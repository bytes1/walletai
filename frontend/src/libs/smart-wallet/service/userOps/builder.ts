import {
  Chain,
  GetContractReturnType,
  Hex,
  PublicClient,
  WalletClient,
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  encodePacked,
  getContract,
  http,
  parseAbi,
  toHex,
  encodeAbiParameters,
  Address,
  zeroAddress,
  getBytes,
} from "viem";

import {
  Blocklock,
  encodeCiphertextToSolidity,
  encodeCondition,
} from "blocklock-js";
import { UserOperationAsHex, UserOperation, Call } from "@/libs/smart-wallet/service/userOps/types";
import { DEFAULT_USER_OP } from "@/libs/smart-wallet/service/userOps/constants";
import { P256Credential, WebAuthn } from "@/libs/web-authn";
import { ENTRYPOINT_ABI, ENTRYPOINT_ADDRESS, FACTORY_ABI } from "@/constants";
import { smartWallet } from "@/libs/smart-wallet";
import { JsonRpcProvider } from "ethers";

// --- BLOCKLOCK INTEGRATION: Assume Blocklock contract details are available ---
const BLOCKLOCK_CONTRACT_ADDRESS: Hex = "0xdCE323C463D66FC6DBc31671f100382ad49C3796"; // Example Address
const BLOCKLOCK_ABI = parseAbi([
  "function createTimelockRequestWithDirectFunding(uint64 callbackGasLimit, bytes calldata condition, bytes calldata ciphertext) payable",
]);


export class UserOpBuilder {
  public relayer: Hex = "0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266";
  public entryPoint: Hex = ENTRYPOINT_ADDRESS;
  public chain: Chain;
  public publicClient: PublicClient;
  public factoryContract: GetContractReturnType<typeof FACTORY_ABI, WalletClient, PublicClient>;
  public paymasterClient: JsonRpcProvider;
  // --- BLOCKLOCK INTEGRATION: Add Blocklock SDK instance ---
  public blocklock: Blocklock;

  constructor(chain: Chain) {
    this.chain = chain;
    this.publicClient = createPublicClient({
      chain,
      transport: http(),
    });

    this.paymasterClient = new JsonRpcProvider("http://localhost:4339/paymaster");

    const walletClient = createWalletClient({
      account: this.relayer,
      chain,
      transport: http(),
    });

    this.factoryContract = getContract({
      address: process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS as Hex,
      abi: FACTORY_ABI,
      walletClient,
      publicClient: this.publicClient,
    });
    
    // --- BLOCKLOCK INTEGRATION: Initialize the Blocklock SDK ---
    // Using the public client as the provider for read-only operations like price calculation.
    this.blocklock = Blocklock.createBaseSepolia(this.publicClient);
  }

  async buildUserOp({
    calls,
    maxFeePerGas,
    maxPriorityFeePerGas,
    keyId,
    // --- BLOCKLOCK INTEGRATION: Add flag to enable encryption ---
    encrypt = false, 
  }: {
    calls: Call[];
    maxFeePerGas: bigint;
    maxPriorityFeePerGas: bigint;
    keyId: Hex;
    encrypt?: boolean;
  }): Promise<UserOperationAsHex> {
    const { account, publicKey } = await this._calculateSmartWalletAddress(keyId);
    
    const bytecode = await this.publicClient.getBytecode({
      address: account,
    });

    let initCode = toHex(new Uint8Array(0));
    let initCodeGas = BigInt(0);
    if (bytecode === undefined) {
      ({ initCode, initCodeGas } = await this._createInitCode(publicKey));
    }

    const nonce = await this._getNonce(account);
    
    // --- BLOCKLOCK INTEGRATION: Main logic fork ---
    let finalCallData: Hex;

    if (encrypt) {
      // 1. Generate the original, sensitive callData that we want to encrypt.
      const protectedCallData = this._addCallData(calls);
      
      // 2. Define encryption parameters.
      const currentBlock = await this.publicClient.getBlockNumber();
      const targetBlock = currentBlock + 2n; 
      const callbackGasLimit = 700_000n; 

      // 3. Encrypt the protected callData.
      const cipherMessage = this.blocklock.encrypt(
        getBytes(protectedCallData),
        targetBlock
      );

      // 4. Calculate the required fee for the Blocklock service.
      const [blocklockFee] = await this.blocklock.calculateRequestPriceNative(
        callbackGasLimit
      );

      // 5. Create the NEW callData. This instructs the smart wallet to call the Blocklock contract.
      // The smart wallet will send the `blocklockFee` as the `value` of this call.
      const blocklockRequestCallData = encodeFunctionData({
        abi: BLOCKLOCK_ABI,
        functionName: "executeEncryptedBatch",
        args: [
          callbackGasLimit,
          encodeCondition(targetBlock),
          encodeCiphertextToSolidity(cipherMessage),
        ],
      });
      
      // 6. The UserOperation will execute a batch transaction on the user's smart wallet.
      // This batch contains a single call: the one to the Blocklock contract to register the encrypted payload.
      finalCallData = this._addCallData([
        {
          dest: BLOCKLOCK_CONTRACT_ADDRESS,
          value: blocklockFee,
          data: blocklockRequestCallData,
        },
      ]);

    } else {
      // If not encrypting, use the original logic.
      finalCallData = this._addCallData(calls);
    }
    // --- END BLOCKLOCK INTEGRATION ---

    const userOp: UserOperation = {
      ...DEFAULT_USER_OP,
      sender: account,
      nonce,
      initCode,
      callData: finalCallData, // Use the potentially encrypted callData
      maxFeePerGas,
      maxPriorityFeePerGas,
    };
    
    // The rest of the flow (gas estimation, paymaster, signing) remains the same.
    // The bundler will estimate gas based on the new `finalCallData`.
    const { callGasLimit, verificationGasLimit, preVerificationGas } =
      await smartWallet.estimateUserOperationGas({
        userOp: this.toParams(userOp),
      });

    userOp.callGasLimit = BigInt(callGasLimit);
    userOp.preVerificationGas = BigInt(preVerificationGas) * BigInt(10);
    userOp.verificationGasLimit =
      BigInt(verificationGasLimit) + BigInt(150_000) + BigInt(initCodeGas) + BigInt(1_000_000);
      
    try {
      const paymasterAndData = await this._getPaymasterData(userOp);
      if (paymasterAndData) {
        userOp.paymasterAndData = paymasterAndData;
      } else {
        console.warn("Paymaster data is empty, proceeding without paymaster.");
      }
    } catch (error) {
      console.error("Failed to fetch paymaster data, proceeding without paymaster:", error);
    }

    const userOpHash = await this._getUserOpHash(userOp);
    const msgToSign = encodePacked(["uint8", "uint48", "bytes32"], [1, 0, userOpHash]);
    const signature = await this.getSignature(msgToSign, keyId);

    return this.toParams({ ...userOp, signature });
  }

  // ... (rest of the class methods: toParams, getSignature, _createInitCode, etc. remain unchanged) ...
  
  public toParams(op: UserOperation): UserOperationAsHex {
    return {
      sender: op.sender,
      nonce: toHex(op.nonce),
      initCode: op.initCode,
      callData: op.callData,
      callGasLimit: toHex(op.callGasLimit),
      verificationGasLimit: toHex(op.verificationGasLimit),
      preVerificationGas: toHex(op.preVerificationGas),
      maxFeePerGas: toHex(op.maxFeePerGas),
      maxPriorityFeePerGas: toHex(op.maxPriorityFeePerGas),
      paymasterAndData: op.paymasterAndData === zeroAddress ? "0x" : op.paymasterAndData,
      signature: op.signature,
    };
  }

  public async getSignature(msgToSign: Hex, keyId: Hex): Promise<Hex> {
    const credentials: P256Credential = (await WebAuthn.get(msgToSign)) as P256Credential;

    if (credentials.rawId !== keyId) {
      throw new Error(
        "Incorrect passkeys used for tx signing. Please sign the transaction with the correct logged-in account",
      );
    }

    const signature = encodePacked(
      ["uint8", "uint48", "bytes"],
      [
        1,
        0,
        encodeAbiParameters(
          [
            {
              type: "tuple",
              name: "credentials",
              components: [
                {
                  name: "authenticatorData",
                  type: "bytes",
                },
                {
                  name: "clientDataJSON",
                  type: "string",
                },
                {
                  name: "challengeLocation",
                  type: "uint256",
                },
                {
                  name: "responseTypeLocation",
                  type: "uint256",
                },
                {
                  name: "r",
                  type: "bytes32",
                },
                {
                  name: "s",
                  type: "bytes32",
                },
              ],
            },
          ],
          [
            {
              authenticatorData: credentials.authenticatorData,
              clientDataJSON: JSON.stringify(credentials.clientData),
              challengeLocation: BigInt(23),
              responseTypeLocation: BigInt(1),
              r: credentials.signature.r,
              s: credentials.signature.s,
            },
          ],
        ),
      ],
    );

    return signature;
  }

  private async _createInitCode(
    pubKey: readonly [Hex, Hex],
  ): Promise<{ initCode: Hex; initCodeGas: bigint }> {
    let createAccountTx = encodeFunctionData({
      abi: FACTORY_ABI,
      functionName: "createAccount",
      args: [pubKey],
    });

    let initCode = encodePacked(
      ["address", "bytes"], // types
      [this.factoryContract.address, createAccountTx], // values
    );

    let initCodeGas = await this.publicClient.estimateGas({
      account: this.relayer,
      to: this.factoryContract.address,
      data: createAccountTx,
    });

    return {
      initCode,
      initCodeGas,
    };
  }

  private async _calculateSmartWalletAddress(
    id: Hex,
  ): Promise<{ account: Address; publicKey: readonly [Hex, Hex] }> {
    const user = await this.factoryContract.read.getUser([BigInt(id)]);
    return { account: user.account, publicKey: user.publicKey };
  }

  private _addCallData(calls: Call[]): Hex {
    return encodeFunctionData({
      abi: [
        {
          inputs: [
            {
              components: [
                {
                  internalType: "address",
                  name: "dest",
                  type: "address",
                },
                {
                  internalType: "uint256",
                  name: "value",
                  type: "uint256",
                },
                {
                  internalType: "bytes",
                  name: "data",
                  type: "bytes",
                },
              ],
              internalType: "struct Call[]",
              name: "calls",
              type: "tuple[]",
            },
          ],
          name: "executeBatch",
          outputs: [],
          stateMutability: "nonpayable",
          type: "function",
        },
      ],
      functionName: "executeBatch",
      args: [calls],
    });
  }

  private async _getNonce(smartWalletAddress: Hex): Promise<bigint> {
    const nonce: bigint = await this.publicClient.readContract({
      address: this.entryPoint,
      abi: parseAbi(["function getNonce(address, uint192) view returns (uint256)"]),
      functionName: "getNonce",
      args: [smartWalletAddress, BigInt(0)],
    });
    return nonce;
  }

  private async _getPaymasterData(userOp: UserOperation): Promise<`0x${string}`> {
    const sanitizedUserOp = JSON.parse(
      JSON.stringify(userOp, (_, value) => (typeof value === "bigint" ? value.toString() : value)),
    );
    
    const paymasterData = await this.paymasterClient.send("pm_sponsorUserOperation", [
      sanitizedUserOp,
    ]);

    
    if (typeof paymasterData !== "string" || !paymasterData.startsWith("0x")) {
      throw new Error("Invalid paymaster data response");
    }

    return paymasterData as `0x${string}`;
  }

  private async _getUserOpHash(userOp: UserOperation): Promise<Hex> {
    const entryPointContract = getContract({
      address: this.entryPoint,
      abi: ENTRYPOINT_ABI,
      publicClient: this.publicClient,
    });

    const userOpHash = entryPointContract.read.getUserOpHash([userOp]);
    return userOpHash;
  }
}
import { CHAIN, PUBLIC_CLIENT, transport } from "@/constants";
import { FACTORY_ABI } from "@/constants/factory";
import { GENESIS_SBT_ABI } from "@/constants/genesisSbt"; // You will need to add this ABI
import { Hex, createWalletClient, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { Randomness } from 'randomness-js';
import { ethers } from 'ethers';

export async function POST(req: Request) {
    const { id, pubKey } = (await req.json()) as { id: Hex; pubKey: [Hex, Hex] };

    const account = privateKeyToAccount(process.env.RELAYER_PRIVATE_KEY as Hex);
    const walletClient = createWalletClient({
        account,
        chain: CHAIN,
        transport,
    });

    const user = await PUBLIC_CLIENT.readContract({
        address: process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS as Hex,
        abi: FACTORY_ABI,
        functionName: "getUser",
        args: [BigInt(id)],
    });

    if (user.account !== zeroAddress) {
        return Response.json(undefined);
    }

    await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS as Hex,
        abi: FACTORY_ABI,
        functionName: "saveUser",
        args: [BigInt(id), pubKey],
    });

    const smartWalletAddress = await PUBLIC_CLIENT.readContract({
        address: process.env.NEXT_PUBLIC_FACTORY_CONTRACT_ADDRESS as Hex,
        abi: FACTORY_ABI,
        functionName: "getAddress",
        args: [pubKey],
    });

    // --- Integration of dcipher Randomness for Genesis SBT Minting ---

    // 1. Define a callback gas limit for the randomness fulfillment
    const callbackGasLimit = 700_000;

    // 2. Create an ethers provider for the randomness-js library
    const jsonProvider = new ethers.JsonRpcProvider(`https://base-sepolia.g.alchemy.com/v2/${process.env.NEXT_PUBLIC_ALCHEMY_KEY}`);

    // 3. Initialize the dcipher Randomness service for the target network
    const randomness = Randomness.createBaseSepolia(jsonProvider);

    // 4. Calculate the required fee in native currency for the randomness request
    const [requestPrice] = await randomness.calculateRequestPriceNative(BigInt(callbackGasLimit));

    // 5. Call the mint function on the GenesisSBT contract, funding it with the calculated price
    await walletClient.writeContract({
        address: process.env.NEXT_PUBLIC_GENESIS_SBT_CONTRACT_ADDRESS as Hex, // The address of your deployed GenesisSBT contract
        abi: GENESIS_SBT_ABI,
        functionName: "mint",
        args: [smartWalletAddress, callbackGasLimit],
        value: requestPrice, // Send the calculated fee with the transaction
    });

    // --- End of Integration ---

    const createdUser = {
        id,
        account: smartWalletAddress,
        pubKey,
    };

    return Response.json(createdUser);
}

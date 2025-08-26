"use client";

import { useEffect, useState } from "react";
import { Chain, Hash, Hex, encodeFunctionData, formatEther } from "viem";
import { Blocklock, encodeCiphertextToSolidity, encodeParams } from "blocklock-js";
import { smartWallet } from "@/libs/smart-wallet";
import { UserOpBuilder } from "@/libs/smart-wallet/service/userOps";
import { useMe } from "@/providers/MeProvider";
import { TIME_RELEASED_MESSENGER_ABI } from "@/lib/blocklock"; // Assuming your messenger ABI is here

const MESSENGER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_MESSENGER_CONTRACT_ADDRESS as Hex;
const CALLBACK_GAS_LIMIT = 300_000; // Define a standard gas limit for the callback

type MessageProps = {
  address: string;
  message: string;
  unlockDate: string; // e.g., "YYYY-MM-DDTHH:mm"
};

smartWallet.init();
const builder = new UserOpBuilder(smartWallet.client.chain as Chain);
const blocklock = Blocklock.createBaseSepolia();

export const TimeLockedMessage = ({ address, message, unlockDate }: MessageProps) => {
  const { me } = useMe();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocklockFee, setBlocklockFee] = useState<bigint | null>(null);

  // Calculate the required Blocklock fee when the component mounts
  useEffect(() => {
    const calculateFee = async () => {
      try {
        const [price] = await blocklock.calculateRequestPriceNative(BigInt(CALLBACK_GAS_LIMIT));
        setBlocklockFee(price);
      } catch (e) {
        console.error("Failed to calculate Blocklock fee:", e);
        setError("Could not calculate service fee.");
      }
    };
    calculateFee();
  }, []);

  const submitMessage = async () => {
    if (!me?.keyId || !blocklockFee) {
      setError("User data or fee is missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      // 1. Convert date to a Unix timestamp for the unlock condition
      const unlockTimestamp = BigInt(Math.floor(new Date(unlockDate).getTime() / 1000));
      if (unlockTimestamp <= Math.floor(Date.now() / 1000)) {
        throw new Error("Unlock date must be in the future.");
      }
      
      
      const encodedMessage = encodeParams(["string"], [message]);
      const blocklockjs = Blocklock.createBaseSepolia(Process.env.key);

      const encryptedMessage = blocklockjs.encrypt(encodedMessage, unlockTimestamp);
      const solidityCiphertext = encodeCiphertextToSolidity(encryptedMessage);

   
      const callData = encodeFunctionData({
        abi: TIME_RELEASED_MESSENGER_ABI,
        functionName: "createTimeLockedMessage",
        args: [CALLBACK_GAS_LIMIT, address as Hex, unlockTimestamp, solidityCiphertext],
      });

      
      const userOp = await builder.buildUserOp({
        calls: [{
          dest: MESSENGER_CONTRACT_ADDRESS,
          value: blocklockFee, 
          data: callData,
        }],
        keyId: me.keyId as Hex,
      });

      
      const hash = await smartWallet.sendUserOperation({ userOp });
      setTxHash(hash);
      await smartWallet.waitForUserOperationReceipt({ hash });

    } catch (e: any) {
      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-sm rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl p-6 text-white">
      <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-cyan-400">
        Confirm Time-Locked Message
      </h2>
      <div className="space-y-3 mb-4">
        <p>Recipient: <span className="font-mono text-teal-200 text-sm break-all">{address}</span></p>
        <p>Message: <span className="text-cyan-200">"{message}"</span></p>
        <p>Unlock Date: <span className="font-bold text-green-300">{new Date(unlockDate).toLocaleString()}</span></p>
      </div>

      <div className="my-4 p-3 bg-gray-900/50 border border-gray-500 rounded-lg text-center">
        <p className="text-sm text-gray-300">Blocklock Service Fee</p>
        <p className="font-semibold text-lg text-white">
          {blocklockFee ? `${parseFloat(formatEther(blocklockFee)).toFixed(6)} ETH` : "Calculating..."}
        </p>
      </div>

      {txHash && (
        <div className="my-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-center">
          <p className="font-semibold">Message Locked!</p>
          <a href={`https://sepolia.basescan.org/userop/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-300 hover:underline break-all">
            View on Explorer
          </a>
        </div>
      )}

      {error && <p className="text-red-400 my-2 text-sm text-center">{error}</p>}

      <button
        className="w-full mt-2 bg-gradient-to-r from-teal-500 to-cyan-500 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-teal-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={submitMessage}
        disabled={isLoading || !!txHash || !blocklockFee}
      >
        {isLoading ? "Locking Message..." : txHash ? "Message Locked" : "Confirm & Pay Fee"}
      </button>
    </div>
  );
};
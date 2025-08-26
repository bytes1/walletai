"use client";
import React, { useEffect, useState } from "react";
import { Hex, decodeAbiParameters, parseAbiItem } from "viem";
import { Blocklock, SolidityCiphertext } from "blocklock-js";
import { PUBLIC_CLIENT } from "@/constants";
import { TIME_RELEASED_MESSENGER_ABI } from "@/lib/blocklock"; // Assuming the ABI is here

// The address of your deployed TimeReleasedMessenger contract
const MESSENGER_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_NFT_CONTRACT_ADDRESS as Hex;

interface SecretMessageProps {
  requestId: bigint;
  encryptedPayload: SolidityCiphertext;
}

const BombNftSecretMessage: React.FC<SecretMessageProps> = ({ requestId, encryptedPayload }) => {
  const [decryptedMessage, setDecryptedMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const decryptMessage = async () => {
      if (!requestId || !encryptedPayload) return;

      setIsLoading(true);
      setError(null);

      try {
        // 1. Find the event log containing the decryption key for this specific request
        const logs = await PUBLIC_CLIENT.getLogs({
          address: MESSENGER_CONTRACT_ADDRESS,
          event: parseAbiItem('event MessageKeyReleased(uint256 indexed requestId, bytes decryptionKey)'),
          args: {
            requestId: requestId,
          },
          // Search recent blocks. You might need to adjust this for older messages.
          fromBlock: 'earliest',
          toBlock: 'latest',
        });

        if (logs.length === 0) {
          // If no log is found, the key has not been released yet
          setError("Message is still time-locked. The decryption key is not yet available.");
          return;
        }

        const decryptionKey = logs[0].args.decryptionKey as Hex;

        // 2. Decrypt the payload using the fetched key
        const blocklock = Blocklock.createBaseSepolia();
        const decryptedBytes = blocklock.decrypt(encryptedPayload, decryptionKey);

        // 3. Decode the decrypted bytes back into a string
        const decoded = decodeAbiParameters([{ type: 'string' }], decryptedBytes);
        setDecryptedMessage(decoded[0]);

      } catch (e: any) {
        console.error("Decryption failed:", e);
        setError("Failed to decrypt the message. The key might be incorrect or the data corrupted.");
      } finally {
        setIsLoading(false);
      }
    };

    decryptMessage();
  }, [requestId, encryptedPayload]);

  const renderContent = () => {
    if (isLoading) {
      return <span className="text-gray-400">Decrypting message...</span>;
    }
    if (error) {
      return <span className="text-yellow-400">{error}</span>;
    }
    if (decryptedMessage) {
      return <span className="text-yellow-200 font-bold text-xl">"{decryptedMessage}"</span>;
    }
    return null;
  };

  return (
    <div className="max-w-sm rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl p-6 text-white transform transition-all duration-500 hover:scale-105 hover:shadow-3xl hover:border-red-400/50">
      <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-yellow-400">
        Wallet Bomb NFT Secret
      </h2>
      <div className="space-y-3 p-4 bg-gray-900/50 rounded-lg min-h-[6rem] flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
};

export default BombNftSecretMessage;
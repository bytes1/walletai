"use client";

import { useEffect, useState } from "react";
import { Chain, Hash, Hex, encodeFunctionData, parseEther } from "viem";
import { Blocklock, encodeCiphertextToSolidity, encodeParams } from "blocklock-js";
import { smartWallet } from "@/libs/smart-wallet";
import { UserOpBuilder } from "@/libs/smart-wallet/service/userOps";
import { useMe } from "@/providers/MeProvider";
import { PUBLIC_CLIENT } from "@/constants";
import { MULTI_AUCTION_ABI } from "@/lib/blocklock";

const AUCTION_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS as Hex;

type BidProps = {
  id: number;
  amount: string;
};

type AuctionDetails = {
  biddingEndBlock: bigint;
};

smartWallet.init();
const builder = new UserOpBuilder(smartWallet.client.chain as Chain);

export const AuctionBid = ({ id, amount }: BidProps) => {
  const { me } = useMe();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [auctionDetails, setAuctionDetails] = useState<AuctionDetails | null>(null);

  useEffect(() => {
    const fetchAuctionData = async () => {
      try {
        const data = (await PUBLIC_CLIENT.readContract({
          address: AUCTION_CONTRACT_ADDRESS,
          abi: MULTI_AUCTION_ABI,
          functionName: "auctions",
          args: [BigInt(id)],
        })) as [string, Hex, bigint, boolean, Hex, bigint];

        setAuctionDetails({ biddingEndBlock: data[2] });
      } catch (e) {
        console.error("Failed to fetch auction details:", e);
        setError("Could not load auction details.");
      }
    };
    fetchAuctionData();
  }, [id]);

  const submitBid = async () => {
    if (!me?.keyId || !auctionDetails) {
      setError("User data or auction details are missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const bidAmountInWei = parseEther(amount);
      const encodedBidAmount = encodeParams(["uint256"], [bidAmountInWei]);
      const blockHeight = auctionDetails.biddingEndBlock;

      // --- Blocklock Encryption: Frontend Method ---
      // IMPORTANT: In the browser, we initialize Blocklock WITHOUT a signer.
      // This is because the application should never handle the user's private key directly.
      // This is the correct and secure method for a client-side dApp.
      const blocklockjs = Blocklock.createBaseSepolia();
      const cipherMessage = blocklockjs.encrypt(encodedBidAmount, blockHeight);
      // --- End of Blocklock Logic ---

      const solidityCiphertext = encodeCiphertextToSolidity(cipherMessage);

      const callData = encodeFunctionData({
        abi: MULTI_AUCTION_ABI,
        functionName: "bid",
        args: [BigInt(id), solidityCiphertext],
      });

      // The final transaction is passed to the smartWallet, which handles the secure signing.
      const userOp = await builder.buildUserOp({
        calls: [
          {
            dest: AUCTION_CONTRACT_ADDRESS,
            value: bidAmountInWei,
            data: callData,
          },
        ],
        keyId: me.keyId as Hex,
      });

      const hash = await smartWallet.sendUserOperation({ userOp });
      setTxHash(hash);
      
      await smartWallet.waitForUserOperationReceipt({ hash });
      
    } catch (e: any)      setError(e.message || "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  };
  
  if (!auctionDetails) {
    return <div className="text-white">Loading auction details...</div>;
  }
  
  return (
    <div className="max-w-sm rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl p-6 text-white transform transition-all duration-500 hover:scale-105 hover:shadow-3xl hover:border-purple-400/50">
      <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
        Confirm Your Bid
      </h2>
      <div className="space-y-3 mb-4">
        <p>Auction ID: <span className="font-mono text-purple-300">{id}</span></p>
        <p>Bid Amount: <span className="font-bold text-green-300">{amount} ETH</span></p>
        <p className="text-sm">Bidding ends at block: <span className="font-mono text-gray-400">{auctionDetails.biddingEndBlock.toString()}</span></p>
      </div>

      {txHash && (
        <div className="my-4 p-3 bg-green-900/50 border border-green-500 rounded-lg text-center">
          <p className="font-semibold">Transaction Sent!</p>
          <a href={`https://sepolia.basescan.org/userop/${txHash}`} target="_blank" rel="noopener noreferrer" className="text-xs text-green-300 hover:underline break-all">
            View on Explorer: {txHash.slice(0, 10)}...{txHash.slice(-8)}
          </a>
        </div>
      )}

      {error && <p className="text-red-400 my-2 text-sm text-center">{error}</p>}

      <button
        className="w-full mt-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50 disabled:opacity-50 disabled:cursor-not-allowed"
        onClick={submitBid}
        disabled={isLoading || !!txHash}
      >
        {isLoading ? "Submitting Bid..." : txHash ? "Bid Confirmed" : "Confirm & Encrypt Bid"}
      </button>
    </div>
  );
};
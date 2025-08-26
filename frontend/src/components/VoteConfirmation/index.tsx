"use client";

import { useEffect, useState } from "react";
import { Chain, Hash, Hex, encodeFunctionData } from "viem";
import { Blocklock, encodeCiphertextToSolidity, encodeParams } from "blocklock-js";
import { smartWallet } from "@/libs/smart-wallet";
import { UserOpBuilder } from "@/libs/smart-wallet/service/userOps";
import { useMe } from "@/providers/MeProvider";
import { PUBLIC_CLIENT } from "@/constants";
import { BLOCKLOCK_VOTING_ABI } from "@/lib/blocklock";

const VOTING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS as Hex;

type VoteProps = {
  id: number;
  vote: string;
};

type ProposalDetails = {
  votingEndBlock: bigint;
};

smartWallet.init();
const builder = new UserOpBuilder(smartWallet.client.chain as Chain);

export const VoteConfirmation = ({ id, vote }: VoteProps) => {
  const { me } = useMe();
  const [isLoading, setIsLoading] = useState(false);
  const [txHash, setTxHash] = useState<Hash | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [proposalDetails, setProposalDetails] = useState<ProposalDetails | null>(null);

  useEffect(() => {
    const fetchProposalData = async () => {
      try {
        const data = (await PUBLIC_CLIENT.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: BLOCKLOCK_VOTING_ABI,
          functionName: "proposals",
          args: [BigInt(id)],
        })) as [string, Hex, bigint, bigint, bigint];
        setProposalDetails({ votingEndBlock: data[2] });
      } catch (e) {
        setError("Could not load proposal details.");
      }
    };
    fetchProposalData();
  }, [id]);

  const submitVote = async () => {
    if (!me?.keyId || !proposalDetails) {
      setError("User or proposal details are missing.");
      return;
    }

    setIsLoading(true);
    setError(null);
    setTxHash(null);

    try {
      const voteAsBoolean = vote.toLowerCase() === "yes";
      const encodedVote = encodeParams(["bool"], [voteAsBoolean]);
      const blockHeight = proposalDetails.votingEndBlock;
      
    
      const blocklockjs = Blocklock.createBaseSepolia(process.env.key);
      const cipherMessage = blocklockjs.encrypt(encodedVote, blockHeight);
      
      
      const solidityCiphertext = encodeCiphertextToSolidity(cipherMessage);

      const callData = encodeFunctionData({
        abi: BLOCKLOCK_VOTING_ABI,
        functionName: "castVote",
        args: [BigInt(id), solidityCiphertext],
      });

      const userOp = await builder.buildUserOp({
        calls: [{
          dest: VOTING_CONTRACT_ADDRESS,
          value: 0n,
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
        <div className="max-w-sm rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl p-6 text-white transform transition-all duration-500 hover:scale-105 hover:shadow-3xl hover:border-blue-400/50">
      <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
        Confirm Your Vote
      </h2>
      <div className="space-y-3">
        <p className="text-lg font-semibold">
          <span className="text-gray-300">Proposal ID:</span>{" "}
          <span className="text-blue-200">{id}</span>
        </p>
        <p className="text-lg font-semibold">
          <span className="text-gray-300">Your Vote:</span>{" "}
          <span className="text-green-300">{vote}</span>
        </p>
      </div>
      <button
        className="w-full mt-6 bg-gradient-to-r from-blue-500 to-cyan-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-blue-600 hover:to-cyan-600 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/50"
        onClick={async (e) => await submitTx(e)}
      >
        Confirm Vote
      </button>
    </div>
  );
};
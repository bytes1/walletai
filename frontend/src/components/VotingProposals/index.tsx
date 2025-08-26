// frontend/src/components/VotingProposals/index.tsx
"use client";
import React from "react";

interface Proposal {
  id: number;
  title: string;
  description: string;
  status: string;
  votesFor: number;
  votesAgainst: number;
  endingBlock?: number; // Make endingBlock optional
}

interface VotingProposalsProps {
  proposals: Proposal[];
}

const VotingProposals: React.FC<VotingProposalsProps> = ({ proposals }) => {
  return (
    <div className="space-y-4">
      {proposals.map((proposal) => (
        <div
          key={proposal.id}
          className="bg-gray-800/50 border border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-blue-500/10 transition-shadow duration-300"
        >
          <div className="flex justify-between items-start mb-4">
            <h2 className="text-2xl font-bold text-blue-400">Proposal #{proposal.id}</h2>
            <span
              className={`px-3 py-1 text-sm font-semibold rounded-full ${
                proposal.status === "active"
                  ? "bg-green-500/20 text-green-400 animate-pulse"
                  : "bg-red-500/20 text-red-400"
              }`}
            >
              {proposal.status === "active" ? "Active" : "Closed"}
            </span>
          </div>

          <div className="space-y-3 text-gray-300">
            <p>
              <strong className="font-semibold text-gray-400">Title:</strong> {proposal.title}
            </p>
            <p>
              <strong className="font-semibold text-gray-400">Description:</strong>{" "}
              {proposal.description}
            </p>
            {proposal.status === "active" ? (
              <p>
                <strong className="font-semibold text-gray-400">Ending Block:</strong>{" "}
                {proposal.endingBlock?.toLocaleString()}
              </p>
            ) : (
              <div className="flex justify-between">
                <p>
                  <strong className="font-semibold text-gray-400">For:</strong>{" "}
                  {proposal.votesFor.toLocaleString()}
                </p>
                <p>
                  <strong className="font-semibold text-gray-400">Against:</strong>{" "}
                  {proposal.votesAgainst.toLocaleString()}
                </p>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default VotingProposals;

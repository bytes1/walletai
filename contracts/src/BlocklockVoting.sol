// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TypesLib} from "blocklock-solidity/src/libraries/TypesLib.sol";
import {AbstractBlocklockReceiver} from "blocklock-solidity/src/AbstractBlocklockReceiver.sol";

contract BlocklockVoting is AbstractBlocklockReceiver {
    struct Proposal {
        string description;
        address proposer;
        uint votingEndBlock;
        uint yesVotes;
        uint noVotes;
        mapping(address => bool) hasVoted;
    }

    struct Vote {
        TypesLib.Ciphertext encryptedChoice;
        uint blocklockRequestId;
        bool revealed;
    }

    struct ProposalVoterInfo {
        uint proposalId;
        address voter;
    }

    uint public proposalCounter;
    mapping(uint => Proposal) public proposals;
    mapping(uint => mapping(address => Vote)) public votes;
    mapping(uint => ProposalVoterInfo) public blocklockRequestToInfo;

    event ProposalCreated(
        uint indexed proposalId,
        string description,
        address indexed proposer,
        uint votingEndBlock
    );
    event VoteCast(uint indexed proposalId, address indexed voter);
    event VoteRevealed(
        uint indexed proposalId,
        address indexed voter,
        bool choice
    );

    constructor(
        address _blocklockSender
    ) AbstractBlocklockReceiver(_blocklockSender) {}

    function createProposal(
        string calldata _description,
        uint _votingDurationInBlocks
    ) external returns (uint) {
        uint proposalId = proposalCounter;
        uint votingEndBlock = block.number + _votingDurationInBlocks;

        Proposal storage newProposal = proposals[proposalId];
        newProposal.description = _description;
        newProposal.proposer = msg.sender;
        newProposal.votingEndBlock = votingEndBlock;

        proposalCounter++;
        emit ProposalCreated(
            proposalId,
            _description,
            msg.sender,
            votingEndBlock
        );
        return proposalId;
    }

    function castVote(
        uint _proposalId,
        TypesLib.Ciphertext calldata _encryptedChoice
    ) external {
        Proposal storage currentProposal = proposals[_proposalId];

        require(
            block.number < currentProposal.votingEndBlock,
            "Voting period is over."
        );
        require(
            !currentProposal.hasVoted[msg.sender],
            "You have already voted."
        );

        bytes memory condition = abi.encode(currentProposal.votingEndBlock);
        uint32 callbackGasLimit = 100000; // Gas for the reveal logic

        // CORRECTED: The function name is _requestBlocklockPayInNative
        (uint256 requestId, ) = _requestBlocklockPayInNative(
            callbackGasLimit,
            condition,
            _encryptedChoice
        );

        currentProposal.hasVoted[msg.sender] = true;
        votes[_proposalId][msg.sender] = Vote({
            encryptedChoice: _encryptedChoice,
            blocklockRequestId: requestId,
            revealed: false
        });

        blocklockRequestToInfo[requestId] = ProposalVoterInfo({
            proposalId: _proposalId,
            voter: msg.sender
        });

        emit VoteCast(_proposalId, msg.sender);
    }

    function _onBlocklockReceived(
        uint256 _requestId,
        bytes calldata _decryptionKey
    ) internal override {
        ProposalVoterInfo memory info = blocklockRequestToInfo[_requestId];
        require(info.voter != address(0), "Invalid Blocklock request ID.");

        uint proposalId = info.proposalId;
        address voter = info.voter;

        Proposal storage currentProposal = proposals[proposalId];
        Vote storage voteToReveal = votes[proposalId][voter];
        voteToReveal.revealed = true;

        bytes memory decryptedPayload = _decrypt(
            voteToReveal.encryptedChoice,
            _decryptionKey
        );

        bool choice = abi.decode(decryptedPayload, (bool));

        if (choice) {
            currentProposal.yesVotes++;
        } else {
            currentProposal.noVotes++;
        }

        emit VoteRevealed(proposalId, voter, choice);
    }

    function getProposalResult(
        uint _proposalId
    ) public view returns (string memory, uint, uint) {
        require(proposalCounter > _proposalId, "Proposal does not exist.");
        Proposal storage currentProposal = proposals[_proposalId];
        return (
            currentProposal.description,
            currentProposal.yesVotes,
            currentProposal.noVotes
        );
    }
}

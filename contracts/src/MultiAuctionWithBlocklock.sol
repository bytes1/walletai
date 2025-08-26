// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TypesLib} from "blocklock-solidity/src/libraries/TypesLib.sol";
import {AbstractBlocklockReceiver} from "blocklock-solidity/src/AbstractBlocklockReceiver.sol";

contract MultiAuctionWithBlocklock is AbstractBlocklockReceiver {
    struct Auction {
        string description;
        address payable beneficiary;
        uint biddingEndBlock;
        bool ended;
        address highestBidder;
        uint highestBid;
        address[] bidders;
    }

    struct Bid {
        TypesLib.Ciphertext encryptedBid;
        uint value;
        uint blocklockRequestId;
        bool revealed;
        bool isValid;
    }

    struct AuctionBidderInfo {
        uint auctionId;
        address bidder;
    }

    uint public auctionCounter;
    mapping(uint => Auction) public auctions;
    mapping(uint => mapping(address => Bid)) public bids;
    mapping(uint => AuctionBidderInfo) public blocklockRequestToInfo;

    event AuctionCreated(
        uint indexed auctionId,
        string description,
        address indexed beneficiary,
        uint biddingEndBlock
    );
    event BidPlaced(uint indexed auctionId, address indexed bidder, uint value);
    event BidRevealed(
        uint indexed auctionId,
        address indexed bidder,
        uint value,
        bool isValid
    );
    event AuctionEnded(uint indexed auctionId, address winner, uint amount);
    event Withdrawal(
        uint indexed auctionId,
        address indexed bidder,
        uint amount
    );

    constructor(
        address _blocklockSender
    ) AbstractBlocklockReceiver(_blocklockSender) {}

    function createAuction(
        string calldata _description,
        uint _biddingDurationInBlocks
    ) external returns (uint) {
        uint auctionId = auctionCounter;
        uint biddingEndBlock = block.number + _biddingDurationInBlocks;

        auctions[auctionId] = Auction({
            description: _description,
            beneficiary: payable(msg.sender),
            biddingEndBlock: biddingEndBlock,
            ended: false,
            highestBidder: address(0),
            highestBid: 0,
            bidders: new address[](0)
        });

        auctionCounter++;
        emit AuctionCreated(
            auctionId,
            _description,
            msg.sender,
            biddingEndBlock
        );
        return auctionId;
    }

    function bid(
        uint _auctionId,
        TypesLib.Ciphertext calldata _encryptedBid
    ) external payable {
        Auction storage currentAuction = auctions[_auctionId];

        require(
            block.number < currentAuction.biddingEndBlock,
            "Bidding period is over."
        );
        require(msg.value > 0, "Bid value must be positive.");
        require(
            bids[_auctionId][msg.sender].value == 0,
            "Bidder has already placed a bid."
        );

        bytes memory condition = abi.encode(currentAuction.biddingEndBlock);
        uint32 callbackGasLimit = 200000;

        (uint256 requestId, ) = _requestBlocklockPayInNative(
            callbackGasLimit,
            condition,
            _encryptedBid
        );

        bids[_auctionId][msg.sender] = Bid({
            encryptedBid: _encryptedBid,
            value: msg.value,
            blocklockRequestId: requestId,
            revealed: false,
            isValid: false
        });

        blocklockRequestToInfo[requestId] = AuctionBidderInfo({
            auctionId: _auctionId,
            bidder: msg.sender
        });
        currentAuction.bidders.push(msg.sender);

        emit BidPlaced(_auctionId, msg.sender, msg.value);
    }

    function _onBlocklockReceived(
        uint256 _requestId,
        bytes calldata _decryptionKey
    ) internal override {
        AuctionBidderInfo memory info = blocklockRequestToInfo[_requestId];
        require(info.bidder != address(0), "Invalid Blocklock request ID.");

        uint auctionId = info.auctionId;
        address bidder = info.bidder;

        Auction storage currentAuction = auctions[auctionId];
        Bid storage bidToReveal = bids[auctionId][bidder];
        bidToReveal.revealed = true;

        bytes memory decryptedPayload = _decrypt(
            bidToReveal.encryptedBid,
            _decryptionKey
        );
        (uint value, ) = abi.decode(decryptedPayload, (uint, bytes));

        bool isValid = (value == bidToReveal.value);

        bidToReveal.isValid = isValid;
        emit BidRevealed(auctionId, bidder, value, isValid);

        if (isValid && value > currentAuction.highestBid) {
            currentAuction.highestBid = value;
            currentAuction.highestBidder = bidder;
        }
    }

    function endAuction(uint _auctionId) external {
        Auction storage currentAuction = auctions[_auctionId];
        require(
            block.number > currentAuction.biddingEndBlock,
            "Bidding period is not over yet."
        );
        require(!currentAuction.ended, "Auction has already been ended.");

        currentAuction.ended = true;
        emit AuctionEnded(
            _auctionId,
            currentAuction.highestBidder,
            currentAuction.highestBid
        );

        if (currentAuction.highestBidder != address(0)) {
            (bool success, ) = currentAuction.beneficiary.call{
                value: currentAuction.highestBid
            }("");
            require(success, "Transfer to beneficiary failed.");
        }
    }

    function withdraw(uint _auctionId) external {
        Auction storage currentAuction = auctions[_auctionId];
        require(currentAuction.ended, "Auction not yet ended.");

        Bid storage bidderBid = bids[_auctionId][msg.sender];
        require(
            bidderBid.value > 0,
            "You did not place a bid in this auction."
        );
        require(
            msg.sender != currentAuction.highestBidder,
            "Highest bidder cannot withdraw."
        );

        uint amountToWithdraw = bidderBid.value;
        bidderBid.value = 0;

        (bool success, ) = msg.sender.call{value: amountToWithdraw}("");
        require(success, "Withdrawal failed.");

        emit Withdrawal(_auctionId, msg.sender, amountToWithdraw);
    }

    function getAuctionState(
        uint _auctionId
    ) public view returns (string memory) {
        Auction storage currentAuction = auctions[_auctionId];
        if (!currentAuction.ended) {
            if (block.number < currentAuction.biddingEndBlock) return "Bidding";
        }
        return "Ended";
    }

    function getBidInfo(
        uint _auctionId,
        address _bidder
    )
        external
        view
        returns (
            uint value,
            uint blocklockRequestId,
            bool revealed,
            bool isValid
        )
    {
        Bid storage bidInfo = bids[_auctionId][_bidder];
        require(
            bidInfo.value > 0,
            "No bid found for this address in this auction."
        );

        return (
            bidInfo.value,
            bidInfo.blocklockRequestId,
            bidInfo.revealed,
            bidInfo.isValid
        );
    }
}

// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {Script} from "forge-std/Script.sol";

import {MultiAuctionWithBlocklock} from "../src/MultiAuctionWithBlocklock.sol";
import {BlocklockVoting} from "../src/BlocklockVoting.sol";
import {TimeReleasedMessenger} from "../src/TimeReleasedMessenger.sol";

contract Deploy is Script {
    address constant BLOCKLOCK_SENDER_ADDRESS =
        0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e;

    function run()
        external
        returns (
            MultiAuctionWithBlocklock,
            BlocklockVoting,
            TimeReleasedMessenger
        )
    {
        console.log(
            "Using Blocklock Sender address:",
            BLOCKLOCK_SENDER_ADDRESS
        );

        vm.startBroadcast();

        MultiAuctionWithBlocklock auctionContract = new MultiAuctionWithBlocklock(
                BLOCKLOCK_SENDER_ADDRESS
            );
        console.log(
            "MultiAuctionWithBlocklock deployed at:",
            address(auctionContract)
        );

        BlocklockVoting votingContract = new BlocklockVoting(
            BLOCKLOCK_SENDER_ADDRESS
        );
        console.log("BlocklockVoting deployed at:", address(votingContract));

        TimeReleasedMessenger messengerContract = new TimeReleasedMessenger(
            BLOCKLOCK_SENDER_ADDRESS
        );
        console.log(
            "TimeReleasedMessenger deployed at:",
            address(messengerContract)
        );

        vm.stopBroadcast();

        return (auctionContract, votingContract, messengerContract);
    }
}

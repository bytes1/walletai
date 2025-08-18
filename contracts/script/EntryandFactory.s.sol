// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "forge-std/Script.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";
import {EntryPoint} from "account-abstraction/core/EntryPoint.sol";
import {SimpleAccountFactory} from "../src/SimpleAccountFactory.sol";

contract DeployEntryandFactory is Script {
    function run() public {
        vm.startBroadcast();

        // From https://docs.stackup.sh/docs/entity-addresses#entrypoint
        EntryPoint entryPoint = new EntryPoint();

        SimpleAccountFactory factory = new SimpleAccountFactory(entryPoint);
        console2.log("SimpleAccountFactory deployed at", address(factory));
        console2.log("EntryPoint deployed at", address(entryPoint));
        vm.stopBroadcast();
    }
}

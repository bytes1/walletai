// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import {TypesLib} from "blocklock-solidity/src/libraries/TypesLib.sol";
import {AbstractBlocklockReceiver} from "blocklock-solidity/src/AbstractBlocklockReceiver.sol";

contract TimeReleasedMessenger is AbstractBlocklockReceiver {
    struct Message {
        address creator;
        address recipient;
        TypesLib.Ciphertext encryptedPayload;
        bool isReleased;
    }

    mapping(uint256 => Message) public messages;

    event MessageLocked(
        uint256 indexed requestId,
        address indexed creator,
        address indexed recipient,
        uint256 unlockTimestamp
    );

    event MessageKeyReleased(uint256 indexed requestId, bytes decryptionKey);

    constructor(
        address blocklockSender
    ) AbstractBlocklockReceiver(blocklockSender) {}

    function createTimeLockedMessage(
        uint32 callbackGasLimit,
        address recipient,
        uint256 unlockTimestamp,
        TypesLib.Ciphertext calldata encryptedMessage
    ) external payable returns (uint256 requestId) {
        require(
            unlockTimestamp > block.timestamp,
            "Unlock time must be in the future"
        );
        require(
            recipient != address(0),
            "Recipient cannot be the zero address"
        );

        bytes memory condition = abi.encode(unlockTimestamp);

        (uint256 _requestId, ) = _requestBlocklockPayInNative(
            callbackGasLimit,
            condition,
            encryptedMessage
        );

        messages[_requestId] = Message({
            creator: msg.sender,
            recipient: recipient,
            encryptedPayload: encryptedMessage,
            isReleased: false
        });

        emit MessageLocked(_requestId, msg.sender, recipient, unlockTimestamp);

        return _requestId;
    }

    function _onBlocklockReceived(
        uint256 _requestId,
        bytes calldata decryptionKey
    ) internal override {
        Message storage messageToRelease = messages[_requestId];

        require(
            messageToRelease.creator != address(0),
            "Message does not exist"
        );

        require(!messageToRelease.isReleased, "Message key already released");

        messageToRelease.isReleased = true;

        emit MessageKeyReleased(_requestId, decryptionKey);
    }
}

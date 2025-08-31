// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "forge-std/console2.sol";
import "account-abstraction/interfaces/IAccount.sol";
import "account-abstraction/interfaces/IEntryPoint.sol";
import "account-abstraction/core/Helpers.sol";
import {WebAuthn} from "src/WebAuthn.sol";
import "openzeppelin-contracts/contracts/interfaces/IERC1271.sol";
import "@openzeppelin/contracts/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts/proxy/utils/UUPSUpgradeable.sol";

// BLOCKLOCK: Import Blocklock contracts
import {TypesLib} from "blocklock-solidity/src/libraries/TypesLib.sol";
import {AbstractBlocklockReceiver} from "blocklock-solidity/src/AbstractBlocklockReceiver.sol";

struct Signature {
    bytes authenticatorData;
    string clientDataJSON;
    uint256 challengeLocation;
    uint256 responseTypeLocation;
    uint256 r;
    uint256 s;
}

struct Call {
    address dest;
    uint256 value;
    bytes data;
}

// BLOCKLOCK: Inherit from AbstractBlocklockReceiver
contract SimpleAccount is
    IAccount,
    UUPSUpgradeable,
    Initializable,
    IERC1271,
    AbstractBlocklockReceiver
{
    struct PublicKey {
        bytes32 X;
        bytes32 Y;
    }

    IEntryPoint public immutable entryPoint;
    PublicKey public publicKey;

    // BLOCKLOCK: State to store encrypted calls, mapping request ID to ciphertext
    mapping(uint256 => TypesLib.Ciphertext) public encryptedCalls;

    event SimpleAccountInitialized(
        IEntryPoint indexed entryPoint,
        bytes32[2] pubKey
    );
    uint256 private constant _SIG_VALIDATION_FAILED = 1;

    // BLOCKLOCK: The constructor now calls the AbstractBlocklockReceiver constructor with address(0)
    // The actual blocklockSender address will be set in the initializer.
    constructor(
        IEntryPoint _entryPoint
    )
        AbstractBlocklockReceiver(
            address(0x82Fed730CbdeC5A2D8724F2e3b316a70A565e27e)
        )
    {
        entryPoint = _entryPoint;
        _disableInitializers();
    }

    function initialize(
        bytes32[2] memory aPublicKey,
        // BLOCKLOCK: Add blocklockSender to the initializer
        address _blocklockSender
    ) public virtual initializer {
        _initialize(aPublicKey);
        // BLOCKLOCK: Initialize the blocklock sender address
        _setBlocklockSender(_blocklockSender);
    }

    function _initialize(bytes32[2] memory aPublicKey) internal virtual {
        publicKey = PublicKey(aPublicKey[0], aPublicKey[1]);
        emit SimpleAccountInitialized(entryPoint, [publicKey.X, publicKey.Y]);
    }

    receive() external payable {}
    fallback() external payable {}

    function _onlyOwner() internal view {
        require(msg.sender == address(this), "only account itself can call");
    }

    /// Execute multiple transactions atomically.
    function executeBatch(Call[] calldata calls) external onlyEntryPoint {
        for (uint256 i = 0; i < calls.length; i++) {
            _call(calls[i].dest, calls[i].value, calls[i].data);
        }
    }

    // BLOCKLOCK: New function to handle MEV-resistant (encrypted) transactions
    /**
     * @notice Creates a time-locked request for an encrypted batch of calls.
     * @param encryptedCallsData The encrypted Call[] array.
     * @param condition The on-chain condition for decryption (e.g., block number).
     * @param callbackGasLimit The gas limit for the callback function.
     */
    function executeEncryptedBatch(
        TypesLib.Ciphertext calldata encryptedCallsData,
        bytes calldata condition,
        uint32 callbackGasLimit
    ) external payable onlyEntryPoint returns (uint256 requestId) {
        require(blocklockSender != address(0), "Blocklock sender not set");

        (uint256 _requestId, ) = _requestBlocklockPayInNative(
            callbackGasLimit,
            condition,
            encryptedCallsData
        );

        // Store the encrypted data against the request ID
        encryptedCalls[_requestId] = encryptedCallsData;

        return _requestId;
    }

    // BLOCKLOCK: Callback function called by the dcipher network
    /**
     * @notice Callback function that receives the decryption key and executes the transaction.
     * @param _requestId The ID of the decryption request.
     * @param decryptionKey The key to decrypt the stored ciphertext.
     */
    function _onBlocklockReceived(
        uint256 _requestId,
        bytes calldata decryptionKey
    ) internal override {
        // Retrieve the encrypted payload
        TypesLib.Ciphertext memory encryptedData = encryptedCalls[_requestId];
        require(
            encryptedData.ciphertext.length > 0,
            "No encrypted data found for request"
        );

        // Decrypt the payload to get the original `Call[]`
        bytes memory decryptedData = _decrypt(encryptedData, decryptionKey);
        Call[] memory calls = abi.decode(decryptedData, (Call[]));

        // Execute the calls
        for (uint256 i = 0; i < calls.length; i++) {
            _call(calls[i].dest, calls[i].value, calls[i].data);
        }

        // Clean up state
        delete encryptedCalls[_requestId];
    }

    function _validateSignature(
        bytes memory message,
        bytes calldata signature
    ) private view returns (bool) {
        Signature memory sig = abi.decode(signature, (Signature));
        return
            WebAuthn.verifySignature({
                challenge: message,
                authenticatorData: sig.authenticatorData,
                requireUserVerification: false,
                clientDataJSON: sig.clientDataJSON,
                challengeLocation: sig.challengeLocation,
                responseTypeLocation: sig.responseTypeLocation,
                r: sig.r,
                s: sig.s,
                x: uint256(publicKey.X),
                y: uint256(publicKey.Y)
            });
    }

    function isValidSignature(
        bytes32 message,
        bytes calldata signature
    ) external view override returns (bytes4 magicValue) {
        if (_validateSignature(abi.encodePacked(message), signature)) {
            return IERC1271(this).isValidSignature.selector;
        }
        return 0xffffffff;
    }

    function _validateUserOpSignature(
        UserOperation calldata userOp,
        bytes32 userOpHash
    ) private view returns (uint256 validationData) {
        bytes memory messageToVerify;
        bytes calldata signature;
        ValidationData memory returnIfValid;

        uint256 sigLength = userOp.signature.length;
        if (sigLength == 0) return _SIG_VALIDATION_FAILED;

        uint8 version = uint8(userOp.signature[0]);
        if (version == 1) {
            if (sigLength < 7) return _SIG_VALIDATION_FAILED;
            uint48 validUntil = uint48(bytes6(userOp.signature[1:7]));

            signature = userOp.signature[7:]; // keySlot, signature
            messageToVerify = abi.encodePacked(version, validUntil, userOpHash);
            returnIfValid.validUntil = validUntil;
        } else {
            return _SIG_VALIDATION_FAILED;
        }

        if (_validateSignature(messageToVerify, signature)) {
            return _packValidationData(returnIfValid);
        }
        return _SIG_VALIDATION_FAILED;
    }

    function _call(address target, uint256 value, bytes memory data) internal {
        (bool success, bytes memory result) = target.call{value: value}(data);
        if (!success) {
            assembly {
                revert(add(result, 32), mload(result))
            }
        }
    }

    function validateUserOp(
        UserOperation calldata userOp,
        bytes32 userOpHash,
        uint256 missingAccountFunds
    )
        external
        virtual
        override
        onlyEntryPoint
        returns (uint256 validationData)
    {
        validationData = _validateUserOpSignature(userOp, userOpHash);
        _payPrefund(missingAccountFunds);
    }

    function _payPrefund(uint256 missingAccountFunds) private {
        if (missingAccountFunds != 0) {
            (bool success, ) = payable(msg.sender).call{
                value: missingAccountFunds,
                gas: type(uint256).max
            }("");
            (success);
        }
    }

    modifier onlySelf() {
        require(msg.sender == address(this), "only self");
        _;
    }

    modifier onlyEntryPoint() {
        require(msg.sender == address(entryPoint), "only entry point");
        _;
    }

    function _authorizeUpgrade(
        address newImplementation
    ) internal view override onlySelf {
        (newImplementation);
    }
}

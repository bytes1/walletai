// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {RandomnessReceiverBase} from "randomness-solidity/src/RandomnessReceiverBase.sol";
import "openzeppelin-contracts/contracts/token/ERC721/ERC721.sol";
import "openzeppelin-contracts/contracts/access/Ownable.sol";

contract GenesisSBT is ERC721, Ownable, RandomnessReceiverBase {
    uint256 private _nextTokenId;

    // Mapping from request ID to the address that will receive the SBT
    mapping(uint256 => address) public sbtRequests;

    event GenesisTokenMinted(
        address indexed account,
        uint256 indexed tokenId,
        bytes32 randomness
    );

    constructor(
        address randomnessSender,
        address owner
    )
        ERC721("Genesis SBT", "GSBT")
        RandomnessReceiverBase(randomnessSender, owner)
    {}

    function mint(
        address to,
        uint32 callbackGasLimit
    ) external payable onlyOwner {
        (
            uint256 requestID,
            uint256 requestPrice
        ) = _requestRandomnessPayInNative(callbackGasLimit);
        require(
            msg.value >= requestPrice,
            "Not enough value sent for randomness fee"
        );
        sbtRequests[requestID] = to;
    }

    function onRandomnessReceived(
        uint256 requestID,
        bytes32 _randomness
    ) internal override {
        address account = sbtRequests[requestID];
        require(account != address(0), "Request ID not found");

        uint256 tokenId = _nextTokenId++;
        _safeMint(account, tokenId);

        // Clean up the request mapping to save gas
        delete sbtRequests[requestID];

        emit GenesisTokenMinted(account, tokenId, _randomness);
    }

    /**
     * @dev Overrides the ERC721 _update function to make the tokens non-transferable (Soulbound).
     */
    function _update(
        address to,
        uint256 tokenId,
        address auth
    ) internal override returns (address) {
        if (_ownerOf(tokenId) != address(0)) {
            revert("SBTs are non-transferable");
        }
        return super._update(to, tokenId, auth);
    }

    /**
     * @dev Allows the owner to withdraw any excess funds from this contract.
     */
    function withdrawFunds(address payable to) external onlyOwner {
        (bool success, ) = to.call{value: address(this).balance}("");
        require(success, "Withdraw failed");
    }
}

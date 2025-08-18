// SPDX-License-Identifier: MIT
pragma solidity ^0.8.12;

import "openzeppelin-contracts/contracts/utils/Create2.sol";
import "openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import "src/SimpleAccount.sol";
import "./GenesisSBT.sol";

struct User {
    uint256 id;
    bytes32[2] publicKey;
    address account;
}

contract SimpleAccountFactory {
    SimpleAccount public immutable accountImplem;
    IEntryPoint public immutable entryPoint;
    GenesisSBT public immutable genesisSBT;
    bytes32 public constant SALT = keccak256("hocuspocusxyz");

    mapping(uint256 => User) public users;

    constructor(IEntryPoint _entryPoint, address _genesisSBT) {
        entryPoint = _entryPoint;
        accountImplem = new SimpleAccount(_entryPoint);
        genesisSBT = GenesisSBT(_genesisSBT);
    }

    function saveUser(uint256 id, bytes32[2] memory publicKey) external {
        users[id] = User(id, publicKey, this.getAddress(publicKey));
    }

    function getUser(uint256 id) external view returns (User memory) {
        return users[id];
    }

    function createAccount(
        bytes32[2] memory publicKey,
        uint32 callbackGasLimit
    ) external payable returns (SimpleAccount) {
        address addr = getAddress(publicKey);

        // Prefund the account with msg.value
        if (msg.value > 0) {
            entryPoint.depositTo{value: msg.value}(addr);
        }

        // Otherwise, no-op if the account is already deployed
        uint codeSize = addr.code.length;
        if (codeSize > 0) {
            return SimpleAccount(payable(addr));
        }

        // Mint the Genesis SBT to the new account
        genesisSBT.mint(addr, callbackGasLimit);

        return
            SimpleAccount(
                payable(
                    new ERC1967Proxy{salt: SALT}(
                        address(accountImplem),
                        abi.encodeCall(SimpleAccount.initialize, (publicKey))
                    )
                )
            );
    }

    /**
     * Calculate the counterfactual address of this account as it would be returned by createAccount()
     */
    function getAddress(
        bytes32[2] memory publicKey
    ) public view returns (address) {
        return
            Create2.computeAddress(
                SALT,
                keccak256(
                    abi.encodePacked(
                        type(ERC1967Proxy).creationCode,
                        abi.encode(
                            address(accountImplem),
                            abi.encodeCall(
                                SimpleAccount.initialize,
                                (publicKey)
                            )
                        )
                    )
                )
            );
    }
}

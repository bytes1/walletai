# Account Abstraction Wallet with Genesis Soulbound NFT

This project introduces a smart contract wallet built on the principles of **Account Abstraction (ERC-4337)**. Upon creation, each new wallet automatically mints a unique, non-transferable **Soulbound Token (SBT)**, permanently attached to it. This SBT serves as the foundation for a user's on-chain identity.

The system is designed for a seamless user experience, leveraging a Paymaster for gasless transactions and a decentralized oracle for verifiable on-chain randomness.

---

## How It Works 🪄

The wallet creation and SBT minting process is designed to be seamless and user-friendly.

- **One-Click Creation**: When you create a new wallet, our `SimpleAccountFactory` is called to deploy your personal smart contract wallet.
- **Randomness Request**: The factory instantly triggers the `GenesisSBT` contract to request a verifiable random number from the dCipher network.
- **Gasless Minting**: Thanks to our Paymaster, this entire process, including the minting of your SBT, is **completely gas-free** for you.
- **Unique Traits**: Once the random number is securely delivered on-chain, your Genesis SBT is minted with a unique set of generative traits, including a visual "Cosmic Signature" and a special "Origin Title."

Currently, the minted Soulbound NFT is only attached to the wallet address.

---

## Key Technologies

### Account Abstraction (ERC-4337)

This project leverages account abstraction to create a more user-friendly Web3 experience. Instead of a traditional Externally Owned Account (EOA), each user gets a smart contract wallet, enabling features like gasless transactions, social recovery, and more complex logic. [cite_start]The `account-abstraction` library is a core dependency[cite: 1].

### dCipher for Verifiable Randomness

To ensure that every Genesis SBT is unique and fairly generated, we use the **dCipher network** for on-chain randomness.

When a new wallet is created, a request is sent to the dCipher oracle. The oracle generates a random number and a cryptographic proof, which are sent back to our `GenesisSBT` contract. This verifiable randomness is then used to assign the unique "Cosmic Signature" and "Origin Title" to the SBT, preventing any form of manipulation. [cite_start]This is made possible by the `randomness-solidity` library[cite: 1].

---

## Future Plans 🚀

Our vision is to evolve this Soulbound NFT into a comprehensive, privacy-preserving digital identity.

In the future, we plan to integrate **KYC (Know Your Customer) using zkTLS proofs**, enabling on-chain verification that can be securely and privately added to the Soulbound NFT.

This way, your on-chain identity evolves into a **trust-enhanced passport** for Web3, all while preserving privacy and decentralization.

---

## Getting Started

### Prerequisites

- [Foundry](https://getfoundry.sh/) must be installed.

### Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd walletai
    ```
2.  **Install dependencies:**
    ```bash
    forge install
    ```
3.  **Set up environment variables:**
    ```bash
    cp .env.example .env
    # Add your keys to the .env file
    ```

### Core Commands

- **Compile:**
  ```bash
  forge build
  ```
- **Test:**
  ```bash
  forge test
  ```
- **Deploy:**
  ```bash
  forge create --rpc-url base_sepolia --private-key $PRIVATE_KEY script/SimpleAccountFactory.s.sol:SimpleAccountFactoryScript
  ```

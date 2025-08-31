# 🧠 WALLET AI — Passkey MEV-Resistant Smart Wallet (ERC-4337)

> **Note**

---

# 🎥 Live Demo

[Watch the Live Demo on Youtube](https://youtu.be/ZvpA0BlrIBQ)

---

## 🌍 The Future of Web3 Wallets — Powered by Natural Language & Account Abstraction

**WALLET AI** is revolutionizing how users interact with blockchain. With a **built-in AI assistant**, **passkey-based authentication**, and full support for **ERC-4337 account abstraction**, it enables seamless, intuitive, and secure blockchain experiences — all in one click.

No mnemonic phrases. No gas fees to worry about. Just simple, fast, and secure access to decentralized finance, NFTs, and dApps — directly from your browser or Telegram.

---

## 🧩 Why WALLET AI?

> "Usability meets decentralization."

We believe blockchain should be accessible to everyone — not just developers. That’s why we’re building WALLET AI: to make interacting with Web3 as easy as typing a message.

By removing technical barriers and offering powerful new capabilities through AI, passkeys, and account abstraction, we are paving the way for true mass adoption.

Blockchain should be as universal and easy as using any everyday app, bringing decentralized access to everyone.

---

## 🔑 Key Features

- ✅ **AI Assistant:** Natural language-based transaction creation.
- ✅ **Account Abstraction:** ERC-4337 support (EntryPoint v0.6).
- ✅ **Passkeys (WebAuthn):** Secure, passwordless authentication (no mnemonics).
- ✅ **MEV Resistance:** Blocklock-encrypted transactions prevent front-running.
- ✅ **Gasless Transactions:** Powered by Paymaster & Bundler infra.
- ✅ **Telegram Mini App Integration:** Onboard via chat.
- ✅ **WalletConnect:** Plug-and-play with dApps.
- ✅ **Genesis Soulbound Token:** A unique, on-chain identity.
- ✅ **Batch Transactions:** Multiple operations in a single `UserOperation`.
- ✅ **Upgradeable Accounts:** UUPS proxy pattern for future-proofing.

---

## 🛡️ MEV Resistance via Blocklock

Maximal Extractable Value (MEV) is an invisible tax on users. WALLET AI combats this by integrating **dcipher’s Blocklock encryption**:

- **Encrypted Mempool:** Transactions are encrypted before hitting the mempool.
- **Commit-Reveal Scheme:** Encrypted transactions are committed first, decrypted later.
- **Just-in-Time Decryption:** Decryption happens only after block inclusion, ensuring no front-running.

### How It Works

1. User builds a transaction (e.g., swap) and enables **MEV Protection**.
2. Transaction data is encrypted with `blocklock-js`, set to unlock in the next block.
3. The wallet submits a `UserOperation` with `executeEncryptedBatch`.
4. Bundler includes it in a block; MEV bots see only opaque data.
5. Blocklock releases the decryption key after block finalization.
6. Wallet decrypts and executes the transaction — too late for MEV bots to exploit.

---

## 🚀 New Integrations

WALLET AI is more than a wallet — it’s an evolving ecosystem.

### ✅ Sealed-Bid Auctions with Blocklock Encryption

- Secret bids, revealed only after the auction ends.
- Prevents last-second bid manipulation.

### ✅ Encrypted Voting & Governance Portal

- Votes stay private until polls close.
- Prevents early voting influence and coercion.

### ✅ Time-Locked Messages

- Encrypt and send assets/messages into the future.
- Use cases: wills, digital time capsules, delayed disclosures.

### ✅ Bomb NFT

- NFTs with hidden encrypted messages revealed only after conditions unlock.
- Creates evolving NFT experiences.

### ✅ Gasless Transaction Status

- Real-time status of UserOperations.
- Transparency in how account abstraction processes your gasless transactions.

---

## 🏗️ Technical Architecture

**On-Chain Contracts**

- `SimpleAccount.sol` — Wallet contract with MEV-protection logic.
- `SimpleAccountFactory.sol` — Deterministic smart wallet deployment.
- `EntryPoint.sol` — Orchestrates ERC-4337 UserOps.

**Off-Chain Services**

- **Bundler** — Aggregates UserOps and submits them.
- **Blocklock Network** — Handles encryption/decryption key delivery.

**Frontend**

- Next.js app with passkey onboarding, AI assistant, and Blocklock SDK.

---

## 🌐 Roadmap

- 🔹 Expand AI agent capabilities (DeFi strategies, portfolio rebalancing).
- 🔹 Cross-chain support for Stacks, Mantle, Base, and more.
- 🔹 Integration of zkProofs for private transactions.
- 🔹 Community-driven governance via encrypted voting portal.

---

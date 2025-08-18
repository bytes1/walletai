import { createPublicClient, http, defineChain } from "viem";
import { sepolia, baseSepolia, mainnet } from "viem/chains";

// Define Anvil (Foundry's local chain)
export const anvil = defineChain({
  id: 1924,
  name: "Anvil",
  network: "anvil",
  nativeCurrency: {
    decimals: 18,
    name: "Ethereum",
    symbol: "ETH",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"],
      webSocket: ["ws://127.0.0.1:8545"],
    },
    public: {
      http: ["http://127.0.0.1:8545"],
      webSocket: ["ws://127.0.0.1:8545"],
    },
  },
  // No block explorer for local anvil chain
});

export const swellchainTestnet = defineChain({
  id: 1924,
  name: "Swellchain Testnet",
  network: "swellchain-testnet",
  nativeCurrency: {
    name: "Ethereum",
    symbol: "ETH",
    decimals: 18,
  },
  rpcUrls: {
    default: {
      http: [""],
    },
    public: {
      http: [""],
    },
  },
  blockExplorers: {
    default: {
      name: "",
      url: "",
    },
  },
});

// Define Monad Testnet with Alchemy RPC
export const monadTestnet = defineChain({
  id: 31337, // Make sure this is the correct chain ID for Monad testnet
  name: "Monad Testnet",
  network: "monad-testnet",
  nativeCurrency: {
    decimals: 18,
    name: "Monad",
    symbol: "MON",
  },
  rpcUrls: {
    default: {
      http: ["http://127.0.0.1:8545"], // Using 127.0.0.1 instead of localhost
      webSocket: [],
    },
    public: {
      http: ["http://127.0.0.1:8545"],
      webSocket: [],
    },
  },
  blockExplorers: {
    default: { name: "Monad Explorer", url: "https://testnet.monadexplorer.com" },
  },
  contracts: {
    multicall3: {
      address: "0xcA11bde05977b3631167028862bE2a173976CA11",
      blockCreated: 0,
    },
  },
});

// Use Anvil or Monad Testnet as needed
export const CHAIN = swellchainTestnet; // Change to monadTestnet if you're really testing on Monad

// Use 127.0.0.1 instead of localhost for more reliable connections
export const transport = http(process.env.NEXT_PUBLIC_NODE_RPC);

export const PUBLIC_CLIENT = createPublicClient({
  chain: CHAIN,
  transport,
});

export const MAINNET_PUBLIC_CLIENT = createPublicClient({
  chain: mainnet,
  transport: http(),
});

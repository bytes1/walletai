export const FACTORY_ABI = [
  {
    type: "constructor",
    inputs: [{ name: "_entryPoint", type: "address", internalType: "contract IEntryPoint" }],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "SALT",
    inputs: [],
    outputs: [{ name: "", type: "bytes32", internalType: "bytes32" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "accountImplem",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract SimpleAccount" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "createAccount",
    inputs: [{ name: "publicKey", type: "bytes32[2]", internalType: "bytes32[2]" }],
    outputs: [{ name: "", type: "address", internalType: "contract SimpleAccount" }],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "entryPoint",
    inputs: [],
    outputs: [{ name: "", type: "address", internalType: "contract IEntryPoint" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getAddress",
    inputs: [{ name: "publicKey", type: "bytes32[2]", internalType: "bytes32[2]" }],
    outputs: [{ name: "", type: "address", internalType: "address" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getUser",
    inputs: [{ name: "id", type: "uint256", internalType: "uint256" }],
    outputs: [
      {
        name: "",
        type: "tuple",
        internalType: "struct User",
        components: [
          { name: "id", type: "uint256", internalType: "uint256" },
          { name: "publicKey", type: "bytes32[2]", internalType: "bytes32[2]" },
          { name: "account", type: "address", internalType: "address" },
        ],
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "getpubkey",
    inputs: [{ name: "id", type: "uint256", internalType: "uint256" }],
    outputs: [{ name: "", type: "bytes32[2]", internalType: "bytes32[2]" }],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "saveUser",
    inputs: [
      { name: "id", type: "uint256", internalType: "uint256" },
      { name: "publicKey", type: "bytes32[2]", internalType: "bytes32[2]" },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "users",
    inputs: [{ name: "id", type: "uint256", internalType: "uint256" }],
    outputs: [
      { name: "id", type: "uint256", internalType: "uint256" },
      { name: "account", type: "address", internalType: "address" },
    ],
    stateMutability: "view",
  },
] as const;

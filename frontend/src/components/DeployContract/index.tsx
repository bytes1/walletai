// frontend/src/components/DeployContract/index.tsx
"use client";
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";

interface DeployContractProps {
  code: string;
  // In a real app, you might pass the contract name as a prop or parse it
  contractName: string;
}

// Define a type for the compiled artifact for better type safety
interface CompiledArtifact {
  abi: any[];
  bytecode: string;
  success: boolean;
}

const DeployContract: React.FC<DeployContractProps> = ({ code, contractName }) => {
  // State for the multi-step deployment process
  const [status, setStatus] = useState("compiling");
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");

  // State to hold blockchain-related data
  const [compiledArtifact, setCompiledArtifact] = useState<CompiledArtifact | null>(null);
  const [signer, setSigner] = useState<ethers.Signer | null>(null);
  const [deployedAddress, setDeployedAddress] = useState("");
  const [transactionHash, setTransactionHash] = useState("");

  useEffect(() => {
    const runDeployment = async () => {
      try {
        // --- Step 1: Compile Contract ---
        setStatus("compiling");
        setProgress(10);
        
        const compileResponse = await fetch("http://localhost:8080/compile", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourceCode: code, contractName }),
        });
        
        const compileResult = await compileResponse.json();
        if (!compileResponse.ok || !compileResult.success) {
          throw new Error(compileResult.details || "Unknown compilation error.");
        }
        setCompiledArtifact(compileResult);
        setProgress(33);

        // --- Step 2: Connect Wallet ---
        setStatus("connecting");
        if (typeof window.ethereum === "undefined") {
          throw new Error("MetaMask (or another Web3 wallet) is not installed.");
        }
        await window.ethereum.request({ method: "eth_requestAccounts" });
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const currentSigner = provider.getSigner();
        setSigner(currentSigner);
        setProgress(66);

        // --- Step 3: Deploy Contract ---
        setStatus("deploying");
        const factory = new ethers.ContractFactory(
          compileResult.abi,
          compileResult.bytecode,
          currentSigner
        );

        // This logic is specific to the example Blocklock contract.
        // A real-world component would need to handle constructor args dynamically.
        const currentBlock = await provider.getBlockNumber();
        const blocklockTime = currentBlock + 10;

        const contract = await factory.deploy(blocklockTime);
        setTransactionHash(contract.deployTransaction.hash);

        await contract.deployed();
        
        setDeployedAddress(contract.address);
        setProgress(100);
        setStatus("deployed");

      } catch (error: any) {
        setErrorMessage(error.reason || error.message || "An unknown error occurred.");
        setStatus("error");
      }
    };

    runDeployment();
  }, [code, contractName]); // Rerun if the code or contract name changes

  const getStatusContent = () => {
    switch (status) {
      case "compiling":
        return { icon: "⚙️", message: "Compiling Smart Contract..." };
      case "connecting":
        return { icon: "🔗", message: "Connecting to Wallet..." };
      case "deploying":
        return { icon: "🛰️", message: "Deploying to Blockchain..." };
      case "deployed":
        return { icon: "🎉", message: "Deployment Successful!" };
      case "error":
        return { icon: "🔥", message: "Deployment Failed" };
      default:
        return { icon: "", message: "" };
    }
  };

  const { icon, message } = getStatusContent();

  return (
    <div className="max-w-lg rounded-3xl backdrop-blur-xl bg-gray-900/50 border border-indigo-500/30 shadow-2xl p-8 text-white transform transition-all duration-500 hover:scale-105 hover:shadow-indigo-500/20">
      <h2 className="text-3xl font-bold mb-6 text-center text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-300">
        Smart Contract Deployment
      </h2>

      <div className="space-y-6">
        <div className="flex items-center justify-center space-x-4 text-xl font-semibold text-gray-200">
          <span
            className={`transition-all duration-500 ${status === "deploying" ? "animate-pulse" : ""}`}
          >
            {icon}
          </span>
          <span>{message}</span>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-gray-800/50 rounded-full h-4 border border-gray-700 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-1000 ease-out ${status === 'error' ? 'bg-red-500' : 'bg-gradient-to-r from-indigo-600 to-cyan-500'}`}
            style={{ width: `${status === 'error' ? 100 : progress}%` }}
          ></div>
        </div>
        
        {/* Error Message Display */}
        {status === "error" && (
            <div className="text-red-400 bg-red-900/30 p-3 rounded-lg border border-red-500/50 text-xs font-mono break-words">
                {errorMessage}
            </div>
        )}

        {/* Deployed Info Display */}
        {status === "deployed" && (
          <div className="animate-fadeIn space-y-4 pt-4 border-t border-gray-700/50 mt-6">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-semibold">Contract Address:</span>
              <span className="text-indigo-300 break-all font-mono text-sm bg-gray-800/60 px-2 py-1 rounded-md">
                {deployedAddress}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-semibold">Transaction Hash:</span>
              <span className="text-cyan-300 break-all font-mono text-sm bg-gray-800/60 px-2 py-1 rounded-md">
                {transactionHash}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default DeployContract;
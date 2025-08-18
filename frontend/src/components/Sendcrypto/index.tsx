"use client";
import { Chain, EstimateFeesPerGasReturnType, Hash, Hex, parseEther } from "viem";
import { smartWallet } from "@/libs/smart-wallet";
import { useEffect, useRef, useState } from "react";
import { UserOpBuilder, emptyHex } from "@/libs/smart-wallet/service/userOps";
import { useBalance } from "@/providers/BalanceProvider";
import { createPublicClient, http } from "viem";
import { useMe } from "@/providers/MeProvider";

type AddressProps = {
  address: string;
  amount: number;
};
smartWallet.init();
const builder = new UserOpBuilder(smartWallet.client.chain as Chain);
export const Cryptosend = ({ address, amount }: AddressProps) => {
  const { me } = useMe();
  const [txReceipt, setTxReceipt] = useState<any>(null);
  const [error, setError] = useState<any>(null);
  const { balance, refreshBalance } = useBalance();
  const submitTx = async (e: any) => {
    e.preventDefault();

    try {
      // This line is causing the error - smartWallet.client is probably pointing to the bundler
      // Create a separate ethClient for standard Ethereum operations
      const ethClient = createPublicClient({
        transport: http(process.env.NEXT_PUBLIC_NODE_RPC), // Use your Ethereum node port, not the bundler
      });

      const { maxFeePerGas, maxPriorityFeePerGas }: EstimateFeesPerGasReturnType =
        await ethClient.estimateFeesPerGas();
      console.log("Amount Type:", typeof amount, "Value:", amount);
      const cleanedAmount = String(amount)
        .replace(/\s*MNT\s*/gi, "")
        .trim();
      const userOp = await builder.buildUserOp({
        calls: [
          {
            dest: address.toLowerCase() as Hex,
            value: BigInt(parseEther(cleanedAmount.toString())), // 100 is the price precision
            data: emptyHex,
          },
        ],
        maxFeePerGas: (BigInt(maxFeePerGas ?? 0) + BigInt(30)) as bigint,
        maxPriorityFeePerGas: maxPriorityFeePerGas as bigint,
        keyId: me?.keyId as Hex,
      });
      const hash = await smartWallet.sendUserOperation({ userOp });
      const receipt = await smartWallet.waitForUserOperationReceipt({ hash });
      setTxReceipt(receipt);
    } catch (e: any) {
      console.error(e);
      setError(e.message);
    } finally {
      refreshBalance();
    }
  };
  return (
    <div className="max-w-sm rounded-2xl backdrop-blur-lg bg-white/10 border border-white/20 shadow-2xl p-6 text-white transform transition-all duration-500 hover:scale-105 hover:shadow-3xl hover:border-purple-400/50">
      <h2 className="text-2xl font-bold mb-4 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400">
        Crypto Send Information
      </h2>
      <div className="space-y-3">
        <p className="text-lg font-semibold">
          <span className="text-gray-300">Address:</span>{" "}
          <span className="text-purple-200 break-all">{address}</span>
        </p>
        <p className="text-lg font-semibold">
          <span className="text-gray-300">Amount:</span>{" "}
          <span className="text-green-300">{amount.toLocaleString()}</span>
        </p>
      </div>
      <button
        className="w-full mt-6 bg-gradient-to-r from-purple-500 to-pink-500 text-white py-2 px-4 rounded-lg font-semibold hover:from-purple-600 hover:to-pink-600 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/50"
        onClick={async (e) => await submitTx(e)}
      >
        Send Crypto
      </button>
    </div>
  );
};

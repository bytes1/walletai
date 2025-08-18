"use client";

import { useBalance } from "@/providers/BalanceProvider";
import { Flex, Text } from "@radix-ui/themes";
import { CSSProperties } from "react";

const css: CSSProperties = {
  padding: "4rem 0",
};

function convertEthValue(value: string) {
  const divisor = BigInt("1000000000000000000"); // 10^18 as BigInt

  if (value === "0") return "0.0000"; // Return string with 4 decimal places

  const ethValue = BigInt(value); // Convert input to BigInt
  const result = Number(ethValue) / Number(divisor); // Perform division

  return result.toFixed(4); // Ensure 4 decimal places
}

export default function Balance() {
  const { balance, balanceeth } = useBalance();
  console.log(balance);
  let [intBalance, decimals] = balance.toString().split(".");

  return (
    <Flex style={css} direction="column" justify="center" align="center" gap="3">
      <Text highContrast={true} weight="bold" size="8" style={{ color: "rgba(0, 0, 0, 0.95)" }}>
        {convertEthValue(balanceeth)} ETH
      </Text>
      <Text highContrast={true} weight="bold" size="5" style={{ color: "rgba(0, 0, 0, 0.95)" }}>
        ${intBalance}
      </Text>
      {/* <Text highContrast={true} weight="bold" size="6" style={{ color: "var(--accent-12)" }}>
        .{(decimals || "00").slice(0, 2)}
      </Text> */}
    </Flex>
  );
}

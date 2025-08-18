"use client";

import type { Message } from "ai";
import { Weather } from "../Weather";
import { Theme } from "@radix-ui/themes";
import { Crypto } from "../Cryptoprice";
import { Cryptosend } from "../Sendcrypto";
import { Stakecrypto } from "../Stake";
import { GenesisSbt } from "../GenesisSbt";

export default function Message({ message }: { message: Message }) {
  return (
    <Theme>
      <div
        className={`relative isolation-auto flex gap-5 p-4 shadow-md ${
          message.role === "assistant"
            ? "bg-gray-900 text-white rounded-lg"
            : "bg-gray-800 text-gray-300"
        }`}
      >
        <div className="text-sm font-medium text-gray-400">
          {message.role === "user" ? "U" : "A"}
        </div>
        <div className="text-sm">{message.content}</div>

        {message.toolInvocations?.map((tool) => {
          const { toolName, toolCallId, state } = tool;

          if (state === "result") {
            if (toolName === "getWeather") {
              return <Weather key={toolCallId} toolCallId={toolCallId} {...tool.result} />;
            } else if (toolName === "cryptoToolPrice") {
              return <Crypto key={toolCallId} {...tool.result} />;
            } else if (toolName === "Sendcrypto") {
              return <Cryptosend key={toolCallId} {...tool.result} />;
            } else if (toolName === "Stakecrypto") {
              return <Stakecrypto key={toolCallId} {...tool.result} />;
            }
          } else {
            if (toolName === "getWeather") {
              return <div key={toolCallId}>Loading weather data...</div>;
            } else if (toolName === "Sendcrypto") {
              return <div>Transaction processing</div>;
            } else if (toolName === "Stakecrypto") {
              return <div>Transaction processing</div>;
            } else {
              return <div>Loading Coin price...</div>;
            }
          }
          return null;
        })}
      </div>
    </Theme>
  );
}

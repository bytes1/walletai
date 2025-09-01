/**
 * @file This file contains the core logic for handling the AI interaction,
 * including tool aggregation and calling the AI model.
 */

import { streamText } from "ai";
import { google } from "@ai-sdk/google";
import { tools } from "../ai/tools";

import { systemPrompt } from "./config";

/**
 * Handles the AI text streaming process.
 * @param {any[]} messages - The array of messages from the user.
 * @returns {Promise<any>} A promise that resolves to the AI's streaming response.
 */
export async function handleAiStream(messages: any[]) {
  // 1. Get tools from CoinGecko by calling our dedicated module.

  // 2. Combine your local tools with the remote tools from CoinGecko.

  // 3. Call the AI model with the combined tools and stream the response.
  const result = streamText({
    model: google("gemini-2.0-flash"),
    system: systemPrompt,
    messages,
    tools,
  });

  return result;
}

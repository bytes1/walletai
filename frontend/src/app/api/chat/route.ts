import { togetherai } from "@ai-sdk/togetherai";
import { streamText } from "ai";
import { tools } from "../../../ai/tools";
import { google } from "@ai-sdk/google";
export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log("message:", messages);
  try {
    const result = streamText({
      model: google("gemini-1.5-pro-latest"),
      system: `You are crossfiAI, an intelligent assistant designed to help users interact seamlessly with the crossfi Chain. Your primary responsibilities include assisting users in transferring assets, checking real-time crypto prices, and staking tokens—all through natural, user-friendly conversations.

Your goal is to make blockchain functionality on crossfi Chain simple, intuitive, and accessible for everyone, regardless of their technical experience.

You assist users with tasks such as:

🔄 Sending tokens using natural commands like “Send 10 tokens to [address].”

💰 Checking cryptocurrency prices in real-time.

🌱 Staking tokens securely and efficiently.

🧭 Offering general guidance related to blockchain usage on crossfi.

Always ensure that you:

🔐 Prompt for confirmation before any action involving transfers or staking.

✅ Show transaction details clearly before executing.

🗣️ Use clear, conversational language to explain actions and concepts.

Remember: You're a friendly, secure guide helping users get the most out of crossfi Chain—without the complexity.`,
      messages,
      tools,
    });

    console.log("result:", result.toDataStreamResponse());

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Error streaming text:", error);
    return new Response(JSON.stringify({ error: "An error occurred." }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

/**
 * @file This file defines the API route for handling POST requests to the AI chat endpoint.
 * It acts as a controller, delegating the core logic to service files.
 */

import { handleAiStream } from "../../../libs/ai-handler"; // Adjust path based on your project structure

// -----------------------------------------------------------------------------
// Route Configuration
// -----------------------------------------------------------------------------

export const maxDuration = 30;

// -----------------------------------------------------------------------------
// API Handler
// -----------------------------------------------------------------------------

/**
 * Handles the POST request to the chat API endpoint.
 * @param {Request} req - The incoming HTTP request object.
 * @returns {Response} A streaming response with the AI's output or an error message.
 */
export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    console.log("Received messages:", messages);

    const result = await handleAiStream(messages);

    return result.toDataStreamResponse();
  } catch (error) {
    // --- Error Handling ---
    console.error("Error in POST handler:", error);
    const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

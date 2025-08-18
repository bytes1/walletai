import { Hex, stringify } from "viem";

export async function GET(_req: Request, { params }: { params: { address: Hex } }) {
  const { address } = params;

  console.log("address", address);
  if (!address) {
    return Response.json(JSON.parse(stringify({ error: "Address is required" })));
  }

  const rpcUrl = "https://rpc.ankr.com/swell_sepolia";
  // const rpcUrl = "http://127.0.0.1:8545";

  const requestBody = {
    jsonrpc: "2.0",
    method: "eth_getBalance",
    params: [address, "latest"],
    id: 1,
  };

  try {
    const response = await fetch(rpcUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
      cache: "no-store",
    });

    const resultJSON = await response.json();

    if (!resultJSON.result) {
      throw new Error("Invalid response from RPC");
    }

    const balance = BigInt(resultJSON.result);

    return Response.json(JSON.parse(stringify({ balance })));
  } catch (error) {
    console.error("Error fetching balance:", error);
    return Response.json(JSON.parse(stringify({ error: "Failed to fetch balance" })));
  }
}

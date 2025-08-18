import { tool } from "ai";
import { z } from "zod";
import axios from "axios";
import { ethers } from "ethers";


export const getWeather = tool({
  description: "Get the current weather in a given location",
  parameters: z.object({
    location: z.string().describe("City, state, or country to get the weather for"),
  }),
  execute: async ({ location }) => {
    const weatherTypes = ["Sunny", "Rainy"];
    const randomTemp = Math.floor(Math.random() * (35 - -5)) + -5; // Random temp between -5 and 35°C
    const randomWeather = weatherTypes[Math.floor(Math.random() * weatherTypes.length)];

    return {
      location,
      temperature: randomTemp,
      weather: randomWeather,
    };
  },
});

// Tool to find pirce of crypto
// export const cryptoTool = tool({
//   description: 'Get price for a crypto currency',
//   parameters: z.object({
//     symbol: z.string().describe('The stock symbol to get the price for'),
//   }),
//   execute: async function ({ symbol }) {
//     // Simulated API call

//     return { symbol, price };
//   },
// });

export const cryptoToolPrice = tool({
  description: "Get price for a crypto currency. only execute when price is asked",
  parameters: z.object({
    symbol: z.string().describe("The crypto symbol to get the price for (e.g., BTC, ETH)"),
  }),
  execute: async function ({ symbol }) {
    const API_KEY = "3ee319b8-e791-4822-a89b-e6287fa84c17"; // Replace with your CoinMarketCap API key
    const convert = "USD"; // Convert price to USD

    const url = "https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest";

    try {
      // Make the API request using Axios
      const response = await axios.get(url, {
        headers: {
          "X-CMC_PRO_API_KEY": API_KEY,
          Accept: "application/json",
        },
        params: {
          symbol: symbol.toUpperCase(), // Ensure the symbol is in uppercase
          convert: convert,
        },
      });

      // Extract the price from the response
      const price = response.data.data[symbol.toUpperCase()].quote[convert].price;

      // Return the symbol and price
      return { symbol, price };
    } catch (error) {
      // Handle errors
      throw new Error("Failed to fetch crypto price");
    }
  },
});

// Update the tools object
// export const tools = {
//   displayWeather: weatherTool,
//   getStockPrice: stockTool,
// };

// Send crypto to another person
export const Sendcrypto = tool({
  description:
    "function to send crypto when address(crypto address) and amount is given. then only execute this. only calls this when send is there in text. return address and amount only.",
  parameters: z.object({
    address: z.string().describe("the blockchain address of person. token need to send"),
    amount: z.string().describe("Amount of tokens need to send"),
  }),
  execute: async function ({ address, amount }) {
    // Simulated API call

    console.log(address, amount);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { address, amount };
  },
});

export const Stakecrypto = tool({
  description:
    "function to stake crypto when  amount is given. then only execute this(only when stake in text)",
  parameters: z.object({
    amount: z.string().describe("Amount of tokens need to send"),
  }),
  execute: async function ({ amount }) {
    

    console.log(amount);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    return { amount };
  },
});

export const readGenesisSbtFromChain = tool({
  description: "Reads the data of a Genesis SBT directly from the Base Sepolia blockchain.",
  parameters: z.object({
    tokenId: z.string().describe("The ID of the token to read (e.g., '0', '1')."),
  }),
  execute: async function ({ tokenId }) {
    try {
      // Connect to the Base Sepolia network
      const provider = new ethers.JsonRpcProvider(Process.env.rpcUrl);

      // Create a contract instance
      const contract = new ethers.Contract(Process.env.contractAddress, contractAbi, provider);

      // Fetch the token name and owner from the contract in parallel
      const [name, owner] = await Promise.all([
        contract.name(),
        contract.ownerOf(tokenId),
      ]);

      // Return a combination of on-chain data and static metadata
      return {
        name: name,
        tokenId: tokenId,
        description: "A unique, non-transferable token representing a special genesis membership.",
        image_uri: "/genesis-sbt.png",
        attributes: [
          { trait_type: "Edition", value: "Genesis" },
          { trait_type: "Status", value: "Active" },
          { trait_type: "Rarity", value: "Mythic" },
        ],
        kycVerified: false,
        contractAddress: contractAddress,
        owner: owner,
      };
    } catch (error: any) {
      console.error("Error fetching from contract:", error);
      // Provide a user-friendly error message
      if (error.code === 'CALL_EXCEPTION') {
        return "Error: The token ID might not exist or the contract is not verified.";
      }
      return `Failed to read from contract: ${error.message}`;
    }
  },
});

export const tools = {
  getWeather,
  cryptoToolPrice,
  Sendcrypto,
  Stakecrypto,
  displayGenesisSbt
};

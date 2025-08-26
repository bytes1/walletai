import { tool } from "ai";
import { z } from "zod";
import axios from "axios";
import { ethers } from "ethers";
import { Hex } from "viem";
import { PUBLIC_CLIENT } from "@/constants"; // Assuming PUBLIC_CLIENT is exported from here
import { MULTI_AUCTION_ABI } from "@/lib/blocklock"; // Assuming the ABI is here


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

export const getAuctionDetails = tool({
  description: "Get details of all available auctions from the smart contract",
  parameters: z.object({}),
  execute: async () => {
    try {
      const AUCTION_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_AUCTION_CONTRACT_ADDRESS as Hex;

      // 1. Get the total number of auctions from the contract's auctionCounter
      const totalAuctions = (await PUBLIC_CLIENT.readContract({
        address: AUCTION_CONTRACT_ADDRESS,
        abi: MULTI_AUCTION_ABI,
        functionName: "auctionCounter",
      })) as bigint; // Cast the result to bigint

      const auctionCount = Number(totalAuctions);
      const auctionsList = [];

      // 2. Prepare all the contract read calls
      const auctionDetailContracts = [];
      for (let i = 0; i < auctionCount; i++) {
        auctionDetailContracts.push({
          address: AUCTION_CONTRACT_ADDRESS,
          abi: MULTI_AUCTION_ABI,
          functionName: "auctions",
          args: [BigInt(i)],
        });
      }

      // 3. Fetch all auction details in a single, efficient multicall
      const results = await PUBLIC_CLIENT.multicall({
        contracts: auctionDetailContracts,
        allowFailure: true, // Continue if one call fails
      });

      // 4. Process the results
      for (let i = 0; i < results.length; i++) {
        const res = results[i];
        if (res.status === 'success') {
          // The result from viem is an array based on the struct's order
          const auctionData = res.result as [string, Hex, bigint, boolean, Hex, bigint];
          
          auctionsList.push({
            id: i,
            description: auctionData[0],
            beneficiary: auctionData[1],
            biddingEndBlock: Number(auctionData[2]), // Convert bigint to number
            ended: auctionData[3],
          });
        }
      }

      return {
        auctions: auctionsList,
      };
    } catch (error) {
      console.error("Error fetching auction details:", error);
      return { error: "Failed to fetch data from the smart contract." };
    }
  },
});

export const bidForAuction = tool({
  description: "Bid for an auction with a specific ID and amount",
  parameters: z.object({
    id: z.number().describe("The ID of the auction to bid on"),
    amount: z.number().describe("The amount to bid"),
  }),
  execute: async ({ id, amount }) => {
    return { id, amount };
  },
});

export const getVotingProposals = tool({
  description: "Get the current voting proposals from the smart contract",
  parameters: z.object({}),
  execute: async () => {
    try {
      const VOTING_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_VOTING_CONTRACT_ADDRESS as Hex;

      // Fetch the total number of proposals and the current block number in parallel
      const [totalProposals, currentBlockNumber] = await Promise.all([
        PUBLIC_CLIENT.readContract({
          address: VOTING_CONTRACT_ADDRESS,
          abi: BLOCKLOCK_VOTING_ABI,
          functionName: "proposalCounter",
        }) as Promise<bigint>,
        PUBLIC_CLIENT.getBlockNumber(),
      ]);

      const proposalCount = Number(totalProposals);
      if (proposalCount === 0) {
        return { proposals: [] }; // Return early if there are no proposals
      }

      // Prepare all the contract read calls for a multicall
      const proposalContracts = Array.from({ length: proposalCount }, (_, i) => ({
        address: VOTING_CONTRACT_ADDRESS,
        abi: BLOCKLOCK_VOTING_ABI,
        functionName: "proposals",
        args: [BigInt(i)],
      }));

      // Fetch all proposal details in a single, efficient multicall
      const results = await PUBLIC_CLIENT.multicall({
        contracts: proposalContracts,
        allowFailure: true,
      });

      // Process the results into the desired format
      const proposalsList = results.map((res, i) => {
        if (res.status === 'failure') {
          return null; // Handle failed calls if necessary
        }
        
        // The result from viem is an array based on the struct's order in the ABI:
        // [string description, address proposer, uint votingEndBlock, uint yesVotes, uint noVotes]
        const proposalData = res.result as [string, Hex, bigint, bigint, bigint];
        const endingBlock = Number(proposalData[2]);
        const status = currentBlockNumber < endingBlock ? "active" : "closed";

        return {
          id: i,
          // The contract has one 'description' field, which we can use for both title and description.
          title: proposalData[0],
          description: proposalData[0],
          status: status,
          votesFor: Number(proposalData[3]),
          votesAgainst: Number(proposalData[4]),
          endingBlock: endingBlock,
        };
      }).filter(p => p !== null); // Filter out any nulls from failed calls

      return {
        proposals: proposalsList,
      };
    } catch (error) {
      console.error("Error fetching voting proposals:", error);
      return { error: "Failed to fetch proposal data from the smart contract." };
    }
  },
});

export const voteOnProposal = tool({
  description: "Vote on a proposal with a specific ID",
  parameters: z.object({
    id: z.number().describe("The ID of the proposal to vote on"),
    vote: z.enum(["yes", "no"]).describe("Your vote (yes or no)"),
  }),
  execute: async ({ id, vote }) => {
    return { id, vote };
  },
});
export const sendTimeLockedMessage = tool({
  description: "Send a time-locked message to a specific address",
  parameters: z.object({
    address: z.string().describe("The recipient's address"),
    message: z.string().describe("The message to send"),
    unlockDate: z.string().describe("The date when the message can be unlocked"),
  }),
  execute: async ({ address, message, unlockDate }) => {
    return { address, message, unlockDate };
  },
});

export const getBombNftSecretMessage = tool({
  description: "Get the secret message from the bomb NFT",
  parameters: z.object({}),
  execute: async () => {
    return {
      secretMessage: "You have 5 gasless transactions for 5 months.",
    };
  },
});

export const tools = {
  getWeather,
  cryptoToolPrice,
  Sendcrypto,
  Stakecrypto,
  displayGenesisSbt,
  getAuctionDetails,
  bidForAuction,
  getVotingProposals,
  voteOnProposal,
  sendTimeLockedMessage,
  getBombNftSecretMessage,
};


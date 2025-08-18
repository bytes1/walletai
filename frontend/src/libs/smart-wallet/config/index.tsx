import { fallback, http } from "viem";

// const publicRpc = http("https://goerli.base.org");
// const localhost = http("http://localhost:8545");
const stackUpBundlerRpcUrl = http(process.env.NEXT_PUBLIC_BUNDLER_RPC);

export const transport = stackUpBundlerRpcUrl;

// http://127.0.0.1:8545

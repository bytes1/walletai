# Dockerized ERC-4337 Paymaster and Bundler

This repository contains a Docker Compose setup to run a local ERC-4337 environment, including a bundler (`rundler`) and a custom Verifying Paymaster service.

---

## Services

The `docker-compose.yml` file defines two main services:

### 1. `rundler`

This service runs `alchemyplatform/rundler`, a production-grade ERC-4337 bundler.

- **Image**: `alchemyplatform/rundler`
- **Ports**: Exposes port `4338` for the bundler's RPC endpoint and `8080` for metrics.
- **Configuration**: The bundler is configured via environment variables in the `docker-compose.yml` file. Key settings include the chain ID (`84532`), the entry point address, and disabling EntryPoint v0.7.

### 2. `paymaster`

This is a custom Node.js Verifying Paymaster service built with the Moleculer microservices framework and Ethers.js.

- **Image**: A custom `node:23-alpine` image built from the `./paymaster` directory.
- **Logic**: The core logic is in `index.ts`. It sets up an HTTP server to receive `userOp`s.
- **Functionality**: It exposes a `pm_sponsorUserOperation` JSON-RPC method. When it receives a UserOperation, it calculates the `verifiableUserOpHash` and signs it using the `PAYMASTER_PK`. The signature, along with `validFrom` and `validUntil` timestamps, is encoded and appended to the `PAYMASTER_CONTRACT` address. This result is then returned as the `paymasterAndData` field for the user operation.
- **Ports**: The port is configured via the `${PAYMASTER_PORT}` environment variable.

---

## How to Run

1.  **Prerequisites**:

    - Docker and Docker Compose installed.

2.  **Build and Start Services**:
    Run the following command from the root of the project:

    ```sh
    docker-compose up --build
    ```

    This will build the `paymaster` image and start both the `paymaster` and `rundler` services.

3.  **Stopping Services**:
    To stop the services, press `Ctrl+C` in the terminal or run:
    ```sh
    docker-compose down
    ```

## Paymaster API

The paymaster service exposes a JSON-RPC API endpoint.

- **Endpoint**: `http://localhost:${PAYMASTER_PORT}/paymaster`
- **Method**: `POST`
- **Supported RPC Method**: `pm_sponsorUserOperation`

**Example Request Body:**

```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "pm_sponsorUserOperation",
  "params": [
    {
      "sender": "0x...",
      "nonce": "0x...",
      "initCode": "0x...",
      "callData": "0x...",
      "maxFeePerGas": "0x...",
      "maxPriorityFeePerGas": "0x...",
      "signature": "0x...",
      "paymasterAndData": "0x"
    },
    "0xEntryPointAddress"
  ]
}
```

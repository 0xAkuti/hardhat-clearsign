# Generate 7730 Plugin

A basic Hardhat 3 plugin that adds a `generate-7730` task that executes Python commands.

## Features

- Adds a new task called `generate-7730`
- Executes Python commands with network context and contract artifacts
- Passes chainId, main contract artifact JSON, and source file path to Python via environment variables
- Supports detailed output with the `--detail` flag
- Built for Hardhat 3 using the new plugin architecture
- Hooks into compilation process with the `--generate-7-7-3-0` global flag
- **NEW**: Adds a `publish-kg` task for publishing Smart Contract Metadata to The Graph Knowledge Graph
- **NEW**: Adds a `fetch-kg` task for retrieving Smart Contract Metadata from The Graph Knowledge Graph

## Usage

### Standalone Task

Run the task with:

```bash
npx hardhat generate-7730
```

Run with detailed output:

```bash
npx hardhat generate-7730 --detail
```

### Publish to Knowledge Graph

Publish Smart Contract Metadata to The Graph Knowledge Graph:

**Easy way (recommended) - using deployment ID:**
```bash
export PRIVATE_KEY=0x...
npx hardhat publish-kg --deployment-id "your-deployment-id"
```

**Manual way - providing all parameters:**
```bash
npx hardhat publish-kg \
  --contract 0x1234567890abcdef1234567890abcdef12345678 \
  --chain-id 8453 \
  --contract-name "ComplexCounter" \
  --erc7730-file "./artifacts/ComplexCounter-erc7730.json" \
  --private-key 0x...
```

**Use mainnet instead of testnet (defaults to testnet):**
```bash
npx hardhat publish-kg --deployment-id "your-deployment-id" --mainnet
```

### Fetch from Knowledge Graph

Retrieve Smart Contract Metadata from The Graph Knowledge Graph:

```bash
npx hardhat fetch-kg \
  --contract 0x1234567890abcdef1234567890abcdef12345678 \
  --chain-id 8453 \
  --space-id ABC123 \
  --testnet
```

Output as JSON:
```bash
npx hardhat fetch-kg --contract 0x... --chain-id 8453 --space-id ABC123 --json --testnet
```

### Compilation Hook

Run automatically after compilation:

```bash
npx hardhat compile --generate-7-7-3-0
```

This will compile your contracts and then automatically run the generate-7730 task.

Note: The flag name is displayed as `--generate-7-7-3-0` in the CLI (kebab-case) but defined as `generate7730` in the code (camelCase).

## Plugin Structure

```
plugin/
├── index.ts              # Main plugin export
├── tasks/
│   ├── generate-7730.ts  # Task definition for ERC-7730 generation
│   ├── publish-kg.ts     # Task definition for Knowledge Graph publishing
│   └── fetch-kg.ts       # Task definition for Knowledge Graph fetching
├── actions/
│   ├── generate-7730.ts  # Task action logic for ERC-7730 generation
│   ├── publish-kg.ts     # Task action logic for Knowledge Graph publishing
│   └── fetch-kg.ts       # Task action logic for Knowledge Graph fetching
├── hook-handlers/
│   └── solidity.ts       # Solidity compilation hooks
└── README.md            # This file
```

## Integration

The plugin is registered in `hardhat.config.ts`:

```typescript
import generate7730Plugin from "./plugin/index.js";

const config: HardhatUserConfig = {
  plugins: [generate7730Plugin],
  // ... other config
};
```

## Development

To extend this plugin:

1. Modify the Python command in `actions/generate-7730.ts` (currently uses `uvx pycowsay`)
2. Add additional flags or parameters in `tasks/generate-7730.ts`
3. Create additional tasks by adding them to the `tasks` array in `index.ts`

### Environment Variables Passed to Python

The plugin automatically passes the following environment variables to the Python process:

- `CHAIN_ID`: The blockchain network's chain ID (e.g., "31337" for Hardhat Network)
- `CONTRACT_ARTIFACT`: Complete JSON artifact of the main compiled contract including ABI, bytecode, and metadata
- `CONTRACT_SOURCE_PATH`: Absolute path to the Solidity source file of the main contract (e.g., `/workspaces/ethglobal-cannes/hh-plugin/contracts/ComplexCounter.sol`)
- `CONTRACT_ARTIFACT_PATH`: Absolute path to the artifact JSON file of the main contract (e.g., `/workspaces/ethglobal-cannes/hh-plugin/artifacts/contracts/ComplexCounter.sol/ComplexCounter.json`)
- `DEPLOYED_CONTRACT_ADDRESS`: Address where the contract was deployed (only when `--deployment-id` is used)

### Example Python Usage

```python
import os
import json

# Access the passed data
chain_id = os.environ.get('CHAIN_ID')
artifact_json = os.environ.get('CONTRACT_ARTIFACT')
source_path = os.environ.get('CONTRACT_SOURCE_PATH')
artifact_path = os.environ.get('CONTRACT_ARTIFACT_PATH')

if artifact_json:
    artifact = json.loads(artifact_json)
    contract_name = artifact.get('contractName', 'Unknown')
    abi = artifact.get('abi', [])
    # Process the ABI for ERC7730 generation
    print(f"Generating ERC7730 for {contract_name} on chain {chain_id}")
    print(f"Source file (absolute): {source_path}")
    print(f"Artifact file (absolute): {artifact_path}")
    print(f"Deployed address: {os.environ.get('DEPLOYED_CONTRACT_ADDRESS')}")
```

## Knowledge Graph Publishing (`publish-kg`)

The `publish-kg` task publishes Smart Contract Metadata to The Graph Knowledge Graph using the `@graphprotocol/grc-20` library.

### What it does:

1. **Creates structured metadata** for smart contracts including:
   - Contract Address
   - Chain ID
   - Contract Name  
   - ERC-7730 JSON metadata

2. **Publishes to The Graph Knowledge Graph** by:
   - Creating a "Smart Contract Metadata" entity type
   - Publishing the metadata as an entity in the knowledge graph
   - Storing the data on IPFS and recording the reference on-chain

3. **Supports both testnet and mainnet** deployments

### Parameters:

**Recommended approach:**
- `--deployment-id`: Ignition deployment ID to auto-extract all contract information (recommended)

**Manual parameters (optional when using deployment-id):**
- `--contract`: Contract address to publish metadata for (auto-detected from deployment)
- `--chain-id`: Blockchain chain ID (auto-detected from deployment)
- `--contract-name`: Name of the contract (auto-detected from deployment)
- `--erc7730-file`: Path to the ERC-7730 JSON file (auto-detected from deployment)

**Other options:**
- `--private-key`: Wallet private key (can use PRIVATE_KEY env var)
- `--space-id`: Space ID to publish to (defaults to Smart Contract Metadata space: `10ea8392-1c7e-4866-8559-eeea7b4722ef`)
- `--mainnet`: Use mainnet instead of testnet (defaults to testnet)

### Example Output:

```
📦 Loading deployment info from: d-1
✅ Extracted deployment info:
   📄 Contract: ComplexCounter (0x1234567890abcdef1234567890abcdef12345678)
   ⛓️  Chain ID: 31337
   📋 ERC-7730 File: /path/to/ignition/deployments/d-1/artifacts/ComplexCounter-erc7730.json
📋 Publishing Smart Contract Metadata to Knowledge Graph
Contract: 0x1234567890abcdef1234567890abcdef12345678
Chain ID: 31337
Contract Name: ComplexCounter
Network: TESTNET
Space ID: 10ea8392-1c7e-4866-8559-eeea7b4722ef
📱 Wallet address: 0x...
📍 Using space: 10ea8392-1c7e-4866-8559-eeea7b4722ef
🔗 Created entity: DEF456
📤 Publishing to IPFS...
📝 IPFS CID: ipfs://QmXYZ...
📨 Transaction target: 0x...
🚀 Sending transaction...
✅ Transaction sent: 0x...
🎉 Smart Contract Metadata successfully published to Knowledge Graph!
📍 Space ID: 10ea8392-1c7e-4866-8559-eeea7b4722ef
🔗 Entity ID: DEF456
📝 IPFS CID: ipfs://QmXYZ...
💎 Transaction Hash: 0x...
```

## Knowledge Graph Fetching (`fetch-kg`)

The `fetch-kg` task retrieves Smart Contract Metadata from The Graph Knowledge Graph by contract address and chain ID.

### What it does:

1. **Searches for contract metadata** using:
   - Contract Address
   - Chain ID
   - Optional Space ID for targeted search

2. **Queries The Graph Knowledge Graph** by:
   - Accessing the hypergraph API endpoints
   - Searching through specified spaces
   - Matching entities by contract address and chain ID

3. **Returns structured metadata** including:
   - Contract name and address
   - Chain ID
   - ERC-7730 JSON metadata
   - Entity and space IDs

### Parameters:

- `--contract`: Contract address to search for (required)
- `--chain-id`: Blockchain chain ID (required)
- `--space-id`: Specific space ID to search in (optional, improves search accuracy)
- `--testnet`: Use testnet instead of mainnet (optional)
- `--json`: Output results as JSON format (optional)

### Example Output:

```
🔍 Searching for Smart Contract Metadata in Knowledge Graph
Contract: 0x1234567890abcdef1234567890abcdef12345678
Chain ID: 8453
Network: TESTNET
📡 Querying space: ABC123
✅ Space found, searching for contract metadata...

📋 Search Results:
──────────────────────────────────────────────────
✅ Contract metadata found!
📍 Entity ID: DEF456
📝 Entity Name: ComplexCounter (8453:0x1234...)
📄 Contract Name: ComplexCounter
🔗 Contract Address: 0x1234567890abcdef1234567890abcdef12345678
⛓️  Chain ID: 8453
🏗️  Space ID: ABC123

📊 ERC-7730 Metadata:
──────────────────────────────
{
  "context": { ... },
  "metadata": { ... },
  "display": { ... }
}
```

### Usage Notes:

- **Space ID**: Providing a space ID significantly improves search performance and accuracy
- **Global Search**: Without a space ID, the search capabilities are currently limited
- **JSON Output**: Use `--json` flag for programmatic consumption of results
- **Network Selection**: Ensure you're searching the correct network (testnet vs mainnet)

## Requirements

- Node.js with child_process support
- `uvx` and `pycowsay` for the Python command (or replace with your own command)
- `@graphprotocol/grc-20` library for Knowledge Graph publishing 
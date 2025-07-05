# Generate 7730 Plugin

A basic Hardhat 3 plugin that adds a `generate-7730` task that executes Python commands.

## Features

- Adds a new task called `generate-7730`
- Executes Python commands with network context and contract artifacts
- Passes chainId, main contract artifact JSON, and source file path to Python via environment variables
- Supports detailed output with the `--detail` flag
- Built for Hardhat 3 using the new plugin architecture
- Hooks into compilation process with the `--generate-7-7-3-0` global flag

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
│   └── generate-7730.ts  # Task definition
├── actions/
│   └── generate-7730.ts  # Task action logic
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

### Example Python Usage

```python
import os
import json

# Access the passed data
chain_id = os.environ.get('CHAIN_ID')
artifact_json = os.environ.get('CONTRACT_ARTIFACT')
source_path = os.environ.get('CONTRACT_SOURCE_PATH')

if artifact_json:
    artifact = json.loads(artifact_json)
    contract_name = artifact.get('contractName', 'Unknown')
    abi = artifact.get('abi', [])
    # Process the ABI for ERC7730 generation
    print(f"Generating ERC7730 for {contract_name} on chain {chain_id}")
    print(f"Source file (absolute): {source_path}")
```

## Requirements

- Node.js with child_process support
- `uvx` and `pycowsay` for the Python command (or replace with your own command) 
# Example Hardhat 3 Project: Clearsign Plugin for ERC7730 Generation

This repository is an example Hardhat 3 project created to demonstrate the **clearsign plugin**, which generates [ERC7730](https://eips.ethereum.org/EIPS/eip-7730) compliant metadata for smart contracts. ERC7730 is a new Ethereum standard for contract interface discovery and machine-readable metadata, designed to improve contract interoperability and developer tooling. You can find more about ERC7730 online and in the official EIP.

The **clearsign plugin** is built using the new Hardhat 3 plugin architecture, showcasing best practices for modern plugin development. It integrates with the Hardhat compilation process and exposes a custom task to generate ERC7730 JSON using both contract artifacts and source code. The plugin is designed for extensibility and real-world use, and is demonstrated here as part of our submission for the **EthGlobal Cannes Hackathon**.

---

## Plugin Features

- Hardhat 3 compatible plugin architecture
- Custom task: `generate-7730` for generating ERC7730 metadata
- Compilation hook: automatically runs after compile with `--generate-7-7-3-0`
- Passes contract artifact, source file, and network context to downstream tools (e.g., Python)
- Example integration for further ERC7730 processing

## Usage

1. Install dependencies and build the project:
   ```sh
   npm install
   npx hardhat compile
   ```
2. Run the custom task:
   ```sh
   npx hardhat generate-7730 --detail
   ```
3. Or use the compilation hook:
   ```sh
   npx hardhat compile --generate-7-7-3-0
   ```

## Environment Variables Passed to Python

- `CHAIN_ID`: The blockchain network's chain ID (e.g., "31337" for Hardhat Network)
- `CONTRACT_ARTIFACT`: Complete JSON artifact of the main compiled contract including ABI, bytecode, and metadata
- `CONTRACT_SOURCE_PATH`: Absolute path to the Solidity source file of the main contract (e.g., `/workspaces/ethglobal-cannes/hh-plugin/contracts/ComplexCounter.sol`)
- `CONTRACT_ARTIFACT_PATH`: Absolute path to the artifact JSON file of the main contract (e.g., `/workspaces/ethglobal-cannes/hh-plugin/artifacts/contracts/ComplexCounter.sol/ComplexCounter.json`)

### Example Python Usage

```python
import os
import json

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
```

---

For more details on ERC7730, see the [official EIP-7730](https://eips.ethereum.org/EIPS/eip-7730) and related resources online.

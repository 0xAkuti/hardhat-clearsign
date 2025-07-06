# ClearSignKit - Hardhat 3 Plugin

**Seamless ERC-7730 clear signing integration for Hardhat 3 development workflows**

This repository contains a Hardhat 3 plugin that automates the generation and publishing of ERC-7730 clear signing schemas directly from your smart contract development workflow. Built specifically for Hardhat 3's new architecture, it integrates with Ignition deployments and The Graph's Knowledge Graph for decentralized schema storage.

## 🚀 Key Features

### Hardhat 3 Native Integration

- **Modern Plugin Architecture**: Built specifically for Hardhat 3.0.0-next.\* versions
- **TypeScript Support**: Full TypeScript integration with modern ES modules
- **Ignition Integration**: Seamlessly works with Hardhat Ignition deployment IDs
- **Post-compilation Hooks**: Automatic schema generation after contract compilation

### AI-Powered Schema Generation

- **Automatic Analysis**: Uses our AI-enhanced python-erc7730 engine
- **Local Artifact Processing**: Processes contracts from Hardhat build artifacts
- **Context-Aware Generation**: Includes source code and documentation for better AI inference
- **Validation**: Built-in ERC-7730 schema validation

### Knowledge Graph Publishing

- **Decentralized Storage**: Publish schemas to The Graph's GRC-20 Knowledge Graph
- **Cross-chain Support**: Works with any network supported by Hardhat 3
- **Public Repository**: Makes schemas discoverable by wallets and dApps
- **Version Control**: Track schema versions and updates

## 🔧 Installation

### Prerequisites

- **Hardhat 3 Alpha**: Must use `hardhat@^3.0.0-next.*`
- **Node.js**: Version 18 or later
- **Python**: For AI-powered schema generation (optional)

### Setup

```bash
# Clone the repository
git clone https://github.com/0xAkuti/hardhat-clearsign.git
cd hardhat-clearsign

# Install dependencies
npm install

# Compile contracts
npx hardhat compile
```

## 📖 Usage

### Basic Commands

```bash
# Generate ERC-7730 schema for deployed contracts
npx hardhat generate-7730 --deployment-id my-deployment

# Publish schema to The Graph Knowledge Graph
npx hardhat publish-kg --deployment-id my-deployment --private-key 0x...

# Fetch existing schemas from Knowledge Graph
npx hardhat fetch-kg --deployment-id my-deployment

# Generate schemas automatically during compilation
npx hardhat compile --generate7730
```

### Advanced Usage

```bash
# Generate with detailed output
npx hardhat generate-7730 --deployment-id my-deployment --detail

# Specify custom chain ID
npx hardhat generate-7730 --deployment-id my-deployment --chain-id 137

# Use custom AI model
OPENAI_MODEL=gpt-4 npx hardhat generate-7730 --deployment-id my-deployment
```

### Environment Configuration

Create a `.env` file for AI and Knowledge Graph features:

```env
# AI Configuration (for automatic schema generation)
OPENAI_API_KEY=your_openai_api_key
OPENAI_BASE_URL=https://api.openai.com/v1  # Optional
OPENAI_MODEL=gpt-4o-mini  # Optional

# Knowledge Graph Configuration
GRC20_PRIVATE_KEY=your_wallet_private_key  # For publishing schemas
```

## 🛠️ Plugin Architecture

### Custom Tasks

The plugin provides three main tasks:

1. **`generate-7730`**: Generate ERC-7730 schemas from deployment artifacts
2. **`publish-kg`**: Publish schemas to The Graph's Knowledge Graph
3. **`fetch-kg`**: Retrieve existing schemas from the Knowledge Graph

### Global Options

- **`--generate7730`**: Enable automatic schema generation during compilation

### Hook Integration

The plugin hooks into Hardhat's compilation process to automatically generate schemas when the `--generate7730` flag is used.

## 🔗 Integration with ClearSignKit Ecosystem

This plugin is part of the larger ClearSignKit toolkit:

- **[python-erc7730](https://github.com/0xAkuti/python-erc7730)**: AI-powered schema generation engine
- **[clear-signing-erc7730-builder](https://github.com/0xAkuti/clear-signing-erc7730-builder)**: Visual web interface
- **hardhat-clearsign** (this repo): Hardhat 3 development plugin

## 🏗️ Technical Implementation

### Hardhat 3 Features Utilized

- **Modern Plugin System**: Uses Hardhat 3's improved plugin architecture
- **TypeScript Native**: Full TypeScript support with proper type checking
- **ES Modules**: Modern JavaScript module system
- **Viem Integration**: Modern Ethereum library for contract interactions
- **Ignition Integration**: Seamless integration with Hardhat Ignition deployments

### Data Flow

1. **Deployment Detection**: Plugin detects Ignition deployment IDs
2. **Artifact Processing**: Extracts contract artifacts and metadata
3. **AI Analysis**: Calls python-erc7730 engine for schema generation
4. **Knowledge Graph**: Publishes schemas using GRC-20-ts library
5. **Validation**: Ensures schemas meet ERC-7730 standards

### Environment Variables (Internal)

When calling the Python engine, the plugin passes:

- `CHAIN_ID`: Network chain ID from deployment
- `CONTRACT_ARTIFACT`: Complete contract artifact JSON
- `CONTRACT_SOURCE_PATH`: Path to Solidity source file
- `CONTRACT_ARTIFACT_PATH`: Path to artifact JSON file
- `CONTRACT_ADDRESS`: Deployed contract address
- `CONTRACT_NAME`: Contract name from artifact

## 🎯 Example Workflow

### Developer Experience

```bash
# 1. Deploy your contract with Ignition
npx hardhat ignition deploy ./ignition/modules/MyContract.ts --network sepolia --deployment-id my-deployment

# 2. Generate ERC-7730 schema automatically
npx hardhat generate-7730 --deployment-id my-deployment

# 3. Publish to Knowledge Graph for wallet integration
npx hardhat publish-kg --deployment-id my-deployment --private-key $PRIVATE_KEY
```

## 🤝 Contributing

This plugin showcases Hardhat 3's capabilities and serves as an example for the community. Contributions and improvements are welcome!

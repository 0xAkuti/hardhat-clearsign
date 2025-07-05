import { task } from "hardhat/config";
import type { NewTaskDefinition } from "hardhat/types/tasks";
import { ArgumentType } from "hardhat/types/arguments";

const publishKgTask: NewTaskDefinition = task("publish-kg")
  .setDescription("Publish Smart Contract Metadata to Knowledge Graph using grc-20 library")
  .setAction(import.meta.resolve("../actions/publish-kg.js"))
  .addOption({
    name: "deploymentId",
    description: "Ignition deployment ID to load deployment info from (recommended)",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "contract",
    description: "Contract address to publish metadata for (auto-detected from deployment if not provided)",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "chainId",
    description: "Chain ID for the contract (auto-detected from deployment if not provided)",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "contractName",
    description: "Name of the contract (auto-detected from deployment if not provided)",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "erc7730File",
    description: "Path to the ERC-7730 JSON file (auto-detected from deployment if not provided)",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "privateKey",
    description: "Private key for wallet (can also be set via PRIVATE_KEY env var)",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "spaceId",
    description: "Space ID to publish to",
    type: ArgumentType.STRING,
    defaultValue: "10ea8392-1c7e-4866-8559-eeea7b4722ef",
  })
  .addFlag({ name: "mainnet", description: "Use mainnet instead of testnet (defaults to testnet)" })
  .build();

export default publishKgTask;
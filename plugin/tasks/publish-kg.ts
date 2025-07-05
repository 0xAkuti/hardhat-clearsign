import { task } from "hardhat/config";
import type { NewTaskDefinition } from "hardhat/types/tasks";
import { ArgumentType } from "hardhat/types/arguments";

const publishKgTask: NewTaskDefinition = task("publish-kg")
  .setDescription("Publish Smart Contract Metadata to Knowledge Graph using grc-20 library")
  .setAction(import.meta.resolve("../actions/publish-kg.js"))
  .addOption({
    name: "contract",
    description: "Contract address to publish metadata for",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "chainId",
    description: "Chain ID for the contract",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "contractName",
    description: "Name of the contract",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addOption({
    name: "erc7730File",
    description: "Path to the ERC-7730 JSON file",
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
    description: "Existing space ID to publish to (if not provided, will create a new space)",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addFlag({ name: "testnet", description: "Use testnet instead of mainnet" })
  .build();

export default publishKgTask;
import { task } from "hardhat/config";
import type { NewTaskDefinition } from "hardhat/types/tasks";
import { ArgumentType } from "hardhat/types/arguments";

const fetchKgTask: NewTaskDefinition = task("fetch-kg")
  .setDescription("Fetch Smart Contract Metadata from Knowledge Graph by chain ID and contract address")
  .setAction(import.meta.resolve("../actions/fetch-kg.js"))
  .addOption({
    name: "contract",
    description: "Contract address to fetch metadata for",
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
    name: "spaceId",
    description: "Space ID to search in (if not provided, will search default Smart Contract Metadata space)",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .addFlag({ name: "testnet", description: "Use testnet instead of mainnet" })
  .addFlag({ name: "json", description: "Output results as JSON" })
  .build();

export default fetchKgTask;
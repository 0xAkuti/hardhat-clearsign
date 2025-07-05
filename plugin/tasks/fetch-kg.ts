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
    description: "Space ID to search in",
    type: ArgumentType.STRING,
    defaultValue: "10ea8392-1c7e-4866-8559-eeea7b4722ef",
  })
  .addFlag({ name: "mainnet", description: "Use mainnet instead of testnet (defaults to testnet)" })
  .addFlag({ name: "json", description: "Output results as JSON" })
  .build();

export default fetchKgTask;
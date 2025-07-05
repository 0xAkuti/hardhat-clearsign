import { task } from "hardhat/config";
import type { NewTaskDefinition } from "hardhat/types/tasks";
import { ArgumentType } from "hardhat/types/arguments";

const generate7730Task: NewTaskDefinition = task("generate-7730")
  .setDescription("Generate 7730 - A basic task for demonstration")
  .setAction(import.meta.resolve("../actions/generate-7730.js"))
  .addFlag({ name: "detail", description: "Enable detailed output" })
  .addOption({
    name: "deploymentId",
    description: "Ignition deployment ID to load deployment info from",
    type: ArgumentType.STRING,
    defaultValue: "",
  })
  .build();

export default generate7730Task; 
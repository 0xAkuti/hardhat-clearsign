import { task } from "hardhat/config";
import type { NewTaskDefinition } from "hardhat/types/tasks";

const generate7730Task: NewTaskDefinition = task("generate-7730")
  .setDescription("Generate 7730 - A basic task for demonstration")
  .setAction(import.meta.resolve("../actions/generate-7730.js"))
  .addFlag({ name: "detail", description: "Enable detailed output" })
  .build();

export default generate7730Task; 
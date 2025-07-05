import type { HardhatPlugin } from "hardhat/types/plugins";
import { globalOption } from "hardhat/config";
import { ArgumentType } from "hardhat/types/arguments";
import generate7730Task from "./tasks/generate-7730.js";
import publishKgTask from "./tasks/publish-kg.js";

declare module "hardhat/types/global-options" {
  interface GlobalOptions {
    "generate7730": boolean;
  }
}

const plugin: HardhatPlugin = {
  id: "generate-7730-plugin",
  tasks: [generate7730Task, publishKgTask],
  globalOptions: [
    globalOption({
      name: "generate7730",
      description: "Run generate-7730 task after compilation",
      defaultValue: false,
      type: ArgumentType.BOOLEAN,
    }),
  ],
  hookHandlers: {
    solidity: import.meta.resolve("./hook-handlers/solidity.js"),
  },
};

export default plugin; 
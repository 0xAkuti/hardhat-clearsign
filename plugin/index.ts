import type { HardhatPlugin } from "hardhat/types/plugins";
import generate7730Task from "./tasks/generate-7730.js";

const plugin: HardhatPlugin = {
  id: "generate-7730-plugin",
  tasks: [generate7730Task],
};

export default plugin; 
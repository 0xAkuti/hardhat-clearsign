import type { NewTaskActionFunction } from "hardhat/types/tasks";
import { spawn } from "child_process";

export interface TaskActionArguments {
  detail: boolean;
}

const action: NewTaskActionFunction<TaskActionArguments> = async (
  args,
  hre
) => {
  console.log("🚀 Running generate-7730 task");
  
  if (args.detail) {
    console.log("📋 Task arguments:", args);
    console.log("🏗️  Hardhat Runtime Environment available");
  }
  
  try {
    console.log("🐍 Executing Python command...");
    
    // Execute the Python command
    const result = await new Promise<string>((resolve, reject) => {
      const process = spawn("uvx", ["pycowsay", "Hello", "from", "Hardhat"], {
        stdio: ["pipe", "pipe", "pipe"]
      });
      
      let stdout = "";
      let stderr = "";
      
      process.stdout.on("data", (data) => {
        stdout += data.toString();
      });
      
      process.stderr.on("data", (data) => {
        stderr += data.toString();
      });
      
      process.on("close", (code) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Python command failed with code ${code}: ${stderr}`));
        }
      });
      
      process.on("error", (error) => {
        reject(new Error(`Failed to start Python command: ${error.message}`));
      });
    });
    
    // Print the output from the Python command
    console.log(result);
    
    console.log("✅ Task generate-7730 completed successfully!");
    
  } catch (error) {
    console.error("❌ Error executing Python command:", error);
    throw error;
  }
};

export default action; 
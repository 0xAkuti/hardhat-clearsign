import type { NewTaskActionFunction } from "hardhat/types/tasks";
import { spawn } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import path from "path";

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
    // Get the chainId from the current network
    let chainId = "31337"; // Default to hardhat local chainId
    let networkName = "hardhat";
    
    try {
      // Try to access network information
      if (hre.config.networks && hre.config.defaultNetwork) {
        const defaultNetwork = hre.config.networks[hre.config.defaultNetwork];
        if (defaultNetwork && 'chainId' in defaultNetwork && defaultNetwork.chainId) {
          chainId = defaultNetwork.chainId.toString();
        }
        networkName = hre.config.defaultNetwork;
      }
    } catch (networkError) {
      console.warn("⚠️  Could not determine network info, using defaults");
    }
    
    if (args.detail) {
      console.log(`🔗 Chain ID: ${chainId}`);
      console.log(`🌐 Network: ${networkName}`);
    }
    
    // Discover and read the main contract artifact JSON
    let artifactJson = "";
    let contractName = "";
    let contractSourcePath = "";
    
    try {
      // Get artifacts path from config or use default
      const artifactsPath = hre.config?.paths?.artifacts || "artifacts";
      const contractsDir = join(artifactsPath, "contracts");
      
      if (args.detail) {
        console.log(`🔍 Searching for contracts in: ${contractsDir}`);
      }
      
      // Find the main contract artifact
      const { readdirSync, statSync } = await import("fs");
      
      let foundArtifact = false;
      let artifactPath = "";
      
      // Look for .sol directories in the contracts folder
      const contractDirs = readdirSync(contractsDir).filter(item => {
        const itemPath = join(contractsDir, item);
        return statSync(itemPath).isDirectory() && item.endsWith('.sol');
      });
      
      if (args.detail) {
        console.log(`📁 Found contract directories: ${contractDirs.join(', ')}`);
      }
      
      // Try to find the main contract (prefer non-test contracts)
      for (const contractDir of contractDirs) {
        if (!contractDir.includes('.t.sol')) { // Skip test contracts
          const contractDirPath = join(contractsDir, contractDir);
          const jsonFiles = readdirSync(contractDirPath).filter(file => file.endsWith('.json'));
          
          // Find the main contract JSON (same name as directory without .sol)
          const baseName = contractDir.replace('.sol', '');
          const mainJsonFile = `${baseName}.json`;
          
          if (jsonFiles.includes(mainJsonFile)) {
            artifactPath = join(contractDirPath, mainJsonFile);
            contractName = baseName;
            // Derive the source file path (absolute)
            contractSourcePath = path.resolve(join("contracts", contractDir));
            foundArtifact = true;
            break;
          }
        }
      }
      
      if (!foundArtifact && contractDirs.length > 0) {
        // Fallback: use the first available contract
        const firstContractDir = contractDirs[0];
        const contractDirPath = join(contractsDir, firstContractDir);
        const jsonFiles = readdirSync(contractDirPath).filter(file => file.endsWith('.json'));
        
        if (jsonFiles.length > 0) {
          const firstJsonFile = jsonFiles[0];
          artifactPath = join(contractDirPath, firstJsonFile);
          contractName = firstJsonFile.replace('.json', '');
          contractSourcePath = join("contracts", firstContractDir);
          contractSourcePath = path.resolve(contractSourcePath);
          foundArtifact = true;
        }
      }
      
      if (foundArtifact) {
        const artifactData = readFileSync(artifactPath, "utf-8");
        artifactJson = artifactData;
        
        if (args.detail) {
          console.log(`📄 Artifact loaded successfully: ${contractName}`);
          console.log(`📁 Artifact path: ${artifactPath}`);
          console.log(`📄 Source file path: ${contractSourcePath}`);
        }
      } else {
        console.warn("⚠️  No contract artifacts found");
        artifactJson = "{}";
        contractSourcePath = "";
      }
      
    } catch (artifactError) {
      console.warn("⚠️  Could not load contract artifact:", (artifactError as Error).message);
      // Continue with empty artifact JSON
      artifactJson = "{}";
      contractSourcePath = "";
    }
    
    console.log("🐍 Executing Python command with chainId and artifact...");
    
    // Execute the Python command with chainId and artifact as arguments
    const result = await new Promise<string>((resolve, reject) => {
      const childProcess = spawn("uvx", [
        "pycowsay", 
        `Hello from Hardhat! Chain: ${chainId}`
      ], {
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          CHAIN_ID: chainId,
          CONTRACT_ARTIFACT: artifactJson,
          CONTRACT_SOURCE_PATH: contractSourcePath,
        }
      });
      
      let stdout = "";
      let stderr = "";
      
      childProcess.stdout.on("data", (data: Buffer) => {
        stdout += data.toString();
      });
      
      childProcess.stderr.on("data", (data: Buffer) => {
        stderr += data.toString();
      });
      
      childProcess.on("close", (code: number | null) => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error(`Python command failed with code ${code}: ${stderr}`));
        }
      });
      
      childProcess.on("error", (error: Error) => {
        reject(new Error(`Failed to start Python command: ${error.message}`));
      });
    });
    
    // Print the output from the Python command
    console.log(result);
    
    if (args.detail) {
      console.log("💾 Environment variables passed to Python:");
      console.log(`   CHAIN_ID: ${chainId}`);
      console.log(`   CONTRACT_ARTIFACT: <JSON data available${contractName ? ` for ${contractName}` : ''}>`);
      console.log(`   CONTRACT_SOURCE_PATH: ${contractSourcePath || '<not found>'}`);
    }
    
    console.log("✅ Task generate-7730 completed successfully!");
    
  } catch (error) {
    console.error("❌ Error executing Python command:", error);
    throw error;
  }
};

export default action; 
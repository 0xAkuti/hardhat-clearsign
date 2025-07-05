import type { NewTaskActionFunction } from "hardhat/types/tasks";
import { spawn } from "child_process";
import { readFileSync } from "fs";
import { join } from "path";
import path from "path";

export interface TaskActionArguments {
  detail: boolean;
  deploymentId?: string;
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
    let contractArtifactPath = "";
    
    try {
      // If a deploymentId is provided, attempt to load data from the Ignition deployment folder
      if (args.deploymentId && args.deploymentId !== "") {
        const deploymentPath = path.resolve(
          "ignition",
          "deployments",
          args.deploymentId
        );

        if (!hre.artifacts || !(await import("fs")).existsSync(deploymentPath)) {
          console.warn(
            `⚠️  Deployment folder not found for deploymentId '${args.deploymentId}'. Falling back to artifact discovery.`
          );
        } else {
          if (args.detail) {
            console.log(`📦 Loading deployment data from: ${deploymentPath}`);
          }

          // 1. Chain ID (from folder name or journal)
          const chainIdMatch = args.deploymentId.match(/chain-(\d+)/);
          if (chainIdMatch) {
            chainId = chainIdMatch[1];
          } else {
            // Read first line of journal for chainId
            try {
              const journalPath = path.join(deploymentPath, "journal.jsonl");
              const firstLine = readFileSync(journalPath, "utf-8").split("\n")[1];
              if (firstLine) {
                const parsed = JSON.parse(firstLine);
                if (parsed.chainId) {
                  chainId = parsed.chainId.toString();
                }
              }
            } catch {}
          }

          // 2. Deployed addresses
          const deployedAddrPath = path.join(
            deploymentPath,
            "deployed_addresses.json"
          );
          let deployedAddress = "";
          try {
            const deployedJson = JSON.parse(
              readFileSync(deployedAddrPath, "utf-8")
            ) as Record<string, string>;
            const firstKey = Object.keys(deployedJson)[0];
            deployedAddress = deployedJson[firstKey];
            contractName = firstKey.split("#").pop() || firstKey;
          } catch (e) {
            console.warn("⚠️  Could not read deployed_addresses.json:", (e as Error).message);
          }

          // 3. Artifact JSON (take first .json file inside artifacts/ not *.dbg.json)
          const artifactsDir = path.join(deploymentPath, "artifacts");
          const { readdirSync } = await import("fs");
          const artifactFiles = readdirSync(artifactsDir).filter(
            (f) => f.endsWith(".json") && !f.endsWith(".dbg.json")
          );
          if (artifactFiles.length > 0) {
            const artifactPath = path.join(artifactsDir, artifactFiles[0]);
            contractArtifactPath = artifactPath;
            artifactJson = readFileSync(artifactPath, "utf-8");

            try {
              const parsedArtifact = JSON.parse(artifactJson);
              const sourceName = parsedArtifact.sourceName as string;
              contractSourcePath = path.resolve(sourceName);
              if (!contractName) contractName = parsedArtifact.contractName;
            } catch {}
          }

          // If detail flag, output info
          if (args.detail) {
            console.log(`📄 Deployment contract: ${contractName}`);
            console.log(`🏠 Deployed at address: ${deployedAddress}`);
            console.log(`🌐 Chain ID (from deployment): ${chainId}`);
          }

          // Add deployed address to env as well
          process.env["DEPLOYED_CONTRACT_ADDRESS"] = deployedAddress;
        }
      }

      // If artifactJson still empty (either no deploymentId or fallback)
      if (!artifactJson) {
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
              contractArtifactPath = path.resolve(artifactPath);
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
            contractArtifactPath = path.resolve(artifactPath);
            contractName = firstJsonFile.replace('.json', '');
            contractSourcePath = path.resolve(join("contracts", firstContractDir));
            foundArtifact = true;
          }
        }
        
        if (foundArtifact) {
          const artifactData = readFileSync(artifactPath, "utf-8");
          artifactJson = artifactData;
          
          if (args.detail) {
            console.log(`📄 Artifact loaded successfully: ${contractName}`);
            console.log(`📁 Artifact path: ${contractArtifactPath}`);
            console.log(`📄 Source file path: ${contractSourcePath}`);
          }
        } else {
          console.warn("⚠️  No contract artifacts found");
          artifactJson = "{}";
          contractSourcePath = "";
          contractArtifactPath = "";
        }
      }
      
    } catch (artifactError) {
      console.warn("⚠️  Could not load contract artifact:", (artifactError as Error).message);
      // Continue with empty artifact JSON
      artifactJson = "{}";
      contractSourcePath = "";
      contractArtifactPath = "";
    }
    
    console.log("🐍 Executing ERC-7730 generation with Python...");
    
    // Determine output path for the ERC-7730 file
    let outputPath = "";
    if (args.deploymentId && contractName) {
      // Save to deployment artifacts folder
      const deploymentArtifactsPath = path.resolve("ignition", "deployments", args.deploymentId, "artifacts");
      outputPath = path.join(deploymentArtifactsPath, `${contractName}-erc7730.json`);
    } else if (contractName) {
      // Fallback to current directory
      outputPath = path.resolve(`${contractName}-erc7730.json`);
    } else {
      // Generic fallback
      outputPath = path.resolve("contract-erc7730.json");
    }
    
    if (args.detail) {
      console.log(`💾 Output file: ${outputPath}`);
    }
    
    // Execute the Python command to generate ERC-7730 descriptor using local development version
    const result = await new Promise<string>((resolve, reject) => {
      const pythonArgs = [
        "run", "python", "-m", "erc7730.main", "generate",
        "--local",
        "--auto",
        "--output", outputPath
      ];
      
      // Path to the local Python ERC-7730 development project
      const pythonProjectPath = path.resolve("../python-erc7730");
      
      if (args.detail) {
        console.log(`🐍 Using local Python project: ${pythonProjectPath}`);
        console.log(`📦 Python command: uv ${pythonArgs.join(' ')}`);
      }
      
      const childProcess = spawn("uv", pythonArgs, {
        cwd: pythonProjectPath,
        stdio: ["pipe", "pipe", "pipe"],
        env: {
          ...process.env,
          CHAIN_ID: chainId,
          CONTRACT_ARTIFACT: artifactJson,
          CONTRACT_SOURCE_PATH: contractSourcePath,
          CONTRACT_ARTIFACT_PATH: contractArtifactPath,
          DEPLOYED_CONTRACT_ADDRESS: process.env["DEPLOYED_CONTRACT_ADDRESS"] || "",
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
      console.log(`   CONTRACT_ARTIFACT_PATH: ${contractArtifactPath || '<not found>'}`);
      if (process.env["DEPLOYED_CONTRACT_ADDRESS"]) {
        console.log(`   DEPLOYED_CONTRACT_ADDRESS: ${process.env["DEPLOYED_CONTRACT_ADDRESS"]}`);
      }
    }
    
    console.log(`✅ ERC-7730 descriptor generated successfully!`);
    
    // Check if file was created and provide feedback
    const { existsSync } = await import("fs");
    if (existsSync(outputPath)) {
      console.log(`📄 File saved: ${outputPath}`);
    } else {
      console.warn(`⚠️  Output file not found at expected location: ${outputPath}`);
    }
    
  } catch (error) {
    console.error("❌ Error executing Python command:", error);
    throw error;
  }
};

export default action; 
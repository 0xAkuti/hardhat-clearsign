import type { NewTaskActionFunction } from "hardhat/types/tasks";
import { readFileSync } from "fs";
import { resolve } from "path";
import path from "path";

export interface PublishKgTaskArguments {
  deploymentId?: string;
  contract: string;
  chainId: string;
  contractName: string;
  erc7730File: string;
  privateKey?: string;
  spaceId?: string;
  mainnet?: boolean;
}

const publishKgAction: NewTaskActionFunction<PublishKgTaskArguments> = async (taskArgs, hre) => {
  const { deploymentId, contract, chainId, contractName, erc7730File, privateKey, spaceId, mainnet } = taskArgs;
  
  // Determine if using testnet (default) or mainnet
  const useTestnet = !mainnet;

  // Initialize variables that might be auto-detected from deployment
  let finalContract = contract;
  let finalChainId = chainId;
  let finalContractName = contractName;
  let finalErc7730File = erc7730File;

  // Extract deployment information if deploymentId is provided
  if (deploymentId && deploymentId.trim() !== "") {
    console.log(`📦 Loading deployment info from: ${deploymentId}`);
    
    const deploymentPath = path.resolve("ignition", "deployments", deploymentId);
    
    try {
      const { existsSync, readdirSync } = await import("fs");
      
      if (!existsSync(deploymentPath)) {
        throw new Error(`⚠️  Deployment '${deploymentId}' not found at ${deploymentPath}`);
      }

      // 1. Extract Chain ID (from folder name or journal)
      if (!finalChainId || finalChainId.trim() === "") {
        const chainIdMatch = deploymentId.match(/chain-(\d+)/);
        if (chainIdMatch) {
          finalChainId = chainIdMatch[1];
        } else {
          // Read from journal for chainId
          try {
            const journalPath = path.join(deploymentPath, "journal.jsonl");
            const firstLine = readFileSync(journalPath, "utf-8").split("\n")[1];
            if (firstLine) {
              const parsed = JSON.parse(firstLine);
              if (parsed.chainId) {
                finalChainId = parsed.chainId.toString();
              }
            }
          } catch (e) {
            console.warn("⚠️  Could not extract chain ID from journal");
          }
        }
      }

      // 2. Extract deployed address and contract name
      if (!finalContract || finalContract.trim() === "" || !finalContractName || finalContractName.trim() === "") {
        const deployedAddrPath = path.join(deploymentPath, "deployed_addresses.json");
        try {
          const deployedJson = JSON.parse(readFileSync(deployedAddrPath, "utf-8")) as Record<string, string>;
          const firstKey = Object.keys(deployedJson)[0];
          
          if (!finalContract || finalContract.trim() === "") {
            finalContract = deployedJson[firstKey];
          }
          if (!finalContractName || finalContractName.trim() === "") {
            finalContractName = firstKey.split("#").pop() || firstKey;
          }
        } catch (e) {
          console.warn("⚠️  Could not read deployed_addresses.json:", (e as Error).message);
        }
      }

      // 3. Find ERC-7730 file in artifacts
      if (!finalErc7730File || finalErc7730File.trim() === "") {
        const artifactsDir = path.join(deploymentPath, "artifacts");
        try {
          const artifactFiles = readdirSync(artifactsDir).filter(
            (f) => f.endsWith("-erc7730.json")
          );
          
          if (artifactFiles.length > 0) {
            finalErc7730File = path.join(artifactsDir, artifactFiles[0]);
          } else {
            console.warn("⚠️  No ERC-7730 file found in deployment artifacts");
          }
        } catch (e) {
          console.warn("⚠️  Could not read deployment artifacts directory:", (e as Error).message);
        }
      }

      console.log(`✅ Extracted deployment info:`);
      console.log(`   📄 Contract: ${finalContractName} (${finalContract})`);
      console.log(`   ⛓️  Chain ID: ${finalChainId}`);
      console.log(`   📋 ERC-7730 File: ${finalErc7730File}`);
      
    } catch (error) {
      console.error("❌ Error loading deployment info:", error);
      throw error;
    }
  }

  // Validate that we have all required information (either provided directly or extracted from deployment)
  if (!finalContract || finalContract.trim() === "") {
    throw new Error("Contract address is required. Provide --contract <address> or use --deployment-id to auto-detect");
  }
  if (!finalChainId || finalChainId.trim() === "") {
    throw new Error("Chain ID is required. Provide --chain-id <chainId> or use --deployment-id to auto-detect");
  }
  if (!finalContractName || finalContractName.trim() === "") {
    throw new Error("Contract name is required. Provide --contract-name <name> or use --deployment-id to auto-detect");
  }
  if (!finalErc7730File || finalErc7730File.trim() === "") {
    throw new Error("ERC-7730 file path is required. Provide --erc7730-file <path> or use --deployment-id to auto-detect");
  }

  try {
    // Import grc-20 library dynamically
    const { Graph, Ipfs, getSmartAccountWalletClient, Id } = await import("@graphprotocol/grc-20");
    const { privateKeyToAccount } = await import("viem/accounts");

    // Get private key from args or environment
    const walletPrivateKey = privateKey || process.env.PRIVATE_KEY;
    if (!walletPrivateKey) {
      throw new Error("Private key required. Provide via --private-key or PRIVATE_KEY environment variable.");
    }
    
    // Ensure private key is properly formatted
    const formattedPrivateKey = walletPrivateKey.startsWith('0x') ? walletPrivateKey : `0x${walletPrivateKey}`;
    if (!/^0x[a-fA-F0-9]{64}$/.test(formattedPrivateKey)) {
      throw new Error("Invalid private key format. Must be a 64-character hex string.");
    }

    // Read and parse ERC-7730 file
    const erc7730Path = resolve(finalErc7730File);
    const erc7730Content = readFileSync(erc7730Path, "utf8");
    const erc7730Data = JSON.parse(erc7730Content);

    console.log("📋 Publishing Smart Contract Metadata to Knowledge Graph");
    console.log(`Contract: ${finalContract}`);
    console.log(`Chain ID: ${finalChainId}`);
    console.log(`Contract Name: ${finalContractName}`);
    console.log(`Network: ${useTestnet ? "TESTNET" : "MAINNET"}`);
    console.log(`Space ID: ${spaceId}`);

    // Setup wallet
    const { address } = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
    console.log(`📱 Wallet address: ${address}`);

    const smartAccountWalletClient = await getSmartAccountWalletClient({
      privateKey: formattedPrivateKey as `0x${string}`,
      // Use testnet RPC if needed
      ...(useTestnet && { rpcUrl: "https://sepolia.base.org" }),
    });

    // Use the provided space ID (defaults to the Smart Contract Metadata space)
    const currentSpaceId = spaceId;
    console.log(`📍 Using space: ${currentSpaceId}`);

    // Create properties for our metadata
    const ops: any[] = [];

    // Contract Address property
    const { id: contractAddressPropertyId, ops: contractAddressOps } = Graph.createProperty({
      name: "Contract Address",
      dataType: "TEXT",
    });
    ops.push(...contractAddressOps);

    // Chain ID property
    const { id: chainIdPropertyId, ops: chainIdOps } = Graph.createProperty({
      name: "Chain ID",
      dataType: "TEXT",
    });
    ops.push(...chainIdOps);

    // Contract Name property
    const { id: contractNamePropertyId, ops: contractNameOps } = Graph.createProperty({
      name: "Contract Name",
      dataType: "TEXT",
    });
    ops.push(...contractNameOps);

    // ERC-7730 JSON property
    const { id: erc7730PropertyId, ops: erc7730Ops } = Graph.createProperty({
      name: "ERC-7730 JSON",
      dataType: "TEXT",
    });
    ops.push(...erc7730Ops);

    // Create Smart Contract Metadata type
    const { id: smartContractTypeId, ops: smartContractTypeOps } = Graph.createType({
      name: "Smart Contract Metadata",
      properties: [contractAddressPropertyId, chainIdPropertyId, contractNamePropertyId, erc7730PropertyId],
    });
    ops.push(...smartContractTypeOps);

    // Create the entity for this specific contract
    const { id: contractEntityId, ops: contractEntityOps } = Graph.createEntity({
      name: `${finalContractName} (${finalChainId}:${finalContract})`,
      description: `ERC-7730 metadata for ${finalContractName} contract on chain ${finalChainId}`,
      types: [smartContractTypeId],
      values: [
        {
          property: contractAddressPropertyId,
          value: finalContract,
        },
        {
          property: chainIdPropertyId,
          value: finalChainId,
        },
        {
          property: contractNamePropertyId,
          value: finalContractName,
        },
        {
          property: erc7730PropertyId,
          value: JSON.stringify(erc7730Data, null, 2),
        },
      ],
    });
    ops.push(...contractEntityOps);

    console.log(`🔗 Created entity: ${contractEntityId}`);

    // Publish to IPFS
    console.log("📤 Publishing to IPFS...");
    const { cid } = await Ipfs.publishEdit({
      name: `Smart Contract Metadata: ${finalContractName}`,
      ops,
      author: address,
      network: useTestnet ? "TESTNET" : "MAINNET",
    });

    console.log(`📝 IPFS CID: ${cid}`);

    // Get calldata for transaction
    const apiOrigin = useTestnet 
      ? "https://hypergraph-v2-testnet.up.railway.app"
      : "https://hypergraph-v2.up.railway.app";

    const result = await fetch(`${apiOrigin}/space/${currentSpaceId}/edit/calldata`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ cid }),
    });

    if (!result.ok) {
      throw new Error(`Failed to get calldata: ${result.status} ${result.statusText}`);
    }

    const responseData = await result.json() as { to: string; data: string };
    const { to, data } = responseData;
    console.log(`📨 Transaction target: ${to}`);

    // Send transaction
    console.log("🚀 Sending transaction...");
    const txResult = await smartAccountWalletClient.sendTransaction({
      account: smartAccountWalletClient.account,
      to: to as `0x${string}`,
      value: 0n,
      data: data as `0x${string}`,
    });

    console.log(`✅ Transaction sent: ${txResult}`);
    console.log(`🎉 Smart Contract Metadata successfully published to Knowledge Graph!`);
    console.log(`📍 Space ID: ${currentSpaceId}`);
    console.log(`🔗 Entity ID: ${contractEntityId}`);
    console.log(`📝 IPFS CID: ${cid}`);
    console.log(`💎 Transaction Hash: ${txResult}`);

    return {
      spaceId: currentSpaceId,
      entityId: contractEntityId,
      cid,
      txHash: txResult,
    };
  } catch (error) {
    console.error("❌ Error publishing to Knowledge Graph:", error);
    throw error;
  }
};

export default publishKgAction;
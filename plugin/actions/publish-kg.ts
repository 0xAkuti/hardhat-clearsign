import type { NewTaskActionFunction } from "hardhat/types/tasks";
import { readFileSync } from "fs";
import { resolve } from "path";

export interface PublishKgTaskArguments {
  contract: string;
  chainId: string;
  contractName: string;
  erc7730File: string;
  privateKey?: string;
  spaceId?: string;
  testnet?: boolean;
}

const publishKgAction: NewTaskActionFunction<PublishKgTaskArguments> = async (taskArgs, hre) => {
  const { contract, chainId, contractName, erc7730File, privateKey, spaceId, testnet } = taskArgs;

  // Validate required parameters
  if (!contract || contract.trim() === "") {
    throw new Error("Contract address is required. Use --contract <address>");
  }
  if (!chainId || chainId.trim() === "") {
    throw new Error("Chain ID is required. Use --chain-id <chainId>");
  }
  if (!contractName || contractName.trim() === "") {
    throw new Error("Contract name is required. Use --contract-name <name>");
  }
  if (!erc7730File || erc7730File.trim() === "") {
    throw new Error("ERC-7730 file path is required. Use --erc7730-file <path>");
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
    const erc7730Path = resolve(erc7730File);
    const erc7730Content = readFileSync(erc7730Path, "utf8");
    const erc7730Data = JSON.parse(erc7730Content);

    console.log("📋 Publishing Smart Contract Metadata to Knowledge Graph");
    console.log(`Contract: ${contract}`);
    console.log(`Chain ID: ${chainId}`);
    console.log(`Contract Name: ${contractName}`);
    console.log(`Network: ${testnet ? "TESTNET" : "MAINNET"}`);

    // Setup wallet
    const { address } = privateKeyToAccount(formattedPrivateKey as `0x${string}`);
    console.log(`📱 Wallet address: ${address}`);

    const smartAccountWalletClient = await getSmartAccountWalletClient({
      privateKey: formattedPrivateKey as `0x${string}`,
      // Use testnet RPC if needed
      ...(testnet && { rpcUrl: "https://sepolia.base.org" }),
    });

    // Create or use existing space
    let currentSpaceId = spaceId;
    if (!currentSpaceId) {
      console.log("🏗️  Creating new space for Smart Contract Metadata...");
      const spaceResult = await Graph.createSpace({
        editorAddress: address,
        name: "Smart Contract Metadata",
        network: testnet ? "TESTNET" : "MAINNET",
      });
      currentSpaceId = spaceResult.id;
      console.log(`✅ Created space: ${currentSpaceId}`);
    } else {
      console.log(`📍 Using existing space: ${currentSpaceId}`);
    }

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
      name: `${contractName} (${chainId}:${contract})`,
      description: `ERC-7730 metadata for ${contractName} contract on chain ${chainId}`,
      types: [smartContractTypeId],
      values: [
        {
          property: contractAddressPropertyId,
          value: contract,
        },
        {
          property: chainIdPropertyId,
          value: chainId,
        },
        {
          property: contractNamePropertyId,
          value: contractName,
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
      name: `Smart Contract Metadata: ${contractName}`,
      ops,
      author: address,
      network: testnet ? "TESTNET" : "MAINNET",
    });

    console.log(`📝 IPFS CID: ${cid}`);

    // Get calldata for transaction
    const apiOrigin = testnet 
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
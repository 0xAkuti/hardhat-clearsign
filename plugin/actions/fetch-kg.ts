import type { NewTaskActionFunction } from "hardhat/types/tasks";

export interface FetchKgTaskArguments {
  contract: string;
  chainId: string;
  spaceId?: string;
  testnet?: boolean;
  json?: boolean;
}

interface ContractMetadata {
  id: string;
  name: string;
  contractAddress: string;
  chainId: string;
  contractName: string;
  erc7730Json: any;
  spaceId: string;
  found: boolean;
}

const fetchKgAction: NewTaskActionFunction<FetchKgTaskArguments> = async (taskArgs, hre) => {
  const { contract, chainId, spaceId, testnet, json } = taskArgs;

  // Validate required parameters
  if (!contract || contract.trim() === "") {
    throw new Error("Contract address is required. Use --contract <address>");
  }
  if (!chainId || chainId.trim() === "") {
    throw new Error("Chain ID is required. Use --chain-id <chainId>");
  }

  try {
    console.log("🔍 Searching for Smart Contract Metadata in Knowledge Graph");
    console.log(`Contract: ${contract}`);
    console.log(`Chain ID: ${chainId}`);
    console.log(`Network: ${testnet ? "TESTNET" : "MAINNET"}`);

    // Determine API endpoint
    const apiOrigin = testnet 
      ? "https://hypergraph-v2-testnet.up.railway.app"
      : "https://hypergraph-v2.up.railway.app";

    let searchSpaceId = spaceId;
    
    // If no space ID provided, try to find default Smart Contract Metadata space
    if (!searchSpaceId) {
      console.log("🏗️  No space ID provided, searching for Smart Contract Metadata spaces...");
      // This would require additional API endpoints that may not be available
      // For now, we'll require a space ID or implement a broader search
    }

    const result: ContractMetadata = {
      id: "",
      name: "",
      contractAddress: contract,
      chainId: chainId,
      contractName: "",
      erc7730Json: null,
      spaceId: searchSpaceId || "",
      found: false,
    };

    if (searchSpaceId) {
      // Try to fetch space information and search for matching entities
      try {
        console.log(`📡 Querying space: ${searchSpaceId}`);
        
        // Attempt to get space data using available API endpoints
        // Note: The hypergraph API may have query endpoints not documented in grc-20 library
        const spaceResponse = await fetch(`${apiOrigin}/space/${searchSpaceId}`);
        
        if (spaceResponse.ok) {
          const spaceData = await spaceResponse.json() as any;
          console.log("✅ Space found, searching for contract metadata...");
          
          // Try to find entities that match our contract address and chain ID
          // This is a hypothetical implementation as the exact API structure is not documented
          if (spaceData.entities) {
            for (const entity of spaceData.entities) {
              const contractAddressMatch = entity.values?.find((v: any) => 
                v.property === "Contract Address" && v.value === contract
              );
              const chainIdMatch = entity.values?.find((v: any) => 
                v.property === "Chain ID" && v.value === chainId
              );
              
              if (contractAddressMatch && chainIdMatch) {
                result.found = true;
                result.id = entity.id;
                result.name = entity.name || "";
                
                // Extract contract name
                const contractNameValue = entity.values?.find((v: any) => 
                  v.property === "Contract Name"
                );
                result.contractName = contractNameValue?.value || "";
                
                // Extract ERC-7730 JSON
                const erc7730Value = entity.values?.find((v: any) => 
                  v.property === "ERC-7730 JSON"
                );
                try {
                  result.erc7730Json = erc7730Value?.value ? JSON.parse(erc7730Value.value) : null;
                } catch (e) {
                  result.erc7730Json = erc7730Value?.value || null;
                }
                
                break;
              }
            }
          }
        } else {
          console.warn(`⚠️  Could not access space ${searchSpaceId}: ${spaceResponse.status} ${spaceResponse.statusText}`);
        }
      } catch (apiError) {
        console.warn("⚠️  API query failed, trying alternative approach...");
        
        // Alternative approach: Try to search using GraphQL or other endpoints
        // This is a placeholder for future implementation when more query APIs are available
        console.log("📝 Note: Advanced querying capabilities may not be fully available yet.");
        console.log("💡 Consider providing the entity ID directly if known.");
      }
    }

    // Try alternative search approaches if space-based search fails
    if (!result.found && !searchSpaceId) {
      console.log("🔄 Attempting broader search across available spaces...");
      
      // This would require a global search API or list of all spaces
      // For now, we'll inform the user about the limitation
      console.log("⚠️  Global search requires a space ID to be specified.");
      console.log("💡 To search effectively, please provide --space-id parameter.");
      console.log("🔧 You can obtain space IDs from your previous publish-kg command outputs.");
    }

    // Output results
    if (json) {
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log("\n📋 Search Results:");
      console.log("─".repeat(50));
      
      if (result.found) {
        console.log("✅ Contract metadata found!");
        console.log(`📍 Entity ID: ${result.id}`);
        console.log(`📝 Entity Name: ${result.name}`);
        console.log(`📄 Contract Name: ${result.contractName}`);
        console.log(`🔗 Contract Address: ${result.contractAddress}`);
        console.log(`⛓️  Chain ID: ${result.chainId}`);
        console.log(`🏗️  Space ID: ${result.spaceId}`);
        
        if (result.erc7730Json) {
          console.log("\n📊 ERC-7730 Metadata:");
          console.log("─".repeat(30));
          console.log(JSON.stringify(result.erc7730Json, null, 2));
        }
      } else {
        console.log("❌ No matching contract metadata found.");
        console.log("\n💡 Suggestions:");
        console.log("• Verify the contract address and chain ID are correct");
        console.log("• Ensure the contract metadata was published to the knowledge graph");
        console.log("• Try specifying a different --space-id if you know where the data is stored");
        console.log("• Check if you're using the correct network (--testnet flag)");
      }
    }

    return result;
  } catch (error) {
    console.error("❌ Error fetching from Knowledge Graph:", error);
    throw error;
  }
};

export default fetchKgAction;
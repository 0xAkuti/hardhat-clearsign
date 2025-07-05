import type { SolidityHooks } from "hardhat/types/hooks";
import action from "../actions/generate-7730.js";

export default async (): Promise<Partial<SolidityHooks>> => ({
  onCleanUpArtifacts: async (context, artifactPaths, next) => {
    // Call the next hook in the chain first
    const result = await next(context, artifactPaths);
    
    // Check if the --generate-7-7-3-0 flag is present
    if (context.globalOptions["generate7730"]) {
      console.log("\n🔗 --generate-7-7-3-0 flag detected, running generate-7730 after compilation...");
      
      try {
        // Call the action directly instead of running the task
        // We need to create a minimal HRE-like object for the action
        const hreForAction = {
          ...context,
          // Add any additional HRE properties the action might need
        };
        
        await action({ detail: false }, hreForAction as any);
      } catch (error) {
        console.error("❌ Error running generate-7730 action:", error);
        throw error;
      }
    }
    
    return result;
  },
}); 
import { createClient } from "@/lib/supabase/server";
import { createAgent } from "./graph";
import { MemoryManager } from "./memory-manager";

export async function createAgentWithMemory(userId: string) {
	const supabase = await createClient();
	const memoryManager = new MemoryManager(supabase, userId);

	return {
		agent: createAgent(memoryManager as any), // TODO: Replace 'as any' with proper interface implementation
		memoryManager,
	};
}

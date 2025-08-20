import { AIMessage, HumanMessage } from "@langchain/core/messages";
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

export function createMessage(lastIncoming: {
	role: string;
	content: string;
	agent_name?: string;
}) {
	return lastIncoming
		? lastIncoming.role === "user"
			? new HumanMessage(lastIncoming.content)
			: new AIMessage({
					content: lastIncoming.content,
					name: lastIncoming.agent_name,
				})
		: undefined;
}

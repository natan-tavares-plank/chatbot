import type { Message } from "@ai-sdk/react";
import { createClient } from "@/lib/supabase/server";
import { ChatService } from "@/lib/supabase/service";
import ChatBot from "./_components/chat-bot";

export default async function Page() {
	const supabase = await createClient();
	const { data } = await supabase.auth.getUser();

	const chatService = new ChatService(supabase);

	const [chat, response] = await Promise.all([
		data?.user ? chatService.getChatByUserId(data.user.id) : null,
		data?.user ? chatService.getMessages(data.user.id) : Promise.resolve([]),
	]);

	type DbMessage = {
		id: string;
		role: Message["role"];
		content: unknown;
		agents?: string[];
	};
	const messages: Message[] = ((response as DbMessage[] | null) || []).map(
		(m) => ({
			id: m.id,
			role: m.role,
			content: typeof m.content === "string" ? m.content : String(m.content),
		}),
	);

	const initialAgentsByMessageId: Record<string, string[]> = {};
	for (const m of (response as DbMessage[] | null) || []) {
		const agents = m.agents;
		if (m.role === "assistant" && Array.isArray(agents) && agents.length) {
			initialAgentsByMessageId[m.id] = agents;
		}
	}

	return (
		<div className="bg-gradient-to-br from-zinc-800 via-zinc-900 to-indigo-950 min-h-svh w-full flex flex-col">
			<ChatBot
				chatTitle={chat?.title || "Chatbot"}
				initialMessages={messages || []}
				initialAgentsByMessageId={initialAgentsByMessageId}
			/>
		</div>
	);
}

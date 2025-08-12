"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatService } from "@/lib/supabase/service";
import ChatBot from "./page";

export default async function ChatLayout() {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();

	if (error || !data?.user) {
		redirect("/auth");
	}

	const chatService = new ChatService(supabase);

	const [chat, response] = await Promise.all([
		chatService.getChatByUserId(data.user.id),
		chatService.getMessages(data.user.id),
	]);

	const messages = response?.map((m) => ({
		id: m.id,
		role: m.role,
		content: typeof m.content === "string" ? m.content : String(m.content),
	}));

	const initialAgentsByMessageId: Record<string, string[]> = {};
	for (const m of response || []) {
		const agents = (m as { agents?: string[] }).agents;
		if (m.role === "assistant" && Array.isArray(agents) && agents.length) {
			initialAgentsByMessageId[m.id] = agents;
		}
	}

	return (
		<div className="bg-gradient-to-br from-zinc-800 via-zinc-900 to-indigo-950 min-h-svh w-full flex flex-col">
			<ChatBot
				chatTitle={chat?.title || "Chatbot"}
				// initialMessages={messages || []}
				initialMessages={[...messages, ...messages, ...messages]}
				initialAgentsByMessageId={initialAgentsByMessageId}
			/>
		</div>
	);
}

"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatService } from "@/lib/supabase/service";
import ChatBot from "./page";

export default async function ChatLayout() {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();

	if (error || !data?.user) {
		// TODO: trigger a toast to tell the user to sign in
		redirect("/auth");
	}

	const chatService = new ChatService(supabase);
	const response = await chatService.getMessages(data.user.id);

	console.log("response", response);

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
		<ChatBot
			initialMessages={messages || []}
			initialAgentsByMessageId={initialAgentsByMessageId}
		/>
	);
}

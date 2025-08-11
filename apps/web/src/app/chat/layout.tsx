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

	const messages = response?.map((m) => ({
		id: m.id,
		role: m.role,
		content: m.content,
		agent: m.agent ?? "chat",
	}));

	return <ChatBot initialMessages={messages || []} />;
}

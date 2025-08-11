"use server";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ChatService } from "@/lib/supabase/service";

export async function clearChatAction() {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();

	if (error || !data.user) {
		return { error: "Unauthorized" };
	}

	const chatService = new ChatService(supabase);
	const response = await chatService.clearChat(data.user.id);

	if (response.error) {
		return { error: response.error };
	}

	redirect("/");
}

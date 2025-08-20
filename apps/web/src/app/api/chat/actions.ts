"use server";
import type { User } from "@supabase/supabase-js";
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
		console.error("error at action", response.error);
		return { error: response.error };
	}

	return { error: null };
}

export const verifyUser = async (): Promise<{
	authenticated: boolean;
	user: User | null;
}> => {
	const { auth } = await createClient();
	const {
		data: { user },
	} = await auth.getUser();
	if (!user?.id) {
		return { authenticated: false, user: null };
	}
	return { authenticated: true, user };
};

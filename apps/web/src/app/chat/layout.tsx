import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function ChatLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const supabase = await createClient();
	const { data, error } = await supabase.auth.getUser();

	if (error || !data?.user) {
		redirect("/auth");
	}

	return (
		<div className="bg-gradient-to-br from-zinc-800 via-zinc-900 to-indigo-950 min-h-svh w-full flex flex-col">
			{children}
		</div>
	);
}

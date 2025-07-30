import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import { signOut } from "../auth/action";

export default async function PrivatePage() {
	const supabase = await createClient();

	const { data, error } = await supabase.auth.getUser();
	if (error || !data?.user) {
		redirect("/auth");
	}

	return (
		<div>
			<p>Hello {data.user.email}</p>
			<button type="button" onClick={signOut}>
				Sign Out
			</button>
		</div>
	);
}

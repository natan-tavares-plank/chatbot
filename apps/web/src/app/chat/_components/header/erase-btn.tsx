"use client";

import { Loader2, Trash } from "lucide-react";
import { redirect } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { clearChatAction } from "@/app/api/chat/actions";
import { Button } from "@/components/ui/button";

export const EraseBtn = () => {
	const [isLoading, setIsLoading] = useState(false);

	const handleClick = async () => {
		let errorMsg: string | null = null;
		try {
			setIsLoading(true);
			const { error } = await clearChatAction();
			if (error) {
				errorMsg = error;
			}
		} finally {
			setIsLoading(false);
		}

		if (errorMsg) {
			return toast.error(errorMsg);
		}
		redirect("/");
	};

	return (
		<Button
			type="button"
			className="bg-transparent hover:bg-rose-800"
			size="sm"
			onClick={handleClick}
			disabled={isLoading}
		>
			{isLoading ? (
				<Loader2 className="mr-1 animate-spin" />
			) : (
				<Trash className="mr-1" />
			)}
			Clear Chat
		</Button>
	);
};

import { Bot, LogOut } from "lucide-react";
import { signOutAction } from "@/app/auth/action";
import { Button } from "@/components/ui/button";
import { EraseBtn } from "./erase-btn";

type HeaderProps = {
	chatTitle: string;
};

export const Header = ({ chatTitle = "New Chat" }: HeaderProps) => {
	return (
		<header className="w-full border-b border-zinc-600 bg-transparent backdrop-blur-sm sticky top-0 z-50">
			<div className="container mx-auto px-4 py-2 flex items-center justify-between">
				<div className="flex items-center space-x-4">
					<Bot className="h-6 w-6 text-zinc-500" />
					<h1 className="text-lg font-bold text-zinc-50">{chatTitle}</h1>
				</div>

				<div className="space-x-4">
					<EraseBtn />

					<Button
						type="button"
						className="bg-zinc-950 hover:bg-zinc-700"
						size="sm"
						onClick={signOutAction}
					>
						<LogOut className="mr-1" />
						Logout
					</Button>
				</div>
			</div>
		</header>
	);
};

import { Bot, LogOut, Trash } from "lucide-react";
import { clearChatAction } from "@/app/api/chat/actions";
import { signOutAction } from "@/app/auth/action";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export const Header = () => {
	return (
		<header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
			<div className="container mx-auto px-4 py-4 flex items-center justify-between">
				<div className="flex items-center space-x-2">
					<Bot className="h-6 w-6 text-primary" />
					<h1 className="text-xl font-bold">Captain Byte</h1>
					<Badge variant="secondary" className="text-xs">
						Multi-Agent AI
					</Badge>
				</div>
				<div className="">
					<Button
						type="button"
						variant="destructive"
						size="sm"
						onClick={clearChatAction}
					>
						<Trash className="h-4 w-4 mr-2" />
						Clear Chat
					</Button>

					<Button
						type="button"
						variant="ghost"
						size="sm"
						onClick={signOutAction}
					>
						<LogOut className="h-4 w-4 mr-2" />
						Logout
					</Button>
				</div>
			</div>
		</header>
	);
};

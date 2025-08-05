"use client";

import { useChat } from "@ai-sdk/react";
import { Bot, Cloud, LogOut, Newspaper, Send, User } from "lucide-react";
import type React from "react";
import { useEffect, useRef } from "react";
import {
	Badge,
	Button,
	Card,
	Input,
	ScrollArea,
	Separator,
} from "@/components/ui";
import { signOut } from "../auth/action";

const agentColors = {
	chat: "bg-primary text-primary-foreground",
	weather: "bg-blue-500 text-white",
	news: "bg-orange-500 text-white",
};

const agentIcons = {
	chat: <Bot className="h-3 w-3" />,
	weather: <Cloud className="h-3 w-3" />,
	news: <Newspaper className="h-3 w-3" />,
};

const ChatBot = () => {
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	const {
		messages,
		input,
		handleInputChange,
		handleSubmit,
		status,
		error,
		reload,
	} = useChat({
		streamProtocol: "text",
		api: "/api/chat",
		onError: (error) => {
			console.error("Chat error:", error);
		},
		onFinish: (message) => {
			// Auto-scroll to bottom when new message arrives
			if (scrollAreaRef.current) {
				scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
			}
		},
	});

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || status === "streaming") return;

		handleSubmit(e);
	};

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
		}
	});

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
			{/* Header */}
			<header className="border-b border-border/50 bg-background/80 backdrop-blur-sm">
				<div className="container mx-auto px-4 py-4 flex items-center justify-between">
					<div className="flex items-center space-x-2">
						<Bot className="h-6 w-6 text-primary" />
						<h1 className="text-xl font-bold">Captain Byte</h1>
						<Badge variant="secondary" className="text-xs">
							Multi-Agent AI
						</Badge>
					</div>
					<Button type="button" variant="ghost" size="sm" onClick={signOut}>
						<LogOut className="h-4 w-4 mr-2" />
						Logout
					</Button>
				</div>
			</header>

			{/* Main Chat Area */}
			<div className="container mx-auto px-4 py-6 max-w-4xl">
				<Card.Root className="h-[calc(100vh-200px)] flex flex-col shadow-xl">
					<Card.Header className="pb-4">
						<Card.Title className="flex items-center space-x-2">
							<span>Conversation</span>
							<div className="flex space-x-1">
								{Object.entries(agentColors).map(([agent, colorClass]) => (
									<Badge
										key={agent}
										className={`${colorClass} text-xs capitalize`}
									>
										{agentIcons[agent as keyof typeof agentIcons]}
										<span className="ml-1">{agent}</span>
									</Badge>
								))}
							</div>
						</Card.Title>
					</Card.Header>

					<Card.Content className="flex-1 flex flex-col space-y-4">
						{/* Error Display */}
						{error && (
							<div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
								<p className="text-sm text-destructive">
									Error: {error.message}
								</p>
								<Button
									variant="outline"
									size="sm"
									onClick={() => reload()}
									className="mt-2"
								>
									Retry
								</Button>
							</div>
						)}

						{/* Messages */}
						<ScrollArea.Root className="flex-1 pr-4" ref={scrollAreaRef}>
							<div className="space-y-4">
								{messages.map((message) => (
									<div
										key={message.id}
										className={`flex items-start space-x-3 ${
											message.role === "user"
												? "flex-row-reverse space-x-reverse"
												: ""
										}`}
									>
										<div
											className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
												message.role === "user"
													? "bg-secondary text-secondary-foreground"
													: "bg-primary text-primary-foreground"
											}`}
										>
											{message.role === "user" ? (
												<User className="h-4 w-4" />
											) : (
												<Bot className="h-4 w-4" />
											)}
										</div>
										<div
											className={`flex flex-col space-y-1 max-w-[80%] ${
												message.role === "user" ? "items-end" : "items-start"
											}`}
										>
											<div
												className={`px-4 py-2 rounded-lg ${
													message.role === "user"
														? "bg-primary text-primary-foreground"
														: "bg-muted"
												}`}
											>
												<p className="text-sm whitespace-pre-wrap">
													{message.content}
												</p>
											</div>
											<span className="text-xs text-muted-foreground">
												{message.createdAt?.toLocaleTimeString()}
											</span>
										</div>
									</div>
								))}

								{status === "streaming" && (
									<div className="flex items-start space-x-3">
										<div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
											<Bot className="h-4 w-4" />
										</div>
										<div className="bg-muted px-4 py-2 rounded-lg">
											<div className="flex space-x-1">
												<div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" />
												<div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-100" />
												<div className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce delay-200" />
											</div>
										</div>
									</div>
								)}
							</div>
						</ScrollArea.Root>

						<Separator />

						{/* Message Input */}
						<form onSubmit={handleSendMessage} className="flex space-x-2">
							<Input
								value={input}
								onChange={handleInputChange}
								placeholder="Ask about weather, news, or just chat with Captain Byte..."
								className="flex-1"
								disabled={status === "streaming"}
							/>
							<Button
								type="submit"
								disabled={status === "streaming" || !input.trim()}
							>
								<Send className="h-4 w-4" />
							</Button>
						</form>

						{/* Help Text */}
						<p className="text-xs text-muted-foreground text-center">
							Try asking about "weather" or "news" to activate specialized
							agents!
						</p>
					</Card.Content>
				</Card.Root>
			</div>
		</div>
	);
};

export default ChatBot;

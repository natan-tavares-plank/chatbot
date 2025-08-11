"use client";

import { type Message, useChat } from "@ai-sdk/react";
import { Bot, Cloud, Newspaper, Send, User } from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import {
	Badge,
	Button,
	Card,
	Input,
	ScrollArea,
	Separator,
} from "@/components/ui";
import { Header } from "./_components/header";

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

type ChatBootProps = {
	initialMessages: Message[];
	initialAgentsByMessageId?: Record<string, string[]>;
};

const ChatBot = ({
	initialMessages,
	initialAgentsByMessageId,
}: ChatBootProps) => {
	const scrollAreaRef = useRef<HTMLDivElement>(null);

	const {
		messages,
		input,
		handleInputChange,
		isLoading,
		error,
		reload,
		setInput,
		setMessages,
	} = useChat({
		api: "/api/chat",
		initialMessages,
		onError: (error) => {
			console.error("Chat error:", error);
		},
	});

	const [agentsByMessageId, setAgentsByMessageId] = useState<
		Record<string, string[]>
	>(initialAgentsByMessageId || {});

	const normalizeAgent = (name: string) => {
		if (name.includes("weather")) return "weather" as const;
		if (name.includes("news")) return "news" as const;
		return "chat" as const;
	};

	// Using SSR-provided initial agents avoids client layout shift

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || isLoading) return;
		const userText = input;

		// Optimistically add user message locally (do not trigger hook request)
		const userId =
			typeof crypto !== "undefined" && "randomUUID" in crypto
				? (crypto as Crypto & { randomUUID: () => string }).randomUUID()
				: `${Date.now()}-u`;
		setMessages((prev) => [
			...prev,
			{ id: userId, role: "user", content: userText },
		]);
		setInput("");

		try {
			const bodyMessages = [...messages, { role: "user", content: userText }];
			const res = await fetch("/api/chat", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ messages: bodyMessages }),
			});
			if (!res.ok) {
				const text = await res.text();
				throw new Error(text || `Request failed with ${res.status}`);
			}
			const data: { content: string; agents?: string[] | undefined } =
				await res.json();

			const assistantId =
				typeof crypto !== "undefined" && "randomUUID" in crypto
					? (crypto as Crypto & { randomUUID: () => string }).randomUUID()
					: `${Date.now()}`;

			setMessages((prev) => [
				...prev,
				{ id: assistantId, role: "assistant", content: data.content },
			]);
			if (Array.isArray(data.agents) && data.agents.length) {
				const next: Record<string, string[]> = { ...agentsByMessageId };
				next[assistantId] = data.agents;
				setAgentsByMessageId(next);
			}
		} catch (err) {
			console.error("Send message error:", err);
		}
	};

	// Auto-scroll to bottom when messages change
	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
		}
	});

	return (
		<div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/5">
			<Header />

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
											{message.role === "assistant" &&
												message.id &&
												agentsByMessageId[message.id] && (
													<div className="flex items-center gap-1 mt-1">
														{agentsByMessageId[message.id]?.map((agent) => {
															const key = normalizeAgent(agent);
															return (
																<Badge
																	key={`${message.id}-${agent}`}
																	className={`${agentColors[key]} text-xs capitalize`}
																>
																	{agentIcons[key]}
																	<span className="ml-1">{key}</span>
																</Badge>
															);
														})}
													</div>
												)}
											<span className="text-xs text-muted-foreground">
												{message.createdAt?.toLocaleTimeString()}
											</span>
										</div>
									</div>
								))}

								{isLoading && (
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
								disabled={isLoading}
							/>
							<Button type="submit" disabled={isLoading || !input.trim()}>
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

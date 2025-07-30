"use client";

import { Bot, Cloud, LogOut, Newspaper, Send, User } from "lucide-react";
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
import { signOut } from "../auth/action";

interface Message {
	id: string;
	content: string;
	sender: "user" | "bot";
	timestamp: Date;
	agent?: "chat" | "weather" | "news";
}

const ChatBot = () => {
	const [messages, setMessages] = useState<Message[]>([
		{
			id: "1",
			content:
				"Ahoy there, matey! Welcome aboard! I'm Captain Byte, your witty pirate AI companion. What brings ye to these digital waters today? 🏴‍☠️",
			sender: "bot",
			timestamp: new Date(),
			agent: "chat",
		},
	]);
	const [currentMessage, setCurrentMessage] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const scrollAreaRef = useRef<HTMLDivElement>(null);

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

	useEffect(() => {
		if (scrollAreaRef.current) {
			scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
		}
	}, [messages]);

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!currentMessage.trim()) return;

		const userMessage: Message = {
			id: Date.now().toString(),
			content: currentMessage,
			sender: "user",
			timestamp: new Date(),
		};

		setMessages((prev) => [...prev, userMessage]);
		setCurrentMessage("");
		setIsTyping(true);

		// Simulate bot response
		setTimeout(
			() => {
				let botResponse: Message;
				const messageText = currentMessage.toLowerCase();

				if (messageText.includes("weather")) {
					botResponse = {
						id: (Date.now() + 1).toString(),
						content:
							"Arrr! The weather be lookin' fine today, ye landlubber! Clear skies with a gentle breeze at 72°F. Perfect for sailin' the seven seas! ⛅",
						sender: "bot",
						timestamp: new Date(),
						agent: "weather",
					};
				} else if (messageText.includes("news")) {
					botResponse = {
						id: (Date.now() + 1).toString(),
						content:
							"Ahoy! Here be the latest news from across the digital seas: 'AI Pirates Successfully Navigate Complex Conversations' - Technology continues to amaze! 📰",
						sender: "bot",
						timestamp: new Date(),
						agent: "news",
					};
				} else {
					const responses = [
						"Har har! That be an interestin' tale ye tell. What else be on yer mind?",
						"Shiver me timbers! I hadn't thought of it that way before!",
						"Aye, that be true as the North Star! Anything else ye want to discuss?",
						"Blimey! Ye sure know how to keep a conversation lively!",
						"That be as clear as the Caribbean waters! What's next on yer agenda?",
					];
					botResponse = {
						id: (Date.now() + 1).toString(),
						content: responses[Math.floor(Math.random() * responses.length)],
						sender: "bot",
						timestamp: new Date(),
						agent: "chat",
					};
				}

				setMessages((prev) => [...prev, botResponse]);
				setIsTyping(false);
			},
			1000 + Math.random() * 2000,
		);
	};

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
						{/* Messages */}
						<ScrollArea.Root className="flex-1 pr-4" ref={scrollAreaRef}>
							<div className="space-y-4">
								{messages.map((message) => (
									<div
										key={message.id}
										className={`flex items-start space-x-3 ${
											message.sender === "user"
												? "flex-row-reverse space-x-reverse"
												: ""
										}`}
									>
										<div
											className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
												message.sender === "user"
													? "bg-secondary text-secondary-foreground"
													: message.agent
														? agentColors[message.agent]
														: "bg-primary text-primary-foreground"
											}`}
										>
											{message.sender === "user" ? (
												<User className="h-4 w-4" />
											) : (
												agentIcons[
													message.agent as keyof typeof agentIcons
												] || <Bot className="h-4 w-4" />
											)}
										</div>
										<div
											className={`flex flex-col space-y-1 max-w-[80%] ${message.sender === "user" ? "items-end" : "items-start"} `}
										>
											<div
												className={`px-4 py-2 rounded-lg ${
													message.sender === "user"
														? "bg-primary text-primary-foreground"
														: "bg-muted"
												}`}
											>
												<p className="text-sm">{message.content}</p>
											</div>
											<span className="text-xs text-muted-foreground">
												{message.timestamp.toLocaleTimeString()}
												{message.agent && (
													<span className="ml-2 capitalize">
														• {message.agent} agent
													</span>
												)}
											</span>
										</div>
									</div>
								))}

								{isTyping && (
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
								value={currentMessage}
								onChange={(e) => setCurrentMessage(e.target.value)}
								placeholder="Ask about weather, news, or just chat with Captain Byte..."
								className="flex-1"
								disabled={isTyping}
							/>
							<Button
								type="submit"
								disabled={isTyping || !currentMessage.trim()}
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

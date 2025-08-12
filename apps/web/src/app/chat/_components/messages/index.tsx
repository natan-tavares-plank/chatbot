"use client";

import type { Message } from "@ai-sdk/react";
import { Bot, Cloud, Globe, Newspaper } from "lucide-react";
import { useEffect } from "react";
import {
	AnimatePresence,
	BadgeMotion,
	BadgesRowMotion,
	MessageAvatarMotion,
	MessageBubbleMotion,
	MessageRowMotion,
	motion,
	ShimmerOnce,
	StaggerText,
	scrollToBottomSmooth,
	TypingIndicatorMotion,
} from "@/components/animation";
import { Badge } from "@/components/ui/badge";

const agentColors = {
	chat: "bg-zinc-700 text-primary-foreground",
	weather: "bg-blue-500 text-white",
	news: "bg-green-500 text-white",
};

const agentIcons = {
	chat: <Bot className="h-3.5 w-3.5 text-zinc-400" />,
	weather: <Cloud className="h-3.5 w-3.5" />,
	news: <Newspaper className="h-3.5 w-3.5" />,
};

const normalizeAgent = (name: string) => {
	if (name.includes("weather")) return "weather" as const;
	if (name.includes("news")) return "news" as const;
	return "chat" as const;
};

type MessagesProps = {
	messages: Message[];
	agentsByMessageId: Record<string, string[]>;
	isLoading: boolean;
};
export const MessagesList = (props: MessagesProps) => {
	const { messages, agentsByMessageId, isLoading } = props;

	useEffect(() => {
		if (messages.length > 0) {
			// Small delay to ensure the new message is rendered
			const timeoutId = setTimeout(() => {
				scrollToBottomSmooth(undefined, 800);
			}, 100);

			return () => clearTimeout(timeoutId);
		}
	}, [messages.length]);

	return (
		<div
			className={`h-full w-full space-y-4 max-w-3xl mx-auto text-zinc-200 px-4 pt-4 pb-8 ${
				messages.length ? "flex-1" : ""
			}`}
		>
			<AnimatePresence initial={false} mode="sync">
				{messages.map((message) => (
					<MessageRowMotion
						key={message.id}
						side={message.role === "user" ? "right" : "left"}
						className={`flex items-start space-x-3 ${
							message.role === "user" ? "flex-row-reverse space-x-reverse" : ""
						}`}
					>
						{message.role !== "user" ? (
							<MessageAvatarMotion
								className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
									agentColors[
										normalizeAgent(agentsByMessageId[message.id]?.[0] || "chat")
									] || "bg-zinc-800 text-zinc-400"
								}`}
							>
								{agentIcons[
									normalizeAgent(agentsByMessageId[message.id]?.[0] || "chat")
								] || <Bot className="h-4 w-4" />}
							</MessageAvatarMotion>
						) : null}

						<div
							className={`flex flex-col space-y-1 max-w-[80%] ${
								message.role === "user" ? "items-end" : "items-start"
							}`}
						>
							<MessageBubbleMotion
								isUser={message.role === "user"}
								className={`px-4 py-2 rounded-lg ${
									message.role === "user"
										? "bg-gradient-to-br from-rose-700 to-rose-900 text-primary-foreground"
										: ""
								}`}
							>
								{message.role === "assistant" ? (
									<div className="relative">
										<ShimmerOnce />
										<StaggerText
											text={message.content}
											className="text-sm whitespace-pre-wrap"
										/>
									</div>
								) : (
									<p className="text-sm whitespace-pre-wrap">
										{message.content}
									</p>
								)}
							</MessageBubbleMotion>

							{message.role === "assistant" &&
								message.id &&
								agentsByMessageId[message.id] && (
									<BadgesRowMotion className="flex items-center gap-1 mt-1">
										{agentsByMessageId[message.id]?.map((agent) => {
											const key = normalizeAgent(agent);
											return (
												<BadgeMotion key={`${message.id}-${agent}`}>
													<Badge
														className={`${agentColors[key]} text-xs capitalize`}
													>
														{agentIcons[key]}
														<span className="ml-1">{key}</span>
													</Badge>
												</BadgeMotion>
											);
										})}
									</BadgesRowMotion>
								)}
						</div>
					</MessageRowMotion>
				))}
			</AnimatePresence>

			<AnimatePresence>
				{isLoading && (
					<TypingIndicatorMotion className="flex items-start gap-3">
						<div className="flex-shrink-0 w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center shadow-sm">
							<Globe className="h-4 w-4 animate-pulse" />
						</div>
						<div className="relative rounded-lg border border-zinc-700/60 bg-zinc-800/40 px-4 py-2 shadow-md backdrop-blur-sm">
							<div className="flex items-center gap-1.5">
								<motion.span
									className="h-2 w-2 rounded-full bg-zinc-300"
									animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
									transition={{
										duration: 0.8,
										repeat: Infinity,
										ease: "easeInOut",
									}}
								/>
								<motion.span
									className="h-2 w-2 rounded-full bg-zinc-300"
									animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
									transition={{
										duration: 0.8,
										repeat: Infinity,
										ease: "easeInOut",
										delay: 0.15,
									}}
								/>
								<motion.span
									className="h-2 w-2 rounded-full bg-zinc-300"
									animate={{ y: [0, -3, 0], opacity: [0.5, 1, 0.5] }}
									transition={{
										duration: 0.8,
										repeat: Infinity,
										ease: "easeInOut",
										delay: 0.3,
									}}
								/>
							</div>
							<span className="sr-only" aria-live="polite">
								Assistant is typing…
							</span>
						</div>
					</TypingIndicatorMotion>
				)}
			</AnimatePresence>
		</div>
	);
};

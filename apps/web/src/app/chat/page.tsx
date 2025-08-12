"use client";

import { type Message, useChat } from "@ai-sdk/react";
import type React from "react";
import { useState } from "react";
import { toast } from "sonner";
import { MessagesList } from "@/app/chat/_components/messages";
import { Button } from "@/components/ui";
import { Form } from "./_components/form";
import { Header } from "./_components/header";

type ChatBootProps = {
	chatTitle: string;
	initialMessages: Message[];
	initialAgentsByMessageId?: Record<string, string[]>;
};

const ChatBot = (props: ChatBootProps) => {
	const { chatTitle, initialMessages, initialAgentsByMessageId } = props;

	const {
		messages,
		input,
		handleInputChange,
		error,
		reload,
		status,
		setInput,
		setMessages,
	} = useChat({
		api: "/api/chat",
		initialMessages,
		onError: (error) => toast.error(`Error: ${error.message}`),
	});

	const [agentsByMessageId, setAgentsByMessageId] = useState<
		Record<string, string[]>
	>(initialAgentsByMessageId || {});

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!input.trim() || status === "streaming" || status === "submitted")
			return;
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

	return (
		<div className="bg-transparent flex flex-col items-center flex-1">
			<Header chatTitle={chatTitle} />
			<MessagesList
				messages={messages}
				agentsByMessageId={agentsByMessageId}
				isLoading={status === "streaming" || status === "submitted"}
			/>
			{/* {!error && (
					<div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3">
						<Button variant="outline" size="sm" onClick={() => reload()}>
							Retry
						</Button>
					</div>
				)} */}

			<Form
				input={input}
				onSubmit={handleSendMessage}
				handleInputChange={handleInputChange}
				isLoading={status === "streaming" || status === "submitted"}
				variant={messages.length ? "bottom" : "center"}
			/>
		</div>
	);
};

export default ChatBot;

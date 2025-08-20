"use client";

import type { Message } from "@ai-sdk/react";
import useChat from "@/hooks/useChat";
import { Form } from "./form";
import { Header } from "./header";
import { MessagesList } from "./messages";

export default function ChatBot(props: {
	userId: string;
	chatTitle: string;
	initialMessages: Message[];
	initialAgentsByMessageId?: Record<string, string[]>;
}) {
	const { userId, chatTitle, initialMessages, initialAgentsByMessageId } =
		props;

	const {
		messages,
		input,
		handleInputChange,
		handleSendMessage,
		isLoading,
		agentsByMessageId,
	} = useChat(userId, initialMessages, initialAgentsByMessageId);

	return (
		<div className="bg-transparent flex flex-col items-center flex-1">
			<Header chatTitle={chatTitle} />
			<MessagesList
				messages={messages}
				agentsByMessageId={agentsByMessageId}
				isLoading={isLoading.submit}
			/>
			<Form
				input={input}
				onSubmit={handleSendMessage}
				handleInputChange={handleInputChange}
				isLoading={isLoading.submit}
				variant={messages.length ? "bottom" : "center"}
			/>
		</div>
	);
}

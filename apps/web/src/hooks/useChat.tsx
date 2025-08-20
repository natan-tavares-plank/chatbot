"use client";

import { type UseChatOptions, useChat as useVercelChat } from "@ai-sdk/react";
import type { Message } from "ai";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { clearChatAction } from "@/app/api/chat/actions";

type LoadingState = {
	submit: boolean;
};

const useChat = (
	userId: string,
	history: Message[],
	initialAgentsByMessageId?: Record<string, string[]>,
) => {
	const router = useRouter();

	const [messages, setMessages] = useState<Message[]>(history);
	const [agentsByMessageId, setAgentsByMessageId] = useState<
		Record<string, string[]>
	>(initialAgentsByMessageId || {});

	const [hasError, setHasError] = useState(false);
	const [isLoading, setIsLoading] = useState<LoadingState>({
		submit: false,
	});

	const config: UseChatOptions = {
		id: userId,
		api: `/api/chat`,
		initialMessages: history,
	};
	const {
		input,
		messages: vercelMessages,
		setMessages: setVercelMessages,
		handleInputChange,
		setInput,
	} = useVercelChat(config);

	useEffect(() => {
		setMessages(
			vercelMessages.map((message) => {
				if (message.role === "assistant") {
					return {
						...message,
						content: message.content.replace(/^"|"$/g, ""),
					};
				}

				return message;
			}),
		);
	}, [vercelMessages]);

	const cleanMessagesWithErrors = () => {
		setVercelMessages((prevMessages) => prevMessages.slice(0, -1));
		setHasError(false);
	};

	const handleSendMessage = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading((prev) => ({ ...prev, submit: true }));

		if (hasError) {
			cleanMessagesWithErrors();
		}

		const userMessage = {
			id: new Date().getTime().toString(),
			role: "user",
			content: input,
		} as Message;

		setVercelMessages((prevMessages) => [...prevMessages, userMessage]);
		setInput("");

		const { data, error, agents } = await sendMessage(userId, [userMessage]);

		if (data) {
			setVercelMessages((prev) => [...prev, data]);
			if (agents) {
				setAgentsByMessageId((prev) => ({ ...prev, [data.id]: agents }));
			}
		} else {
			setHasError(true);
			console.log("error at sendMessage", error);
		}

		setIsLoading((prev) => ({ ...prev, submit: false }));
	};

	const handleRetryMessage = async (message: Message) => {
		setIsLoading((prev) => ({ ...prev, submit: true }));
		setHasError(false);

		const { data, error, agents } = await sendMessage(userId, [message]);

		if (data) {
			setVercelMessages((prev) => [...prev, data]);
			if (agents) {
				setAgentsByMessageId((prev) => ({ ...prev, [data.id]: agents }));
			}
		} else {
			setHasError(true);
			console.log("error at sendMessage", error);
		}
		setIsLoading((prev) => ({ ...prev, submit: false }));
	};

	const handleClearChatHistory = async () => {
		await clearChatAction();

		setVercelMessages([]);
		router.refresh();
	};

	return {
		input,
		messages,
		isLoading,
		hasError,
		agentsByMessageId,
		handleInputChange,
		handleSendMessage,
		handleRetryMessage,
		handleClearChatHistory,
	};
};

export default useChat;

async function sendMessage(
	userId: string,
	messages: Message[],
): Promise<{ data: Message | null; error: string | null; agents?: string[] }> {
	try {
		const response = await fetch(`/api/chat`, {
			method: "POST",
			body: JSON.stringify({ messages }),
		});

		if (!response.ok) {
			throw new Error(`HTTP error! status: ${response.status}`);
		}

		// Get the response content as text
		const content = await response.text();

		// Get agent calls from headers if available
		const agentCallsHeader = response.headers.get("X-Agents-Calls");
		const agentCalls = agentCallsHeader ? JSON.parse(agentCallsHeader) : {};

		// Extract agent names from agent calls
		const agents = Object.keys(agentCalls).filter((key) => agentCalls[key] > 0);

		// Create the assistant message
		const assistantMessage: Message = {
			id: `msg_${Date.now()}`,
			content: content,
			role: "assistant",
			createdAt: new Date(),
		};

		console.log("Agent calls:", agentCalls);
		console.log("Extracted agents:", agents);

		return { data: assistantMessage, error: null, agents };
	} catch (error) {
		console.error("Error sending message", error);
		return { data: null, error: error as string };
	}
}

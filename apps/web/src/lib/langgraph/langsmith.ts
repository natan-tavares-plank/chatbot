import { env } from "@/env";

// LangSmith configuration for observability
export const configureLangSmith = () => {
	// Only enable LangSmith if API key is provided
	if (env.LANGCHAIN_API_KEY) {
		process.env.LANGCHAIN_TRACING_V2 = "true";
		process.env.LANGCHAIN_PROJECT = env.LANGCHAIN_PROJECT;
		process.env.LANGCHAIN_ENDPOINT = env.LANGCHAIN_ENDPOINT;
	} else {
		// Disable LangSmith to prevent 403 errors
		process.env.LANGCHAIN_TRACING_V2 = "false";

		console.warn("LangSmith observability disabled (no API key provided)");
	}
};

// Call configuration on import
configureLangSmith();

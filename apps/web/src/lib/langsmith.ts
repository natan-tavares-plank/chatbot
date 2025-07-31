// LangSmith configuration for observability
export const configureLangSmith = () => {
	// Only enable LangSmith if API key is provided
	if (process.env.LANGCHAIN_API_KEY) {
		process.env.LANGCHAIN_TRACING_V2 = "true";
		process.env.LANGCHAIN_PROJECT = process.env.LANGCHAIN_PROJECT || "captain-byte-chatbot";
		process.env.LANGCHAIN_ENDPOINT = process.env.LANGCHAIN_ENDPOINT || "https://api.smith.langchain.com";
		
		console.log("✅ LangSmith observability enabled");
	} else {
		// Disable LangSmith to prevent 403 errors
		process.env.LANGCHAIN_TRACING_V2 = "false";
		
		console.log("ℹ️ LangSmith observability disabled (no API key)");
	}
};

// Call configuration on import
configureLangSmith();

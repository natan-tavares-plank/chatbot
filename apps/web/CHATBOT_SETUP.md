# Captain Byte Chatbot Setup Guide

This guide explains how to set up a production-ready chatbot using `useChat`, OpenAI, LangChain, and LangSmith.

## Architecture Overview

### Frontend: `useChat` Hook
- **Library**: `@ai-sdk/react` (Vercel AI SDK)
- **Benefits**:
  - Built-in streaming support
  - Optimistic updates
  - Error handling and retry mechanisms
  - TypeScript support
  - File attachment support
  - Message history management

### Backend: LangChain + OpenAI
- **LangChain**: Orchestrates the AI workflow
- **OpenAI**: Provides the language model (GPT-4o-mini)
- **Multi-agent system**: Automatically detects user intent and routes to appropriate agents

### Observability: LangSmith
- **Purpose**: Monitor, debug, and optimize your AI applications
- **Features**: Conversation tracking, performance metrics, prompt testing

## Setup Instructions

### 1. Environment Variables

Create a `.env.local` file in the `apps/web` directory:

```bash
# Required
OPENAI_API_KEY=your_openai_api_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_key
DATABASE_PASSWORD=your_database_password

# Optional - LangSmith Observability
LANGCHAIN_API_KEY=your_langsmith_api_key_here
LANGCHAIN_PROJECT=captain-byte-chatbot
LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
```

### 2. LangSmith Setup (Optional but Recommended)

1. **Sign up**: Go to [https://smith.langchain.com/](https://smith.langchain.com/)
2. **Get API key**: Navigate to Settings → API Keys
3. **Add to environment**: Set `LANGCHAIN_API_KEY` in your `.env.local`

### 3. Running the Application

```bash
# Install dependencies
pnpm install

# Start development server
pnpm dev:web
```

## Features

### Multi-Agent System
The chatbot automatically detects user intent and routes to specialized agents:

- **General Chat**: Default pirate-themed conversation
- **Weather Agent**: Activated when users ask about weather
- **News Agent**: Activated when users ask about news/current events

### Error Handling
- **401**: Invalid API key
- **429**: Rate limit exceeded
- **500**: OpenAI service error
- **403**: LangSmith authentication error (automatically disabled if no API key)

### Streaming Responses
- Real-time message streaming
- Optimistic UI updates
- Auto-scroll to latest messages

## Best Practices

### 1. Use `useChat` for React Applications
✅ **Recommended**:
```typescript
const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
  api: "/api/chat",
  onError: (error) => console.error("Chat error:", error),
  onFinish: (message) => console.log("Message completed:", message),
});
```

❌ **Avoid**: Custom state management for chat functionality

### 2. Proper Error Handling
```typescript
// Frontend
{error && (
  <div className="error-message">
    <p>Error: {error.message}</p>
    <Button onClick={() => reload()}>Retry</Button>
  </div>
)}

// Backend
if (e.message.includes("401")) {
  return NextResponse.json(
    { error: "Invalid API key" },
    { status: 401 }
  );
}
```

### 3. LangSmith Integration
```typescript
// Automatic configuration based on environment
if (process.env.LANGCHAIN_API_KEY) {
  process.env.LANGCHAIN_TRACING_V2 = "true";
} else {
  process.env.LANGCHAIN_TRACING_V2 = "false";
}
```

### 4. Multi-Agent Detection
```typescript
const detectAgent = (input: string) => {
  const lowerInput = input.toLowerCase();
  
  if (lowerInput.includes("weather")) return "weather";
  if (lowerInput.includes("news")) return "news";
  return "chat";
};
```

## Troubleshooting

### 403 Forbidden Error
**Problem**: `Failed to ingest multipart runs. Received status [403]: Forbidden`

**Solution**: 
1. Set `LANGCHAIN_API_KEY` in your environment variables
2. Or disable LangSmith by not setting the API key (automatically handled)

### Streaming Issues
**Problem**: Messages not appearing in real-time

**Solution**: Ensure your API route returns a proper `ReadableStream` and sets correct headers:
```typescript
return new Response(readableStream, {
  headers: {
    "Content-Type": "text/plain; charset=utf-8",
    "Transfer-Encoding": "chunked",
  },
});
```

### Performance Issues
**Problem**: Slow response times

**Solutions**:
1. Use `gpt-4o-mini` instead of `gpt-4` for faster responses
2. Implement proper caching strategies
3. Monitor performance in LangSmith dashboard

## Production Considerations

### 1. Rate Limiting
- Implement rate limiting per user
- Handle OpenAI rate limits gracefully
- Use appropriate model tiers

### 2. Security
- Validate user input
- Implement proper authentication
- Secure API keys

### 3. Monitoring
- Use LangSmith for AI-specific monitoring
- Implement application-level logging
- Set up alerts for errors

### 4. Scaling
- Consider using edge functions for global distribution
- Implement connection pooling
- Use CDN for static assets

## Alternative Approaches

### When NOT to use `useChat`:
- **Non-React applications**: Use the core AI SDK instead
- **Custom streaming requirements**: Implement custom streaming logic
- **Complex state management**: Use Redux/Zustand with custom chat logic

### Alternative Libraries:
- **LangChain.js**: For complex AI workflows
- **OpenAI SDK**: For direct OpenAI integration
- **Custom implementation**: For highly specialized requirements

## Conclusion

The combination of `useChat` + LangChain + OpenAI + LangSmith provides an excellent foundation for building production-ready chatbots. This setup offers:

- ✅ Excellent developer experience
- ✅ Built-in streaming and error handling
- ✅ Comprehensive observability
- ✅ Scalable architecture
- ✅ Type safety
- ✅ Multi-agent capabilities

This is currently the **best practice** for React-based chatbot implementations. 
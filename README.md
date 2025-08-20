# AI Character Chatbot

A sophisticated AI-powered chatbot application featuring personality-driven conversations, multi-agent intelligence, and seamless integration with external services. Built with Next.js, LangGraph, and Supabase.

## 🌟 Features

- **Personality-Driven AI**: Chat with Captain Byte, a witty pirate-themed AI assistant
- **Multi-Agent Architecture**: Specialized agents for weather, news, and general conversation
- **Memory Management**: Persistent conversation history with intelligent summarization
- **Real-time Tools**: Weather updates and news headlines via external APIs
- **Modern UI/UX**: Beautiful, responsive interface with smooth animations
- **Authentication**: Secure user management with Supabase
- **Conversation Persistence**: Chat history stored securely in PostgreSQL

## 🏗️ Architecture

### Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion
- **AI Framework**: LangChain, LangGraph
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **External APIs**: OpenAI GPT-4, OpenWeather, NewsAPI
- **Build Tool**: Turbo (Monorepo)
- **Package Manager**: pnpm

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App  │    │   LangGraph     │    │   Supabase      │
│   (Frontend)   │◄──►│   (AI Engine)   │◄──►│   (Database)    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   UI Components │    │   Multi-Agents  │    │   PostgreSQL    │
│   & Animations  │    │   & Tools       │    │   Tables        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm 10.13.1+
- Supabase account
- OpenAI API key
- OpenWeather API key
- NewsAPI key

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd chatbot
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Environment Setup**
   Create a `.env.local` file in the `apps/web` directory:
   ```env
   # Supabase
   SUPABASE_URL=your_supabase_url
   SUPABASE_PUBLISHABLE_OR_ANON_KEY=your_supabase_anon_key
   DATABASE_PASSWORD=your_database_password
   
   # OpenAI
   OPENAI_API_KEY=your_openai_api_key
   
   # External APIs
   OPENWEATHER_API_KEY=your_openweather_api_key
   NEWSAPI_API_KEY=your_newsapi_api_key
   
   # Optional: LangSmith
   LANGCHAIN_API_KEY=your_langsmith_api_key
   LANGCHAIN_PROJECT=your_project_name
   LANGCHAIN_ENDPOINT=https://api.smith.langchain.com
   LANGCHAIN_TRACING_V2=true
   ```

4. **Database Setup**
   ```bash
   cd apps/web
   npx supabase start
   npx supabase db reset
   ```

5. **Run the development server**
   ```bash
   pnpm dev
   ```

   The application will be available at `http://localhost:3000`

## 🧠 AI Architecture

### Multi-Agent System

The chatbot uses a sophisticated multi-agent architecture built with LangGraph:

#### 1. **Router Agent** (`routerNode`)
- **Purpose**: Determines which specialized agent should handle user input
- **Decision Logic**: Analyzes user intent to route to appropriate agent
- **Routing Options**:
  - `weather_agent`: Weather/forecast related queries
  - `news_agent`: Current events and news queries
  - `chat_agent`: General conversation and everything else

#### 2. **Weather Agent** (`weather.agent.ts`)
- **Purpose**: Handles weather-related queries
- **Tools**: Integrates with OpenWeather API
- **Output**: Provides current weather conditions and forecasts
- **Flow**: Routes back to chat agent with weather context

#### 3. **News Agent** (`news.agent.ts`)
- **Purpose**: Handles news and current events queries
- **Tools**: Integrates with NewsAPI
- **Output**: Provides relevant news headlines and summaries
- **Flow**: Routes back to chat agent with news context

#### 4. **Chat Agent** (`chat.agent.ts`)
- **Purpose**: Main conversation handler with personality
- **Personality**: Captain Byte - a witty pirate-themed assistant
- **Context Integration**: Incorporates weather and news data when available
- **Response Style**: Helpful, engaging, and character-consistent

### Memory Management

The system implements intelligent memory management:

- **Conversation Persistence**: All messages stored in PostgreSQL
- **Smart Summarization**: Long conversations automatically summarized every 5 turns
- **Context Preservation**: Recent messages and summaries maintained for continuity
- **Turn Tracking**: Conversation turn counter for optimization

### Tool Integration

#### Weather Tool
```typescript
// Fetches current weather data from OpenWeather API
weatherTool.invoke({ query: "London" })
// Returns: "The weather in London is 18°C with scattered clouds."
```

#### News Tool
```typescript
// Fetches relevant news headlines from NewsAPI
newsTool.invoke({ query: "artificial intelligence" })
// Returns: Up to 3 relevant news headlines
```

## 🗄️ Database Schema

### Core Tables

#### `chats`
- `user_id`: UUID (Primary Key, references auth.users)
- `title`: TEXT (Chat session title)
- `turn`: INTEGER (Conversation turn counter)
- `updated_at`: TIMESTAMP (Last update time)

#### `messages`
- `id`: UUID (Primary Key)
- `chat_id`: UUID (References chats.user_id)
- `role`: TEXT (user/assistant/system)
- `content`: TEXT (Message content)
- `agents`: VARCHAR[] (Array of agent names that processed the message)
- `updated_at`: TIMESTAMP (Last update time)

#### `summaries`
- `id`: UUID (Primary Key)
- `chat_id`: UUID (References chats.user_id)
- `summary_text`: TEXT (Conversation summary)
- `updated_at`: TIMESTAMP (Last update time)

### Row Level Security (RLS)
All tables implement RLS policies ensuring users can only access their own data.

## 🎨 User Interface

### Design System

- **Color Scheme**: Dark theme with gradient accents
- **Typography**: Geist Sans and Geist Mono fonts
- **Components**: Radix UI primitives with custom styling
- **Animations**: Framer Motion for smooth interactions

### Key Components

#### Chat Interface
- **Message Display**: User and AI messages with distinct styling
- **Agent Badges**: Visual indicators showing which agents processed responses
- **Typing Indicators**: Animated loading states
- **Responsive Layout**: Adapts to different screen sizes

#### Form Components
- **Input Field**: Large, accessible text input
- **Quick Actions**: Pre-filled example queries
- **Submit Button**: Animated send button with loading states

#### Animation System
- **Message Entrance**: Direction-aware animations based on message origin
- **Text Reveal**: Staggered word-by-word text animation
- **Smooth Scrolling**: Automatic scroll to bottom with easing
- **Loading States**: Shimmer effects and typing indicators

## 🔧 API Endpoints

### Chat API (`/api/chat`)

#### POST `/api/chat`
Processes user messages and returns AI responses.

**Request Body:**
```json
{
  "messages": [
    {
      "role": "user",
      "content": "What's the weather like in Paris?"
    }
  ]
}
```

**Response:**
```json
{
  "content": "Shiver me timbers! The skies report: The weather in Paris is 22°C with clear sky.",
  "headers": {
    "X-Agents-Calls": "{\"weather_agent\":1,\"chat_agent\":1}"
  }
}
```

### Authentication Endpoints

- `POST /auth/signin` - User sign in
- `POST /auth/signup` - User registration
- `POST /auth/signout` - User sign out

## 🚀 Development

### Project Structure

```
chatbot/
├── apps/
│   └── web/                          # Next.js application
│       ├── src/
│       │   ├── app/                  # App Router pages
│       │   │   ├── api/              # API routes
│       │   │   ├── auth/             # Authentication pages
│       │   │   ├── chat/             # Chat interface
│       │   │   └── layout.tsx        # Root layout
│       │   ├── components/           # Reusable UI components
│       │   │   ├── ui/               # Base UI components
│       │   │   └── animation/        # Animation components
│       │   ├── hooks/                # Custom React hooks
│       │   ├── lib/                  # Utility libraries
│       │   │   ├── langgraph/        # AI engine
│       │   │   │   ├── agents/       # AI agents
│       │   │   │   ├── tools/        # External API tools
│       │   │   │   └── graph.ts      # LangGraph configuration
│       │   │   └── supabase/         # Database integration
│       │   └── env.ts                # Environment configuration
│       ├── supabase/                 # Database migrations
│       └── package.json
├── package.json                       # Root package.json
└── turbo.json                         # Turbo configuration
```

### Key Development Commands

```bash
# Development
pnpm dev              # Start all apps in development mode
pnpm dev:web          # Start only the web app

# Building
pnpm build            # Build all apps
pnpm build:web        # Build only the web app

# Linting
pnpm lint             # Lint all apps

# Database
cd apps/web
npx supabase start    # Start local Supabase
npx supabase db reset # Reset database
npx supabase stop     # Stop local Supabase
```

### Code Quality

- **TypeScript**: Strict type checking enabled
- **Biome**: Fast linter and formatter
- **ESLint**: Code quality rules
- **Prettier**: Code formatting

## 🔒 Security Features

- **Authentication**: Supabase Auth with email/password
- **Row Level Security**: Database-level access control
- **Environment Variables**: Secure API key management
- **Input Validation**: Zod schema validation
- **CORS Protection**: Configured for local development

## 🌐 External Integrations

### OpenAI
- **Model**: GPT-4o-mini for main conversations
- **Model**: GPT-3.5-turbo for routing decisions
- **Features**: Structured output, tool calling

### OpenWeather API
- **Endpoint**: Current weather data
- **Units**: Metric (Celsius)
- **Rate Limit**: 1000 calls/day (free tier)

### NewsAPI
- **Endpoint**: News search and headlines
- **Results**: Up to 3 articles per query
- **Rate Limit**: 100 requests/day (free tier)

## 📊 Performance Optimizations

- **Edge Runtime**: API routes use Edge Runtime for faster response times
- **Memory Management**: Intelligent conversation summarization
- **Lazy Loading**: Components loaded on demand
- **Optimized Queries**: Database indexes for fast retrieval
- **Streaming**: Support for streaming responses (commented out)

## 🧪 Testing

The project includes:
- **Type Safety**: TypeScript for compile-time error checking
- **Input Validation**: Zod schemas for runtime validation
- **Error Handling**: Comprehensive error handling throughout the stack

## 🚀 Deployment

### Supabase Deployment
1. Push migrations to production
2. Configure environment variables
3. Deploy the Next.js application

### Vercel Deployment
1. Connect repository to Vercel
2. Configure environment variables
3. Deploy automatically on push

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is proprietary software. All rights reserved.

## 👨‍💻 Author

**Natan Plank** - AI Character Chat © 2025

## 🔮 Future Enhancements

- [ ] Streaming responses for real-time interaction
- [ ] Voice input/output capabilities
- [ ] Multi-language support
- [ ] Advanced conversation analytics
- [ ] Plugin system for custom tools
- [ ] Mobile application
- [ ] Real-time collaboration features

## 📚 Additional Resources

- [LangGraph Documentation](https://langchain-ai.github.io/langgraph/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Supabase Documentation](https://supabase.com/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Framer Motion Documentation](https://www.framer.com/motion/)

---

For questions or support, please contact the development team.

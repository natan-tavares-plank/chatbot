import z from "zod";

const getEnv = () => {
	const client = () => {
		const envSchema = z.object({
			NEXT_PUBLIC_POSTHOG_KEY: z.string(),
			NEXT_PUBLIC_POSTHOG_HOST: z.string().url(),
		});

		return envSchema.parse(process.env);
	};

	const server = () => {
		const envSchema = z.object({
			SUPABASE_URL: z.url(),
			SUPABASE_PUBLISHABLE_OR_ANON_KEY: z.string(),
			DATABASE_PASSWORD: z.string(),
			OPENAI_API_KEY: z.string(),
			LANGCHAIN_API_KEY: z.string().optional(),
			LANGCHAIN_PROJECT: z.string().optional(),
			LANGCHAIN_ENDPOINT: z.url().optional(),
			LANGCHAIN_TRACING_V2: z.string().optional(),
		});

		return envSchema.parse(process.env);
	};

	return {
		...client(),
		...server(),
	};
};

export const env = getEnv();

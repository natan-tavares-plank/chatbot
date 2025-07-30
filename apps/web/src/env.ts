import z from "zod";

const getEnv = () => {
	console.log(process.env);
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
		});

		return envSchema.parse(process.env);
	};

	return {
		client,
		server,
	};
};

export const env = getEnv();

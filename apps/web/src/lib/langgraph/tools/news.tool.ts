import { tool } from "@langchain/core/tools";
import z from "zod";
import { env } from "@/env";

const baseUrl = "https://newsapi.org/v2/everything";

export const newsTool = tool(
	async ({ query }) => {
		try {
			const response = await fetch(
				`${baseUrl}?q=${query}&apiKey=${env.NEWSAPI_API_KEY}&pageSize=3`,
			);

			const data = await response.json();
			const articles = (data.articles ?? []) as Array<{ title: string }>;
			if (articles.length === 0) {
				return `No recent news found about ${query}.`;
			}

			const headlines = articles
				.map((a, i) => `${i + 1}. ${a.title}`)
				.join("\n");
			return headlines || `No recent news found about ${query}.`;
		} catch (error) {
			return `Error getting news about ${query}: ${error}`;
		}
	},
	{
		name: "news_tool",
		description: "Call to get the latest news.",
		returnDirect: true,
		schema: z.object({
			query: z.string().describe("The query to use in your search."),
		}),
		responseFormat: "content",
	},
);

import { tool } from "@langchain/core/tools";
import z from "zod";
import { env } from "@/env";

// GET https://newsapi.org/v2/top-headlines?country=us&apiKey=API_KEY

const baseUrl = "https://newsapi.org/v2/top-headlines";

export const newsTool = tool(
	async ({ query }) => {
		const response = await fetch(
			`${baseUrl}?everything?q=${query}&apiKey=${env.NEWSAPI_API_KEY}&pageSize=5`,
		);
		const data = await response.json();

		return data;
	},
	{
		name: "search",
		description: "Call to surf the web.",
		returnDirect: true,
		schema: z.object({
			query: z.string().describe("The query to use in your search."),
		}),
	},
);

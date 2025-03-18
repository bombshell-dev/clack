import { defineCollection, z } from "astro:content";
import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { topicSchema } from "starlight-sidebar-topics/schema";

const baseSchema = topicSchema.extend({
	type: z.literal("base").optional().default("base"),
	i18nReady: z.boolean().optional().default(false),
});

const redirectSchema = baseSchema.extend({
	type: z.literal("redirect"),
	redirect: z.string(),
});

export const collections = {
	docs: defineCollection({
		loader: docsLoader(),
		schema: docsSchema({
			extend: z.union([baseSchema, redirectSchema]),
		}),
	}),
};

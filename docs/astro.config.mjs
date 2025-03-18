// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import ecTwoSlash from "expressive-code-twoslash";

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: "Bombshell",
			logo: {
				dark: "./src/assets/dark.svg",
				light: "./src/assets/light.svg",
			},
			expressiveCode: {
				plugins: [ecTwoSlash()],
			},
			editLink: {
				baseUrl: "https://github.com/bombshell-dev/clack/docs/edit/main/",
			},
			social: {
				discord: "https://bomb.sh/chat",
				blueSky: "https://bomb.sh/on/bluesky",
				github: "https://bomb.sh/on/github",
			},
			sidebar: [
				// {
				// 	label: "Guides",
				// 	items: [
				// 		// Each item here is one entry in the navigation menu.
				// 		{ label: "Example Guide", slug: "guides/example" },
				// 	],
				// },
				{
					label: "Basics",
					autogenerate: { directory: "basics" },
				},
			],
		}),
	],
});

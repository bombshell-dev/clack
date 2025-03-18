// @ts-check
import { defineConfig } from "astro/config";
import starlight from "@astrojs/starlight";
import ecTwoSlash from "expressive-code-twoslash";

// https://astro.build/config
export default defineConfig({
	integrations: [
		starlight({
			title: "Clack",
			logo: {
				dark: "./src/assets/clack-dark.gif",
				light: "./src/assets/clack-dark.gif",
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
				{
					label: "Basics",
					autogenerate: { directory: "basics" },
				},
				{
					label: "Packages",
					autogenerate: { directory: "packages" },
				},
				{
					label: "Guides",
					autogenerate: { directory: "guides" },
				},
			],
		}),
	],
});

import c, { createStyleText } from "@clack/color";
import { styleText } from "node:util";
import { test, expect } from "vitest";

process.env.FORCE_COLOR = "1";

test("@clack/color", () => {
	expect(c.redBright.underline("Hello World")).toBe(
		styleText(["redBright", "underline"], "Hello World")
	);

	expect(c.bgCyan.bold`Hello World`).toBe(
		styleText(["bgCyan", "bold"], "Hello World")
	);

	expect(createStyleText("red", "inverse")(`Hello World`)).toBe(
		styleText(["red", "inverse"], "Hello World")
	);
});

import { setTimeout } from 'node:timers/promises';
import * as p from '@clack/prompts';
import color from 'picocolors';
import { resolve } from "node:path";
import { statSync } from "node:fs";

function onCancel() {
	p.cancel('Operation cancelled.');
	process.exit(0);
}

async function main() {
	console.clear();

	await setTimeout(1000);

	const filePath = await p.path({
		message: "Please enter file path",
		initialValue: resolve("."),
	}) as string;

	p.log.info(filePath);

	const filePathFile = await p.path({
		message: "Please enter file path",
		initialValue: resolve("."),
		validate(val) {
			if (!val || statSync(val).isDirectory()) {
				return "Not a file";
			}
		}
	}) as string;

	p.log.info(filePathFile);

	const filePathDict = await p.path({
		message: "Please enter directory path",
		initialValue: resolve("."),
		directory: true,
	}) as string;

	p.log.info(filePathDict);

	const filePathNotExists = await p.path({
		message: "Please enter file path",
		initialValue: resolve("."),
		directory: false,
		exists: false,
	}) as string;

	p.log.info(filePathNotExists);
}

main().catch(console.error);

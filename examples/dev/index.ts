import { logger } from '@clack/logger';
import { setTimeout as sleep } from 'node:timers/promises';

async function main() {
	const c = logger();

	c.log("Hello world welcome to this shit");
	await sleep(1000);
	c.log("Hello world");
	console.log("AHHHHHH!");
	await sleep(1000);
	c.log("Hello world");
	console.log("AHHHHHH!");
	await sleep(1000);
	c.log("Hello world");
	console.log({ test: 0 });
}

main().catch(console.error);

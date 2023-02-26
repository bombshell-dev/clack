import color from 'picocolors';
export type LogLevel = 'debug' | 'info' | 'warn' | 'error' | 'silent';
const levels: Record<LogLevel, number> = {
	debug: 20,
	info: 30,
	warn: 40,
	error: 50,
	silent: 90,
}

// export interface LogOptions {
// 	dest: LogWritable<LogMessage>;
// 	level: LoggerLevel;
// }

// export const log = (chunk) => {
//     process.stdout.write('' + chunk + "\n");
// }


import shiki from 'shiki';
import color from 'picocolors';
import { stdout } from 'process';

function hexToRgb(hex: string) {
	hex = hex.replace(/^#/, '');
	if (hex.length === 3) hex = `${hex[0].repeat(2)}${hex[1].repeat(2)}${hex[2].repeat(2)}`;
	const value = parseInt(hex, 16);
	const r = (value >> 16) & 255;
	const g = (value >> 8) & 255;
	const b = value & 255;
	return { r, g, b };
}
let formatter =
	(open: string, close: string, replace = open) =>
	(input: string) => {
		let string = '' + input;
		let index = string.indexOf(close, open.length);
		return ~index
			? open + replaceClose(string, close, replace, index) + close
			: open + string + close;
	};

let replaceClose = (string: string, close: string, replace: string, index: number): string => {
	let start = string.substring(0, index) + replace;
	let end = string.substring(index + close.length);
	let nextIndex = end.indexOf(close);
	return ~nextIndex ? start + replaceClose(end, close, replace, nextIndex) : start + end;
};

const hex = (code: string, value: string) => {
	const { r, g, b } = hexToRgb(code);
	return formatter(`\x1b[38;2;${r};${g};${b}m`, '\x1b[39m')(value);
};

export async function highlight(code: string, lang: string, { output = stdout } = {}) {
	const width = output.columns ?? 80;
	const highlighter = await shiki.getHighlighter({
		theme: 'github-dark',
	});
	const ansi: string[] = [];
	const lines = highlighter.codeToThemedTokens(code.replaceAll('\t', '  '), lang);
	let lineNumber = 1;
	for (const line of lines) {
		let len = String(lines.length).length + 1;
		let part = `${color.gray(lineNumber.toString().padStart(len, ' '))}  `;
		len += 2;
		for (const token of line) {
			if (len + token.content.length > width) {
				ansi.push(part + ' '.repeat(width - len));
				len = String(lines.length).length + 1;
				part = ' '.repeat(len) + '  ';
				len += 2;
			}

			if (token.color) {
				len += token.content.length;
				part += hex(token.color, token.content);
			} else {
				len += token.content.length;
				part += token.content;
			}
		}
		lineNumber++;
		ansi.push(part + ' '.repeat(width - len));
	}
	return (
		color.bgBlack(' '.repeat(width)) +
		'\n' +
		ansi.map((ln) => color.bgBlack(ln)).join('\n') +
		'\n' +
		color.bgBlack(' '.repeat(width))
	);
}

const code = `const id = (v: string) => v;
const theme = new Map<string, any>([
	['var(--shiki-color-text)', id],
	['var(--shiki-color-background)', id],
	['var(--shiki-token-constant)', color.yellow],
	['var(--shiki-token-string)', color.green],
	['var(--shiki-token-comment)', color.dim],
	['var(--shiki-token-keyword)', color.green],
	['var(--shiki-token-parameter)', color.cyan],
	['var(--shiki-token-function)', color.red],
	['var(--shiki-token-string-expression)', color.yellow],
	['var(--shiki-token-punctuation)', color.dim],
	['var(--shiki-token-link)', color.cyan],
]);
export function highlight(code: string, lang: string) {
	shiki
		.getHighlighter({
			theme: 'css-variables'
		})
		.then((highlighter) => {
			const lines = highlighter.codeToThemedTokens(code.replaceAll('\t', '  '), lang);
			for (const line of lines) {
				for (const token of line) {
					if (token.color) {
						const c = theme.get(token.color);
						process.stdout.write(c(token.content));
					} else {
						process.stdout.write(token.content);
					}
				}
				process.stdout.write('\\n');
			}
		});
}`;

async function main() {
	console.log(await highlight(code, 'ts'));
}

main();

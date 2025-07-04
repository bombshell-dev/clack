import wrapAnsi from 'wrap-ansi';
import { stripVTControlCharacters as strip } from 'node:util';
import { stdout } from 'node:process';
import { S_BAR, symbol } from './common.js';
import color from 'picocolors';

// 6 => vertical padding = 3
const termWidth: number = stdout.columns - 6;

const wrap = (text: string, width: number): string => {
  if (text.indexOf(' ') === -1) {
    const re = new RegExp(`.{1,${width}}`, 'g');
    const lines = strip(text).match(re) || [];
    return lines.join('\n');
  }
  return wrapAnsi(text, width);
}

// Wrap title (message)
export const wrapTitle = (message: string, state: string): string => {
  const wrapStr = wrap(message, termWidth);
  const lines = wrapStr.split('\n');
  return lines.map((line, index) => {
    if (index === 0) {
      return `${symbol(state)}  ${line}`
    }
    switch (state) {
  		case 'initial':
  		case 'active':
  			return `${color.cyan(S_BAR)}  ${line}`;
  		case 'cancel':
  			return `${color.gray(S_BAR)}  ${line}`;
  		case 'error':
  			return `${color.yellow(S_BAR)}  ${line}`;
  		case 'submit':
  			return `${color.gray(S_BAR)}  ${line}`;
  	}
  }).join('\n');
}
import { PasswordPrompt, ConfirmPrompt, isCancel } from '@clack/core';
import c from 'picocolors';
import boxen from 'boxen';

async function run() {
    const text = new PasswordPrompt({
        render() {
            const title = `What's your name?\n`;
            const boxOpts = { width: 48, padding: { left: 1, right: 1, top: 0, bottom: 0 }};
            switch (this.state) {
                case 'initial': {
                    const input = boxen((!this.value ? c.bgWhite(c.black('P')) + c.dim('assword') : this.valueWithCursor), boxOpts);
                    return `🙋 ${title}${input}`;
                }
                case 'active': {
                    const input = boxen((!this.value ? c.bgWhite(c.black('P')) + c.dim('assword') : this.valueWithCursor), boxOpts);
                    return `💭 ${title}${input}`;
                }
                case 'error': {
                    const input = boxen((!this.value ? c.bgWhite(c.black('P')) + c.dim('assword') : this.valueWithCursor), { ...boxOpts, borderColor: 'yellow' });
                    return `🚸 What's your name? ${c.yellow(this.error)}\n${input}`;
                }
                case 'submit': return `✅ ${title}${boxen(c.dim(this.valueWithCursor), { ...boxOpts, borderColor: 'gray'  })}`;
                case 'cancel': return `❌ What's your name?`;
            }
        }
    })
    
    const value = await text.prompt();
    if (isCancel(value)) {
        console.log('See you later!');
        return;
    }

    const Option = (label: string, active: boolean) => `${active ? c.cyan('🟦') : '⬜'} ${label}`;

    const select = new ConfirmPrompt({
        active: 'yes',
        inactive: 'no',
        render() {
            const title = `Select an option!\n`;
            switch (this.state) {
                case 'submit': return `✅ ${title}${c.dim(this.value ? 'yes' : 'no')}`;
                case 'cancel': return `❌ ${title.trim()}`;
                default: {
                    return `💭 ${title}${this.value ? c.cyan('yes') : 'yes'} / ${!this.value ? c.cyan('no') : 'no'}`;
                }
            }
            return ''
        }
    })
    
    const choice = await select.prompt();
    if (isCancel(choice)) {
        console.log('See you later!');
        return;
    }

    console.log({ choice });
}

run();


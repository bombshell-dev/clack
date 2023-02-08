import { TextPrompt, SelectPrompt, isCancel } from '@clack/core';
import c from 'picocolors';
import boxen from 'boxen';

async function run() {
    const text = new TextPrompt({
        validate(value) {
            if (value === '') return 'Value is required!';
        },
        render() {
            const title = `What's your name?\n`;
            const boxOpts = { width: 48, padding: { left: 1, right: 1, top: 0, bottom: 0 }};
            switch (this.state) {
                case 'initial': {
                    const input = boxen((!this.value ? c.bgWhite(c.black('N')) + c.dim('obody') : this.valueWithCursor), boxOpts);
                    return `🙋 ${title}${input}`;
                }
                case 'active': {
                    const input = boxen((!this.value ? c.bgWhite(c.black('N')) + c.dim('obody') : this.valueWithCursor), boxOpts);
                    return `💭 ${title}${input}`;
                }
                case 'error': {
                    const input = boxen((!this.value ? c.bgWhite(c.black('N')) + c.dim('obody') : this.valueWithCursor), { ...boxOpts, borderColor: 'yellow' });
                    return `🚸 What's your name? ${c.yellow(this.error)}\n${input}`;
                }
                case 'submit': return `✅ ${title}${boxen(c.dim(this.value), { ...boxOpts, borderColor: 'gray'  })}`;
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

    const select = new SelectPrompt({
        initialIndex: 1,
        options: [
            { value: 1, label: 'One' },
            { value: 2, label: 'Two' },
            { value: 3, label: 'Three' }
        ],
        render() {
            const title = `Select an option!\n`;
            switch (this.state) {
                case 'submit': return `✅ ${title}${Option(this.options.find((opt, i) => i === this.cursor)!.label, true)}`;
                case 'cancel': return `❌ ${title.trim()}`;
                default: {
                    return `💭 ${title}${this.options.map((opt, i) => Option(opt.label, i === this.cursor)).join('\n')}`;
                }
            }
            return ''
        }
    })
    
    const choice = await select.prompt();
    if (isCancel(choice)) {
        console.log('See you later!');z
        return;
    }

    console.log({ choice });
    

    // await sleep(10000);
    // const name = await input(`  ${c.bgMagenta(c.white(' dir '))}  Where should we create your new project?\n         `, { placeholder: 'Ahhhhhh' })
    // if (wasCancelled(name)) {
    //     return;
    // }

    // const template = await select(` ${c.bgMagenta(c.white(' tmpl '))}  How would you like to start your new project?\n`, ['Include sample files', 'Use blog template', 'Empty'], {
    //     render(opts, { done, index }) {
    //         return opts.map((opt, i) => {
    //             if (i === index) return '      ' + (done ? ' ' : c.green('•')) + '  ' + (done ? c.dim(opt) : opt);
    //             return '      ' + c.dim('•') + '  ' + opt;
    //         }).join('\n')
    //     },
    // })
    // if (wasCancelled(template)) {
    //     return;
    // }
    // console.log()

    // const other = await text(` ${c.bgMagenta(c.white(' some '))}  Meh?\n         `)
    // if (wasCancelled(other)) {
    //     return;
    // }
    // const goon = await confirm(`\nShould I continue?\n> `);
    // if (wasCancelled(name)) {
    //     console.log('Fine, don\'t answer.')
    //     return;
    // }
    // console.log({ goon });

    // const option = await select('\nChoose an option:\n> ', ['a', 'b', 'c'], {
    //     render(i, opts) {
    //         return opts.map((text, j) => {
    //             if (i === j) return `[${text}]`;
    //             return ` ${text} `;
    //         }).join(' ');
    //     }
    // });
    // if (wasCancelled(option)) {
    //     console.log('Fine, don\'t answer.')
    //     return;
    // }
    // console.log({ option });
}

run();


import { text, select, confirm, intro, outro, cancel, spinner, isCancel, multiSelect } from '@clack/prompts';
import color from 'picocolors';
import { setTimeout } from 'node:timers/promises';

async function main () {
    console.clear(); 

    await setTimeout(1000);

    intro(`${color.bgCyan(color.black(' create-app '))}`);

    const a = await text({
        message: 'What is your twitter handle?',
        placeholder: '@username',
        validate(value) {
            if (value[0] !== '@') return `Value must start with @!`;
        }
    })

    if (isCancel(a)) {
        cancel('Operation cancelled.');
        process.exit(0);
    }

    const b = await confirm({
        message: 'Are you sure?'
    })

    if (isCancel(b)) {
        cancel('Operation cancelled.');
        process.exit(0);
    }

    const c = await select({
        message: 'Pick a project type.',
        options: [
            { value: 'ts', label: 'TypeScript' },
            { value: 'js', label: 'JavaScript' },
            { value: 'coffee', label: 'CoffeeScript', hint: 'oh no' },
        ]
    })

    if (isCancel(c)) {
        cancel('Operation cancelled.');
        process.exit(0);
    }

    const m = await multiSelect({
        message: 'Select one/many styling tools',
        options: [
            {value: 'eslint', label: 'Eslint'},
            {value: 'prettier', label: 'Prettier'},
            {value: 'another-option', label: 'Another awesome option', hint: "I'm not creative"},
        ] 
    });

    if(isCancel(m)) {
        cancel('Operation cancelled.');
        process.exit(0);
    }

    const s = spinner();
    s.start('Installing via npm');
    await setTimeout(5000);
    s.stop('Installed via npm');

    outro('Have fun out there!');

    await setTimeout(3000);

    console.clear();

    await setTimeout(3000);
}

main().catch(console.error);

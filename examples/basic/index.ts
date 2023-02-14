/* eslint-disable no-console */
import { setTimeout } from 'node:timers/promises'
import {
  cancel,
  confirm,
  intro,
  isCancel,
  multiselect,
  note,
  outro,
  select,
  spinner,
  text,
} from '@clack/prompts'
import color from 'picocolors'

async function main() {
  console.clear()

  await setTimeout(1000)

  intro(`${color.bgCyan(color.black(' create-app '))}`)

  const dir = await text({
    message: 'Where should we create your project?',
    placeholder: './sparkling-slop',
  })

  if (isCancel(dir)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const projectType = await select({
    message: 'Pick a project type.',
    options: [
      { value: 'ts', label: 'TypeScript' },
      { value: 'js', label: 'JavaScript' },
      { value: 'coffee', label: 'CoffeeScript', hint: 'oh no' },
    ],
  })

  if (isCancel(projectType)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const tools = await multiselect({
    message: 'Select additional tools.',
    options: [
      { value: 'prettier', label: 'Prettier', hint: 'recommended' },
      { value: 'eslint', label: 'ESLint' },
      { value: 'stylelint', label: 'Stylelint' },
      { value: 'gh-action', label: 'GitHub Action' },
    ],
  })

  if (isCancel(tools)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  const install = await confirm({
    message: 'Install dependencies?',
  })

  if (isCancel(install)) {
    cancel('Operation cancelled.')
    process.exit(0)
  }

  if (install) {
    const s = spinner()
    s.start('Installing via pnpm')
    await setTimeout(5000)
    s.stop('Installed via pnpm')
  }

  const nextSteps = `cd ${dir}        \n${install ? '' : 'npm install\n'}npm run dev`

  note(nextSteps, 'Next steps.')

  await setTimeout(3000)

  outro(`Problems? ${color.underline(color.cyan('https://example.com/issues'))}`)
}

main().catch(console.error)

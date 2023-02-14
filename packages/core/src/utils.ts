import type { Key } from 'node:readline'

import * as readline from 'node:readline'
import { stdin, stdout } from 'node:process'
import { cursor } from 'sisteransi'

export function block({ input = stdin, output = stdout, overwrite = true, hideCursor = true } = {}) {
  const rl = readline.createInterface({
    input,
    output,
    prompt: '',
    tabSize: 1,
  })
  readline.emitKeypressEvents(input, rl)
  if (input.isTTY)
    input.setRawMode(true)

  const clear = (data: Buffer, { name }: Key) => {
    const str = String(data)
    if (str === '\x03')
      process.exit(0)

    if (!overwrite)
      return
    const dx = name === 'return' ? 0 : -1
    const dy = name === 'return' ? -1 : 0

    readline.moveCursor(output, dx, dy, () => {
      readline.clearLine(output, 1, () => {
        input.once('keypress', clear)
      })
    })
  }
  if (hideCursor)
    process.stdout.write(cursor.hide)
  input.once('keypress', clear)

  return () => {
    input.off('keypress', clear)
    if (hideCursor)
      process.stdout.write(cursor.show)
    rl.close()
  }
}

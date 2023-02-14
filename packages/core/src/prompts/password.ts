import color from 'picocolors'
import type { PromptOptions } from './prompt'
import Prompt from './prompt'

interface PasswordOptions extends PromptOptions<PasswordPrompt> {
  mask?: string
}
export default class PasswordPrompt extends Prompt {
  valueWithCursor = ''
  private _mask = '•'
  get cursor() {
    return this._cursor
  }

  private get masked() {
    return this.value.split('').map(() => this._mask).join('')
  }

  constructor({ mask, ...opts }: PasswordOptions) {
    super(opts)
    this._mask = mask ?? '•'

    this.on('finalize', () => {
      this.valueWithCursor = this.masked
    })
    this.on('value', () => {
      if (this.cursor >= this.value.length) {
        this.valueWithCursor = `${this.masked}${color.inverse(color.hidden('_'))}`
      }
      else {
        const s1 = this.masked.slice(0, this.cursor)
        const s2 = this.masked.slice(this.cursor)
        this.valueWithCursor = `${s1}${color.inverse(s2[0])}${s2.slice(1)}`
      }
    })
  }
}

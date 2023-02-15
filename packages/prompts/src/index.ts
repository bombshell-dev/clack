import { State } from "@clack/core";
import { MultiSelectPrompt, TextPrompt, SelectPrompt, ConfirmPrompt, block } from "@clack/core";
import color from "picocolors";
import { cursor, erase } from "sisteransi";
export { isCancel } from "@clack/core";

const symbol = (state: State) => {
  switch (state) {
    case "initial":
    case "active":
      return color.cyan("●");
    case "cancel":
      return color.red("■");
    case "error":
      return color.yellow("▲");
    case "submit":
      return color.green("○");
  }
};

const barStart = "┌";
const bar = "│";
const barEnd = "└";

export interface TextOptions {
  message: string;
  placeholder?: string;
  initialValue?: string;
  validate?: (value: string) => string | void;
}
export const text = (opts: TextOptions) => {
  return new TextPrompt({
    validate: opts.validate,
    placeholder: opts.placeholder,
    initialValue: opts.initialValue,
    render() {
      const title = `${color.gray(bar)}\n${symbol(this.state)}  ${
        opts.message
      }\n`;
      const placeholder = opts.placeholder
        ? color.inverse(opts.placeholder[0]) +
          color.dim(opts.placeholder.slice(1))
        : color.inverse(color.hidden("_"));
      const value = !this.value ? placeholder : this.valueWithCursor;

      switch (this.state) {
        case "error":
          return `${title.trim()}\n${color.yellow(
            bar
          )}  ${value}\n${color.yellow(barEnd)}  ${color.yellow(this.error)}\n`;
        case "submit":
          return `${title}${color.gray(bar)}  ${color.dim(this.value)}`;
        case "cancel":
          return `${title}${color.gray(bar)}  ${color.strikethrough(
            color.dim(this.value)
          )}${this.value.trim() ? "\n" + color.gray(bar) : ""}`;
        default:
          return `${title}${color.cyan(bar)}  ${value}\n${color.cyan(
            barEnd
          )}\n`;
      }
    },
  }).prompt() as Promise<string | symbol>;
};

export interface ConfirmOptions {
  message: string;
  active?: string;
  inactive?: string;
  initialValue?: boolean;
}
export const confirm = (opts: ConfirmOptions) => {
  const active = opts.active ?? "Yes";
  const inactive = opts.inactive ?? "No";
  return new ConfirmPrompt({
    active,
    inactive,
    initialValue: opts.initialValue ?? true,
    render() {
      const title = `${color.gray(bar)}\n${symbol(this.state)}  ${
        opts.message
      }\n`;
      const value = this.value ? active : inactive;

      switch (this.state) {
        case "submit":
          return `${title}${color.gray(bar)}  ${color.dim(value)}`;
        case "cancel":
          return `${title}${color.gray(bar)}  ${color.strikethrough(
            color.dim(value)
          )}\n${color.gray(bar)}`;
        default: {
          return `${title}${color.cyan(bar)}  ${
            this.value
              ? `${color.green("●")} ${active}`
              : `${color.dim("○")} ${color.dim(active)}`
          } ${color.dim("/")} ${
            !this.value
              ? `${color.green("●")} ${inactive}`
              : `${color.dim("○")} ${color.dim(inactive)}`
          }\n${color.cyan(barEnd)}\n`;
        }
      }
    },
  }).prompt() as Promise<boolean | symbol>;
};

interface Option<Value extends Readonly<string>> {
  value: Value;
  label?: string;
  hint?: string;
}
export interface SelectOptions<Options extends Option<Value>[], Value extends Readonly<string>> {
  message: string;
  options: Options;
  initialValue?: Options[number]["value"];
}

export interface MultiSelectOptions<Options extends Option<Value>[], Value extends Readonly<string>> {
  message: string;
  options: Options;
  initialValue?: Options[number]['value'][];
  cursorAt?: Options[number]["value"]
}

export const select = <Options extends Option<Value>[], Value extends Readonly<string>>(
  opts: SelectOptions<Options, Value>
) => {
  const opt = (
    option: Options[number],
    state: "inactive" | "active" | "selected" | "cancelled"
  ) => {
    const label = option.label ?? option.value;
    if (state === "active") {
      return `${color.green("●")} ${label} ${
        option.hint ? color.dim(`(${option.hint})`) : ""
      }`;
    } else if (state === "selected") {
      return `${color.dim(label)}`;
    } else if (state === "cancelled") {
      return `${color.strikethrough(color.dim(label))}`;
    }
    return `${color.dim("○")} ${color.dim(label)}`;
  };

  return new SelectPrompt({
    options: opts.options,
    initialValue: opts.initialValue,
    render() {
      const title = `${color.gray(bar)}\n${symbol(this.state)}  ${
        opts.message
      }\n`;

      switch (this.state) {
        case "submit":
          return `${title}${color.gray(bar)}  ${opt(
            this.options[this.cursor],
            "selected"
          )}`;
        case "cancel":
          return `${title}${color.gray(bar)}  ${opt(
            this.options[this.cursor],
            "cancelled"
          )}\n${color.gray(bar)}`;
        default: {
          return `${title}${color.cyan(bar)}  ${this.options
            .map((option, i) =>
              opt(option, i === this.cursor ? "active" : "inactive")
            )
            .join(`\n${color.cyan(bar)}  `)}\n${color.cyan(barEnd)}\n`;
        }
      }
    },
  }).prompt() as Promise<Options[number]['value'] | symbol>;
};

export const multiselect = <Options extends Option<Value>[], Value extends Readonly<string>>(opts: MultiSelectOptions<Options, Value>) => {
    const opt = (option: Options[number], state: 'inactive' | 'active' | 'selected' | 'active-selected' | 'submitted' | 'cancelled') => {
        const label =  option.label ?? option.value;
        if (state === 'active') {
            return `${color.cyan('◻')} ${label} ${option.hint ? color.dim(`(${option.hint})`) : ''}`
        } else if (state === 'selected') {
            return `${color.green('◼')} ${color.dim(label)}`
        } else if (state === 'cancelled') {
            return `${color.strikethrough(color.dim(label))}`;
        } else if (state === 'active-selected') {
            return `${color.green('◼')} ${label} ${option.hint ? color.dim(`(${option.hint})`) : ''}`
        } else if (state === 'submitted') {
            return `${color.dim(label)}`;
        }
        return `${color.dim('◻')} ${color.dim(label)}`;
    }

    return new MultiSelectPrompt({
        options: opts.options,
        initialValue: opts.initialValue,
        cursorAt: opts.cursorAt,
        render() {
            let title = `${color.gray(bar)}\n${symbol(this.state)}  ${opts.message}\n`;

            switch (this.state) {
                case 'submit': {
                    const selectedOptions = this.options.filter(option => this.selectedValues.some(selectedValue => selectedValue === option.value as any));
                    return `${title}${color.gray(bar)}  ${selectedOptions.map((option, i) => opt(option, 'submitted')).join(color.dim(", "))}`;
                };
                case 'cancel': {
                    const selectedOptions = this.options.filter(option => this.selectedValues.some(selectedValue => selectedValue === option.value as any));
                    const label = selectedOptions.map((option, i) => opt(option, 'cancelled')).join(color.dim(", "));
                    return `${title}${color.gray(bar)}  ${label.trim() ? `${label}\n${color.gray(bar)}` : ''}`
                };
                case 'error': {
                    const footer = this.error.split('\n').map((ln, i) => i === 0 ? `${color.yellow(barEnd)}  ${color.yellow(ln)}` : `   ${ln}`).join('\n');
                    return `${title}${color.yellow(bar)}  ${this.options.map((option, i) => {
                        const isOptionSelected = this.selectedValues.includes(option.value as any); 
                        const isOptionHovered = i === this.cursor;
                        if(isOptionHovered && isOptionSelected)  {
                            return opt(option, 'active-selected');
                        }
                        if(isOptionSelected) {
                            return opt(option, 'selected');
                        }
                        return opt(option, isOptionHovered ? 'active' : 'inactive');
                    }).join(`\n${color.yellow(bar)}  `)}\n${footer}\n`;
                }
                default: {
                    return `${title}${color.cyan(bar)}  ${this.options.map((option, i) => {
                        const isOptionSelected = this.selectedValues.includes(option.value as any); 
                        const isOptionHovered = i === this.cursor;
                        if(isOptionHovered && isOptionSelected)  {
                            return opt(option, 'active-selected');
                        }
                        if(isOptionSelected) {
                            return opt(option, 'selected');
                        }
                        return opt(option, isOptionHovered ? 'active' : 'inactive');
                    }).join(`\n${color.cyan(bar)}  `)}\n${color.cyan(barEnd)}\n`;
                }
            }
        }
    }).prompt() as Promise<Options[number]['value'][] | symbol>;
}

const strip = (str: string) => str.replace(ansiRegex(), '')
export const note = (message = "", title = '') => {
  const lines = `\n${message}\n`.split('\n');
  const len = lines.reduce((sum, ln) => {
    ln = strip(ln);
    return ln.length > sum ? ln.length : sum
  }, 0) + 2;
  const msg = lines.map((ln) => `${color.gray(bar)}  ${color.dim(ln)}${' '.repeat(len - strip(ln).length)}${color.gray(bar)}`).join('\n');
  process.stdout.write(`${color.gray(bar)}\n${color.green('○')}  ${color.reset(title)} ${color.gray('─'.repeat(len - title.length - 1) + '╮')}\n${msg}\n${color.gray('├' + '─'.repeat(len + 2) + '╯')}\n`);
};

export const cancel = (message = "") => {
  process.stdout.write(`${color.gray(barEnd)}  ${color.red(message)}\n\n`);
};

export const intro = (title = "") => {
  process.stdout.write(`${color.gray(barStart)}  ${title}\n`);
};

export const outro = (message = "") => {
  process.stdout.write(
    `${color.gray(bar)}\n${color.gray(barEnd)}  ${message}\n\n`
  );
};

const arc = [
    '◒', '◐', '◓', '◑'
]

export const spinner = () => {
  let unblock: () => void;
  let loop: NodeJS.Timer;
  const frames = arc;
  const delay = 80;
  return {
    start(message = "") {
      message = message.replace(/\.?\.?\.$/, "");
      unblock = block();
      process.stdout.write(
        `${color.gray(bar)}\n${color.magenta("○")}  ${message}\n`
      );
      let i = 0;
      let dot = 0;
      loop = setInterval(() => {
        let frame = frames[i];
        process.stdout.write(cursor.move(-999, -1));
        process.stdout.write(
            `${color.magenta(frame)}  ${message}${Math.floor(dot) >= 1 ? '.'.repeat(Math.floor(dot)).slice(0, 3) : ''}   \n`
        );
        i = i === frames.length - 1 ? 0 : i + 1;
        dot = dot === frames.length ? 0 : (dot + 0.125);
      }, delay);
    },
    stop(message = "") {
      process.stdout.write(cursor.move(-999, -2));
      process.stdout.write(erase.down(2));
      clearInterval(loop);
      process.stdout.write(
        `${color.gray(bar)}\n${color.green("○")}  ${message}\n`
      );
      unblock();
    },
  };
};

// Adapted from https://github.com/chalk/ansi-regex
// @see LICENSE
function ansiRegex() {
	const pattern = [
		'[\\u001B\\u009B][[\\]()#;?]*(?:(?:(?:(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]+)*|[a-zA-Z\\d]+(?:;[-a-zA-Z\\d\\/#&.:=?%@~_]*)*)?\\u0007)',
		'(?:(?:\\d{1,4}(?:;\\d{0,4})*)?[\\dA-PR-TZcf-nq-uy=><~]))'
	].join('|');

	return new RegExp(pattern, 'g');
}

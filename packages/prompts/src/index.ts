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
      return color.green("✔");
  }
};

const barStart = "┌";
const bar = "│";
const barEnd = "└";

export interface TextOptions {
  message: string;
  placeholder?: string;
  validate?: (value: string) => string | void;
}
export const text = (opts: TextOptions) => {
  return new TextPrompt({
    validate: opts.validate,
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
  }).prompt();
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
  }).prompt();
};

interface Option {
  value: any;
  label?: string;
  hint?: string;
}
export interface SelectOptions<Options extends Option[]> {
  message: string;
  options: Options;
  initialValue?: Options[number]["value"];
}
export const select = <Options extends Option[]>(
  opts: SelectOptions<Options>
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
  }).prompt();
};

export const multiselect = <Options extends Option[]>(opts: SelectOptions<Options>) => {
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
        render() {
            let title = `${color.gray(bar)}\n${symbol(this.state)}  ${opts.message}\n`;

            switch (this.state) {
                case 'submit': {
                    const selectedOptions = this.options.filter(option => this.selectedValues.some(selectedValue => selectedValue === option.value));
                    return `${title}${color.gray(bar)}  ${selectedOptions.map((option, i) => opt(option, 'submitted')).join(color.dim(", "))}`;
                };
                case 'cancel': {
                    const selectedOptions = this.options.filter(option => this.selectedValues.some(selectedValue => selectedValue === option.value));
                    const label = selectedOptions.map((option, i) => opt(option, 'cancelled')).join(color.dim(", "));
                    return `${title}${color.gray(bar)}  ${label.trim() ? `${label}\n${color.gray(bar)}` : ''}`
                };
                case 'error': {
                    const footer = this.error.split('\n').map((ln, i) => i === 0 ? `${color.yellow(barEnd)}  ${color.yellow(ln)}` : `   ${ln}`).join('\n');
                    return `${title}${color.yellow(bar)}  ${this.options.map((option, i) => {
                        const isOptionSelected = this.selectedValues.includes(option.value); 
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
                        const isOptionSelected = this.selectedValues.includes(option.value); 
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
    }).prompt();
}

export const cancel = (message = "") => {
  process.stdout.write(`${color.gray(barEnd)}  ${color.red(message)}\n\n`);
};

export const intro = (title = "") => {
  process.stdout.write(`${color.gray(barStart)}  ${title}\n`);
};

export const outro = (message = "") => {
  process.stdout.write(
    `${color.gray(bar)}\n${color.gray(barEnd)}  ${color.green(message)}\n\n`
  );
};

const arc = [
    '◒', '◒', '◐', '◐', '◓', '◓', '◑', '◑'
]

export const spinner = () => {
  let unblock: () => void;
  let loop: NodeJS.Timer;
  const frames = arc;
  const delay = 120;
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
        dot = i % 2 === 0 ? i / 2 : dot;
        process.stdout.write(cursor.move(-999, -1));
        process.stdout.write(
            `${color.magenta(frame)}  ${message}${dot > 0 ? '.'.repeat(dot).slice(0, 3) : ''}   \n`
        );
        i = i > frames.length - 2 ? 0 : i + 1;
      }, delay);
    },
    stop(message = "") {
      process.stdout.write(cursor.move(-999, -2));
      process.stdout.write(erase.down(2));
      clearInterval(loop);
      process.stdout.write(
        `${color.gray(bar)}\n${color.gray("○")}  ${message}\n`
      );
      unblock();
    },
  };
};

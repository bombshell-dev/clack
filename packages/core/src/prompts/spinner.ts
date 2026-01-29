import Prompt, { type PromptOptions } from './prompt.js';
import {settings} from '../utils/index.js';

const removeTrailingDots = (msg: string): string => {
	return msg.replace(/\.+$/, '');
};

export interface SpinnerOptions extends PromptOptions<undefined, SpinnerPrompt> {
	indicator?: 'dots' | 'timer';
	onCancel?: () => void;
	cancelMessage?: string;
	errorMessage?: string;
	frames: string[];
	delay: number;
	styleFrame?: (frame: string) => string;
}

export default class SpinnerPrompt extends Prompt<undefined> {
	#isCancelled = false;
	#isActive = false;
	#startTime: number = 0;
	#frameIndex: number = 0;
	#indicatorTimer: number = 0;
	#intervalId: ReturnType<typeof setInterval> | undefined;
	#delay: number;
	#frames: string[];
	#cancelMessage: string;
	#errorMessage: string;
	#onCancel?: () => void;
	#message: string = '';
	#silentExit: boolean = false;
	#exitCode: number | undefined = undefined;

	constructor(opts: SpinnerOptions) {
		super(opts);
		this.#delay = opts.delay;
		this.#frames = opts.frames;
		this.#cancelMessage = opts.cancelMessage ?? settings.messages.cancel;
		this.#errorMessage = opts.errorMessage ?? settings.messages.error;
		this.#onCancel = opts.onCancel;

		this.on('cancel', () => this.#onExit(1));
	}

	start(msg?: string): void {
		this.#isActive = true;
		this.#message = removeTrailingDots(msg ?? '');
		this.#startTime = performance.now();
		this.#frameIndex = 0;
		this.#indicatorTimer = 0;

		this.#intervalId = setInterval(() => this.#onInterval(), this.#delay);

		this.#addGlobalListeners();
	}

	stop(msg?: string, exitCode?: number, silent?: boolean): void {
		if (!this.#isActive) {
			return;
		}

		this.#isActive = false;
		this.#silentExit = silent === true;
		this.#exitCode = exitCode;

		if (msg !== undefined) {
			this.#message = msg;
		}

		if (this.#intervalId) {
			clearInterval(this.#intervalId);
			this.#intervalId = undefined;
		}

		this.#removeGlobalListeners();
		this.state = 'cancel';
		this.render();
		this.close();
	}

	get isCancelled(): boolean {
		return this.#isCancelled;
	}

	get message(): string {
		return this.#message;
	}

	set message(msg: string) {
		this.#message = removeTrailingDots(msg);
	}

	get exitCode(): number | undefined {
		return this.#exitCode;
	}

	get frameIndex(): number {
		return this.#frameIndex;
	}

	get indicatorTimer(): number {
		return this.#indicatorTimer;
	}

	get isActive(): boolean {
		return this.#isActive;
	}

	get silentExit(): boolean {
		return this.#silentExit;
	}

	getFormattedTimer(): string {
		const duration = (performance.now() - this.#startTime) / 1000;
		const min = Math.floor(duration / 60);
		const secs = Math.floor(duration % 60);
		return min > 0 ? `[${min}m ${secs}s]` : `[${secs}s]`;
	}

	#onInterval(): void {
		this.#frameIndex = this.#frameIndex + 1 < this.#frames.length ? this.#frameIndex + 1 : 0;
		// indicator increase by 1 every 8 frames
		this.#indicatorTimer = this.#indicatorTimer < 4 ? this.#indicatorTimer + 0.125 : 0;

		this.render();
	}

	#onProcessError: () => void = () => {
		this.#onExit(2);
	};

	#onProcessSignal: () => void = () => {
		this.#onExit(1);
	};

	#onExit: (exitCode: number) => void = (exitCode) => {
		this.#exitCode = exitCode;
		if (exitCode > 1) {
			this.#message = this.#errorMessage;
		} else {
			this.#message = this.#cancelMessage;
		}
		this.#isCancelled = exitCode === 1;
		if (this.#isActive) {
			this.stop(this.#message, exitCode);
			if (this.#isCancelled && this.#onCancel) {
				this.#onCancel();
			}
		}
	};

	#addGlobalListeners(): void {
		// Reference: https://nodejs.org/api/process.html#event-uncaughtexception
		process.on('uncaughtExceptionMonitor', this.#onProcessError);
		// Reference: https://nodejs.org/api/process.html#event-unhandledrejection
		process.on('unhandledRejection', this.#onProcessError);
		// Reference Signal Events: https://nodejs.org/api/process.html#signal-events
		process.on('SIGINT', this.#onProcessSignal);
		process.on('SIGTERM', this.#onProcessSignal);
		process.on('exit', this.#onExit);
	}

	#removeGlobalListeners(): void {
		process.removeListener('uncaughtExceptionMonitor', this.#onProcessError);
		process.removeListener('unhandledRejection', this.#onProcessError);
		process.removeListener('SIGINT', this.#onProcessSignal);
		process.removeListener('SIGTERM', this.#onProcessSignal);
		process.removeListener('exit', this.#onExit);
	}
}

import { randomUUID } from 'crypto';
import { cursor } from 'sisteransi';
import { mockPrompt, setGlobalAliases } from '../../src';
import Prompt, { PromptOptions } from '../../src/prompts/prompt';
import { MockReadable, MockWritable } from '../mocks';

const outputSpy = jest.spyOn(process.stdout, 'write').mockImplementation();

const makeSut = (opts?: Omit<PromptOptions<Prompt>, 'render'>, trackValue?: boolean) => {
	return new Prompt(
		{
			render() {
				return this.value;
			},
			...opts,
		},
		trackValue
	).prompt();
};

describe('Prompt', () => {
	let input: MockReadable;
	let output: MockWritable;
	const mock = mockPrompt();

	beforeEach(() => {
		input = new MockReadable();
		output = new MockWritable();
	});

	afterEach(() => {
		mock.close();
	});

	it('should set initialValue as value', () => {
		const value = randomUUID();

		makeSut({
			initialValue: value,
		});

		expect(mock.value).toBe(value);
	});

	it('should listen to event', () => {
		let counter = 0;
		makeSut();

		mock.on('value', () => {
			counter++;
		});
		for (let i = 0; i < 5; i++) {
			mock.emit('value', '');
		}

		expect(counter).toBe(5);
	});

	it('should listen to event just once', () => {
		let counter = 0;
		makeSut();

		mock.once('value', () => {
			counter++;
		});
		for (let i = 0; i < 5; i++) {
			mock.emit('value', '');
		}

		expect(counter).toBe(1);
	});

	it('should submit value', () => {
		const value = randomUUID();

		makeSut();
		mock.submit(value);

		expect(mock.state).toBe('submit');
		expect(mock.value).toBe(value);
	});

	it('should cancel prompt', () => {
		const value = randomUUID();

		makeSut();
		mock.cancel(value);

		expect(mock.state).toBe('cancel');
		expect(mock.value).toBe(value);
	});

	it('should validate value', () => {
		const value = randomUUID();
		const error = 'invalid value';

		makeSut({
			validate(value) {
				return error;
			},
		});
		mock.submit(value);

		expect(mock.state).toBe('error');
		expect(mock.value).toBe(value);
		expect(mock.error).toBe(error);
	});

	it('should set prompt state as `active` after error', () => {
		makeSut();

		mock.setState('error');
		mock.pressKey('', { name: '' });

		expect(mock.state).toBe('active');
	});

	it('should emit `cursor` on press key alias', (done) => {
		setGlobalAliases([['c', 'cancel']]);
		makeSut({}, false);

		mock.on('cursor', (key) => {
			key === 'cancel' ? done() : done(`invalid key received: ${key}`);
		});
		mock.pressKey('', { name: 'c' });
	});

	it('should emit `cursor` on press internal key alias', (done) => {
		makeSut();

		mock.on('cursor', (key) => {
			key === 'cancel' ? done() : done(`invalid key received: ${key}`);
		});
		mock.pressKey('', { name: 'cancel' });
	});

	it('should emit `confirm` on press y/n', () => {
		makeSut();
		let counter = 0;

		mock.on('confirm', (key) => {
			counter++;
		});
		mock.pressKey('y', { name: '' });
		mock.pressKey('n', { name: '' });

		expect(counter).toBe(2);
	});

	it('should allow tab completion for placeholders', () => {
		makeSut({ initialValue: '', placeholder: 'bar' });

		mock.pressKey('\t', { name: 'tab' });

		expect(mock.value).toBe('bar');
	});

	it('should not allow tab completion if value is set', () => {
		makeSut({ initialValue: 'foo', placeholder: 'bar' });

		mock.pressKey('\t', { name: 'tab' });

		expect(mock.value).toBe('foo');
	});

	it('should render prompt on default output', () => {
		mock.setIsTestMode(false);
		const value = randomUUID();

		makeSut({
			initialValue: value,
		});

		expect(outputSpy).toHaveBeenCalledWith(value);
	});

	test('should render prompt on custom output', () => {
		mock.setIsTestMode(false);
		const value = 'foo';

		makeSut({ input, output, initialValue: value });

		expect(output.buffer).toStrictEqual([cursor.hide, 'foo']);
	});

	it('should re-render prompt on resize', () => {
		const renderFn = jest.fn().mockImplementation(() => 'foo');
		const instance = new Prompt({
			input,
			output,
			render: renderFn,
		});
		instance.prompt();

		expect(renderFn).toHaveBeenCalledTimes(1);

		output.emit('resize');

		expect(renderFn).toHaveBeenCalledTimes(2);
	});

	it('should update single line', () => {
		mock.setIsTestMode(false);
		const value = randomUUID();
		const char = 't';

		makeSut({
			initialValue: value,
		});
		mock.on('key', (key) => {
			mock.setValue(mock.value + key);
		});
		mock.pressKey(char, { name: char });

		expect(mock.frame).toBe(value + char);
		expect(outputSpy).toHaveBeenCalledWith(value + char);
	});

	it('should update frame', () => {
		mock.setIsTestMode(false);
		const value = randomUUID();
		const newValue = 't\ng';

		makeSut({ initialValue: value });
		mock.setValue(newValue);
		mock.pressKey('', { name: '' });

		expect(mock.frame).toBe(newValue);
		expect(outputSpy).toHaveBeenCalledWith(value);
		expect(outputSpy).toHaveBeenCalledWith(newValue);
	});

	it('should emit cursor events for movement keys', () => {
		const keys = ['up', 'down', 'left', 'right'];
		const eventSpy = jest.fn();
		const instance = new Prompt({
			input,
			output,
			render: () => 'foo',
		});

		instance.on('cursor', eventSpy);

		instance.prompt();

		for (const key of keys) {
			input.emit('keypress', key, { name: key });
			expect(eventSpy).toBeCalledWith(key);
		}
	});

	it('should emit cursor events for movement key aliases when not tracking', () => {
		const keys = [
			['k', 'up'],
			['j', 'down'],
			['h', 'left'],
			['l', 'right'],
		];
		const eventSpy = jest.fn();
		const instance = new Prompt(
			{
				input,
				output,
				render: () => 'foo',
			},
			false
		);

		instance.on('cursor', eventSpy);

		instance.prompt();

		for (const [alias, key] of keys) {
			input.emit('keypress', alias, { name: alias });
			expect(eventSpy).toBeCalledWith(key);
		}
	});
});

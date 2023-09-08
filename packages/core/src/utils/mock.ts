import Prompt from '../prompts/prompt';

type MockResult = Prompt & {
	frame: string;
	cancel: (value?: any) => void;
	submit: (value?: any) => void;
	close: () => void;
};

export let isTestMode = false;

const _mockResult: Partial<MockResult> = {};

export function mockPrompt(): MockResult {
	isTestMode = true;
	return _mockResult as MockResult;
}

export function expose(params: Partial<MockResult>): void {
	Object.assign(_mockResult, params);
}

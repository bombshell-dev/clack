import Prompt from '../prompts/prompt';
import { ClackState } from '../types';

export type MockResult = Prompt & {
	frame: string;
	pressKey: (char: string, key: { name: string }) => void;
	setState: (state: ClackState) => void;
	setValue: (value: any) => void;
	setIsTestMode: (state: boolean) => void;
	cancel: (value?: any) => void;
	submit: (value?: any) => void;
	close: () => void;
};

export let isTestMode = false;

const _mockResult: Partial<MockResult> = {
	setIsTestMode(state) {
		isTestMode = state;
	},
};

export function mockPrompt(): MockResult {
	isTestMode = true;
	return _mockResult as MockResult;
}

export function exposeTestUtils(params: Partial<MockResult>): void {
	Object.assign(_mockResult, params);
}

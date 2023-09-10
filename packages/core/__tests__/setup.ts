jest.mock('wrap-ansi', () => ({
	__esModule: true,
	default: (str: string) => str,
}));

/**
 * `wrap-ansi` is an ES Module, and `jest` does not fully support it.
 *
 * Related Jest Issue:
 * 	title: Meta: Native support for ES Modules #9430
 * 	url: https://github.com/jestjs/jest/issues/9430
 **/
jest.mock('wrap-ansi', () => (str: string) => str);

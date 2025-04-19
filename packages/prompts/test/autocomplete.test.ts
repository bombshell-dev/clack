import { cursor } from 'sisteransi';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { AutocompletePrompt } from '@clack/core';
import { MockReadable } from './test-utils.js';
import { MockWritable } from './test-utils.js';

describe('AutocompletePrompt', () => {
  let input: MockReadable;
  let output: MockWritable;
  const testOptions = [
    { value: 'apple', label: 'Apple' },
    { value: 'banana', label: 'Banana' },
    { value: 'cherry', label: 'Cherry' },
    { value: 'grape', label: 'Grape' },
    { value: 'orange', label: 'Orange' }
  ];

  beforeEach(() => {
    input = new MockReadable();
    output = new MockWritable();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('renders render() result', () => {
    const instance = new AutocompletePrompt({
      input,
      output,
      render: () => 'foo',
      options: testOptions
    });
    instance.prompt();
    expect(output.buffer).to.deep.equal([cursor.hide, 'foo']);
  });

  test('initial options match provided options', () => {
    const instance = new AutocompletePrompt({
      input,
      output,
      render: () => 'foo',
      options: testOptions
    });

    instance.prompt();

    // Initial state should have all options
    expect(instance.filteredOptions.length).to.equal(testOptions.length);
    expect(instance.cursor).to.equal(0);
  });

  test('cursor navigation with event emitter', () => {
    const instance = new AutocompletePrompt({
      input,
      output,
      render: () => 'foo',
      options: testOptions
    });

    instance.prompt();

    // Initial cursor should be at 0
    expect(instance.cursor).to.equal(0);

    // Directly trigger the cursor event with 'down'
    instance.emit('cursor', 'down');

    // After down event, cursor should be 1
    expect(instance.cursor).to.equal(1);

    // Trigger cursor event with 'up'
    instance.emit('cursor', 'up');

    // After up event, cursor should be back to 0
    expect(instance.cursor).to.equal(0);
  });

  test('initialValue selects correct option', () => {
    const instance = new AutocompletePrompt({
      input,
      output,
      render: () => 'foo',
      options: testOptions,
      initialValue: 'cherry'
    });

    // The cursor should be initialized to the cherry index
    const cherryIndex = testOptions.findIndex(opt => opt.value === 'cherry');
    expect(instance.cursor).to.equal(cherryIndex);

    // The selectedValue should be cherry
    expect(instance.selectedValue).to.equal('cherry');
  });

  test('maxItems limits the number of options displayed', () => {
    // Create more test options
    const manyOptions = [
      ...testOptions,
      { value: 'kiwi', label: 'Kiwi' },
      { value: 'lemon', label: 'Lemon' },
      { value: 'mango', label: 'Mango' },
      { value: 'peach', label: 'Peach' }
    ];

    const instance = new AutocompletePrompt({
      input,
      output,
      render: () => 'foo',
      options: manyOptions,
      maxItems: 3
    });

    instance.prompt();

    // There should still be all options in the filteredOptions array
    expect(instance.filteredOptions.length).to.equal(manyOptions.length);

    // The maxItems property should be set correctly
    expect(instance.maxItems).to.equal(3);
  });

  test('filtering through value event', () => {
    const instance = new AutocompletePrompt({
      input,
      output,
      render: () => 'foo',
      options: testOptions
    });

    instance.prompt();

    // Initial state should have all options
    expect(instance.filteredOptions.length).to.equal(testOptions.length);

    // Simulate typing 'a' by emitting value event
    instance.emit('value', 'a');

    // Check that filtered options are updated to include options with 'a'
    expect(instance.filteredOptions.length).to.be.lessThan(testOptions.length);

    // Check that 'apple' is in the filtered options
    const hasApple = instance.filteredOptions.some(opt => opt.value === 'apple');
    expect(hasApple).to.equal(true);
  });

  test('default filter function works correctly', () => {
    const instance = new AutocompletePrompt({
      input,
      output,
      render: () => 'foo',
      options: testOptions
    });

    // Create a test function that uses the private method
    const testFilter = (input: string, option: any) => {
      // @ts-ignore - Access private method for testing
      return instance.defaultFilterFn(input, option);
    };

    // Call the test filter with an input
    const sampleOption = testOptions[0]; // 'apple'
    const result = testFilter('ap', sampleOption);

    // The filter should match 'apple' with 'ap'
    expect(result).to.equal(true);

    // Should not match with a non-existing substring
    const noMatch = testFilter('z', sampleOption);
    expect(noMatch).to.equal(false);
  });
}); 
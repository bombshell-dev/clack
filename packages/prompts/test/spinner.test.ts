import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { spinner, updatePromptsSettings } from '../src/index.js';
import { MockWritable } from '../../core/test/mock-writable.js';

describe('spinner', () => {
  let mockOutput: MockWritable;
  let processExitSpy: any;
  let processSignalEvents: Record<string, any> = {};
  let originalProcessOn: any;
  let originalProcessEmit: any;

  beforeEach(() => {
    mockOutput = new MockWritable();
    processExitSpy = vi.fn();
    
    // Store original event listeners
    processSignalEvents = {
      'SIGINT': process.listeners('SIGINT'),
      'SIGTERM': process.listeners('SIGTERM'),
      'exit': process.listeners('exit')
    };

    // Mock process.on and process.emit to handle uncaughtExceptionMonitor
    originalProcessOn = process.on;
    originalProcessEmit = process.emit;
    
    // @ts-ignore - Mock to override type constraint
    process.on = vi.fn((event, handler) => {
      return originalProcessOn.call(process, event, handler);
    });
    
    // @ts-ignore - Mock to override type constraint
    process.emit = vi.fn((event, ...args) => {
      return originalProcessEmit.call(process, event, ...args);
    });

    // Clear event listeners
    const events = ['SIGINT', 'SIGTERM', 'exit'];
    for (const event of events) {
      process.removeAllListeners(event);
    }

    // Mock process.exit
    vi.spyOn(process, 'exit').mockImplementation(processExitSpy as any);
  });

  afterEach(() => {
    // Restore original event listeners
    for (const [event, listeners] of Object.entries(processSignalEvents)) {
      process.removeAllListeners(event);
      for (const listener of (listeners as any[])) {
        process.on(event as any, listener);
      }
    }

    // Restore original process methods
    process.on = originalProcessOn;
    process.emit = originalProcessEmit;

    vi.restoreAllMocks();
  });

  it('should use default cancel message', () => {
    const s = spinner({ output: mockOutput });
    s.start('Test operation');
    
    // Simulate SIGINT (Ctrl+C)
    process.emit('SIGINT');
    
    expect(mockOutput.buffer.join('')).toContain('Canceled');
  });

  it('should use custom cancel message when provided directly to spinner', () => {
    const s = spinner({ 
      output: mockOutput,
      cancelMessage: 'Custom cancel message'
    });
    s.start('Test operation');
    
    // Simulate SIGINT (Ctrl+C)
    process.emit('SIGINT');
    
    expect(mockOutput.buffer.join('')).toContain('Custom cancel message');
  });

  it('should use custom error message when provided directly to spinner', () => {
    const s = spinner({ 
      output: mockOutput,
      errorMessage: 'Custom error message'
    });
    s.start('Test operation');
    
    // Simulate error by triggering exit with code 2
    process.emit('exit', 2);
    
    expect(mockOutput.buffer.join('')).toContain('Custom error message');
  });

  it('should use global custom cancel message when set through updatePromptsSettings', () => {
    updatePromptsSettings({
      messages: {
        cancel: 'Global cancel message'
      }
    });
    
    const s = spinner({ output: mockOutput });
    s.start('Test operation');
    
    // Simulate SIGINT (Ctrl+C)
    process.emit('SIGINT');
    
    expect(mockOutput.buffer.join('')).toContain('Global cancel message');
    
    // Reset to default for other tests
    updatePromptsSettings({
      messages: {
        cancel: 'Canceled'
      }
    });
  });

  it('should use global custom error message when set through updatePromptsSettings', () => {
    updatePromptsSettings({
      messages: {
        error: 'Global error message'
      }
    });
    
    const s = spinner({ output: mockOutput });
    s.start('Test operation');
    
    // Simulate error by triggering exit with code 2
    process.emit('exit', 2);
    
    expect(mockOutput.buffer.join('')).toContain('Global error message');
    
    // Reset to default for other tests
    updatePromptsSettings({
      messages: {
        error: 'Something went wrong'
      }
    });
  });

  it('should prioritize direct spinner options over global settings', () => {
    updatePromptsSettings({
      messages: {
        cancel: 'Global cancel message',
        error: 'Global error message'
      }
    });
    
    const s = spinner({ 
      output: mockOutput,
      cancelMessage: 'Spinner cancel message',
      errorMessage: 'Spinner error message'
    });
    s.start('Test operation');
    
    // Test cancel message
    process.emit('SIGINT');
    expect(mockOutput.buffer.join('')).toContain('Spinner cancel message');
    
    // Reset buffer
    mockOutput.buffer = [];
    
    // Create new spinner
    const s2 = spinner({ 
      output: mockOutput,
      cancelMessage: 'Spinner cancel message',
      errorMessage: 'Spinner error message'
    });
    s2.start('Test operation');
    
    // Test error message
    process.emit('exit', 2);
    expect(mockOutput.buffer.join('')).toContain('Spinner error message');
    
    // Reset to defaults for other tests
    updatePromptsSettings({
      messages: {
        cancel: 'Canceled',
        error: 'Something went wrong'
      }
    });
  });
}); 
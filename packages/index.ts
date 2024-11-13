import * as p from './prompts/src'

p.group({
    type: ({ results }) =>
      p.search({
        message: 'Search for a programming language',
        initialValue: 'ts',
        placeholder:'filter...',
        maxItems: 5,
        options: [
          { value: 'ts', label: 'TypeScript' },
          { value: 'js', label: 'JavaScript' },
          { value: 'rust', label: 'Rust' },
          { value: 'go', label: 'Go' },
          { value: 'python', label: 'Python' },
          { value: 'coffee', label: 'CoffeeScript', hint: 'oh no' },
        ],
      })
})

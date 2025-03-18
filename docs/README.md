# Clack Documentation

This directory contains the documentation for Clack, a modern, accessible command-line interface builder for Node.js.

## Contributing

To contribute to the documentation:

1. Fork the repository
2. Make your changes
3. Submit a pull request

### Adding New Pages

To add a new page to the documentation:

1. Create a new Markdown file in the appropriate language directory (e.g., `en/`)
2. Add frontmatter with `title` and `description`
3. Update `config.json` to include the new page in the sidebar

Example frontmatter:

```md
---
title: My New Page
description: Description of my new page
---

# My New Page

Content goes here...
```

### Editing Existing Pages

To edit an existing page:

1. Find the page in the appropriate language directory
2. Make your changes
3. Submit a pull request

## Integration with bomb.sh

This documentation is designed to be integrated with the bomb.sh website. The content in this directory will be pulled into the `/docs/clack/` route in the bomb.sh repository.

## Local Development

To preview the documentation locally, you'll need to clone the bomb.sh repository and set up the integration. Follow these steps:

1. Clone the bomb.sh repository
2. Set up the integration to pull in this documentation
3. Run the development server

See the bomb.sh repository for more detailed instructions on local development.

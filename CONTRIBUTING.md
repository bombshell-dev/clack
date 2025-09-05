# Contributing to Clack

Thank you for your interest in contributing to Clack! This document provides detailed instructions for setting up your development environment, navigating the codebase, making changes, and submitting contributions.

> [!Tip]
> **For new contributors:** Take a look at [https://github.com/firstcontributions/first-contributions](https://github.com/firstcontributions/first-contributions) for helpful information on contributing to open source projects.

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version specified in `.nvmrc`, currently v20.18.1)
- [pnpm](https://pnpm.io/) (version 9.14.2 or higher)

If you use [volta](https://volta.sh/) or [nvm](https://github.com/nvm-sh/nvm), the correct Node.js version will be automatically selected based on the project's `.nvmrc` file.

### Local Development Setup

1. **Fork the repository**:
   - Visit [https://github.com/bombshell-dev/clack](https://github.com/bombshell-dev/clack)
   - Click the "Fork" button in the top right
   - Clone your fork to your local machine

   ```bash
   git clone https://github.com/YOUR_USERNAME/clack.git
   cd clack
   ```

2. **Set up the upstream remote**:
   ```bash
   git remote add upstream https://github.com/bombshell-dev/clack.git
   ```

3. **Install dependencies**:
   ```bash
   pnpm install
   ```

4. **Build the packages**:
   ```bash
   pnpm build
   ```

5. **Run the development server**:
   ```bash
   pnpm dev
   ```

### Using Clack Packages in Your Own Projects During Development

If you want to test changes to Clack packages in your own project, you can use pnpm's linking capabilities:

1. **Build the Clack packages locally first**:
   ```bash
   # In the clack repository
   cd /path/to/clack
   pnpm build
   ```

2. **Link the packages to your project using one of these methods**:

   **Method 1: Using pnpm link**
   ```bash
   # In your project
   cd /path/to/your-project
   
   # Link @clack/core
   pnpm link --global /path/to/clack/packages/core
   
   # Link @clack/prompts
   pnpm link --global /path/to/clack/packages/prompts
   ```

   **Method 2: Using local path in package.json**
   
   In your project's package.json, reference the local paths:
   ```json
   {
     "dependencies": {
       "@clack/core": "file:/path/to/clack/packages/core",
       "@clack/prompts": "file:/path/to/clack/packages/prompts"
     }
   }
   ```
   Then run `pnpm install` in your project.

3. **Watch for changes** (optional):
   ```bash
   # In the clack repository
   cd /path/to/clack
   pnpm build --watch
   ```

4. **Refresh after changes**:
   If you're making changes to Clack while testing in your project, you'll need to rebuild Clack and potentially reinstall in your project:
   ```bash
   # In the clack repository
   cd /path/to/clack
   pnpm build
   
   # In your project (if using Method 2)
   cd /path/to/your-project
   pnpm install
   ```

With this setup, you can develop and test your changes to Clack within the context of your own project. This is especially useful for implementing new features like filtering.

## Repository Structure

Clack is organized as a monorepo using pnpm workspaces. Understanding the structure will help you navigate and contribute effectively:

```
clack/
├── .changeset/         # Changeset files for versioning
├── .github/            # GitHub workflows and templates
├── examples/           # Example implementations of Clack
├── packages/           # Core packages
│   ├── core/           # Unstyled primitives (@clack/core)
│   └── prompts/        # Ready-to-use components (@clack/prompts)
├── biome.json          # Biome configuration
├── package.json        # Root package.json
├── pnpm-workspace.yaml # Workspace configuration
└── tsconfig.json       # TypeScript configuration
```

### Key Packages

1. **@clack/core** (`packages/core/`): 
   - Contains the unstyled, extensible primitives for building CLI applications
   - The foundation layer that provides the core functionality

2. **@clack/prompts** (`packages/prompts/`): 
   - Built on top of @clack/core
   - Provides beautiful, ready-to-use CLI prompt components
   - What most users will interact with directly

### Examples

The `examples/` directory contains sample projects that demonstrate how to use Clack. Examining these examples is a great way to understand how the library works in practice.

## Development Workflow

### Common Commands

- **Build all packages**: 
  ```bash
  pnpm build
  ```

- **Start development environment**:
  ```bash
  pnpm dev
  ```

- **Run tests**:
  ```bash
  pnpm test
  ```

- **Lint code**:
  ```bash
  pnpm lint
  ```

- **Format code**:
  ```bash
  pnpm format
  ```

- **Type check**:
  ```bash
  pnpm run types
  ```

- **Build stubbed packages** (for faster development):
  ```bash
  pnpm stub
  ```

### Making Changes

1. **Create a new branch**:
   ```bash
   git checkout -b my-feature-branch
   ```

2. **Implement your changes**:
   - For bug fixes, start by reproducing the issue
   - For new features, consider how it fits into the existing architecture
   - Maintain type safety with TypeScript
   - Add or update tests as necessary

3. **Run local verification**:
   ```bash
   # Ensure everything builds
   pnpm build
   
   # Check formatting and lint issues
   pnpm format
   pnpm lint
   
   # Verify type correctness
   pnpm types
   
   # Run tests
   pnpm test
   ```

4. **Create a changeset** (for changes that need versioning):
   ```bash
   pnpm changeset
   ```
   - Follow the prompts to select which packages have changed
   - Choose the appropriate semver increment (patch, minor, major)
   - Write a concise but descriptive message explaining the changes

### Testing Your Changes

For testing changes to the core functionality:

1. **Use the examples**:
   ```bash
   # Run an example to test your changes
   pnpm --filter @example/changesets run start
   ```

2. **Create a test-specific example** (if needed):
   - Add a new directory in the `examples/` folder
   - Implement a minimal reproduction that uses your new feature/fix
   - Run it with `pnpm --filter @example/your-example run start`

### Debugging Tips

When encountering issues during development:

1. **Check for errors in the console** - Clack will often output helpful error messages
2. **Review the API documentation** - Ensure you're using components and functions as intended
3. **Look at existing examples** - See how similar features are implemented
4. **Inspect the packages individually** - Sometimes issues are isolated to either `core` or `prompts`

## Pull Request Process

1. **Commit your changes**:
   ```bash
   git add .
   git commit -m "feat: add new awesome feature"
   ```

2. **Push to your fork**:
   ```bash
   git push origin my-feature-branch
   ```

3. **Create a pull request**:
   - Go to your fork on GitHub
   - Click "New pull request"
   - Select your branch and add a descriptive title
   - Fill in the PR template with details about your changes
   - Reference any related issues

4. **Wait for the automated checks**:
   - GitHub Actions will run tests, type checking, and lint validation
   - Fix any issues that arise

5. **Address review feedback**:
   - Make requested changes
   - Push additional commits to your branch
   - The PR will update automatically

### PR Previews

Clack uses [pkg.pr.new](https://pkg.pr.new) (provided by [bolt.new](https://bolt.new)) to create continuous preview releases of all PRs. This simplifies testing and makes verifying bug fixes easier for our dependents. 

The workflow that builds a preview version and adds instructions for installation as a comment on your PR should run automatically if you have contributed to Clack before. First-time contributors may need to wait until a maintainer manually approves GitHub Actions running on your PR.

## Release Process

Clack uses [Changesets](https://github.com/changesets/changesets) to manage versions and releases.

1. **For contributors**:
   - Create a changeset file with your PR as described above
   - Maintainers will handle the actual release process

2. **For maintainers**:
   - Merging PRs with changesets will queue them for the next release
   - When ready to release, merge the `[ci] release` PR

### Backporting to v0 Branch

Clack maintains a stable `v0` branch alongside the main development branch. For maintainers who need to backport changes:

1. Label PRs that should be backported with the `backport` label
2. After the PR is merged to `main`, manually cherry-pick the squashed commit into the `v0` branch:
   ```bash
   # Ensure you have the latest v0 branch
   git checkout v0
   git pull upstream v0
   
   # Cherry-pick the squashed commit from main
   git cherry-pick <commit-hash>
   
   # Push the changes
   git push upstream v0
   ```
3. CI is configured to run changesets from the `v0` branch, so release PRs will be opened automatically

The GitHub Actions are configured to cut releases from both the `main` and `v0` branches.

## Filing Issues

When reporting bugs or requesting features:

1. **Check existing issues** to avoid duplicates
2. **Use the issue templates** to provide all necessary information
3. **Be specific and clear** about what's happening and what you expect
4. **Provide reproduction steps** - ideally a minimal example that demonstrates the issue
5. **Include environment details** like OS, Node.js version, etc.

### Issue Types

When opening an issue, consider which category it falls into:

- **Bug Report**: Something isn't working as documented or expected
- **Feature Request**: A suggestion for new functionality
- **Documentation Issue**: Improvements or corrections to documentation
- **Performance Issue**: Problems with speed or resource usage

## Style Guide

We use [Biome](https://biomejs.dev/) for linting and formatting. Your code should follow these standards:

```bash
# To check formatting
pnpm format

# To lint and fix issues automatically where possible
pnpm lint
```

The project follows standard TypeScript practices. If you're new to TypeScript:
- Use precise types whenever possible
- Avoid `any` unless absolutely necessary
- Look at existing code for patterns to follow

### Commit Message Format

We follow conventional commits for commit messages:

- `feat:` - A new feature
- `fix:` - A bug fix
- `docs:` - Documentation changes
- `style:` - Changes that don't affect code functionality (formatting, etc)
- `refactor:` - Code changes that neither fix bugs nor add features
- `perf:` - Performance improvements
- `test:` - Adding or correcting tests
- `chore:` - Changes to the build process, tools, etc

## License

By contributing, you agree that your contributions will be licensed under the project's MIT License.

Thank you for taking the time to contribute to Clack! Feel free to join our community Discord at [bomb.sh/chat](https://bomb.sh/chat). It's a great place to connect with other project contributors—we're chill!

## Acknowledgments

This contributing guide was inspired by and adapted from the [Astro Contributing Manual](https://github.com/withastro/astro/blob/main/CONTRIBUTING.md). We appreciate their excellent documentation and open source practices.

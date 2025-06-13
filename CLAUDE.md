# MCP Make Sound - Development Guide

## Code Quality Standards

This project uses ESLint for code quality and Vitest for testing.

### Before Any Push to GitHub

**ALWAYS run these commands before pushing changes:**

```bash
npm run lint        # Check for code style issues
npm run test:run    # Run all unit tests
```

Fix any linting errors or test failures before proceeding with git operations.

### Available Commands

#### Code Quality
- `npm run lint` - Check code style and errors
- `npm run lint:fix` - Auto-fix linting issues where possible

#### Testing
- `npm run test` - Run tests in watch mode (for development)
- `npm run test:run` - Run all tests once (for CI/validation)
- `npm run test:ui` - Run tests with interactive UI

#### Development
- `npm run build` - Compile TypeScript
- `npm run start` - Run the MCP server
- `npm run dev` - Development mode with auto-reload
- `npm run kill` - Stop all running MCP server instances

## Project Structure

```
src/
├── index.ts              # Main MCP server implementation
└── __tests__/            # Unit tests
    └── sound.test.ts     # Sound system tests
```

## Testing Guidelines

- All core functionality should have unit tests
- Tests use Vitest with mocked system calls (no actual sounds during testing)
- Tests validate input validation, error handling, and command generation
- Coverage includes system sounds, TTS, file playback, and edge cases

## Linting Rules

- TypeScript strict mode enabled
- Explicit function return types required
- No `any` types allowed (use proper TypeScript types)
- No unused variables
- Follows ES2022+ standards

## Workflow

1. Make changes to code
2. Run `npm run lint` and fix any issues
3. Run `npm run test:run` and ensure all tests pass
4. Commit changes
5. Push to GitHub

This ensures code quality and prevents breaking changes from being merged.
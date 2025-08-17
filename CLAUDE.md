# TABSH Project Guidelines

## Build & Run Commands
- Start the server: `npm start` or `node server.js`
- Run the application in browser: http://localhost:3000
- DO NOT restart the server after making code changes - the Express server serves static files, so changes to JS files are picked up when the browser refreshes
- No tests are currently configured in the project

## Development Workflow
- When given an issue or requirement, implement the change without prompting for approval
- Write a test case for each change, including in-browser tests where applicable
- Run the test to verify the solution works correctly
- Report back with: what was changed, what was tested, and the test results
- If a test fails, summarize the next approach and ask if you want to proceed

## Code Style Guidelines

### Architecture
- Frontend: Vanilla JavaScript with ES6 modules
- Backend: Express.js server for asset serving and config management

### JavaScript Conventions
- Use ES6 module imports/exports (`import/export` syntax)
- Camel case for variables, functions, methods: `camelCase`
- Pascal case for classes: `PascalCase`
- Use `const` for constants, `let` for variables that change
- Use optional chaining (`?.`) for nullable object properties
- Prefer async/await over raw promises where applicable

### Error Handling
- Use try/catch blocks for async operations
- Log errors to console with descriptive messages
- Show user-friendly error messages via alerts when appropriate
- Check for element existence before DOM operations with optional chaining

### Project Organization
- Game logic in `/js` directory
- Configuration files in `/config` directory
- Assets in `/assets` directory
- Styles in `/css` directory
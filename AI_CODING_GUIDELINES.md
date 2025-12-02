# AI Coding Guidelines

This document outlines the principles and standards that AI assistants should follow when generating code for this project.

## 1. General Principles

- **Safety First**: Never generate code that introduces security vulnerabilities (e.g., SQL injection, XSS, hardcoded secrets).
- **Readability**: Code should be self-documenting. Use meaningful variable and function names.
- **Consistency**: Follow the existing project structure and coding style (ESLint/Prettier).
- **Modularity**: Break down complex logic into smaller, reusable functions or services.

## 2. Node.js & Express Best Practices

- **Async/Await**: Always use `async/await` over callbacks or raw promises.
- **Error Handling**:
  - Use the `asyncHandler` wrapper for all async route handlers.
  - Throw `ApiError` for known operational errors.
  - Never swallow errors silently.
- **Layered Architecture**:
  - **Controllers**: Handle HTTP requests/responses only.
  - **Services**: Contain business logic.
  - **Models**: Handle data access.
  - **Utils**: Pure utility functions.
- **Configuration**: Use `src/config/index.js` for all configuration values. Never hardcode magic numbers or strings.

## 3. Code Style

- **Naming**:
  - Variables/Functions: `camelCase`
  - Classes/Models: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
  - Files: `camelCase.js`
- **Comments**:
  - Use JSDoc for functions and classes.
  - Explain "why", not "what" for complex logic.

## 4. Testing & Verification

- **Validation**: Validate all inputs using libraries (e.g., Joi, express-validator) or manual checks before processing.
- **Edge Cases**: Consider and handle edge cases (e.g., empty arrays, missing fields).

## 5. Documentation

- **Swagger**: Add Swagger/OpenAPI annotations to all new routes.
- **README**: Update the README if adding new features or scripts.

## Example Pattern

```javascript
// Controller
exports.getItem = asyncHandler(async (req, res) => {
  const item = await itemService.getItemById(req.params.id);
  res.json({ success: true, data: item });
});

// Service
class ItemService {
  async getItemById(id) {
    const item = await db.findById(id);
    if (!item) throw new ApiError('Item not found', 404);
    return item;
  }
}
```

# Contributing to Lobster Dashboard

Thank you for your interest in contributing! 🦞

## How to Contribute

### Reporting Bugs

- Check if the bug has already been reported in [Issues](https://github.com/abczsl520/lobster-dashboard/issues)
- Use the bug report template
- Include steps to reproduce, expected behavior, and actual behavior
- Add screenshots or logs if applicable

### Suggesting Features

- Check if the feature has already been requested
- Use the feature request template
- Explain the use case and why it would be valuable
- Consider implementation complexity

### Pull Requests

1. **Fork the repository** and create a new branch from `main`
2. **Make your changes** following the code style guidelines
3. **Test your changes** thoroughly
4. **Update documentation** if needed (README, comments, etc.)
5. **Commit with clear messages** (see commit guidelines below)
6. **Submit a pull request** with a clear description

## Development Setup

```bash
git clone https://github.com/YOUR_USERNAME/lobster-dashboard.git
cd lobster-dashboard
npm install
cp config.example.json config.json
# Edit config.json with test credentials
npm start
```

## Code Style Guidelines

- **JavaScript**: Use ES6+ features, avoid `var`, prefer `const` over `let`
- **Indentation**: 2 spaces (no tabs)
- **Naming**: camelCase for variables/functions, PascalCase for classes
- **Comments**: Explain *why*, not *what* (code should be self-documenting)
- **Security**: Always sanitize user input, use timing-safe comparisons for secrets

## Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) format:

```
<type>(<scope>): <subject>

<body>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, no logic change)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

**Examples:**
```
feat(topology): add node clustering for large sessions
fix(auth): prevent timing attack on password comparison
docs(readme): add deployment guide for Docker
```

## Testing

Before submitting a PR:

1. **Syntax check**: `node -c server.js services/*.js`
2. **Manual testing**: Start the server and verify your changes work
3. **Security check**: Run `npm audit` and address any vulnerabilities
4. **XSS check**: Verify all user input is sanitized before rendering

## Security

If you discover a security vulnerability, please **do not** open a public issue.

Instead, email the maintainers directly or use GitHub's private security advisory feature.

## Code of Conduct

Be respectful, inclusive, and constructive. See [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md) for details.

## Questions?

Open a [Discussion](https://github.com/abczsl520/lobster-dashboard/discussions) or reach out to the maintainers.

---

Thank you for contributing! 🦞✨

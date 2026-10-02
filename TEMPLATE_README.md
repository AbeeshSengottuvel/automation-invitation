# Automation Arena - Player Template

Welcome to the Arena. This template contains the minimal structure required for the GitHub Actions scorer to find and run your test framework.

## Rules
1. Your repository must be public by the deadline.
2. The OrangeHRM demo site is shared. Use unique data when possible.
3. No hardcoded sleeps (`Thread.Sleep`, `cy.wait(5000)`, etc.). Use explicit waits.
4. Any tool, language, or design pattern is allowed.

## Scaffolding Requirements

For the scorer to analyze your pipeline, you must ensure that your tests can be run with a single command. Depending on your stack, include one of the following files at the root of your repository:

- **Node.js**: `package.json` with a `test` script (e.g. `npm test`)
- **Python**: `requirements.txt` and a `pytest` configuration
- **Java**: `pom.xml` (Maven) or `build.gradle` (Gradle)
- **.NET**: A `.csproj` or `.sln` file

## Power-ups
The scorer scans your repository for advanced features. To get bonus points, include things like:
- A CI/CD workflow file in `.github/workflows/`
- A `Dockerfile`
- Configuration files for Allure, Lighthouse, or Axe-core
- A distinct Page Object Model structure (e.g. `pages/` and `tests/` folders)

## Submission
Once your tests are passing locally and pushed to GitHub, send the link of your repository to the Organizer. The arena scoreboard updates every 30 minutes.

Good luck!

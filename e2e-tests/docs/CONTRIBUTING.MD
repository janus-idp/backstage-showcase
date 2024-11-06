# Contributing

We are excited that you want to be a part of this project by contributing to the end-to-end tests. Here is some information on how to get started, as well as our requirements and guidelines to ensure a smooth contribution process.

## Getting Started

### Clone and Install

1. **Fork the Repository**

   Click the "Fork" button at the top right corner of the repository page.

2. **Clone Your Forked Repository**

   ```bash
   git clone https://github.com/your-username/backstage-showcase.git
   ```

3. **Navigate to the Project Directory**

   ```bash
   cd e2e-tests
   ```

4. **Install Dependencies**

   We use **Yarn** for package management. If you don't have Yarn installed, you can install it globally:

   ```bash
   npm install -g yarn
   ```

   Then install the project dependencies:

   ```bash
   yarn install
   ```

5. **Install Playwright Browsers**

   The Playwright browsers will be installed automatically via the `postinstall` script in `package.json`. If not, you can manually install them:

   ```bash
   yarn playwright install
   ```

6. **Run TypeScript Compilation**

   Run type generation and checks:

   ```bash
   yarn tsc
   ```

### Running the Tests

Our project contains multiple test suites for different environments and configurations. Some useful scripts to run the tests:

```bash
yarn showcase                       # Runs the showcase test suite
yarn showcase-rbac                  # Runs the showcase RBAC test suite
yarn showcase-1-2-x                 # Runs the showcase 1.2.x test suite
yarn showcase-rbac-1-2-x            # Runs the showcase RBAC 1.2.x test suite
yarn showcase-ci-nightly            # Runs the showcase CI nightly test suite
yarn showcase-rbac-nightly          # Runs the showcase RBAC nightly test suite
yarn showcase-aks-ci-nightly        # Runs the showcase AKS CI nightly test suite
yarn showcase-rbac-aks-ci-nightly   # Runs the showcase RBAC AKS CI nightly test suite
```

### Useful Scripts

Some additional scripts available in `package.json`:

- **Linting:**

  ```bash
  yarn lint:check    # Checks for linting errors
  yarn lint:fix      # Fixes linting errors automatically
  ```

- **Formatting:**

  ```bash
  yarn prettier:check   # Checks for formatting issues
  yarn prettier:fix     # Fixes formatting issues automatically
  ```

## Contribution Guidelines

We welcome both code and non-code contributions to our project. Non-code contributions can come in the form of documentation updates, enhancement requests, and new test requests.

### Developer Guidelines

Those principles are valid for new contributions. Some part of the codebase may not adhere yet to the principles yet, but improvements shall be done in that direction.

#### Architectural Principles

1. **Naming Convention**

   A naming convention is enforced for all entities, including variables, functions, and file names. Consistent naming ensures code clarity, maintainability, and ease of navigation throughout the project.

2. **Code Visibility**

   Carefully consider the visibility of all classes, variables, and functions. Exposed elements should be simple and understandable on the frontend while being versatile and resilient in the background. This promotes a clean and user-friendly API while maintaining robust internal functionality.

3. **Test Isolation**

   All tests should be written to be as isolated as possible. Even if current constraints (such as GitHub login rate limits) prevent complete independence, strive for maximum isolation. This approach ensures that when blockers are removed, refactoring can proceed smoothly.

4. **Control Over Test Environment**

   The test framework must have full control over the test environment. All environment configurations should be managed and propagated up to the Playwright layer. This ensures consistency and reliability across all tests.

5. **Team Agreement on Architecture Principles**

   All architecture principles and guidelines must be agreed upon by the team. Every team member's voice is important, and open communication ensures alignment and shared understanding of the project's direction.

#### Technical Guidelines

1. **Page Object Model (POM)**

   The Page Object Model (POM) design pattern is required for all test code. Until we find a better-suited standard, we adhere to this well-known and well-tested pattern to promote code reusability and maintainability.

2. **Playwright Best Practices**

   We follow Playwright best practices, including the use of fixtures. Adhering to these practices ensures that our tests are reliable, efficient, and maintainable. Please refer to the [Playwright Best Practices](https://playwright.dev/docs/best-practices) and [Fixtures](https://playwright.dev/docs/test-fixtures) documentation for guidance.

3. **Avoid Using `uiHelper` in Spec Files**

   - The `uiHelper` utility should **never** be used directly in spec files.
   - Use `uiHelper` methods only within the Page Object Model (POM) classes.
   - When working with tests that directly use `uiHelper` in spec files, refactor them to move `uiHelper` usage into POM classes.
   - This ensures that all UI interactions are encapsulated within page objects, promoting cleaner and more maintainable test code.

4. **Use External Sources for Validation**

   - **Avoid Hardcoded Data in Tests**

     - When validating frontend results in your end-to-end tests, use external sources of truth such as APIs or databases instead of hardcoded information.
     - This approach ensures that tests are more robust and accurately reflect the dynamic nature of the application data.

### Adding New Tests

When contributing with new tests or modifying existing ones, please adhere to the guidelines.

### Pull Requests

If you want to contribute code changes to the project, here are some guidelines:

1. **Create a Branch**

   ```bash
   git checkout -b e2e/your-test-name
   ```

2. **Implement Your Changes**

   Make your code changes, ensuring that you follow the project's coding standards and best practices outlined in the [Developer Guidelines](#developer-guidelines).

3. **Testing**

   - **Run Tests:** Ensure all tests pass before committing.

     ```bash
     yarn showcase
     ```

   - **Note on Environment Dependencies:**

     - If your new or edited tests **can't be validated locally** due to environment dependencies, you can open a **draft Pull Request (PR)**. This allows the tests to run on the test environment as described in [CI.md](./CI.md).

4. **Linting and Formatting**

   Ensure your code passes linting and formatting checks.

   - **Check Linting:**

     ```bash
     yarn lint:check
     ```

   - **Fix Linting Issues:**

     ```bash
     yarn lint:fix
     ```

   - **Check Formatting:**

     ```bash
     yarn prettier:check
     ```

   - **Fix Formatting Issues:**

     ```bash
     yarn prettier:fix
     ```

5. **Ensure CI Passes**

   Your contributions will need to pass the Continuous Integration (CI) tests for pull requests. For more information, refer to [./CI.md](./CI.md).

6. **Commit Changes**

   Use meaningful commit messages following the [Conventional Commits](https://www.conventionalcommits.org/) specification.

   ```bash
   git commit -m "test: add new test"
   ```

7. **Push to Your Fork**

   ```bash
   git push origin e2e/your-test-name
   ```

8. **Open a Pull Request**

   Go to the original repository and click on **New Pull Request**. Provide a clear description of your changes, including any issues your PR fixes, acceptance criteria, and any special notes to the reviewers.

### Commit Messages

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

- `docs`: Documentation changes.
- `style`: Code style changes (formatting, missing semi-colons, etc.).
- `refactor`: Code changes that neither fix a bug nor add a feature.
- `test`: Adding or correcting tests.
- `chore`: Changes to the build process or auxiliary tools.

### Collaboration and Communication

- **Team Consensus:**

  - Engage with the team when introducing significant changes. Ensure that architectural decisions are agreed upon collectively.

- **Open Communication:**

  - Encourage discussion and feedback. All voices are important in shaping the project's direction.

## Support

If you have any questions or need assistance, feel free to open an issue or contact the maintainers. We appreciate your efforts and look forward to your contributions!

You can also reach out to us in our [community Slack channel](https://join.slack.com/t/janus-idp/shared_invite/zt-1pxtehxom-fCFtF9rRe3vFqUiFFeAkmg) if you run into any issues with setup, running, or testing the application. Members of the team and community can assist you with questions and concerns you might have.

## License

By contributing, you agree that your contributions will be licensed under the [Apache-2.0 License](https://github.com/janus-idp/backstage-showcase/blob/main/LICENSE).

---

Janus-IDP follows the [CNCF Code of Conduct](https://github.com/cncf/foundation/blob/main/code-of-conduct.md).

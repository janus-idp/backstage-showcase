# RHDH Repo Context

High-level orientation for agents working in this repo. Detailed knowledge lives in `docs/agents/knowledge/` — do not add it here.

## What this repo is

Red Hat Developer Hub (RHDH): Red Hat's supported distribution of Backstage. Yarn monorepo (`packages/*`, `plugins/*`), with E2E tests in `e2e-tests/` and dynamic plugin wrappers in `dynamic-plugins/`.

## Knowledge index

| Topic | File |
|---|---|
| E2E testing (framework, CI/CD infra, config maps) | `docs/agents/knowledge/e2e-testing.md` |
| E2E coverage instrumented imports | `docs/agents/knowledge/e2e-coverage-imports.md` |
| E2E test fix workflow | `docs/agents/knowledge/e2e-fix-workflow.md` |
| Extensions catalog plugin metadata | `docs/agents/knowledge/plugin-metadata-workflow.md` |
| GitHub Workflows security | `docs/agents/knowledge/github-workflows-security.md` |
| Playwright locator best practices | `docs/agents/knowledge/playwright-locators.md` |

## Conventions

- New detailed knowledge gets its own file in `docs/agents/knowledge/` (or a topical subdirectory), listed in the index above. `CONTEXT.md` stays high-level.
- Domain vocabulary: `GLOSSARY.md` (see `docs/agents/domain.md`). Decisions: `docs/adr/`.
- Skills and agent workflows: `.agents/skills/`. Agent config: `AGENTS.md` + `docs/agents/`.
- No vendored dotfile directories for AI harnesses — see `AGENTS.md`.

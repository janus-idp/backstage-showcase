## Agent skills

### Issue tracker

Jira (RHIDP) is the source of truth; fullsend drives agentic execution on GitHub PRs. See `docs/agents/issue-tracker.md`.

### Triage labels

Canonical five, applied as Jira labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: `GLOSSARY.md` + `docs/adr/` at repo root. See `docs/agents/domain.md`.

### Repo knowledge

`CONTEXT.md` at repo root holds consolidated repo knowledge (E2E testing, CI/CD, security practices). Skills live in `.agents/skills/` (Agent Skills open standard).

### No harness dotfiles

Do not create vendored dotfile directories for AI harnesses (`.claude/`, `.cursor/`, `.opencode/`, `.github/copilot-instructions.md`, config files like `.pr_agent.toml`, etc.) or add tooling to synchronize them. Shared knowledge goes in `CONTEXT.md`; skills and commands go in `.agents/skills/`; pointers live in this file. The only agent-facing entry points are `AGENTS.md`, `.agents/`, and `CONTEXT.md`.

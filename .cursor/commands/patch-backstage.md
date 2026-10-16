---
description: Backport Backstage fixes into an RHDH release line with Yarn patches via the rhdh-patch-backstage skill in redhat-developer/rhdh-skills.
---
# Patch Backstage

This command delegates to the **rhdh-patch-backstage** skill maintained in the
[rhdh-skills](https://github.com/redhat-developer/rhdh-skills/tree/main/skills/ci/rhdh-patch-backstage)
repository.

## Agent Behavior

1. **Check if the skill is already installed.** Look for a skill named
   `rhdh-patch-backstage` in the available skills list.
2. **If installed**, invoke it immediately with the user's request.
3. **If not installed**, guide the user through setup
   (`npx skills add redhat-developer/rhdh-skills --global` or
   `/setup-rhdh-skills`), then invoke the skill.

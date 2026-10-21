# RHDH Repo Context

Shared knowledge for agents working in this repo. Consolidated from the former `.rulesync/rules/`.

## Contents

- RHDH Extensions Catalog - Plugin Metadata Workflow
- RHDH (Red Hat Developer Hub) Repository Context
- E2E Coverage: Use Instrumented Imports
- E2E Test Fix Workflow
- GitHub Workflows Security Best Practices
- Playwright Locator Best Practices

---
root: false
targets:
  - '*'
globs: []
---
# RHDH Extensions Catalog - Plugin Metadata Workflow

This cursor rule provides an automated workflow for adding dynamic plugin metadata to the RHDH Extensions Catalog.

## Important Documentation

**Primary Reference**: Read `catalog-entities/extensions/README.md` for:
- Detailed YAML structure and field explanations
- Complete examples (3scale plugin)
- RHDH-local testing setup
- Troubleshooting guide

This rule focuses on the **workflow automation** and **validation** aspects not covered in the README.

## Prerequisites

Before starting, ensure you have:

1. **Successfully exported plugin** from [RHDH Plugin Export Overlays](https://github.com/redhat-developer/rhdh-plugin-export-overlays)
   - OCI URL from build output (e.g., `oci://ghcr.io/redhat-developer/rhdh-plugin-export-overlays/aws-ecs:pr_1426__0.6.0!aws-ecs`)
   - Plugin version and integrity information

2. **Required tools installed**:
   ```bash
   # Check if tools are installed
   command -v yq &> /dev/null || echo "❌ Install yq (Go version): brew install yq (macOS) or snap install yq (Linux)"
   command -v ajv &> /dev/null || echo "❌ Install ajv-cli: npm install -g ajv-cli"
   command -v gh &> /dev/null || echo "❌ Install GitHub CLI: brew install gh (macOS)"
   ```

   **Important**: Ensure you have the **Go-based version of yq** (mikefarah/yq), not the Python version (kislyuk/yq).
   Verify with: `yq --version` (should show "mikefarah/yq")

## Interactive Information Gathering

When adding a plugin, gather the following information:

### Required Information
1. **Plugin Identification**
   - Plugin name (e.g., `aws-ecs`, `todo`)
   - NPM package name (e.g., `@aws/amazon-ecs-plugin-for-backstage`)
   - Namespace (e.g., `rhdh` for Red Hat maintained, `community` for community plugins)

2. **Technical Details**
   - OCI URL from overlay build
   - Plugin version
   - Backstage version compatibility
   - Role: `frontend-plugin` or `backend-plugin`

3. **User-Facing Information**
   - Title and short description (2-3 lines for tile view)
   - Long description (markdown, for expanded view)
   - Category (one of: AI, Analytics, CI/CD, Cloud, Compliance, Cost, Developer Tools, Docs, Feature Flags, Kubernetes, Monitoring, Productivity, Reporting, Search, Security, Storage, Supply Chain, Testing)
   - Tags (lowercase, kebab-case)
   - Support level: `production`, `tech-preview`, or `dev-preview`

4. **Links**
   - Homepage/documentation URL
   - Source code repository
   - Bug tracker URL

## Workflow Steps

### Step 1: Create Feature Branch

```bash
# Ensure we're on latest main
git fetch origin && git checkout main && git pull origin main

# Create feature branch
git checkout -b add-{plugin-name}-plugin-metadata
```

### Step 2: Tool Verification

```bash
# Verify required tools
for tool in yq ajv gh; do
  command -v $tool &> /dev/null && echo "✓ $tool installed" || echo "❌ $tool missing"
done

# Verify yq is the Go version
yq --version | grep -q "mikefarah" && echo "✓ yq is Go version (mikefarah/yq)" || echo "❌ Wrong yq version - install mikefarah/yq"
```

### Step 3: Create/Edit Plugin Metadata

Create `catalog-entities/extensions/plugins/{plugin-name}.yaml`:
- Use `catalog-entities/extensions/plugins/3scale.yaml` as a template
- See README for complete field descriptions

### Step 4: Validate Files

```bash
# Navigate to extensions directory
cd catalog-entities/extensions

# Download schemas to temp directory (ajv doesn't support remote schemas well)
mkdir -p /tmp/rhdh-schemas
curl -s "https://raw.githubusercontent.com/redhat-developer/rhdh-plugins/main/workspaces/extensions/json-schema/packages.json" \
  -o /tmp/rhdh-schemas/packages.json
curl -s "https://raw.githubusercontent.com/redhat-developer/rhdh-plugins/main/workspaces/extensions/json-schema/plugins.json" \
  -o /tmp/rhdh-schemas/plugins.json

# Convert YAML to JSON and validate Package against local schema
echo "Validating packages/{plugin-name}.yaml..."
yq eval packages/{plugin-name}.yaml -o json > /tmp/rhdh-schemas/package-temp.json
ajv validate -s /tmp/rhdh-schemas/packages.json -d /tmp/rhdh-schemas/package-temp.json

# Convert YAML to JSON and validate Plugin against local schema
echo "Validating plugins/{plugin-name}.yaml..."
yq eval plugins/{plugin-name}.yaml -o json > /tmp/rhdh-schemas/plugin-temp.json
ajv validate -s /tmp/rhdh-schemas/plugins.json -d /tmp/rhdh-schemas/plugin-temp.json

# Clean up temp files
rm /tmp/rhdh-schemas/package-temp.json /tmp/rhdh-schemas/plugin-temp.json
```

**Note**: This uses the Go-based `yq` syntax (`yq eval file.yaml -o json`). If validation fails, check that you have the correct yq version installed.

### Step 5: Test Locally (Optional)

Follow the RHDH-local testing instructions in the README:
1. Clone `rhdh-local` repository
2. Mount your local catalog in `compose.yaml`
3. Set `catalog.processingInterval: { seconds: 15 }` in `app-config.yaml`
4. Start with `docker compose up -d`
5. Check http://localhost:7007 → Catalog → Extensions

### Step 6: Create Pull Request

```bash
# Stage changes
git add catalog-entities/extensions/packages/{plugin-name}.yaml
git add catalog-entities/extensions/plugins/{plugin-name}.yaml

# Commit with descriptive message
git commit -m "feat: add {plugin-name} plugin to RHDH Extensions Catalog

- Added Package entity with OCI URL and version
- Added Plugin entity with description and metadata

# Create PR
gh pr create --title "feat: add {plugin-name} plugin to Extensions Catalog" \
  --body "## Summary
- Added {plugin-name} plugin metadata to Extensions Catalog
- Package: \`{npm-package-name}\` version {version}
- Support level: {support-level}

## Checklist
- [ ] Package and Plugin YAML files created
- [ ] Schemas validate successfully
- [ ] Tested locally with rhdh-local (if applicable)"
```

## Validation Checklist

Before submitting:
- [ ] Tools installed (`yq` Go version, `ajv-cli`, `gh`)
- [ ] Package YAML validates against schema
- [ ] Plugin YAML validates against schema
- [ ] Namespace consistent between Package and Plugin
- [ ] OCI URL correctly formatted
- [ ] All required fields populated

## Common Issues

### Schema Validation Fails
```bash
# Debug by checking JSON conversion (using Go-based yq)
yq eval your-file.yaml -o json | jq '.'

# Common issues:
# - Missing required fields
# - Wrong field types
# - Invalid enum values (e.g., wrong category)
```

### Wrong yq Version
```bash
# Check if you have the Go version
yq --version

# Should show: yq (https://github.com/mikefarah/yq/) version X.X.X

# If you have the Python version (kislyuk/yq), uninstall and install Go version:
# macOS: brew install mikefarah/yq/yq
# Linux: snap install yq
```

### OCI URL Format
Correct format: `oci://registry/path:tag!package-name`
- Must include `!package-name` suffix
- Tag typically includes PR number and version

## References

- [README with detailed documentation](../../catalog-entities/extensions/README.md)
- [Extension Schemas](https://github.com/redhat-developer/rhdh-plugins/tree/main/workspaces/extensions/json-schema)
- [RHDH Local Testing](https://github.com/redhat-developer/rhdh-local)
- [Dynamic Plugins Documentation](https://docs.redhat.com/en/documentation/red_hat_developer_hub)
- [RHDH Plugin Catalog](https://gitlab.cee.redhat.com/rhidp/rhdh-plugin-catalog/-/blob/rhdh-1-rhel-9/catalog-index) (RH VPN Required)

---

---
root: false
targets:
  - '*'
globs: []
---
# RHDH (Red Hat Developer Hub) Repository Context

This document serves as a comprehensive starting point for LLMs working with the RHDH repository. It provides detailed information about the e2e-tests, testing infrastructure and CI/CD pipeline.

## Table of Contents

- [E2E Testing Framework](#e2e-testing-framework)
- [CI/CD Infrastructure](#cicd-infrastructure)
- [Key Dependencies and Common Issues](#key-dependencies-and-common-issues)
- [Documentation References](#documentation-references)

## E2E Testing Framework

### Technology Stack
- **Testing Framework**: Playwright with TypeScript
- **Node.js Version**: Use `engines.node` in `e2e-tests/package.json`
- **Package Manager**: Use `packageManager` in `e2e-tests/package.json`
- **Test Runner**: Playwright Test
- **Reporting**: HTML, JUnit XML, List reporters

Current versions for e2e-tests are defined in `e2e-tests/package.json`

### Test Structure and Organization

#### Directory Structure
```text
e2e-tests/
├── playwright/
│   ├── e2e/                    # Main test files
│   │   └── *.spec.ts          # General test files
│   ├── utils/                 # Test utilities
│   ├── data/                  # Test data
│   └── support/               # Test support files
```

#### Test File Requirements

**Component Assignment**: Every test file (`*.spec.ts`) in the `e2e-tests` folder must have a component assigned in the `test.beforeAll` hook using the following syntax:

```typescript
test.beforeAll(async ({ }, testInfo) => {
  testInfo.annotations.push({
    type: "component",
    description: "your_value",
  });
});
```

**Purpose**: This component annotation is used for test categorization, reporting, and CI/CD pipeline organization. It helps identify which component or feature area each test file is validating.

**Examples of Component Values**:
- `"authentication"` - for authentication provider tests
- `"rbac"` - for role-based access control tests
- `"plugins"` - for plugin functionality tests
- `"configuration"` - for configuration validation tests
- `"audit-log"` - for audit logging tests
- `"core"` - for core functionality tests
- `"navigation"` - for navigation and routing tests
- `"api"` - for API endpoint and integration tests
- `"integration"` - for external service integration tests
- `"monitoring"` - for monitoring and observability tests
- `"data-management"` - for data handling and management tests

**Note**: The component description should be descriptive and consistent across related test files to ensure proper test organization and reporting.

#### Key Test Categories

1. **Smoke Tests** (`smoke-test.spec.ts`)
   - Basic functionality verification
   - Health checks and core features

2. **Showcase Tests** (defined in `e2e-tests/playwright/projects.json`)
   - `showcase`: General functionality tests with base deployment using Helm chart
   - `showcase-rbac`: General functionality tests with RBAC-enabled deployment using Helm chart
   - `showcase-k8s`: Kubernetes integration tests with base deployment
   - `showcase-rbac-k8s`: Kubernetes integration tests with RBAC-enabled deployment
   - `showcase-operator`: General functionality tests with base deployment using Operator
   - `showcase-operator-rbac`: General functionality tests with RBAC-enabled deployment using Operator
   - `showcase-runtime`: Runtime environment tests
   - `showcase-sanity-plugins`: Plugin sanity checks
   - `showcase-upgrade`: Upgrade scenario tests
   - `showcase-localization-de`: German localization tests
   - `showcase-localization-es`: Spanish localization tests
   - `showcase-localization-fr`: French localization tests
   - `showcase-localization-it`: Italian localization tests
   - `showcase-localization-ja`: Japanese localization tests
   - `any-test`: Use for debugging when you need to run a specific test

   **Note**: All project names are defined in `e2e-tests/playwright/projects.json` as the single source of truth. This file is consumed by:
   - `playwright.config.ts` via TypeScript import (`e2e-tests/playwright/projects.ts`)
   - CI/CD scripts via `.ci/pipelines/playwright-projects.sh` (exports as `$PW_PROJECT_*` variables)

3. **Authentication Provider Tests** (`showcase-auth-providers`)
   - OIDC (Red Hat Backstage Keycloak)
   - Microsoft OAuth2
   - GitHub authentication
   - LDAP (Active Directory)

4. **Plugin Tests** (`playwright/e2e/plugins/`)
   - RBAC (Role-Based Access Control)
   - Kubernetes actions
   - Notifications
   - Topology
   - Quay integration
   - Tekton
   - Dynamic plugins info
   - Adoption insights
   - Analytics

5. **Configuration Tests** (`playwright/e2e/configuration-test/`)
   - Config map validation
   - Environment-specific configurations

6. **Audit Log Tests** (`playwright/e2e/audit-log/`)
   - Audit logging functionality
   - Compliance verification

7. **Localization Tests** (`playwright/e2e/localization/`)
   - Verify UI displays correctly translated strings
   - Supports **German (de)**, **Spanish (es)**, **French (fr)**, **Italian (it)**, and **Japanese (ja)**
   - Runs in a dedicated `e2e-ocp-helm-localization-nightly` nightly job
   - Uses `showcase-localization-de`, `showcase-localization-es`, `showcase-localization-fr`, `showcase-localization-it`, `showcase-localization-ja` Playwright projects
   - Translation files located in `translations/` directory
   - Test helper: `e2e-tests/playwright/e2e/localization/locale.ts`

### Test Execution

#### CI/CD Pipeline Execution

In the CI/CD pipeline, tests are executed directly using Playwright's `--project` flag via `testing::run_tests()` in `.ci/pipelines/lib/testing.sh`:

```bash
yarn playwright test --project="${playwright_project}"
```

The namespace and Playwright project are decoupled, allowing flexible reuse. The `testing::check_and_test()` and `testing::run_tests()` functions accept an explicit `playwright_project` argument:

```bash
# Function signatures:
testing::check_and_test "${RELEASE_NAME}" "${NAMESPACE}" "${PLAYWRIGHT_PROJECT}" "${URL}" [max_attempts] [wait_seconds]
testing::run_tests "${RELEASE_NAME}" "${NAMESPACE}" "${PLAYWRIGHT_PROJECT}" "${URL}"
```

#### Local Development Scripts

The package aliases below require an environment already prepared by CI. For local tests,
run the equivalent project through `local-test.sh` so Bitwarden secrets and certificate files
are prepared correctly:

```bash
cd e2e-tests
BW_SESSION="$(env -u BW_CLEANEXIT bw unlock --raw)" && export BW_SESSION
BASE_URL=https://deployed-rhdh.example.com NAME_SPACE=showcase ./local-test.sh -- --project=showcase --headed
```

Set `NAME_SPACE_RBAC` for RBAC projects and `NAME_SPACE_RUNTIME` for the runtime project to the
corresponding deployed namespace. Caller-supplied namespaces and cluster connection values
are preserved. Host and container runs both download the current public AWS RDS CA bundle;
a failed download never falls back to a stored bundle.

Secret names, both Bitwarden profiles, recovery from failed checks, and creating or rotating
secrets are documented in `docs/e2e-tests/managing-e2e-secrets.md`; generic CLI usage lives in the
[upstream Secrets API](https://redhat-developer.github.io/rhdh-e2e-test-utils/api/secrets.html).
Read that guide before changing a local runner or adding a secret.

Package aliases for CI or an already prepared environment:

```bash
# Showcase tests - OpenShift deployments (Helm)
yarn showcase                       # General showcase tests
yarn showcase-rbac                 # General showcase tests with RBAC

# Showcase tests - Kubernetes deployments
yarn showcase-k8s                  # Kubernetes showcase tests
yarn showcase-rbac-k8s             # Kubernetes showcase tests with RBAC

# Showcase tests - Operator deployments
yarn showcase-operator             # Operator showcase tests
yarn showcase-operator-rbac        # Operator showcase tests with RBAC

# Showcase tests - Other scenarios
yarn showcase-runtime              # Runtime configuration tests
yarn showcase-upgrade              # Upgrade scenario tests

# Authentication provider tests
yarn showcase-auth-providers       # Auth provider tests

# Plugin tests
yarn showcase-sanity-plugins       # Plugin sanity tests

# Localization tests
yarn showcase-localization-de      # German localization tests
yarn showcase-localization-es      # Spanish localization tests
yarn showcase-localization-fr      # French localization tests
yarn showcase-localization-it      # Italian localization tests
yarn showcase-localization-ja      # Japanese localization tests

# Utility scripts
yarn lint                          # Oxlint checking
yarn lint:fix                      # Oxlint fixing
yarn fmt:check                     # Oxfmt checking
yarn fmt                           # Oxfmt fixing
yarn test:unit                     # Vitest unit and runner regression tests
yarn shellcheck                    # Shell script checking
```

Unit tests live under `e2e-tests/unit/` and use Vitest imports. Playwright specs use
the coverage-instrumented imports described in `e2e-coverage-imports`. Run unit tests
for changes to the local runners, stream decoder, and shared test utilities without
requiring a deployment. Run the relevant Playwright project for live E2E verification.
The current workspace has no `tsc:check` script; do not report a separate TypeScript
compilation check unless one was actually run.

**Note**: The CI pipeline no longer uses yarn script aliases. Instead, it runs Playwright directly with `yarn playwright test --project=<project-name>`. This decouples the namespace from the test project name, enabling more flexible namespace and test project reuse.

### Environment Variables

All the important environment variables are sourced in `.ci/pipelines/env_variables.sh`
CI secrets are mounted by OpenShift CI; local runners select equivalent names from Bitwarden.

⚠️ Important Notice
Do not persist local test secrets in `.env` files.
Store local credentials in the approved Bitwarden collection and CI secrets in the configured
OpenShift CI secret store. Local wrappers transport profile-selected values through FD 3,
materialize private files where needed, and load secrets into the test child environment.

CI retains the explicit `/tmp/secrets/<field>` reads and aliases in `env_variables.sh`.
The local container decodes its stream into a private tmpfs at that same path, so it
uses the original CI sourcing. Normalize both Azure certificate spellings to
`azure-db-certificates.pem` and reject conflicting aliases before writing files.

Host tests use `e2e-tests/local-test-secrets.ts` with the installed package's stream
decoder and child-process runner, without sourcing CI setup. Caller connection values
and namespaces are preserved; profile-supplied process controls and cluster-admin
credentials are excluded. The cluster-login helper reads only its two explicit fields
from the separate ephemeral-cluster profile.

Keep runtime secret files outside `SHARED_DIR` (flat cross-step state) and `ARTIFACT_DIR`
(public artifacts). The host adapter removes its private certificate directory after the
test process exits; container secrets retain their tmpfs lifecycle. Keep tracing disabled for secret-bearing
commands, and keep secret values out of process arguments and container environment flags. Store each GSM credential as a separate raw field for Prow censoring, as documented
in [OpenShift CI secret protection guidance](https://docs.ci.openshift.org/how-tos/adding-a-new-secret-to-ci-gsm/#protecting-secrets-from-leaking).

### Test Configuration

Playwright configuration (`e2e-tests/playwright.config.ts`):
- **Timeout**: 90 seconds global, 10-15 seconds for actions
- **Retries**: 2 on CI, 0 locally
- **Workers**: 3 on CI; Playwright's default locally, with project-specific overrides
- **Viewport**: 1920x1080
- **Video**: Retain on failure
- **Screenshots**: Enabled for all tests
- **Trace**: Retain on failure

### Key Differences: showcase-auth-providers vs Other Showcase Projects

The `showcase-auth-providers` project has several significant differences from other showcase projects, particularly in deployment and configuration:

#### **Namespace and Release Management**
- **Other Showcase Projects**: Use standard namespace patterns (`showcase-ci-nightly`, `showcase-rbac-nightly`)
- **showcase-auth-providers**: Uses dedicated namespace `showcase-auth-providers` and release `rhdh-auth-providers`
- **Logging**: Dedicated logs folder: `e2e-tests/auth-providers-logs`

#### **Test Retry Configuration**
- **Other Showcase Projects**: Typically use 2 retries (CI default)
- **showcase-auth-providers**: Configured with only 1 retry due to the complexity of authentication provider setup and teardown

#### **Configuration and Deployment Approach**
- **Other Showcase Projects**: Use Bash scripts for configuration and deployment
- **showcase-auth-providers**: Uses TypeScript for configuration and deployment management
- **Configuration Files**: Uses different configuration files compared to other showcase projects:
  - `e2e-tests/playwright/e2e/auth-providers/` directory structure with TypeScript test files
  - Dedicated values file: `.ci/pipelines/value_files/values_showcase-auth-providers.yaml`
  - TypeScript-based test configuration instead of Bash scripts
  - Dynamic RHDH instance management (create, update, restart, delete)

#### **Required Plugins and Dependencies**
- **Other Showcase Projects**: Standard plugin dependencies
- **showcase-auth-providers**: Requires specific plugins exported to `dynamic-plugins-root`:
  - `backstage-community-plugin-catalog-backend-module-keycloak-dynamic`
  - `backstage-plugin-catalog-backend-module-github-org-dynamic`
  - `backstage-plugin-catalog-backend-module-msgraph-dynamic`
  - `backstage-community-plugin-rbac`

#### **Authentication Provider Coverage**
- **Other Showcase Projects**: Standard authentication testing
- **showcase-auth-providers**: Tests multiple authentication providers:
  - OIDC using Red Hat Backstage Keycloak (RHBK)
  - Microsoft OAuth2 provider
  - GitHub authentication
  - LDAP using Active Directory (commented out)

#### **Test Structure and Files**
- **Other Showcase Projects**: Standard test file patterns
- **showcase-auth-providers**: Dedicated test structure:
  - `e2e-tests/playwright/e2e/auth-providers/` directory
  - Individual test files: `oidc.spec.ts`, `microsoft.spec.ts`, `github.spec.ts`, `ldap.spec.ts`
  - Tests verify: supported resolvers, user/group ingestion, nested groups, session token configuration

These differences make `showcase-auth-providers` a specialized testing environment focused on validating authentication provider integrations rather than general RHDH functionality testing.

## CI/CD Infrastructure

### OpenShift CI Overview

The RHDH CI/CD pipeline uses **OpenShift CI** with **Prow-based** automation and **ephemeral clusters** for testing.

Check the readme at `.ci/pipelines/README.md`

#### Key Components

1. **Ephemeral Clusters**: AWS-based clusters in `us-east-2` region
2. **Cluster Management**: Managed via cluster claims
3. **CI Job Types**: OCP, EKS, GKE, AKS environments
4. **Authentication**: Keycloak as default provider
5. **Secrets Management**: OpenShift CI mounted secrets; Bitwarden for local runs

### Cluster Pools

RHDH uses dedicated Hive cluster pools with the `rhdh` prefix on AWS `us-east-2`. Pool versions rotate as new OCP releases come out. Find the current list by filtering for `rhdh` in the [existing cluster pools](https://docs.ci.openshift.org/how-tos/cluster-claim/#existing-cluster-pools) page. See also `.ci/pipelines/README.md`.

### CI Job Types

#### Pull Request Tests
- **Trigger**: Automatic for code changes, manual with `/ok-to-test`
- **Environment**: Ephemeral OpenShift cluster
- **Scope**: Both RBAC and non-RBAC namespaces
- **Artifacts**: 6-month retention period

#### Nightly Tests
- **Schedule**: Automated nightly runs
- **Environments**: Multiple OCP versions, AKS, GKE
- **Reporting**: Slack notifications to `#rhdh-e2e-alerts`

### Test Execution Environment

#### Local Development
Host tests run through `local-test.sh` using the Node.js and Yarn versions declared
in `e2e-tests/package.json`. Container deployment and test runs use `local-run.sh`.

#### CI/CD Pipeline Execution
For CI/CD pipeline execution, tests run in a containerized environment using the image `.ci/images/Dockerfile`. This image is based on `mcr.microsoft.com/playwright` and uses Ubuntu as the base operating system.

**Note**: Any additional system dependencies required for testing must be installed in this Docker image to ensure CI/CD pipeline compatibility.

#### Alternative Execution Methods
**Podman Usage**: If you need to prepare the environment or run tests close to how CI/CD pipeline runs them, you can use Podman to run the `.ci/pipelines/openshift-ci-tests.sh` script inside the Docker image.

**RHEL/Fedora Systems**: On Playwright unsupported systems such as RHEL or Fedora, running tests inside the containerized environment using Podman is the recommended approach to avoid compatibility issues.

### Key CI Scripts

#### Main Orchestration
- **`.ci/pipelines/openshift-ci-tests.sh`**: Main test orchestration script
- **`.ci/pipelines/utils.sh`**: Utility functions
- **`.ci/pipelines/reporting.sh`**: Reporting and notifications
- **`.ci/pipelines/env_variables.sh`**: Environment variable management
- **`.ci/pipelines/playwright-projects.sh`**: Loads Playwright project names from `projects.json` as `$PW_PROJECT_*` variables

#### CI Infrastructure Package Configuration

The `.ci/package.json` file defines the CI infrastructure package configuration and development tools:

**Available Scripts:**
```bash
# Code quality and linting
yarn shellcheck              # Shell script linting with severity warnings
yarn prettier:check          # Check formatting for shell, markdown, and YAML files
yarn prettier:fix            # Fix formatting for shell, markdown, and YAML files
```

⚠️ **Important**: Before using any of these scripts, you must first run `yarn install` in the `.ci` folder to install the required dependencies (prettier, prettier-plugin-sh, shellcheck).

**Purpose**: This package provides essential tooling for maintaining code quality in the CI infrastructure, ensuring consistent formatting and shell script best practices across the pipeline scripts.

#### Shell Script Conventions

**Shell scripts in `.ci/` folder:**
- **Never use** `set pipefail` or `set -o pipefail`
- Only `.ci/pipelines/openshift-ci-tests.sh` defines global `set` options; other scripts inherit them
- Functions may temporarily disable/re-enable error handling with `set +e` / `set -e` pattern

#### Job Handlers
The main script dispatches to job-specific handlers in `.ci/pipelines/jobs/`:
- `handle_aks_helm` / `handle_aks_operator`: AKS Helm/Operator deployment
- `handle_eks_helm` / `handle_eks_operator`: EKS Helm/Operator deployment
- `handle_gke_helm` / `handle_gke_operator`: GKE Helm/Operator deployment
- `handle_ocp_nightly`: OCP Helm nightly tests (also handles OSD-GCP Helm)
- `handle_ocp_localization`: OCP Helm localization nightly tests
- `handle_ocp_operator`: OCP Operator nightly tests (also handles OSD-GCP Operator)
- `handle_ocp_pull`: OCP PR checks
- `handle_auth_providers`: Auth provider tests
- `handle_ocp_helm_upgrade`: Upgrade scenario tests

#### Special Case: showcase-auth-providers Deployment

The `showcase-auth-providers` project has a unique deployment workflow that differs significantly from other showcase projects:

**Handler**: `handle_auth_providers()` function in `.ci/pipelines/jobs/auth-providers.sh`
**Configuration**: Uses dedicated values file `values_showcase-auth-providers.yaml` with auth provider-specific settings
**Test Execution**: Runs TypeScript-based tests from `e2e-tests/playwright/e2e/auth-providers/` directory

### Access and Debugging

#### Cluster Access
For cluster pool admins, use the login script:
```bash
.ci/pipelines/ocp-cluster-claim-login.sh
```

It validates the Prow URL and resolves the cluster claim before loading Bitwarden
credentials. Use `--no-console` for login only or `--open-console` to request the
console explicitly. Non-interactive stdin skips the console prompt.

#### Debugging Process
1. Run the login script
2. Provide Prow log URL when prompted
3. Script resolves the claim, loads credentials, and logs in; console access is optional
4. Ephemeral clusters are deleted after CI job termination

### CI Configuration Files

- **Job Definitions**: [OpenShift Release Jobs](https://github.com/openshift/release/tree/master/ci-operator/jobs/redhat-developer/rhdh)
- **Configuration**: [OpenShift Release Config](https://github.com/openshift/release/tree/master/ci-operator/config/redhat-developer/rhdh)
- **Step Registry**: [OpenShift Release Steps](https://github.com/openshift/release/tree/master/ci-operator/step-registry/redhat-developer/rhdh)

### Debugging

#### Local Debugging
```bash
# Set local development flags
export ISRUNNINGLOCAL=true
export ISRUNNINGLOCALDEBUG=true

# Run tests locally
./local-test.sh -- --project=showcase-auth-providers --workers=1
```

#### CI Debugging
1. **Access Logs**: Check PR artifacts or CI logs
2. **Cluster Access**: Use cluster claim login script
3. **Environment Variables**: Verify required variables
4. **Test Failures**: Review test reports and screenshots

#### Common Debugging Tools
- **Playwright Inspector**: `./local-test.sh -- --project=PROJECT --debug`
- **Trace analysis**: `npx playwright trace open "test-results/${TEST_PATH}/trace.zip"`, then `npx playwright trace errors` or `npx playwright trace actions`; finish with `npx playwright trace close`
- **Screenshots**: Automatic on failure
- **Video Recording**: Available for all tests

## Key Dependencies and Common Issues

### System Dependencies

#### macOS Requirements
**Important**: macOS users need to use GNU `grep` and GNU `sed` instead of the built-in BSD versions to avoid compatibility issues with scripts and CI/CD pipelines.

Install using Homebrew:
```bash
brew install grep
brew install gnu-sed
```

**Important**: Make sure to set the GNU versions as default to ensure they are used instead of the built-in macOS versions.

**Note**: The built-in macOS versions of these tools may cause issues when running scripts or tests that expect GNU-compatible behavior.

### External Services

#### Required Services
- **GitHub**: Authentication, repository access
- **Keycloak**: Default authentication provider
- **OpenShift**: Primary deployment platform
- **Advanced Cluster Management**: For OCM plugins

### Internal Components

#### Core Components
- **Backstage**: Main application framework
- **Dynamic Plugins**: Plugin management system
- **Catalog**: Entity management
- **Scaffolder**: Template system

### Common Issues and Solutions

#### Test Failures
1. **Environment Issues**: Verify environment variables
2. **Authentication Problems**: Check credentials and tokens
3. **Resource Constraints**: Check cluster resources

#### CI Failures
1. **Cluster Issues**: Verify cluster availability
2. **Resource Limits**: Check resource quotas
3. **Network Problems**: Verify connectivity
4. **Configuration Errors**: Review job configuration

#### Plugin Issues
1. **Loading Failures**: Check plugin configuration
2. **Dependency Conflicts**: Verify package versions
3. **Configuration Errors**: Review plugin config
4. **Build Issues**: Check build process

## Documentation References

### Core Documentation
- [E2E Testing CI Documentation](docs/e2e-tests/CI.md)
- [Dynamic Plugins Documentation](docs/dynamic-plugins/index.md)
- [Authentication Providers README](e2e-tests/playwright/e2e/auth-providers/README.md)
- [OpenShift CI Pipeline README](.ci/pipelines/README.md)

### Configuration Files
- [Playwright Project Names (Single Source of Truth)](e2e-tests/playwright/projects.json)
- [Playwright Configuration](e2e-tests/playwright.config.ts)
- [Package Configuration](e2e-tests/package.json)
- [CI Test Script](.ci/pipelines/openshift-ci-tests.sh)

### External Resources
- [OpenShift CI Documentation](https://docs.ci.openshift.org/)
- [Playwright Documentation](https://playwright.dev/)
- [Red Hat Developer Hub Documentation](https://redhat-developer.github.io/red-hat-developers-documentation-rhdh/main/)
- [Backstage Documentation](https://backstage.io/docs)
- [Dynamic Plugins Guide](https://github.com/backstage/backstage/tree/master/packages/backend-dynamic-feature-service)

### Key Scripts and Tools
- [Cluster Login Script](.ci/pipelines/ocp-cluster-claim-login.sh)
- [Test Reporting Script](.ci/pipelines/reporting.sh)
- [Environment Variables](.ci/pipelines/env_variables.sh)
- [Dynamic Plugin Installer](https://github.com/redhat-developer/rhdh-plugins/tree/main/workspaces/install-dynamic-plugins)

## Test Configuration Files (Config Maps)

### Overview

The RHDH e2e testing infrastructure uses two main configuration files located in `.ci/pipelines/resources/config_map/`:

1. **`app-config-rhdh.yaml`** - Non-RBAC configuration
2. **`app-config-rhdh-rbac.yaml`** - RBAC-enabled configuration

### Config Map Usage Pattern

The choice of config map depends on the **Playwright test project** being executed, as defined in `e2e-tests/playwright.config.ts`:

#### **app-config-rhdh.yaml** (Non-RBAC Configuration)

**Used for test projects that exclude RBAC testing:**

- `smoke-test` - Basic smoke tests
- `showcase` - General functionality tests (explicitly excludes RBAC tests)
- `showcase-k8s` - Kubernetes integration tests (explicitly excludes RBAC tests)
- `showcase-operator` - Operator-based tests (explicitly excludes RBAC tests)
- `showcase-runtime` - Runtime environment tests
- `showcase-sanity-plugins` - Plugin sanity tests
- `showcase-upgrade` - Upgrade scenario tests
- `showcase-localization-de` - German localization tests
- `showcase-localization-es` - Spanish localization tests
- `showcase-localization-fr` - French localization tests
- `showcase-localization-it` - Italian localization tests
- `showcase-localization-ja` - Japanese localization tests
- `showcase-auth-providers` - Authentication provider tests (uses special deployment process)

#### **app-config-rhdh-rbac.yaml** (RBAC Configuration)

**Used for test projects that include RBAC testing:**

- `showcase-rbac` - RBAC-specific tests
- `showcase-rbac-k8s` - Kubernetes + RBAC tests
- `showcase-operator-rbac` - Operator + RBAC tests

### **CRITICAL RULE: Config Map Selection**

**When adding new tests:**

1. **Identify the test project scope:**
   - Will the new test/plugin be tested with RBAC? → Use `app-config-rhdh-rbac.yaml`
   - Will the new test/plugin be tested without RBAC? → Use `app-config-rhdh.yaml`

2. **Check the Playwright project configuration:**
   - Projects that exclude RBAC tests (using `testIgnore` for RBAC patterns) → Use `app-config-rhdh.yaml`
   - Projects that include RBAC tests (using `testMatch` for RBAC patterns) → Use `app-config-rhdh-rbac.yaml`

### **Special Cases**

1. **showcase-auth-providers**: Although it uses the non-RBAC config pattern, it has its own specialized deployment process with dedicated values file (`values_showcase-auth-providers.yaml`) and TypeScript-based configuration management.

### **Configuration Deployment Process**

The config maps are deployed as Kubernetes ConfigMaps during CI/CD pipeline execution and are mounted into the RHDH pods to provide runtime configuration. The pipeline selects the appropriate config map based on the test project being executed.

---

---
root: false
targets:
  - '*'
globs:
  - e2e-tests/playwright/**/*.spec.ts
  - e2e-tests/playwright/**/*.test.ts
---
# E2E Coverage: Use Instrumented Imports

When creating or modifying Playwright spec files under `e2e-tests/playwright/`, always use the coverage-instrumented `test` and `expect` instead of importing directly from `@playwright/test`.

## Import Rule

```typescript
// WRONG - bypasses coverage collection
import { test, expect } from "@playwright/test";

// CORRECT - uses the @support path alias (configured in e2e-tests/tsconfig.json)
import { test, expect } from "@support/coverage/test";
```

The instrumented version is a drop-in replacement: `describe`, `beforeAll`, `expect`, locators, and all fixtures behave identically. When `COLLECT_COVERAGE` is unset (the default), the instrumented fixture is a no-op with zero overhead.

## Specs with Custom Context

If the spec creates its own `BrowserContext` / `Page` via `browser.newContext()`, also import and call the explicit helpers:

```typescript
import { test, expect, startCoverageForPage, stopCoverageForPage } from "@support/coverage/test";

test("my test", async ({ browser }, testInfo) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  await startCoverageForPage(page);
  try {
    // test body
  } finally {
    await stopCoverageForPage(page, testInfo);
    await context.close();
  }
});
```

## Reference

See `docs/coverage/e2e-rhdh.md` for full details on the coverage infrastructure.

---

---
root: false
targets:
  - '*'
globs: []
---
# E2E Test Fix Workflow

Reference knowledge for the `/fix-e2e` command. For detailed instructions, load the corresponding skill for each phase.

## Workflow Overview

The `/fix-e2e` command orchestrates a 7-phase workflow to autonomously fix E2E CI failures:

1. **Parse CI Failure** (`e2e-parse-ci-failure`) — Extract failure details from Prow URL, Playwright report, or Jira ticket
2. **Setup Fix Branch** — Create a branch from the correct upstream release branch
3. **Deploy RHDH** (`e2e-deploy-rhdh`) — Deploy RHDH to a cluster using `local-run.sh`
4. **Reproduce Failure** (`e2e-reproduce-failure`) — Confirm the failure reproduces locally
5. **Diagnose and Fix** (`e2e-diagnose-and-fix`) — Analyze root cause and implement a fix
6. **Verify Fix** (`e2e-verify-fix`) — Run the test multiple times and check code quality
7. **Submit and Review** (`e2e-submit-and-review`) — Create PR, trigger review, monitor CI

**Critical rule**: No phase may be skipped without **explicit user approval**.

## Job Name Mapping Tables

These tables are the **single source of truth** — referenced by `e2e-parse-ci-failure` and other skills.

### Job Name → Release Branch

Extract the release branch from the Prow job name using the `-rhdh-<branch>-` pattern:

```bash
BRANCH=$(echo "$JOB_NAME" | grep -oE '\-rhdh-(main|release-[0-9]+\.[0-9]+)-' | sed 's/^-rhdh-//;s/-$//')
```

### Job Name → Platform and Deployment Method

| Pattern | Platform | Method |
|---------|----------|--------|
| `*ocp*helm*` | OCP | Helm |
| `*ocp*operator*` | OCP | Operator |
| `*aks*helm*` | AKS | Helm |
| `*aks*operator*` | AKS | Operator |
| `*eks*helm*` | EKS | Helm |
| `*eks*operator*` | EKS | Operator |
| `*gke*helm*` | GKE | Helm |
| `*gke*operator*` | GKE | Operator |
| `*osd-gcp*` | OSD-GCP | Helm/Operator |

### Job Name → Playwright Projects

| Job pattern | Projects |
|-------------|----------|
| `*ocp*helm*nightly*` (not upgrade, not localization) | `showcase`, `showcase-rbac`, `showcase-runtime`, `showcase-sanity-plugins` |
| `*ocp*helm*localization*nightly*` | `showcase-localization-de`, `showcase-localization-es`, `showcase-localization-fr`, `showcase-localization-it`, `showcase-localization-ja` |
| `*ocp*helm*upgrade*` | `showcase-upgrade` |
| `*ocp*operator*nightly*` (not auth) | `showcase-operator`, `showcase-operator-rbac` |
| `*ocp*operator*auth-providers*` | `showcase-auth-providers` |
| `*ocp*helm*pull*` | `showcase`, `showcase-rbac` |
| `*aks*`/`*eks*`/`*gke*` helm | `showcase-k8s`, `showcase-rbac-k8s` |
| `*aks*`/`*eks*`/`*gke*` operator | `showcase-k8s`, `showcase-rbac-k8s` |

### Job Name → local-run.sh `-j` Parameter

Use the **full Prow CI job name** directly as the `-j` parameter. Do NOT use shortened names.

**OCP** (deploy-only with `-s`): `./local-run.sh -j "$JOB_NAME" -r "$REPO" -t "$TAG" -s`
**K8s** (full execution, no `-s`): `./local-run.sh -j "$JOB_NAME" -r "$REPO" -t "$TAG"`

### Release Branch → Image Repo and Tag

```bash
if [[ "$BRANCH" == "main" ]]; then
  REPO="rhdh-community/rhdh"; TAG="next"
else
  REPO="rhdh/rhdh-hub-rhel9"; TAG="${BRANCH#release-}"
fi
```

## Local Test Environment

After deployment, run host tests through `e2e-tests/local-test.sh`. Export an unlocked
`BW_SESSION`, set `BASE_URL` to the deployment URL, and set the namespaces used by the
selected tests (`NAME_SPACE`, `NAME_SPACE_RBAC`, or `NAME_SPACE_RUNTIME`). Cluster-aware
tests also require caller-provided `K8S_CLUSTER_URL` and `K8S_CLUSTER_TOKEN`.

The wrapper loads the project-pinned Bitwarden profile through FD 3. It does not
deploy RHDH, read deployment configuration, generate cluster tokens, or write `.env`
files. The deployment runner retrieves secrets before cluster mutation and rejects
concurrent invocations in the same checkout.

## Coding Conventions

All test code must follow the project's coding rules:
- **`playwright-locators`** — locator priority, anti-patterns, assertions, Page Objects
- **`ci-e2e-testing`** — test structure, component annotations, utility classes, CI scripts
- **`e2e-coverage-imports`** — instrumented imports for Playwright specs

Run code quality checks using the scripts defined in `e2e-tests/package.json`:
`yarn lint`, `yarn fmt:check`, `yarn shellcheck`, and relevant `yarn test:unit` tests.

---

---
root: false
targets:
  - '*'
globs: []
---
# GitHub Workflows Security Best Practices

This rule provides comprehensive guidance for creating secure GitHub Actions workflows, based on the [GitHub Security Lab](https://securitylab.github.com/) blog series on GitHub Actions security.

> **Note on Action Versions:** The action versions (commit SHAs and version tags) used in examples throughout this document may be outdated. When implementing these patterns, always check for the latest versions of actions and update the commit SHAs accordingly. You can find the latest versions on each action's GitHub releases page.

## Table of Contents

- [Untrusted Input Handling](#untrusted-input-handling)
- [pull_request_target Security](#pull_request_target-security)
- [Action Pinning and Permissions](#action-pinning-and-permissions)
- [Environment Variable Safety](#environment-variable-safety)
- [Artifact Security](#artifact-security)
- [Repository-Specific Patterns](#repository-specific-patterns)
- [Reusable Actions](#reusable-actions)

---

## Untrusted Input Handling

Reference: [GitHub Actions: Untrusted Input](https://securitylab.github.com/resources/github-actions-untrusted-input/)

### Always Use Environment Variables for GitHub Context Expressions

**NEVER** directly interpolate GitHub context expressions in `run:` scripts. Always encapsulate them in environment variables first.

```yaml
# BAD - Direct interpolation is vulnerable to injection
- name: Print PR title
  run: echo "Title: ${{ github.event.pull_request.title }}"

# GOOD - Use environment variable encapsulation
- name: Print PR title
  env:
    TITLE: ${{ github.event.pull_request.title }}
  run: echo "Title: $TITLE"
```

### Use Default GitHub Environment Variables

Prefer using default GitHub environment variables (like `$GITHUB_REF_NAME`, `$GITHUB_SHA`, `$GITHUB_REPOSITORY`) over context expressions when available:

```yaml
# GOOD - Use default environment variables
- name: Show branch info
  run: |
    echo "Branch: $GITHUB_REF_NAME"
    echo "SHA: $GITHUB_SHA"
    echo "Repository: $GITHUB_REPOSITORY"

# Also acceptable when env vars aren't available
- name: Show PR number
  env:
    PR_NUMBER: ${{ github.event.number }}
  run: echo "PR #$PR_NUMBER"
```

### Dangerous Context Expressions

The following context expressions are **especially dangerous** because they are controlled by external users:

| Expression | Risk |
|------------|------|
| `github.event.issue.title` | Attacker-controlled issue title |
| `github.event.issue.body` | Attacker-controlled issue body |
| `github.event.pull_request.title` | Attacker-controlled PR title |
| `github.event.pull_request.body` | Attacker-controlled PR description |
| `github.event.comment.body` | Attacker-controlled comment content |
| `github.event.review.body` | Attacker-controlled review content |
| `github.event.pages.*.page_name` | Attacker-controlled page name |
| `github.event.commits.*.message` | Attacker-controlled commit message |
| `github.event.head_commit.message` | Attacker-controlled commit message |
| `github.event.head_commit.author.email` | Attacker-controlled author email |
| `github.event.head_commit.author.name` | Attacker-controlled author name |
| `github.event.commits.*.author.email` | Attacker-controlled author email |
| `github.event.commits.*.author.name` | Attacker-controlled author name |
| `github.event.pull_request.head.ref` | Attacker-controlled branch name |
| `github.event.pull_request.head.label` | Attacker-controlled label |
| `github.event.pull_request.head.repo.default_branch` | Attacker-controlled default branch |
| `github.head_ref` | Attacker-controlled branch name |

**Always sanitize or encapsulate these in environment variables:**

```yaml
# GOOD - Proper encapsulation of dangerous inputs
- name: Check PR eligibility
  env:
    PR_BRANCH: ${{ github.event.pull_request.head.ref }}
    PR_TITLE: ${{ github.event.pull_request.title }}
  run: |
    # Now safe to use in shell
    echo "Branch: $PR_BRANCH"
    echo "Title: $PR_TITLE"
```

---

## pull_request_target Security

Reference: [GitHub Actions: Preventing pwn requests](https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/)

### When to Use Each Trigger

| Trigger | Secrets Access | Write Permission | Use Case |
|---------|---------------|------------------|----------|
| `pull_request` | No (from forks) | No | Build/test PR code safely |
| `pull_request_target` | Yes | Yes | Label PRs, comment, NO code checkout |
| `workflow_run` | Yes | Yes | Post-processing after `pull_request` |

### CRITICAL: Never Checkout Untrusted Code with pull_request_target

```yaml
# DANGEROUS - Checking out PR code with secrets access
on: pull_request_target
jobs:
  build:
    steps:
      - uses: actions/checkout@v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}  # UNSAFE!
      - run: npm install  # Attacker's code runs with secrets!

# SAFE - Only checkout target branch (default behavior)
on: pull_request_target
jobs:
  label:
    steps:
      - uses: actions/checkout@v4  # Checks out base branch, safe
      - name: Add label
        run: gh pr edit $PR_NUMBER --add-label "needs-review"
```

### Preferred Pattern: pull_request + workflow_run

When you need to run untrusted PR code AND access secrets/write permissions, split into two workflows:

**Step 1: Unprivileged `pull_request` workflow**

```yaml
# .github/workflows/pr-build.yaml
name: PR Build
on: pull_request

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4  # Safe - no secrets access

      - name: Build and test
        run: |
          npm install
          npm test

      - name: Save PR number
        run: echo "${{ github.event.number }}" > pr_number.txt

      - name: Upload results
        uses: actions/upload-artifact@v4
        with:
          name: pr-results
          path: |
            pr_number.txt
            test-results/
```

**Step 2: Privileged `workflow_run` workflow**

```yaml
# .github/workflows/pr-comment.yaml
name: PR Comment
on:
  workflow_run:
    workflows: ["PR Build"]
    types: [completed]

jobs:
  comment:
    runs-on: ubuntu-latest
    if: github.event.workflow_run.conclusion == 'success'
    steps:
      - name: Download artifacts
        uses: actions/download-artifact@v4
        with:
          name: pr-results
          run-id: ${{ github.event.workflow_run.id }}
          github-token: ${{ secrets.GITHUB_TOKEN }}

      - name: Comment on PR
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          PR_NUMBER=$(cat pr_number.txt)
          gh pr comment "$PR_NUMBER" --body "Build succeeded!"
```

### When pull_request_target is Necessary: Use Author Verification

If you must use `pull_request_target` with code checkout, use the repository's `check-author` action to verify the author is trusted:

```yaml
# Reference implementation from .github/workflows/pr.yaml
on:
  pull_request_target:
    types: [opened, synchronize, reopened, ready_for_review]

jobs:
  check-commit-author:
    runs-on: ubuntu-latest
    outputs:
      is_active_team_member: ${{ steps.team-check.outputs.is_active_member }}
    steps:
      - name: Generate GitHub App Token
        id: app-token
        uses: actions/create-github-app-token@67018539274d69449ef7c02e8e71183d1719ab42 # v2.1.4
        with:
          app-id: ${{ secrets.RHDH_GITHUB_APP_ID }}
          private-key: ${{ secrets.RHDH_GITHUB_APP_PRIVATE_KEY }}

      - name: Checkout main branch for secure version of check-author action
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
        with:
          fetch-depth: 1
          ref: main  # Always use main branch for security-critical action
          persist-credentials: false

      - name: Check if commit author is an active member of the team
        id: team-check
        uses: ./.github/actions/check-author
        with:
          author: ${{ github.actor }}
          organization: redhat-developer
          team: rhdh
          gh_token: ${{ steps.app-token.outputs.token }}
          whitelisted_authors: '["openshift-cherrypick-robot"]'

  authorize:
    environment:
      ${{ (needs.check-commit-author.outputs.is_active_team_member == 'true' || 
          github.event.pull_request.head.repo.full_name == github.repository) && 
          'internal' || 'external' }}
    runs-on: ubuntu-latest
    needs: check-commit-author
    steps:
      - name: Authorized
        run: echo "Author is authorized to run this workflow"

  build:
    needs: authorize
    runs-on: ubuntu-latest
    steps:
      - name: Checkout PR code (now safe after authorization)
        uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
        with:
          ref: ${{ github.event.pull_request.head.sha }}
          persist-credentials: false
```

---

## Action Pinning and Permissions

Reference: [GitHub Actions: Building Blocks](https://securitylab.github.com/resources/github-actions-building-blocks/)

### Pin Actions to Commit SHAs

**Always** pin third-party actions to full commit SHAs, not tags:

```yaml
# BAD - Tags can be moved to malicious commits
- uses: actions/checkout@v4
- uses: docker/login-action@v3

# GOOD - Pinned to immutable commit SHA with version comment
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
- uses: docker/login-action@9780b0c442fbb1117ed29e0efdff1e18412f7567 # v3
```

### Use persist-credentials: false

Always disable credential persistence unless explicitly needed:

```yaml
- uses: actions/checkout@34e114876b0b11c390a56381ad16ebd13914f8d5 # v4
  with:
    persist-credentials: false  # Prevents token from being stored on disk
```

### Explicit Permissions Block

Always declare the minimum required permissions:

```yaml
# At workflow level
permissions:
  contents: read
  pull-requests: write

# Or at job level for finer control
jobs:
  build:
    permissions:
      contents: read
    # ...

  deploy:
    permissions:
      contents: read
      packages: write
    # ...
```

### Common Permission Patterns

```yaml
# Read-only workflow (most restrictive)
permissions:
  contents: read

# PR workflows that need to comment
permissions:
  contents: read
  pull-requests: write

# Package publishing
permissions:
  contents: read
  packages: write

# Release workflows
permissions:
  contents: write
  packages: write
```

---

## Environment Variable Safety

Reference: [GitHub Actions: New Patterns and Mitigations](https://securitylab.github.com/resources/github-actions-new-patterns-and-mitigations/)

### NEVER Append Untrusted Data to GITHUB_ENV

```yaml
# DANGEROUS - Allows command injection via GITHUB_ENV
- name: Set environment
  run: |
    echo "BRANCH=${{ github.head_ref }}" >> $GITHUB_ENV  # UNSAFE!

# SAFE - Use env: block instead
- name: Use branch
  env:
    BRANCH: ${{ github.head_ref }}
  run: echo "Branch is $BRANCH"
```

### Safe GITHUB_ENV Usage

Only write trusted, validated data to `GITHUB_ENV`:

```yaml
# SAFE - Writing computed/validated values
- name: Compute values
  run: |
    # Safe - internally computed values
    SHORT_SHA="${GITHUB_SHA:0:7}"
    echo "SHORT_SHA=$SHORT_SHA" >> $GITHUB_ENV

    # Safe - output from trusted command
    DATE=$(date +%Y-%m-%d)
    echo "BUILD_DATE=$DATE" >> $GITHUB_ENV
```

### Use GITHUB_OUTPUT for Step Outputs

```yaml
- name: Generate output
  id: compute
  env:
    INPUT_VALUE: ${{ github.event.inputs.value }}
  run: |
    # Process the input safely
    result=$(echo "$INPUT_VALUE" | tr '[:upper:]' '[:lower:]')
    echo "result=$result" >> $GITHUB_OUTPUT

- name: Use output
  run: echo "Result: ${{ steps.compute.outputs.result }}"
```

---

## Artifact Security

### Treat Artifacts from Untrusted Sources as Untrusted

When using `workflow_run` to process artifacts from `pull_request` workflows:

```yaml
on:
  workflow_run:
    workflows: ["PR Build"]
    types: [completed]

jobs:
  process:
    runs-on: ubuntu-latest
    steps:
      - name: Download artifact
        uses: actions/download-artifact@v4
        with:
          name: build-results
          run-id: ${{ github.event.workflow_run.id }}
          github-token: ${{ secrets.GITHUB_TOKEN }}

      # DANGEROUS - Never execute downloaded binaries
      # - run: ./downloaded-binary

      # SAFE - Only read data files
      - name: Read PR number
        run: |
          PR_NUMBER=$(cat pr_number.txt)
          # Validate it's actually a number
          if ! [[ "$PR_NUMBER" =~ ^[0-9]+$ ]]; then
            echo "Invalid PR number"
            exit 1
          fi
```

### Validate Artifact Contents

```yaml
- name: Process artifact safely
  run: |
    # Validate file exists and is reasonable size
    if [[ ! -f "result.txt" ]] || [[ $(stat -c%s "result.txt") -gt 1000000 ]]; then
      echo "Invalid artifact"
      exit 1
    fi

    # Read and validate content
    CONTENT=$(cat result.txt)
    # Add validation as needed
```

---

## Repository-Specific Patterns

### Concurrency Control

Use concurrency to cancel duplicate runs **from the same PR or branch only**. A new push to PR A should cancel the previous workflow for PR A, but should NOT affect workflows for PR B.

```yaml
concurrency:
  # Group by workflow name + PR number (for PRs) or ref (for branches)
  # This ensures:
  #   - PR A's new workflow cancels PR A's old workflow
  #   - PR A's workflow does NOT cancel PR B's workflow
  #   - Push to branch X cancels previous push to branch X
  group: ${{ github.workflow }}-${{ github.event.number || github.ref }}
  cancel-in-progress: true
```

**How the group key works:**
- For pull requests: `github.event.number` provides the unique PR number (e.g., `my-workflow-123`)
- For branch pushes: `github.ref` provides the branch ref (e.g., `my-workflow-refs/heads/main`)
- Each unique group runs independently; only duplicate runs within the same group are cancelled

### Standard Workflow Header

```yaml
# Copyright Red Hat, Inc.
#
# Licensed under the Apache License, Version 2.0 (the "License");
# ...

name: Descriptive Workflow Name

on:
  pull_request:  # Or appropriate trigger

concurrency:
  group: ${{ github.workflow }}-${{ github.event.number || github.ref }}
  cancel-in-progress: true

permissions:
  contents: read

env:
  # Global environment variables
  REGISTRY: quay.io

jobs:
  # ...
```

### Environment-Based Authorization

Use GitHub Environments for manual approval gates:

```yaml
jobs:
  authorize:
    environment:
      ${{ (condition) && 'internal' || 'external' }}
    runs-on: ubuntu-latest
    steps:
      - run: echo "Authorized"

  deploy:
    needs: authorize
    # Proceeds only after environment approval
```

---

## Reusable Actions

### When to Create Reusable Actions

Create a reusable composite action in `.github/actions/` when:

1. Logic is used by multiple workflows
2. Logic is complex enough to benefit from encapsulation
3. Logic requires multiple steps that should be tested together

### Composite Action Template

```yaml
# .github/actions/my-action/action.yaml
name: "My Action"
description: "Description of what this action does"

inputs:
  required-input:
    description: "A required input"
    required: true
  optional-input:
    description: "An optional input"
    required: false
    default: "default-value"

outputs:
  result:
    description: "The result of the action"
    value: ${{ steps.main.outputs.result }}

runs:
  using: "composite"
  steps:
    - name: Validate inputs
      shell: bash
      env:
        INPUT_VALUE: ${{ inputs.required-input }}
      run: |
        if [[ -z "$INPUT_VALUE" ]]; then
          echo "Error: required-input is empty"
          exit 1
        fi

    - name: Main logic
      id: main
      shell: bash
      env:
        REQUIRED: ${{ inputs.required-input }}
        OPTIONAL: ${{ inputs.optional-input }}
      run: |
        # Your logic here
        echo "result=success" >> $GITHUB_OUTPUT
```

### Existing Reusable Actions

This repository provides the following reusable actions:

| Action | Purpose |
|--------|---------|
| `.github/actions/check-author` | Verify if PR author is a team member |
| `.github/actions/check-image-and-changes` | Check if image exists and detect relevant changes |
| `.github/actions/docker-build` | Build Docker images with hermetic build |
| `.github/actions/get-sha` | Get short SHA for tagging |

---

## Quick Reference Checklist

When creating or reviewing a workflow, verify:

- [ ] All GitHub context expressions are encapsulated in `env:` blocks
- [ ] No direct interpolation of untrusted inputs in `run:` scripts
- [ ] Actions are pinned to commit SHAs with version comments
- [ ] `permissions:` block is explicit and minimal
- [ ] `persist-credentials: false` used with `actions/checkout` where appropriate
- [ ] `pull_request_target` is only used when secrets/write access is truly needed
- [ ] If `pull_request_target` checks out PR code, author verification is in place
- [ ] No untrusted data is appended to `GITHUB_ENV`
- [ ] Artifacts from untrusted sources are validated before use
- [ ] Concurrency is configured to prevent duplicate runs

---

## References

- [Part 1: Preventing pwn requests](https://securitylab.github.com/resources/github-actions-preventing-pwn-requests/)
- [Part 2: Untrusted Input](https://securitylab.github.com/resources/github-actions-untrusted-input/)
- [Part 3: Building Blocks](https://securitylab.github.com/resources/github-actions-building-blocks/)
- [Part 4: New Patterns and Mitigations](https://securitylab.github.com/resources/github-actions-new-patterns-and-mitigations/)

---

---
root: false
targets:
  - '*'
globs: []
---
# Playwright Locator Best Practices

## Locator Priority (Use in Order)

1. **`page.getByRole(role, { name })`** - Interactive elements, headings (reflects user perception)
2. **`page.getByLabel(text)`** - Form controls with labels
3. **`page.getByPlaceholder(text)`** - Inputs without labels
4. **`page.getByText(text)`** - Non-interactive content only (avoid for buttons/links - use getByRole instead)
5. **`page.getByAltText(text)`** - Images
6. **`page.getByTitle(text)`** - Elements with title attribute
7. **`page.getByTestId(id)`** -  When semantic locators unavailable (uses `data-testid` attribute only)
8. **`page.locator(selector)`** - Avoid CSS/XPath unless necessary

## Quick Examples

```typescript
// ✅ GOOD - Semantic locators
await page.getByRole('button', { name: 'Submit' }).click();
await page.getByLabel('Username').fill('admin');
await page.getByPlaceholder('Search...').type('test');
await expect(page.getByText('Welcome')).toBeVisible();

// ✅ GOOD - Filtering and chaining
await page.getByRole('row')
  .filter({ hasText: 'Guest User' })
  .getByRole('button', { name: 'Edit' })
  .click();

// ❌ BAD - Using getByText for interactive elements
await page.getByText('Submit').click(); // Use getByRole('button', { name: 'Submit' }) instead

// ❌ BAD - Implementation-dependent selectors
await page.locator('.MuiButton-label').click();
await page.locator('div:nth-child(3)').click();
await page.locator('//*[@id="form"]/div[2]/input').fill('test');
```

## Anti-Patterns

- ❌ CSS class selectors (`.MuiButton-label`, `[class*="MuiTableCell"]`, `.MuiDataGrid-*`)
- ❌ Long XPath chains
- ❌ `nth-child` without semantic context
- ❌ Using `force: true` to bypass checks
- ❌ Mixing locator strategies inconsistently
- ❌ Using getByText for buttons or links (use getByRole instead)
- ❌ Targeting dynamically generated text (dynamic status, timestamps)
- ❌ Configuring custom test ID attributes (stick with `data-testid` only)
- ❌ Selecting elements without scoping (may match from wrong card/dialog)

## Assertions with Auto-Waiting

Playwright assertions automatically wait and retry (default: 5 seconds) until conditions are met. No manual waits needed.

```typescript
// ✅ Auto-waiting assertions
await expect(page.getByRole('button', { name: 'Submit' })).toBeVisible();
await expect(page.getByLabel('Status')).toHaveText('Submitted');
await expect(page.getByRole('list')).toHaveCount(5);

// ❌ Unnecessary manual waiting
await page.waitForSelector('.status'); // Don't do this, expect() waits automatically
```

**Common assertions**: `toBeVisible()`, `toBeHidden()`, `toBeEnabled()`, `toBeDisabled()`, `toBeChecked()`, `toHaveText()`, `toContainText()`, `toHaveValue()`, `toHaveCount()`, `toHaveAttribute()`

**Auto-checks before actions**: Visible, Stable (not animating), Enabled, Editable, Receives Events (not obscured)

## Filtering & Chaining

```typescript
// Filter by text or child elements
const row = page.getByRole('listitem').filter({ hasText: 'Product 2' });
const card = page.getByRole('article').filter({ 
  has: page.getByRole('button', { name: 'Delete' }) 
});

// Narrow scope with chaining
await page.getByTestId('dialog')
  .getByRole('button', { name: 'OK' })
  .click();

// Handle alternatives with .or()
const btn = page.getByRole('button', { name: 'New' });
const dialog = page.getByText('Confirm settings');
await expect(btn.or(dialog).first()).toBeVisible();
```

## Working with DataGrid Tables

```typescript
// ✅ GOOD - Use role-based locators for grids
await page.getByRole('grid').getByRole('row').filter({ hasText: 'Guest User' })
  .getByRole('button', { name: 'Edit' })
  .click();

await page.getByRole('columnheader', { name: 'Name' }).click();

// ✅ GOOD - Filter rows by text content
const userRow = page.getByRole('row').filter({ hasText: 'john@example.com' });
await expect(userRow).toBeVisible();

// ✅ GOOD - Scope within specific container to avoid conflicts
await page.getByTestId('users-card')
  .getByRole('grid')
  .getByRole('row')
  .filter({ hasText: 'Active' })
  .click();

// ❌ BAD - MUI class names (brittle, changes frequently)
await page.locator('.MuiDataGrid-row').click();
await page.locator('.MuiDataGrid-columnHeader').click();
await page.locator('[class*="MuiDataGrid"]').click();

// ❌ BAD - Selecting from wrong context
await page.getByRole('row').first().click(); // Could match row from any grid on page
```

## Page Objects

```typescript
// ✅ Return locators, not elements
class CatalogPage {
  constructor(private page: Page) {}

  getSearchInput(): Locator {
    return this.page.getByPlaceholder('Search');
  }

  getComponentLink(name: string): Locator {
    return this.page.getByRole('link', { name });
  }

  async findComponent(searchTerm: string): Promise<void> {
    await this.getSearchInput().fill(searchTerm);
    await this.getSearchInput().press('Enter');
  }
}
```

## Debugging

```bash
# Generate locators automatically
yarn playwright codegen http://localhost:7007

# Debug tests step-by-step
cd e2e-tests
# Export BASE_URL, an unlocked BW_SESSION, and the deployed namespaces first.
# Cluster-aware tests also require K8S_CLUSTER_URL and K8S_CLUSTER_TOKEN.
./local-test.sh -- --project="$PLAYWRIGHT_PROJECT" --debug

# Or pause in test
await page.pause();
```

## Resources

- **Full Guide**: `docs/e2e-tests/playwright-locator-best-practices.md`
- **Official Docs**: https://playwright.dev/docs/locators
- **Best Practices**: https://playwright.dev/docs/best-practices

## Remember

Good locators reflect how users interact with your app. Ask: "How would a user or screen reader find this element?"

---


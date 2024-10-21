# CI Steps and Processes for the Tests

This document provides a comprehensive overview of our continuous integration (CI) testing processes. We begin by explaining when and how different test jobs are triggered and where you can monitor them. Then, we delve deeper into the environments that host these tests and guide you on how to access them.

## GitHub Pull Requests

Once a new PR is opened at [backstage-showcase](https://github.com/janus-idp/backstage-showcase), tests can be triggered in two ways:

1. Marking the PR with the comment [`/ok-to-test`](https://prow.k8s.io/command-help#ok_to_test). _Only members of the janus-idp GitHub organization can set it._
2. Triggering the tests with [`/test` or `/test all`](https://prow.k8s.io/command-help#test) or [`/retest`](https://prow.k8s.io/command-help#retest). _Anyone can trigger it once the PR has been validated by a janus-idp member._

Any of these interactions will be picked up by the OpenShift-CI service, which will set up a test environment on the **IBM Cloud**, specifically on the `rhdh-pr-os` OpenShift Container Platform (OCP) cluster. The configurations and steps for setting up this environment are defined in the [`openshift-ci-tests.sh`](/.ibm/pipelines/openshift-ci-tests.sh) script.

**Note:** We do **not** have PR checks running on Azure Kubernetes Service (AKS); all PR checks are executed on the IBM Cloud's `rhdh-pr-os` cluster.

Detailed steps on how the tests and reports are managed can be found in the `run_tests()` function within the `openshift-ci-tests.sh` script. Also, all the different `yarn` commands that trigger various [Playwright projects](/e2e-tests/playwright.config.ts) are described [here](/e2e-tests/package.json).

When the test run is complete, the status will be reported under your PR checks.

**The environment in which the PR tests are executed is shared and ephemeral. All the PR tests queue for the same environment, which is destroyed and recreated for each PR.**

However, the test outputs (screenshots, recordings, walkthroughs, etc.) are stored for a retention period of **6 months** and can be accessed by checking the _Details -> Artifacts_ of the test check on the PR.

### Retrying Tests

PR tests are not automatically retried beyond the individual test retries specified in the Playwright configuration (each test is retried up to 2 times on failure). However, you can manually retrigger the entire test suite by commenting:

- `/retest e2e-tests`
- `/test all`

This is useful if you believe a failure was due to a flake or external issue and want to rerun the tests without making any code changes.

### CI Job Definitions

#### Pull Request Test Job

- **Purpose:** Validate new PRs for code quality, functionality, and integration.
- **Trigger:** When a PR is opened and `/ok-to-test` is commented by a janus-idp member, or when `/test`, `/test all`, or `/retest` is issued after validation.
- **Environment:** Runs on the ephemeral `rhdh-pr-os` cluster on IBM Cloud.
- **Configurations:**
  - Tests are executed on both **RBAC** and **non-RBAC** instances to ensure comprehensive coverage.
- **Steps:**
  1. **Detection:** OpenShift-CI detects the PR event.
  2. **Environment Setup:** The test environment is set up using the `openshift-ci-tests.sh` script.
  3. **Test Execution:**
     - **Running Tests:** Executes test suites using `yarn` commands specified in `package.json`.
     - **Retry Logic:** Individual tests are retried up to 2 times as specified in the Playwright configuration.
  4. **Artifact Collection:**
     - Collects test artifacts (logs, screenshots, recordings).
     - Stores artifacts in the designated `ARTIFACT_DIR` for a retention period of **6 months**.
  5. **Reporting:**
     - Reports status back to the PR checks.
     - Generates and uploads HTML reports.
- **Artifacts:** Test reports, logs, screenshots, accessible via PR details under _Artifacts_.
- **Notifications:** Status updates posted on the PR.
- **Manual Retriggering:**
  - Tests can be manually retriggered using the `/retest e2e-tests` or `/test all` commands in the PR comments.

## Nightlies

Nightly tests are run to ensure the stability and reliability of our codebase over time. These tests are executed on different clusters to cover various environments, including both **RBAC** and **non-RBAC** instances.

- **AKS Nightly Tests:** Nightly tests for Azure Kubernetes Service (AKS) run on the `bsCluster`. We do not have AKS PR checks; the AKS environment is exclusively used for nightly runs.

- **IBM Cloud Tests:** All nightly tests for the `main`, `1.3`, and `1.2` branches run against the `rhdh-pr-os` OpenShift Container Platform (OCP) cluster on IBM Cloud.

### Additional Nightly Jobs for Main Branch

- The nightly job for the `main` branch also runs against:
  - **`rhdh-os-1`** (currently OCP 4.14).
  - **`rhdh-os-2`** (currently OCP 4.15).

We regularly upgrade the clusters to ensure that `rhdh-pr-os` is always at the latest version we support. The team manages these upgrades to keep our test environments up-to-date with the newest supported OCP versions.

**Note:** The output of the nightly runs, including test results and any relevant notifications, is posted on the Slack channel **`rhdh-e2e-test-alerts`**. This allows the team to monitor test outcomes and promptly address any issues that arise.

### CI Job Definitions

#### Nightly Test Job

- **Purpose:** Ensure ongoing stability and detect regressions in different environments.
- **Trigger:** Scheduled to run every night.
- **Environments:**
  - **AKS Nightly Tests:** Runs on the `bsCluster`.
  - **IBM Cloud Nightly Tests:** Runs on the `rhdh-pr-os`, `rhdh-os-1`, and `rhdh-os-2` clusters.
- **Configurations:**
  - Tests are executed on both **RBAC** and **non-RBAC** instances to cover different security configurations.
- **Steps:**
  1. **Triggering:** Nightly job is triggered by the scheduler.
  2. **Environment Setup:** Uses the `openshift-ci-tests.sh` script for setting up the environment.
     - **Cluster Selection:** Chooses the appropriate cluster based on the job name.
     - **Resource Configuration:** Sets up namespaces and configures resources.
     - **Deployment:** Deploys the RHDH instance and necessary services.
  3. **Test Execution:**
     - Runs full test suites using the `yarn` commands.
     - Tests are executed similarly to the PR tests but may include additional suites.
     - **Retry Logic:** Individual tests are retried up to 2 times as specified in the Playwright configuration.
  4. **Artifact Collection:**
     - Collects and aggregates results.
     - Stores artifacts for later review for a retention period of **6 months**.
  5. **Reporting:**
     - Posts outputs to Slack channel `rhdh-e2e-test-alerts`.
     - Generates reports for team visibility.
- **Artifacts:** Comprehensive test reports, logs, screenshots.
- **Notifications:** Results posted on Slack.

## Supported Platforms and Testing Strategies

Our CI pipeline supports testing on multiple platforms to ensure compatibility and stability across different environments. Tests are executed on both **RBAC** and **non-RBAC** instances to ensure that our applications function correctly under different security configurations.

### Supported Platforms

- **Azure Kubernetes Service (AKS):**

  - **Cluster:** `bsCluster`
  - **Testing Strategy:** Nightly tests are executed to validate functionality on AKS, covering both RBAC and non-RBAC configurations.
  - **Notes:** No PR tests are conducted on AKS; it is exclusively used for nightly runs.

- **IBM Cloud OpenShift Clusters:**
  - **Clusters:**
    - **`rhdh-pr-os`** (latest supported OCP version)
    - **`rhdh-os-1`** (currently OCP 4.14)
    - **`rhdh-os-2`** (currently OCP 4.15)
  - **Testing Strategy:**
    - PR tests and nightly tests run on `rhdh-pr-os`, covering both RBAC and non-RBAC instances.
    - Additional nightly tests for the main branch run on `rhdh-os-1` and `rhdh-os-2` to validate against different OCP versions, including both RBAC and non-RBAC configurations.
  - **Notes:** Clusters are regularly upgraded to the latest supported OCP versions.

## Configuration and Installation of Testing Environments

### Automation Processes

- **Scripts Used:**
  - **`openshift-ci-tests.sh`:** Automates the setup of the test environment, deployment of RHDH instances, and execution of tests.
- **Automated Steps:**
  - **Environment Setup:**
    - **PR Tests:** Ephemeral environments are automatically created and destroyed per test run.
    - **Nightly Tests:** Use long-running clusters with automated updates.
  - **Deployment:**
    - RHDH instances are deployed using automated scripts and Helm charts.
  - **Test Execution:**
    - Tests are executed using `yarn` scripts defined in `package.json`.

### Configuration Details

- **Clusters:**
  - Configured with necessary resources and permissions.
  - Running specific versions of OpenShift (OCP 4.14, 4.15, latest).
- **RHDH Instances:**
  - Deployed with predefined configurations suitable for testing.
  - Ensures consistency across test runs.
- **Environment Variables and Secrets:**
  - Environment variables such as `AKS_NIGHTLY_CLUSTER_NAME` and secrets like GitHub credentials are stored securely in the **OpenShift-CI Vault**.
    - Located under **Pipeline** and **e2e-tests Secrets**.
  - These are made available to the scripts during runtime through secure methods.
- **Secrets Management:**
  - All sensitive information is managed securely within the OpenShift-CI Vault.
  - Access is controlled and audited to maintain security compliance.

### Maintenance Procedures

- **Upgrades:**
  - Clusters are upgraded to new versions as they become supported.
  - Upgrades are planned to minimize disruption to testing schedules.
- **Monitoring:**
  - Continuous monitoring for issues.
  - Logs and alerts set up for proactive management.
- **Artifacts Retention Policy:**
  - All test results and artifacts are retained for a period of **6 months**.
  - This allows for historical analysis and auditing if necessary.

# CI Steps and Processes for the Tests

This document provides a comprehensive overview of our continuous integration (CI) testing processes. We begin by explaining when and how different test jobs are triggered and where you can monitor them. Then, we delve deeper into the environments that host these tests and guide you on how to access them.

## GitHub Pull Requests

Once a new PR is opened at [backstage-showcase](https://github.com/janus-idp/backstage-showcase), tests can be triggered in two ways:

1. Marking the PR with the comment [`/ok-to-test`](https://prow.k8s.io/command-help#ok_to_test). _Only members of the janus-idp GitHub organization can set it._
2. Triggering the tests with [`/test` or `/test all`](https://prow.k8s.io/command-help#test) or [`/retest`](https://prow.k8s.io/command-help#retest). _Anyone can trigger it once the PR has been validated by a janus-idp member._

Any of these interactions will be picked up by the OpenShift-CI service, which will set up a test environment on the **IBM Cloud**, specifically on the `rhdh-pr-os` OpenShift Container Platform (OCP) cluster. The configurations and steps for setting up this environment are described [**here**](/.ibm/pipelines/openshift-ci-tests.sh).

**Note:** We do **not** have PR checks running on Azure Kubernetes Service (AKS); all PR checks are executed on the IBM Cloud's `rhdh-pr-os` cluster.

Detailed steps on how the tests and reports are managed can be found in the `run_tests()` function description. Also, all the different `yarn` commands that trigger various [Playwright projects](/e2e-tests/playwright.config.ts) are described [here](/e2e-tests/package.json).

When the test run is complete, the status will be reported under your PR checks.

**The environment in which the PR tests are executed is shared and ephemeral. All the PR tests queue for the same environment, which is destroyed and recreated for each PR.**

However, the test outputs (screenshots, recordings, walkthroughs, etc.) are stored for a reasonable amount of time and can be accessed by checking the _Details -> Artifacts_ of the test check on the PR.

## Nightlies

Nightly tests are run to ensure the stability and reliability of our codebase over time. These tests are executed on different clusters to cover various environments:

- **AKS Nightly Tests:** Only the nightly tests for Azure Kubernetes Service (AKS) run on the bsCluster. We do not have AKS PR checks; the AKS environment is exclusively used for nightly runs.

- **IBM Cloud Tests:** All nightly tests for the `main`, `1.3`, and `1.2` branches run against the `rhdh-pr-os` OpenShift Container Platform (OCP) cluster on IBM Cloud.

### Additional Nightly Jobs for Main Branch:

- The nightly job for the `main` branch also runs against `rhdh-os-1` (currently OCP 4.14).
- It also runs against `rhdh-os-2` (currently OCP 4.15).

We regularly upgrade the clusters to ensure that `rhdh-pr-os` is always at the latest version we support. The team manages these upgrades to keep our test environments up-to-date with the newest supported OCP versions.

**Note:** The output of the nightly runs, including test results and any relevant notifications, is posted on the Slack channel **`#rhdh-e2e-test-alerts`**. This allows the team to monitor test outcomes and promptly address any issues that arise.

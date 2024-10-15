# CI Steps and Processes for the Tests

This document is written from _front_ to _back_; we will start by looking at when the different test jobs are triggered and where you can see them, and we will delve deeper, looking into the environments that host them and where to find them.

## GitHub Pull Requests

Once a new PR is opened at [backstage-showcase](https://github.com/janus-idp/backstage-showcase), tests can be triggered in two ways:

1. Marking the PR with the comment [`/ok-to-test`](https://prow.k8s.io/command-help#ok_to_test). _Only members of the janus-idp GitHub organization can set it._
2. Triggering the tests with [`/test` or `/test all`](https://prow.k8s.io/command-help#test) or [`/retest`](https://prow.k8s.io/command-help#retest). _Anyone can trigger it once the PR has been validated by a janus-idp member._

Any of these interactions will be picked up by the OpenShift-CI service, which will set up a test environment on the IBM Cloud following the configurations and steps described [**here**](/.ibm/pipelines/openshift-ci-tests.sh).

Detailed steps on how the tests and reports are managed can be found in the `run_tests()` function description. Also, all the different `yarn` commands that trigger different [Playwright projects](/e2e-tests/playwright.config.ts) are described [here](/e2e-tests/package.json).

When the test run is done, the status will be reported under your PR checks.

**The environment in which the PR tests are executed is shared and ephemeral. All the PR tests queue for the same environment, which is destroyed and recreated for each PR.**

Nonetheless, the test outputs (screenshots, recordings, walkthroughs, etc.) are stored for a reasonable amount of time and can be seen by checking the _Details -> Artifacts_ of the test check on the PR.

## Nightlies

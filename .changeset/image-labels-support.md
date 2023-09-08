---
'app': patch
'backend': patch
---

Implemented Support for Custom Docker Image Labels in GitHub Actions Workflow:

Incorporated functionality to seamlessly manage custom labels for Docker images within the GitHub Actions workflow. The enhancements were made as follows:

1. **Enhanced Action Configuration (`action.yaml`):**
   - Introduced the `imageLabels` parameter in the Docker build action configuration.
   - The `imageLabels` parameter empowers users to define custom labels for Docker images during the build process.
2. **Improved Workflow Configuration (`nightly.yaml`):**
   - Introduced the `imageLabels` parameter in the workflow configuration.
   - Illustrative usage: Setting `imageLabels: quay.expires-after=14d` to specify a 14-day expiration for images.
   - When executing the nightly workflow, the Docker image will be enriched with the designated labels.

**Usage Guide:**
To leverage the new `imageLabels` parameter, navigate to the workflow configuration (`nightly.yaml`) and modify the `imageLabels` parameter as needed:

```yaml
jobs:
  release:
    ...
    steps:
      ...
      - name: Publish
        uses: ./.github/actions/docker-build
        with:
          ...
          imageLabels: "quay.expires-after=14d" # modify this
          push: true

```

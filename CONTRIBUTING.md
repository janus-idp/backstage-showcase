# Contributing

We are excited to see you want to be a part of this project by contributing. Here is some information on how to get started, as well as some knowledge on our requirements.

## Get Started

### Clone and Install

1. For the repository here in GitHub
2. Clone your forked version of the Showcase app
3. Install dependencies using `yarn install`
4. Run type generation and checks using `yarn tsc`

### Run the Showcase App

We currently have quite a bit of moving parts for the showcase application. As such we have documentation dedicated to the requirements for running the showcase app under [getting-started.md](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md)

Some useful package scripts for the application

```shell
yarn start # Starts the application
yarn tsc # Type generation and checks
yarn test
yarn test:e2e
yarn lint # Lint packages
yarn ci # Mirrors our CI in GitHub
yarn prettier:check # Checks for formatting errors
yarn prettier:fix # Fixes formatting errors
```

## Contributions

We welcome code and non-code contributions to our project. Non-code contributions can come in the form of documentation updates, bug reports, enhancement and feature requests.

### Bug Reporting

If you found a bug in our showcase app, please submit an [issue](https://github.com/janus-idp/backstage-showcase/issues/new?assignees=&labels=kind%2Fbug%2Cstatus%2Ftriage&template=bug.md) describing the problem that you ran into. Some important information to include are steps to reproduce the bug, the app-config.yaml that is being used, and any relevant logs. This will help us narrow down the potential cause of the bug and speed up the time it takes to solve the problem at hand.

**Please remember to remove all secrets from the app-config.yaml before sharing.**

### Updating Backstage Dependencies

1. Run the following command

   ```console
   yarn backstage-cli versions:bump --pattern '@{backstage,roadiehq,immobiliarelabs,janus-idp}/*'
   ```

2. Find and replace all `"^` with `"` filtered by `package.json` files.

### Enhancement Requests

Want an enhancement of a feature or workflow, you can submit an [issue](https://github.com/janus-idp/backstage-showcase/issues/new?assignees=&labels=kind%2Fenhancement%2Cstatus%2Ftriage&template=enhancement.md) describing the enhancement. Maybe you see a feature that we could provide a better experience to. This would be that opportunity to call it out. It is important to include in the issue what you are wanting to see improved, what the current behavior is, and what the new behavior you wish to see.

### Feature Requests

Want to see a new feature within the showcase app, file an [issue](https://github.com/janus-idp/backstage-showcase/issues/new?assignees=&labels=kind%2Ffeature%2Cstatus%2Ftriage&template=feature.md) detailing the new feature. Sometimes we don't know about the latest and greatest and this issue is a great way for you to communicate that to us. Be sure to include information on what you are trying to achieve with the new issue, what you will need, who will have access, and any relevant documentation / information on the new feature.

### Documentation

Documentation is another option for contributing to us. If there is documentation that is unclear or could use some TLC, please raise an issue.

### Pull Requests

Want to submit some changes to the code? The best place to start is to look through our issues for [bugs](https://github.com/janus-idp/backstage-showcase/issues?q=is%3Aopen+is%3Aissue+label%3Akind%2Fbug), [good first issues](https://github.com/janus-idp/backstage-showcase/issues?q=is%3Aopen+is%3Aissue+label%3A%22good+first+issue%22), and [help wanted](https://github.com/janus-idp/backstage-showcase/issues?q=is%3Aopen+is%3Aissue+label%3A%22help+wanted%22). Be sure to include a description of the changes made, which issue this PR will fix (if any), PR acceptance criteria, and any special notes to the reviewers.

Before submitting the PR, it is important to run some of our package scripts to ensure that the code changes will pass our CI workflow. These include running `yarn lint` `yarn prettier:write` `yarn test` `yarn test:e2e` and `yarn build`. This saves time from having to go back and make changes to your PR.

A special note. If there will be changes to the [app config](https://github.com/janus-idp/backstage-showcase/blob/main/app-config.yaml), we ask that [documentation](https://github.com/janus-idp/backstage-showcase/blob/main/showcase-docs/getting-started.md) be updated if it will be a requirement for running the app. We also ask to ensure that the app will still work in the case of dummy information being supplied to the app config. While it is not a hard requirement, it does help others with quickly being able to get up and running with the showcase app.

## Support

You can reach out to us in our [community slack channel](https://join.slack.com/t/janus-idp/shared_invite/zt-1pxtehxom-fCFtF9rRe3vFqUiFFeAkmg) if you run into any issues with setup, running, or testing the application. Members of the team and community can assist you with questions and concerns you might have. Even if you don't need help, please consider joining and being involved in our community.

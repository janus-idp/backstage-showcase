# GUIDE TO ONBOARD DEVELOPERS INTO OPENSHIFT

A guide for developers and platform engineers to onboard into containers and OpenShift.

## Introduction

Platform Team set up the OpenShift clusters. Clusters are ready to allocate workloads. Developers want to migrate their applications, but there needs to be a current process to onboard them. This document provides a template that can be used to design your onboarding process or use it as it is.

### Developer Team Guide: Where to start for Developers in their modernization Journey

The Developer Team processes to be ready to start their container journey.

1. Developer Foundational Learning: Follow the Lear
2. Application Assessment: Apply Twelve-Factor App for Containers.

[A checklist for The Top Twelve-Factor App for Containers]()

The application owner and the team will perform a high-Level application assessment to understand the application maturity level, risks, potential changes, and feasibility.

- [ ] I. Codebase: One codebase tracked in revision control, many deploys
- [ ] II. Dependencies: Explicitly declare and isolate dependencies
- [ ] III. Config: Store config in the environment
- [ ] V. Build, release, run: Strictly separate build and run stages
- [ ] XI. Logs: Treat logs as event streams
- [ ] Security and Compliance: Understand security and compliance to be implemented.

3. Request Access to OpenShift

If necessary for your organization, create an automated-repeatable process to gather information about the application and development team.

### Platform Team Checklist

This process describes the Platform Team process to grant access to the developer team and application to OpenShift, considering application and team requirements.

#### Step 1 Project Setup (Platform)

This process creates all the required resources for the development team and applications based on their requirements.

##### Platform Team Checklist

Developers will require a new namespace, access to the namespace, and other requirements to have their applications functional.

This is a recommended list to start creating your platform guide to successfully onboard teams and applications into OpenShift.

- [ ] 1- Project Provisioning per Team
  - [ ] Create namespaces for Lower Level Environment
    - [ ] Give users access to each LLE and registry
    - [ ] Projects setup
    - [ ] Resource Management
- [ ] 2- Application Configuration in OpenShift
  - [ ] Application access (If the team specified the inbound/outbound dependencies)
  - [ ] Network policies per each namespace following company guidelines
  - [ ] Application route definition
  - [ ] Firewall rules setup per each component/dependency
- [ ] 3- CI/CD
  - [ ] CI/CD access (For ex. Jenkins/OpenShift Pipelines)
  - [ ] OpenShift access to the company registry. For example: [Quay Container Registry](https://quay.io/)
- [ ] 4- Integrations required from OpenShift
  - [ ] Access to the Company Application Logging Tooling
    - [ ] Create a new index for the application.
  - [ ] Access to the Company Observability & Monitoring tooling
- [ ] 5- Security
  - [ ] Access to any Auth/Authorization/Policies tool that’s required for the application
    - [ ] Create new policies
  - [ ] Certificate creation is defined, and guidelines are shared.
  - [ ] Access to the Company Vault
  - [ ] Access to the certificates repository
    - [ ] Create new certificates
- [ ] 6- Send a welcome email to Developers

#### Step 2 Welcome OpenShift

Send confirmation to the user. Developers will follow the Developer Guide for Containers.

# Platform Services API

This is the README file for engineers wishing to get familiar with how the MCAP Platform Services API works. For an overview of MCAP, please see [our software system architecture documentation](https://structurizr.calipsa.biz/share/4).

## Introduction

Platform Services API is the sole interface for MCAP integration partners. Please refer our [basic concepts document for integration partners](openapi/docs/topics/01-basic-concepts.md) to understand what this is and how it works.

## OpenAPI Specification

Services API is a contract-first service, defined by its [service definition in OpenAPI 3.1](openapi/index.json).

### Contract Development

We use [Stoplight](https://docs.calipsa.io) as a contract development tool. Log in with the MSI SSO option.

### API Publishing
We use bump.sh to publish our documentation to [a central website](https://docs-mcap.motorolasolutions.com/) for internal and external parties to view.

To publish the service definition to bump.sh:
1. tag the release commit with `documentation/<openapi-definition-number>` (example: `documentation/1.68.0`),
1. then run the [Publish API Documentation](https://github.com/msi-calipsa/services-api/actions/workflows/publish-api-doc.yml) GitHub action.

## Environments

### Local Environment

[Set up your local environment](docs/Local-Setup.md): no VPN required.

Sometimes it's necessary to do a full dependency rebuild. Because of some cross-platform compatibility issues when running `npm install` without `node_modules`, we've instead added a script that will allow Services API to work on environments (both local workstations and deployed). To do this, run `npm run rebuild`.

### DEV Environment

Our development environment is accessible from URLs that match the pattern `*.calipsa.biz`. This has historically been referred to as our "staging" environment, but in reality it is our first stop (after local development) along our CI/CD pipeline. By its nature, it's an unstable environment that may break for a variety of reasons, so we discourage teams outside of MCAP to interface with it.

### Integration Environments

The INT environment serves are our main point of validation, and it is for MCAP integration partners to have a sandbox for their own exploration and testing. Stored data in this environment is stable, and all end-to-end tests passing in this environment before being promoted to production.

Promotion from INT to Production is completed with an approval of the INT/QA workflow run (through GitHub Actions).

### Production Environments

There are currently a three production environments:
- US Commercial (Alta Video US customers, **coming soon** Unity VFD customers)
- US Gov (**coming soon**: Vehicle Manager / Image Search Service MCAP integration partner)
- EU Commercial (this is a deployment which is currently shared with the Calipsa EU environment and is for non-US Alta customers)

The production approval of the INT/QA workflow will push to *all* of the above environments using a 10-then-100% canary rollout strategy.

## Continuous Integration

This is how you, as a team member, make and deploy changes to Services API:

1. Assign the relevant JIRA issue to yourself (e.g., CLSAPI-481) and mark it `In Progress`.
1. Create a feature branch from `main` with the JIRA name in it.
    - This is an ephemeral branch, so the naming isn't really that important.
    - I like to use `git -b checkout <task_type>/<JIRA-issue-number>_<brief description>`. Example: `task/CLSAPI-481_doc-refresh`
1. You can manually deploy code to the dev environment:
    - Navigate to the [Deploy To Staging Workflow](https://github.com/msi-calipsa/services-api/actions/workflows/deploy-staging.yml).
    - Click on Run Workflow ([see the screenshot for help](docs/deploy-to-dev-manually.jpg))
1. Push commits to the branch as you work on the change.
    - These don't have to follow conventional commits.
    - Don't forget to align the version in `package.json` / `package-lock.json` with the [OpenAPI definition version](./openapi/index.json) according to semantic versioning principles. For example, for the version `1.65.2`:
        - A refactor but no change to the OpenAPI definition does not require a change to any of these files.
        - Incrementing to `1.65.3` indicates a change to the OpenAPI file that is either a documentation clarification or a documentation bugfix.
        - Incrementing to `1.66.0` indicates a compatible change to the API (e.g., property addition, new endpoint).
        - Incrementing to `2.0.0` indicates an incompatible change to the API (this should be rare and should be discussed with the team). 
1. [Create a PR](https://github.com/msi-calipsa/services-api/compare) and seek discussion.
    - Use [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) for the PR title and then tack on the JIRA issue number (e.g., `docs: modernized specification #CLSAPI-481`)
    - Feel free to draft a PR, then convert it to `Ready for Review` when you think you have a good candidate. (I like the built-in diff tool for GitHub, so a draft PR is useful for this.)
    - If you're being thorough, change the status of the JIRA issue to `In Review`.
1. Once approved, [squash merge](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges#squash-and-merge-your-commits) the PR.
    - This will delete your feature branch and will initiate [a deployment](https://github.com/msi-calipsa/services-api/actions/workflows/deploy-staging.yml) to the dev environment.
    - End-to-end tests will run after deployment to help ensure there aren't regressions.
    - Change the status of the JIRA issue to `In Staging`.

## Continuous Delivery

This is how changes are promoted to our integration and production environments.

1. To deploy to the integration environments, create (and push) a tag on the commit you want deployed.
    - Prepend `v` to the version number in `package.json`  and then append `-<build-sequence-number>`.
        - Example (first build on the `1.66.0` track): `v1.66.0-0`
        - Example (second build on the `1.66.0` track): `v1.66.0-1`
    - This tag is almost always from a commit that's on or near the `main` branch.
    - After tagging, [the integration deployment](https://github.com/msi-calipsa/services-api/actions/workflows/deploy-int-qa-prod.yml) will run.
1. This will push changes to both INT and QA simultaneously.
1. End-to-end tests will only be run on INT.
1. The workflow will be paused, waiting for production approval by one of the team leads.
1. After production approval (and a review of any environment variable changes), the changes will be deployed to all production environments.
    - Services API is a canary deployment for production, initially set to 10% of all traffic.
    - Once the deployment is verified, you must use the canary tool (see the canary section of [this Confluence page](https://confluence.mot-solutions.com/x/9km_Mg)) to promote each environment to 100%.
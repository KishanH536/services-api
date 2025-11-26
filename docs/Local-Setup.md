---
internal: true
stoplight-id: 0qcc4glp7k94v
---

# Setup for Running Locally

## Introduction

This document describes setting up this service to run locally for testing and debugging purposes.

## Set up your local database

You only need to follow the instructions in this section _once_.

1. Install PostgreSQL using your favorite method to run it locally. If you don't have a favorite method, may I suggest one of the following options?
    - [`brew install postgresql@16`](https://wiki.postgresql.org/wiki/Homebrew) for MacOS
    - [Docker Image](https://github.com/docker-library/docs/blob/master/postgres/README.md)
    - An [installer](https://www.enterprisedb.com/downloads/postgres-postgresql-downloads)
1. Create a database named `mcap` using your local postgres instance by issuing the following commands:
    - `$ psql postgres`
    - `postgres=# create database mcap;`
    - `postgres=# quit`
    - If you are unsure of your postgres username, you can run the following to get it:
        - `$ psql mcap`  
        - `mcap=# \conninfo`
1. Clone the [MCAP DB Migrations repository](https://github.com/msi-calipsa/db-migration-mcap?tab=readme-ov-file).
1. Apply the migration for the `mcap` database to initialize it (follow the instructions [here](https://github.com/msi-calipsa/db-workflows/blob/main/README.md#local-database) and issue the following commands from the root directory)
    - `$ export GOOSE_DRIVER=postgres`
    - `$ export GOOSE_DBSTRING=postgres://127.0.0.1:5432/mcap`
    - `$ export GOOSE_MIGRATION_DIR=./sql-migrations`
    - `$ goose up`

## Generate an integration partner token

You only need to follow the instructions in this section _once_.

Install and start the MCAP Admin API:

1. Clone the [MCAP Admin API repository]((https://github.com/msi-calipsa/mcap-admin-api))
1. Copy `env/sample.env` to a file named `local.env`
1. In `local.env`, set the following values:
    - Set `DB_USER` to your postgres username
    - Set `DB_PASSWORD` to the administrative postgres password you set (it might be the empty string)
    - Set `JWT_SECRET` to your own JWT secret; generate one with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`
1. Run `npm ci` and then `npm run local` from the root directory.

Install and start the MCAP Admin Web App:
1. Clone the [MCAP Admin Web App repository]((https://github.com/msi-calipsa/mcap-admin-web-app))
1. Run `npm ci` and then `npm start` from the root directory. A browser window running at `http://localhost:3000` should start up and you should see a login screen.

Create an integration partner on the website:
1. Login on the home screen, click Remember Me, and then click Sign In.
    - Use the email address `mcap-super-admin@motorolasolutions.com`
    - Use the password `McapSuper123!`
1. Create a new integration partner.
    - Click the New Integration Partner button.
    - Enter any name you wish.
    - Select all of the capabilities you wish for this integration partner (it's recommended that you select all of them).
    - Click Create.
1. A dialog box with the copy icon will appear with the integration partner token in it. Click the copy icon to save this token to your clipboard. _Use this token when calling the API!_

You can now stop the node processes for both the MCAP Admin Web App and the MCAP Admin API. You won't need them again (unless you need to create another integration partner).

## Run Services API locally

### Environment

To configure required environment variables, copy the `env/sample-mcap.env` file to `env/local.env` and make the following changes:
- Set `DB_USER` to your postgres username
- Set `DB_PASSWORD` to the administrative postgres password you set (it might be the empty string)
- Set `JWT_SECRET` to the JWT secret you used when you ran the MCAP Admin API

### Dependency Installation

Your *.npmrc* file allows private NPM packages to be pulled from GitHub.

This is what your *.npmrc* file should look like in order to be able to install locally:

```javascript
@msi-calipsa:registry=https://npm.pkg.github.com 
//npm.pkg.github.com/:_authToken=xxx_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

You should replace the *_authToken* value with your GitHub Personal Access Token. Go to your GitHub account and generate one if you haven't already.

Make sure that your *.npmrc* file is secure and do not check it in to a repo. I personally have it in my home directory so that it can be used for all repositories.

Then run:

```
$ npm ci
```

### Running

To start Services API locally, run:

```
$ npm run local
```

### Using

Of course you can use a tool like `curl` to call the API endpoints locally, but our team uses Postman pretty extensively to both document usage patterns and make it easy to configure MCAP resources. See [our Postman collection](../postman/collections/services-api-collection.json) for details. The team itself has a shared Postman workspace, which is always up to date. The collection stored here is occasionally synced with the workspace so that we can point integration partners to it for sample usage.

## Perform Analytics using APS

You'll be able to create companies, clients, sites, and camera views simply by running Platform Services API. But to be able to use the analytic endpoints (the ones backed by the AI services), you'll need to access a running instance of the Analytics Processing Service (APS) on local port 9095. There are two ways to do this:
1. Run one yourself locally (note: if you need to test scene change with pre-configured reference images, you'll need to select this option).
1. Use the one on the staging cluster by [port forwarding the service](../scripts/redirect-staging.sh).

To run your own, clone [APS](https://github.com/msi-calipsa/alarm-processor) and follow the installation instructions located in its `README.md` file.

### Testing
#### Testcontainers and Rancher Desktop
Some tests use the [Testcontainers](https://node.testcontainers.org/) library for integrated DB testing. This library creates a Postgres instance in a local Docker container, with queries being executed against this DB instance rather than the remote DB used for development. This allows us to test more complex queries in a more controlled environment.

I recommend using [Rancher Desktop](https://rancherdesktop.io/) for container management rather than Docker Desktop, as MSI has opted not to purchase a license for enterprise use. To use Rancher Desktop with Testcontainers, the latest version must be used, and the following settings in Rancher Desktop must have the values below:

- Preferences >> Virtual Machine >> Emulation >> Virtual Machine Type: VZ
- Preferences >> Container Engine: dockerd (moby)

It _might_ also be the case, that specific environment variables need to be set on the local development machine. These three variables have been added to the appropriate `npm` script, but if you have trouble with the script (or you want to use a different one), please make sure that the following environment variables have been evaluated and set:

- `DOCKER_HOST=unix://$HOME/.rd/docker.sock`
- `TESTCONTAINERS_DOCKER_SOCKET_OVERRIDE=/var/run/docker.sock`
- `TESTCONTAINERS_HOST_OVERRIDE=$(rdctl shell ip a show vznat | awk '/inet / {sub("/.*",""); print $2}')`

Ref: [https://golang.testcontainers.org/system_requirements/rancher/](https://golang.testcontainers.org/system_requirements/rancher/)

If you are using a different program, consult the Testcontainers documentation on how to set it up manually, or you can skip all tests that use it by running `npm run test:no-containers`.

#### Running Tests Using `npm`
There are three commands to run tests:

- `npm test`
- `npm run test:local`
- `npm run test:no-containers`

`npm test` is used by GitHub for automated testing. This script does not export the above environment variables for Testcontainers, as these set the Docker host to Rancher Desktop. If these variables are set in the GitHub runtime environment, the tests will throw an error.

`npm run test:local` should be the default test script used by devs, as this runs all tests, including those that require Testcontainers to run. To run a single test or use another pattern matching argument with Jest, you can append it to the `npm` command, e.g., `npm run test:local -- /path/to/file` 

`npm run test:no-containers` is used to run the full set of tests while excluding any tests that use Testcontainers. By convention, tests that include integrated DB testing via Testcontainers have `_db` appended to their file name, e.g., `src/core/__tests__/test_db.js`, so file names matching this pattern will be excluded.
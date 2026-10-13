# Aurora Serverless v2 with Lambda and API Gateway

A CDK TypeScript app that deploys an Aurora PostgreSQL Serverless v2 cluster, a Lambda function that reads the database credentials from Secrets Manager and runs `SELECT NOW()`, and a REST API in front of the function.

## Prerequisites

- A valid [LocalStack for AWS license](https://localstack.cloud/pricing). Your license provides a [`LOCALSTACK_AUTH_TOKEN`](https://docs.localstack.cloud/aws/getting-started/auth-token/) to activate LocalStack.
- [`lstk` CLI](https://docs.localstack.cloud/aws/developer-tools/running-localstack/lstk/)
- [Node.js](https://nodejs.org/en/download/) with NVM (Node Version Manager)
- [AWS CDK](https://docs.localstack.cloud/user-guide/integrations/aws-cdk/) with the `lstk cdk` proxy

## Start LocalStack

Start LocalStack with the `LOCALSTACK_AUTH_TOKEN` pre-configured:

```shell
export LOCALSTACK_AUTH_TOKEN=<your-auth-token>
make start
```

# Setup
1. Install Node Version Manager (NVM)
https://github.com/nvm-sh/nvm#installing-and-updating
2. Select Node version 22
```shell
nvm install 22
```

# Build and Deploy
1. Install packages in this repo. Use `npm`, having issues with `yarn` and CDK.
```shell
npm install
```
2. Install `aws-cdk` and `lstk` CLI
```shell
npm install -g aws-cdk @localstack/lstk
```
3. Bootstrap the CDK project for LocalStack
```shell
lstk cdk bootstrap aws://000000000000/us-east-1
```
4. Deploy CDK project to LocalStack
```shell
lstk cdk deploy
```

Or run steps 1, 3 and 4 with `make deploy`.

# Test

```shell
make test
```

`test.sh` checks the credentials secret has the connection fields the cluster attaches to it, then calls the API and expects a `200` with `{"message": "DB Response: <timestamp>"}` from the database.

On an x86_64 machine, start LocalStack with `LOCALSTACK_LAMBDA_IGNORE_ARCHITECTURE=1` so the arm64 function runs without emulation.

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    run the jest unit tests against the synthesized template
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

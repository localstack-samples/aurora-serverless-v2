# Welcome to your CDK TypeScript project
The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Prerequisites

- A valid [LocalStack for AWS license](https://localstack.cloud/pricing). Your license provides a [`LOCALSTACK_AUTH_TOKEN`](https://docs.localstack.cloud/getting-started/auth-token/) to activate LocalStack.
- [`localstack` CLI](https://docs.localstack.cloud/getting-started/installation/#localstack-cli)
- [Node.js](https://nodejs.org/en/download/) with NVM (Node Version Manager)
- [AWS CDK](https://docs.localstack.cloud/user-guide/integrations/aws-cdk/) with the [`cdklocal`](https://www.npmjs.com/package/aws-cdk-local) wrapper

## Start LocalStack

Start LocalStack with the `LOCALSTACK_AUTH_TOKEN` pre-configured:

```shell
export LOCALSTACK_AUTH_TOKEN=<your-auth-token>
make start
make ready
```

# Setup
1. Install Node Version Manager (NVM)
https://github.com/nvm-sh/nvm#installing-and-updating
2. Select Node version 18
```shell
nvm install 18
```

# Build and Deploy
1. Install packages in this repo. Use `npm`, having issues with `yarn` and CDK.
```shell
npm install
```
2. Install `aws-cdk` and `aws-cdk-local` CLI
```shell
npm install -g aws-cdk
npm install -g aws-cdk-local
npm install aws-cdk-lib constructs
```
3. Bootstrap the CDK project for LocalStack
```shell
cdklocal bootstrap aws://000000000000/us-east-1
```
4. Deploy CDK project to LocalStack
```shell
cdklocal deploy
```

## Useful commands

* `npm run build`   compile typescript to js
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the jest unit tests
* `cdk deploy`      deploy this stack to your default AWS account/region
* `cdk diff`        compare deployed stack with current state
* `cdk synth`       emits the synthesized CloudFormation template

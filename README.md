# Welcome to your CDK TypeScript project
The `cdk.json` file tells the CDK Toolkit how to execute your app.

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

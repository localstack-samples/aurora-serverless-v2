import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import {
  InstanceType,
  SecurityGroup,
  SubnetType,
  Vpc,
  Peer,
  Port
} from 'aws-cdk-lib/aws-ec2';
const cognito = require("aws-cdk-lib/aws-cognito");
const s3 = require("aws-cdk-lib/aws-s3");
const ec2 = require("aws-cdk-lib/aws-ec2");
const ssm = require("aws-cdk-lib/aws-ssm");
const secrets = require("aws-cdk-lib/aws-secretsmanager");

import { Aspects, CfnOutput, Duration, SecretValue, aws_iam as iam } from 'aws-cdk-lib';
import { CfnDBCluster } from 'aws-cdk-lib/aws-rds';

export class AuroraServerlessV2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create a vpc
    const vpc = new Vpc(this, 'VPC', {
      cidr: '10.0.0.0/16',
      subnetConfiguration: [{ name: 'egress', subnetType: SubnetType.PUBLIC },{ name: 'db', subnetType: SubnetType.PRIVATE_ISOLATED }], // only one subnet is needed
      natGateways: 0 // disable NAT gateways
    });

    // create a security group for aurora db
    const dbSecurityGroup = new SecurityGroup(this, 'DbSecurityGroup', {
      vpc: vpc, // use the vpc created above
      allowAllOutbound: true // allow outbound traffic to anywhere
    });

    // allow inbound traffic from anywhere to the db
    dbSecurityGroup.addIngressRule(
      Peer.anyIpv4(),
      Port.tcp(5432), // allow inbound traffic on port 5432 (postgres)
      'allow inbound traffic from anywhere to the db on port 5432'
    );

    // Dynamically generate the username and password, then store in secrets manager
    const databaseCredentialsSecret = new secrets.Secret(
      this,
      "DBCredentialsSecret",
      {
        secretName: id + "-rds-credentials",
        generateSecretString: {
          secretStringTemplate: JSON.stringify({
            username: "serverless",
          }),
          excludePunctuation: true,
          includeSpace: false,
          generateStringKey: "password",
        },
      }
    );

    const dbsecret = rds.Credentials.fromSecret(databaseCredentialsSecret);

    const dbCluster = new rds.ServerlessCluster(this, "serverless-db", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_14_4,
      }),
          // engine: rds.DatabaseClusterEngine.AURORA_POSTGRESQL,
      defaultDatabaseName: "serverless",
      vpc: vpc,
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.ISOLATED,
      }),
      securityGroups: [dbSecurityGroup],
      scaling: {
        autoPause: Duration.minutes(0), // Enable auto-pause after 5 minutes
        minCapacity: 2, // Minimum ACUs
        maxCapacity: 16, // Maximum ACUs
      },
      credentials: dbsecret,
    })


    // create a lambda function
    // you can read more about lambda functions here: https://www.codewithyou.com/blog/writing-typescript-lambda-in-aws-cdk
    const fn = new NodejsFunction(this, 'Lambda', {
      entry: './lambda/index.ts',
      runtime: Runtime.NODEJS_16_X,
      handler: 'main',
      architecture: Architecture.ARM_64,
      bundling: {
        externalModules: ['aws-sdk', 'pg-native'],
        minify: false
      },
      environment: {
        DATABASE_SECRET_ARN: databaseCredentialsSecret.secretArn, // pass the secret arn to the lambda function
      }
    });

    // allow the lambda function to access credentials stored in AWS Secrets Manager
    // the lambda function will be able to access the credentials for the default database in the db cluster
    databaseCredentialsSecret.grantRead(fn);

    // create a lambda rest api
    // you can read more about lambda rest apis here: https://www.codewithyou.com/blog/creating-a-lambda-rest-api-in-aws-cdk
    const api = new LambdaRestApi(this, 'Api', {
      handler: fn
    });

    // create a cfn output for the api url
    new CfnOutput(this, 'ApiUrl', {
      value: api.url
    });
  }
}

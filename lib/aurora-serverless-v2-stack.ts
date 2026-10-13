import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { LambdaRestApi } from 'aws-cdk-lib/aws-apigateway';
import { Architecture, Runtime } from 'aws-cdk-lib/aws-lambda';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secrets from 'aws-cdk-lib/aws-secretsmanager';
import {
  SecurityGroup,
  SubnetType,
  Vpc,
  Peer,
  Port
} from 'aws-cdk-lib/aws-ec2';
import { CfnOutput } from 'aws-cdk-lib';

export class AuroraServerlessV2Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // create a vpc
    const vpc = new Vpc(this, 'VPC', {
      ipAddresses: cdk.aws_ec2.IpAddresses.cidr('10.0.0.0/16'),
      subnetConfiguration: [{ name: 'egress', subnetType: SubnetType.PUBLIC },{ name: 'db', subnetType: SubnetType.PRIVATE_ISOLATED }],
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

    // Aurora Serverless v2: a cluster with a db.serverless writer instance.
    // The cluster attaches to the secret, which adds host, port and dbname to it.
    new rds.DatabaseCluster(this, "serverless-db", {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_16_4,
      }),
      writer: rds.ClusterInstance.serverlessV2('writer'),
      serverlessV2MinCapacity: 0.5, // Minimum ACUs
      serverlessV2MaxCapacity: 16, // Maximum ACUs
      defaultDatabaseName: "serverless",
      vpc: vpc,
      vpcSubnets: { subnetType: SubnetType.PRIVATE_ISOLATED },
      securityGroups: [dbSecurityGroup],
      credentials: rds.Credentials.fromSecret(databaseCredentialsSecret),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // create a lambda function
    // you can read more about lambda functions here: https://www.codewithyou.com/blog/writing-typescript-lambda-in-aws-cdk
    const fn = new NodejsFunction(this, 'Lambda', {
      entry: './lambda/index.ts',
      runtime: Runtime.NODEJS_22_X,
      handler: 'main',
      architecture: Architecture.ARM_64,
      timeout: cdk.Duration.seconds(30),
      bundling: {
        externalModules: ['@aws-sdk/*', 'pg-native'],
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

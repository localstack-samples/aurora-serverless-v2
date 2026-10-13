import * as cdk from 'aws-cdk-lib';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as AuroraServerlessV2 from '../lib/aurora-serverless-v2-stack';

const app = new cdk.App();
const stack = new AuroraServerlessV2.AuroraServerlessV2Stack(app, 'MyTestStack');
const template = Template.fromStack(stack);

test('Aurora PostgreSQL cluster uses Serverless v2 scaling', () => {
  template.hasResourceProperties('AWS::RDS::DBCluster', {
    Engine: 'aurora-postgresql',
    DatabaseName: 'serverless',
    ServerlessV2ScalingConfiguration: { MinCapacity: 0.5, MaxCapacity: 16 },
  });
  template.hasResourceProperties('AWS::RDS::DBInstance', {
    DBInstanceClass: 'db.serverless',
  });
});

test('The cluster is attached to the credentials secret', () => {
  template.resourceCountIs('AWS::SecretsManager::SecretTargetAttachment', 1);
});

test('The Lambda function gets the secret ARN', () => {
  template.hasResourceProperties('AWS::Lambda::Function', {
    Runtime: 'nodejs22.x',
    Environment: { Variables: { DATABASE_SECRET_ARN: Match.anyValue() } },
  });
});

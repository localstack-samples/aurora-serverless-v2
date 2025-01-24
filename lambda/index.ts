import { GetSecretValueCommand, SecretsManagerClient } from '@aws-sdk/client-secrets-manager';
import { APIGatewayEvent, APIGatewayProxyResult } from 'aws-lambda';
import { Client } from 'pg';

export async function main(event: APIGatewayEvent): Promise<APIGatewayProxyResult> {
  const secretsClient = new SecretsManagerClient({});
  
  try {
    // Validate environment variable
    if (!process.env.DATABASE_SECRET_ARN) {
      throw new Error('Environment variable "databaseSecretArn" is not defined.');
    }

    // Fetch secret
    const secret = await secretsClient.send(
      new GetSecretValueCommand({ SecretId: process.env.DATABASE_SECRET_ARN })
    );

    // Validate secret content
    const secretString = secret.SecretString;
    if (!secretString) {
      throw new Error('SecretString is null or undefined.');
    }

    const secretValues = JSON.parse(secretString);

    const requiredFields = ['host', 'port', 'username', 'password', 'dbname'];
    for (const field of requiredFields) {
      if (!secretValues[field]) {
        throw new Error(`Missing required field "${field}" in secret.`);
      }
    }

    // Connect to the database
    const db = new Client({
      host: secretValues.host,
      port: parseInt(secretValues.port, 10),
      user: secretValues.username,
      password: secretValues.password,
      database: secretValues.dbname,
    });

    await db.connect();
    const result = await db.query('SELECT NOW()');
    await db.end();

    return {
      statusCode: 200,
      body: JSON.stringify({ message: `DB Response: ${result.rows[0].now}` }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
}
import * as AWS from 'aws-sdk';

const secretsManager = new AWS.SecretsManager();

export async function getSecretByName(secretName: string): Promise<string> {
  const secretsList: AWS.SecretsManager.ListSecretsResponse = await secretsManager.listSecrets().promise();
  const secret: AWS.SecretsManager.SecretListEntry | undefined = secretsList.SecretList?.find(
      (s) => s.Name === secretName
  );

  if (!secret || !secret.ARN) throw new Error(`Secret "${secretName}" not found`);

  const response: AWS.SecretsManager.GetSecretValueResponse = await secretsManager
      .getSecretValue({ SecretId: secret.ARN })
      .promise();

  if (!response.SecretString) throw new Error(`Secret "${secretName}" has no value`);

  return response.SecretString;
}
import { Config } from '@backstage/config';
import { Router, Request } from 'express';
import { Logger } from 'winston';
import { errorHandler } from '@backstage/backend-common';
import { CredentialsOptions } from 'aws-sdk/lib/credentials';
import { ClientConfiguration } from 'aws-sdk/clients/s3';
import AWS, { AWSError } from 'aws-sdk';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

function createClient(config: Config) {
  const awsConfig = config.getOptionalConfig('techdocs.publisher.awsS3');

  const cred: CredentialsOptions = {
    accessKeyId: awsConfig?.getOptionalString('credentials.accessKeyId') || '',
    secretAccessKey:
      awsConfig?.getOptionalString('credentials.secretAccessKey') || '',
  };

  const options: ClientConfiguration = {
    endpoint: awsConfig?.getOptionalString('endpoint'),
    credentials: cred,
    region: awsConfig?.getOptionalString('region'),
    s3ForcePathStyle: awsConfig?.getOptionalBoolean('s3ForcePathStyle'),
  };

  return new AWS.S3(options);
}

export function createRouter({ config }: RouterOptions): Promise<Router> {
  const router = Router();

  router.get('/:directory/:file', async (request: Request, response) => {
    const directory = request.params.directory;
    const file = request.params.file;
    const key = `${directory}/${file}`;

    const s3AWS = createClient(config);

    const awsBucketName =
      config.getOptionalString('techdocs.publisher.awsS3.bucketName') || '';

    const params = {
      Bucket: awsBucketName,
      Key: key,
    };

    try {
      const contents = JSON.parse(
        (await s3AWS
          .getObject(params)
          .promise()
          .then(data => data.Body?.toString())) || '',
      );
      response.status(200);
      response.contentType('application/json');
      response.send(contents);
    } catch (err: unknown) {
      response.status((err as AWSError).statusCode || 500);
      response.send(JSON.stringify((err as AWSError).message));
    }
  });

  router.use(errorHandler());
  return Promise.resolve(router);
}

import { S3, S3ClientConfig, S3ServiceException } from '@aws-sdk/client-s3';
import { errorHandler } from '@backstage/backend-common';
import { Config } from '@backstage/config';
import { Router, Request } from 'express';
import { Logger } from 'winston';

export interface RouterOptions {
  logger: Logger;
  config: Config;
}

function createClient(config: Config) {
  const awsConfig = config.getOptionalConfig('techdocs.publisher.awsS3');

  const options: S3ClientConfig = {
    endpoint: awsConfig?.getOptionalString('endpoint'),
    credentials: {
      accessKeyId:
        awsConfig?.getOptionalString('credentials.accessKeyId') || '',
      secretAccessKey:
        awsConfig?.getOptionalString('credentials.secretAccessKey') || '',
    },
    region: awsConfig?.getOptionalString('region'),
    forcePathStyle: awsConfig?.getOptionalBoolean('s3ForcePathStyle'),
  };

  return new S3(options);
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
      const transformedString =
        (await s3AWS.getObject(params)).Body?.transformToString() || '';

      const contents = JSON.parse((await transformedString).toString());

      response.status(200);
      response.contentType('application/json');
      response.send(contents);
    } catch (err: unknown) {
      response.status((err as S3ServiceException).$response?.statusCode || 500);
      response.send(JSON.stringify((err as S3ServiceException).message));
    }
  });

  router.use(errorHandler());
  return Promise.resolve(router);
}

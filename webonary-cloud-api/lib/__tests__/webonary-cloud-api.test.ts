import { expect as expectCDK, haveResource } from '@aws-cdk/assert';
import * as cdk from '@aws-cdk/core';
import * as WebonaryCloudApi from '../webonary-cloud-api-stack';

const app = new cdk.App();
const stack = new WebonaryCloudApi.WebonaryCloudApiStack(app, 'MyTestStack');

// See https://github.com/aws/aws-cdk/tree/master/packages/%40aws-cdk/assert
test('S3 exists', () => {
  expectCDK(stack).to(
    haveResource('AWS::S3::Bucket', {
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          { ServerSideEncryptionByDefault: { SSEAlgorithm: 'AES256' } },
        ],
      },
    }),
  );
});

describe('Gateway domain', () => {
  beforeEach(() => {
    jest.resetModules(); // this is important - it clears the cache

    // First, set the env var
    process.env.WEBONARY_URL = 'https://www.testsite.com';
    process.env.WEBONARY_AUTH_PATH = 'testAuthPath';
    process.env.WEBONARY_RESET_DICTIONARY_PATH = 'testResetPath';
    process.env.MONGO_DB_NAME = 'testDb';
    process.env.API_DOMAIN_NAME = 'some-api.test-site.com';
    process.env.API_DOMAIN_CERT_ARN = 'arn:aws:acm:test';
  });

  test('Gateway domain name exists', async () => {
    // Next, post the module – do it dynamically, not at the top of the file!
    const appWithDomain = new cdk.App();
    const WebonaryCloudApiStack = (await import('../webonary-cloud-api-stack')).default;
    const stackWithDomain = new WebonaryCloudApiStack(appWithDomain, 'MyTestStackWithDomain');

    expectCDK(stackWithDomain).to(
      haveResource('AWS::ApiGateway::DomainName', {
        DomainName: process.env.API_DOMAIN_NAME,
        EndpointConfiguration: {
          Types: ['REGIONAL'],
        },
        RegionalCertificateArn: process.env.API_DOMAIN_CERT_ARN,
      }),
    );
  });

  test('Gateway domain name and path exists', async () => {
    process.env.API_DOMAIN_BASE_PATH = 'v999';

    // Next, post the module – do it dynamically, not at the top of the file!
    const appWithDomainAndPath = new cdk.App();
    const WebonaryCloudApiStack = (await import('../webonary-cloud-api-stack')).default;
    const stackWithDomainAndPath = new WebonaryCloudApiStack(
      appWithDomainAndPath,
      'MyTestStackWithDomain',
    );

    expectCDK(stackWithDomainAndPath).to(
      haveResource('AWS::ApiGateway::BasePathMapping', {
        BasePath: process.env.API_DOMAIN_BASE_PATH,
      }),
    );
  });
});

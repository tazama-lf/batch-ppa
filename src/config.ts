// SPDX-License-Identifier: Apache-2.0

/* eslint-disable @typescript-eslint/no-non-null-assertion */
// config settings, env variables
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load .env file into process.env if it exists. This is convenient for running locally.
dotenv.config({
  path: path.resolve(__dirname, '../.env'),
});

export interface IConfig {
  env: string;
  functionName: string;
  port: number;
  verifyReports: string;
  delay: number;
  retry: number;
  apm: {
    secretToken: string;
    serviceName: string;
    url: string;
    active: string;
  };
  db: {
    pseudonymsdb: string;
    pseudonymscollection: string;
    transactionhistorydb: string;
    transactionhistory_pain001_collection: string;
    transactionhistory_pain013_collection: string;
    transactionhistory_pacs008_collection: string;
    transactionhistory_pacs002_collection: string;
    password: string;
    url: string;
    user: string;
  };
  cacheTTL: number;
  cert: string;
  tmsEndpoint: string;
  logstash: {
    host: string;
    port: number;
  };
  redis: {
    auth: string;
    db: number;
    host: string;
    port: number;
  };
  data: {
    type: string;
  };
}

export const configuration: IConfig = {
  apm: {
    serviceName: process.env.APM_SERVICE_NAME!,
    url: process.env.APM_URL!,
    secretToken: process.env.APM_SECRET_TOKEN!,
    active: process.env.APM_ACTIVE!,
  },
  cacheTTL: parseInt(process.env.CACHE_TTL!, 10),
  cert: process.env.CERT_PATH!,
  tmsEndpoint: process.env.TMS_ENDPOINT!,
  verifyReports: process.env.VERIFY_REPORTS!,
  delay: parseInt(process.env.DELAY!, 0),
  retry: parseInt(process.env.RETRY!, 0) || 1,
  db: {
    pseudonymsdb: process.env.PSEUDONYMS_DATABASE!,
    pseudonymscollection: process.env.PSEUDONYMS_COLLECTION!,
    transactionhistorydb: process.env.TRANSACTIONHISTORY_DATABASE!,
    transactionhistory_pain001_collection: process.env.TRANSACTIONHISTORY_PAIN001_COLLECTION!,
    transactionhistory_pain013_collection: process.env.TRANSACTIONHISTORY_PAIN013_COLLECTION!,
    transactionhistory_pacs008_collection: process.env.TRANSACTIONHISTORY_PACS008_COLLECTION!,
    transactionhistory_pacs002_collection: process.env.TRANSACTIONHISTORY_PACS002_COLLECTION!,
    password: process.env.DATABASE_PASSWORD!,
    url: process.env.DATABASE_URL!,
    user: process.env.DATABASE_USER!,
  },
  env: process.env.NODE_ENV!,
  functionName: process.env.FUNCTION_NAME!,
  logstash: {
    host: process.env.LOGSTASH_HOST!,
    port: parseInt(process.env.LOGSTASH_PORT!, 10),
  },
  port: parseInt(process.env.PORT!, 10) || 3000,
  redis: {
    auth: process.env.REDIS_AUTH!,
    db: parseInt(process.env.REDIS_DB!, 10) || 0,
    host: process.env.REDIS_HOST!,
    port: parseInt(process.env.REDIS_PORT!, 10),
  },
  data: {
    type: process.env.DATA_TYPE!,
  },
};

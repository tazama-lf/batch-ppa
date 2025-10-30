// SPDX-License-Identifier: Apache-2.0
// config settings, env variables

import type { ManagerConfig } from '@tazama-lf/frms-coe-lib';
import type { AdditionalConfig, ProcessorConfig } from '@tazama-lf/frms-coe-lib/lib/config/processor.config';

export const additionalEnvironmentVariables: AdditionalConfig[] = [
  {
    name: 'PORT',
    type: 'number',
  },
  {
    name: 'QUOTING',
    type: 'boolean',
  },
  {
    name: 'DELIMITER',
    type: 'string',
    optional: true,
  },
  {
    name: 'TMS_ENDPOINT',
    type: 'string',
  },
  {
    name: 'MAX_FILE_SIZE',
    type: 'number',
    optional: true,
  },
];

export interface ExtendedConfig {
  PORT: number;
  QUOTING: boolean;
  TMS_ENDPOINT: string;
  MAX_FILE_SIZE: number;
  DELIMITER: string;
}

type Databases = Required<Pick<ManagerConfig, 'eventHistory' | 'redisConfig' | 'rawHistory'>>;
export type Configuration = ProcessorConfig & Databases & ExtendedConfig;

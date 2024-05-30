// SPDX-License-Identifier: Apache-2.0

import Router from 'koa-router';
import { handleHealthCheck } from './health.controller';
import { handleExecute, handleFileUpload } from './app.controller';

const router = new Router();

router.get('/', handleHealthCheck);
router.get('/health', handleHealthCheck);
router.post('/executeBatch', handleExecute);
router.post('/uploadFile', handleFileUpload);
router.post('/repairBatch', handleFileUpload);

export default router;

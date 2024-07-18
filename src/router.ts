// SPDX-License-Identifier: Apache-2.0

import Router from 'koa-router';
import { handleHealthCheck } from './health.controller';
import { handleExecute, handleFileUpload } from './app.controller';

const router = new Router();

router.get('/', handleHealthCheck);
router.get('/health', handleHealthCheck);
router.post('/v1/executeBatch', handleExecute);
router.post('/v1/uploadFile', handleFileUpload);
router.post('/v1/repairBatch', handleFileUpload);

export default router;

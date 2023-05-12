import Router from 'koa-router';
import { handleHealthCheck } from './health.controller';
import { handleExecute, handleFileUpload } from './app.controller';

const router = new Router();

router.get('/', handleHealthCheck);
router.get('/health', handleHealthCheck);
router.post('/execute', handleExecute);
router.post('/uploadFile', handleFileUpload);


export default router;

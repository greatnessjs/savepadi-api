
import express from 'express';
import adminController from './controller';
import { authenticateUser, requireAdmin } from '../../middleware';

const route = express.Router();

route.get('/thrift-groups', authenticateUser, requireAdmin, adminController.getAllThriftGroups);
route.get('/target-groups', authenticateUser, requireAdmin, adminController.getAllTargetContributionGroups);
route.get('/users', authenticateUser, requireAdmin, adminController.getAllUsers);
route.get('/groups', authenticateUser, requireAdmin, adminController.getAllGroups);
route.post('/disable-user', authenticateUser, requireAdmin, adminController.disableUser);

export default route;

import express from 'express';
import targetController from './controller';
import { authenticateUser } from '../../middleware';

const route = express.Router();

route.post("/target/group", authenticateUser, targetController.createTargetGroup);
route.put("/group/:group", authenticateUser, targetController.editGroup);
route.post("/add/members/:groupId", authenticateUser, targetController.addMembers);
route.put("/recipient/approve/:groupId", authenticateUser, targetController.setRecipient);
route.post("/contribute/:groupId", authenticateUser, targetController.contribute);
route.post("/approve/cashout/:groupId", authenticateUser, targetController.approvedCashout);
route.post("/cashout/:groupId", authenticateUser, targetController.cashout);
route.post("/close/group/:groupId", authenticateUser, targetController.closeGroup);

export default route;
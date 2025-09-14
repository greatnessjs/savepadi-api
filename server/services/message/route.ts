import express from 'express';
import messageController from './controller';
import { authenticateUser } from '../../middleware';

const route = express.Router();

// Group chat
route.post('/group/send', authenticateUser, messageController.sendGroupMessage);
route.get('/group/:groupId/messages', authenticateUser, messageController.getGroupMessages);

// Private chat with group owner
route.post('/group/send-private', authenticateUser, messageController.sendPrivateMessage);
route.get('/group/:groupId/private-messages', authenticateUser, messageController.getPrivateMessages);

export default route;

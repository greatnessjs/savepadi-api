import express from 'express';
import messageController from './controller';

const route = express.Router();

// Group chat
route.post('/group/send', messageController.sendGroupMessage);
route.get('/group/:groupId/messages', messageController.getGroupMessages);

// Private chat with group owner
route.post('/group/send-private', messageController.sendPrivateMessage);
route.get('/group/:groupId/private-messages', messageController.getPrivateMessages);

export default route;

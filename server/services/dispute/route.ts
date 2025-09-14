import express from 'express';
import disputeController from './controller';
import resolutionController from './resolution';
import notificationController from './notification';
import { authenticateUser } from '../../middleware';

const route = express.Router();

// Dispute
route.post('/log', authenticateUser, disputeController.logDispute);
route.get('/group/:groupId', authenticateUser, disputeController.getGroupDisputes);

// Resolution
route.post('/resolve', authenticateUser, resolutionController.resolveDispute);
route.get('/all', authenticateUser, resolutionController.getAllDisputes);
route.get('/my-resolutions', authenticateUser, resolutionController.getMyResolutions);

// Notification
route.post('/notify', authenticateUser, notificationController.sendNotification);
route.get('/notifications', authenticateUser, notificationController.getNotifications);

export default route;

import express from 'express';
import thriftController from './controller';
import { authenticateUser } from '../../middleware';

const route = express.Router();

route.post("/group/regular", authenticateUser, thriftController.createRegularGroup);
route.post("/group/percentage-based", authenticateUser, thriftController.createPercentageBasedGroup);
route.post("/group/:goupId/contribute", authenticateUser, thriftController.contribute);
route.post("/regular/chashout/:goupId", authenticateUser, thriftController.regularCashout);
route.post("/initial/chashout/:goupId", authenticateUser, thriftController.initialCashout);
route.post("/final/chashout/:goupId", authenticateUser, thriftController.finalCashout);

export default route;
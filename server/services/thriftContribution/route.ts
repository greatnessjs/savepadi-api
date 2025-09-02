import express from 'express'
import thriftController from './controller'


const route = express.Router()

route.post("/group/regular", thriftController.createRegularGroup);
route.post("/group/percentage-based", thriftController.createPercentageBasedGroup);
route.post("/group/:goupId/contribute", thriftController.contribute);
route.post("/regular/chashout/:goupId", thriftController.regularCashout);
route.post("/initial/chashout/:goupId", thriftController.initialCashout);
route.post("/final/chashout/:goupId", thriftController.finalCashout);


export default route;
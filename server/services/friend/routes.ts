import express from 'express'
import thriftController from './controller'


const route = express.Router()

route.post("/send/request", thriftController.friendRequest);
route.put("/process/request", thriftController.processInviteResponse);
route.get("/get/requests", thriftController.getRequestSent);


export default route;
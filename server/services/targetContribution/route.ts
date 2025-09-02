import express from 'express'
import targetController from './controller'


const route = express.Router()

route.post("/target/group", targetController.createTargetGroup);
route.put("/group/:group", targetController.editGroup);
route.post("/add/members/:groupId", targetController.addMembers);
route.put("/recipient/approve/:groupId", targetController.setRecipient);
route.post("/contribute/:groupId", targetController.contribute);
route.post("/approve/cashout/:groupId", targetController.approvedCashout);
route.post("/cashout/:groupId", targetController.cashout);
route.post("/close/group/:groupId", targetController.closeGroup);


export default route;
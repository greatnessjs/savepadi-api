import express from 'express';
import AuthController from './controller';
import { authenticateUser } from '../../middleware';

const route = express.Router();

// Auth
route.post("/register", AuthController.register);
route.post("/login", AuthController.login);

// Transaction Pin
route.post("/create-pin", authenticateUser, AuthController.createPin);
route.post("/change-pin", authenticateUser, AuthController.changePin);
route.post("/forgot-pin", authenticateUser, AuthController.forgotPin);

// Password
route.post("/change-password", authenticateUser, AuthController.changePassword);
route.post("/forgot-password", authenticateUser, AuthController.forgotPassword);

// KYC
route.post("/kyc-verification", authenticateUser, AuthController.kycVerification);

// Email Verification
route.post("/email-verification", authenticateUser, AuthController.emailVerification);

export default route;
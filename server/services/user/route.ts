import express from 'express'
import AuthController from './controller'


const route = express.Router()


// Auth
route.post("/register", AuthController.register)
route.post("/login", AuthController.login)

// Transaction Pin
route.post("/create-pin", AuthController.createPin)
route.post("/change-pin", AuthController.changePin)
route.post("/forgot-pin", AuthController.forgotPin)

// Password
route.post("/change-password", AuthController.changePassword)
route.post("/forgot-password", AuthController.forgotPassword)

// KYC
route.post("/kyc-verification", AuthController.kycVerification)

// Email Verification
route.post("/email-verification", AuthController.emailVerification)

export default route;
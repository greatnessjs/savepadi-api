import nodemailer from "nodemailer";
import multer from "multer";
import path from "path";
import { Request, Response } from "express";
import prisma from "../../connections/prisma";
import Validator from "validatorjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

class AuthController {
  register = async (request: Request, response: Response) => {
    try {
      const rules = {
        firstName: "required|string",
        lastName: "required|string",
        middleName: "string",
        email: "required|email",
        phone: "required|string",
        password: "required|string|min:8",
      };

      const validation = new Validator(request.body, rules);

      if (validation.fails()) {
        return response.status(400).json({
          error: true,
          message: Object.values(
            validation.errors.all() as Record<string, string[]>
          )[0][0],
        });
      }

      const { firstName, lastName, email, phone, password } = request.body;

      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (user) {
        return response.status(400).json({
          error: true,
          message: `user with the email ${email} already created`,
        });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);

      await prisma.user.create({
        data: {
          firstName,
          lastName,
          email,
          phone,
          password: hashedPassword,
        },
      });

      return response.status(200).json({
        error: false,
        message: "user created successfully",
      });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  login = async (request: Request, response: Response) => {
    try {
      const rules = {
        email: "required|email",
        password: "required|string|min:8",
      };

      const validation = new Validator(request.body, rules);

      if (validation.fails()) {
        return response.status(400).json({
          error: true,
          message: Object.values(
            validation.errors.all() as Record<string, string[]>
          )[0][0],
        });
      }

      const { email, password } = request.body;

      const user = await prisma.user.findUnique({
        where: {
          email: email,
        },
      });

      if (!user) {
        return response.status(404).json({
          error: true,
          message: "wrong credentials",
        });
      }

      const isPasswordSame = await bcrypt.compare(password, user.password);

      if (!isPasswordSame) {
        return response.status(400).json({
          error: true,
          message: "wrong credentials",
        });
      }

      const userData = {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        middleName: user.middleName,
        email: user.email,
        phone: user.phone,
        kycStatus: user.kycStatus,
        createdAt: user.createdAt,
      };

      const token = jwt.sign({ userData }, process.env.JWT_KEY as string, {
        expiresIn: "24hr",
      });

      return response.status(200).json({
        error: false,
        message: "user retreived",
        token,
      });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  createPin = async (request: Request, response: Response) => {
    try {
      const userId = request.user?.id;
      const { pin } = request.body;
      const rules = { pin: "required|string|min:4|max:6" };
      const validation = new Validator({ pin }, rules);
      if (validation.fails()) {
        const errors = Object.values(validation.errors.all()) as string[][];
        return response
          .status(400)
          .json({ error: true, message: errors[0][0] });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return response
          .status(404)
          .json({ error: true, message: "User not found" });
      }
      if (user.hasPin) {
        return response
          .status(400)
          .json({ error: true, message: "Pin already set. Use change pin." });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPin = await bcrypt.hash(pin, salt);
      await prisma.user.update({
        where: { id: userId },
        data: { pin: hashedPin, hasPin: true },
      });
      return response.status(200).json({
        error: false,
        message: "Transaction pin created successfully",
      });
    } catch (error: any) {
      return response
        .status(500)
        .json({ error: true, message: "internal server error" });
    }
  };

  changePin = async (request: Request, response: Response) => {
    try {
      const userId = request.user?.id;
      const { oldPin, newPin } = request.body;
      const rules = {
        oldPin: "required|string|min:4|max:6",
        newPin: "required|string|min:4|max:6",
      };
      const validation = new Validator({ oldPin, newPin }, rules);
      if (validation.fails()) {
        const errors = Object.values(validation.errors.all()) as string[][];
        return response
          .status(400)
          .json({ error: true, message: errors[0][0] });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user || !user.hasPin || !user.pin) {
        return response
          .status(400)
          .json({ error: true, message: "No pin set for user" });
      }
      const isPinSame = await bcrypt.compare(oldPin, user.pin);
      if (!isPinSame) {
        return response
          .status(400)
          .json({ error: true, message: "Old pin is incorrect" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPin = await bcrypt.hash(newPin, salt);
      await prisma.user.update({
        where: { id: userId },
        data: { pin: hashedPin },
      });
      return response.status(200).json({
        error: false,
        message: "Transaction pin changed successfully",
      });
    } catch (error: any) {
      return response
        .status(500)
        .json({ error: true, message: "internal server error" });
    }
  };

  forgotPin = async (request: Request, response: Response) => {
    try {
      const { email } = request.body;
      if (!email) {
        return response
          .status(400)
          .json({ error: true, message: "Email is required" });
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return response
          .status(404)
          .json({ error: true, message: "User not found" });
      }

      const resetPinToken = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      await prisma.user.update({
        where: { email },
        data: { emailToken: resetPinToken },
      });

      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset Your Transaction Pin",
        text: `Your pin reset code is: ${resetPinToken}`,
      });
      return response
        .status(200)
        .json({
          error: false,
          message: "Reset instructions sent to your email",
        });
    } catch (error: any) {
      return response
        .status(500)
        .json({ error: true, message: "internal server error" });
    }
  };

  changePassword = async (request: Request, response: Response) => {
    try {
      const userId = request.user?.id;
      const { oldPassword, newPassword } = request.body;
      const rules = {
        oldPassword: "required|string|min:8",
        newPassword: "required|string|min:8",
      };
      const validation = new Validator({ oldPassword, newPassword }, rules);
      if (validation.fails()) {
        const errors = Object.values(validation.errors.all()) as string[][];
        return response
          .status(400)
          .json({ error: true, message: errors[0][0] });
      }
      const user = await prisma.user.findUnique({ where: { id: userId } });
      if (!user) {
        return response
          .status(404)
          .json({ error: true, message: "User not found" });
      }
      const isPasswordSame = await bcrypt.compare(oldPassword, user.password);
      if (!isPasswordSame) {
        return response
          .status(400)
          .json({ error: true, message: "Old password is incorrect" });
      }
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });
      return response
        .status(200)
        .json({ error: false, message: "Password changed successfully" });
    } catch (error: any) {
      return response
        .status(500)
        .json({ error: true, message: "internal server error" });
    }
  };

  forgotPassword = async (request: Request, response: Response) => {
    try {
      const { email } = request.body;
      if (!email) {
        return response
          .status(400)
          .json({ error: true, message: "Email is required" });
      }
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) {
        return response
          .status(404)
          .json({ error: true, message: "User not found" });
      }
      // Generate a reset code and save to user
      const resetPasswordToken = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      await prisma.user.update({
        where: { email },
        data: { emailToken: resetPasswordToken },
      });
      // Send email with nodemailer
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Reset Your Password",
        text: `Your password reset code is: ${resetPasswordToken}`,
      });
      return response
        .status(200)
        .json({
          error: false,
          message: "Password reset instructions sent to your email",
        });
    } catch (error: any) {
      return response
        .status(500)
        .json({ error: true, message: "internal server error" });
    }
  };

  kycVerification = async (request: Request, response: Response) => {
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, path.join(__dirname, "../../../uploads/kyc"));
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
      },
    });

    const upload = multer({ storage }).fields([
      { name: "passport", maxCount: 1 },
      { name: "utilityBill", maxCount: 1 },
      { name: "governmentIssuedId", maxCount: 1 },
    ]);

    upload(request, response, async (err) => {
      if (err) {
        return response.status(400).json({
          error: true,
          message: "File upload error",
          details: err.message,
        });
      }
      try {
        const userId = request.user?.id;
        const { bvn } = request.body;
        if (!bvn) {
          return response
            .status(400)
            .json({ error: true, message: "BVN is required" });
        }
        const user = await prisma.user.findUnique({ where: { id: userId } });
        if (!user) {
          return response
            .status(404)
            .json({ error: true, message: "User not found" });
        }

        const files = request.files as
          | { [fieldname: string]: Express.Multer.File[] }
          | undefined;
        const passport = files?.passport?.[0]?.path;
        const utilityBill = files?.utilityBill?.[0]?.path;
        const governmentIssuedId = files?.governmentIssuedId?.[0]?.path;
        await prisma.kYC.create({
          data: {
            userId,
            bvn,
            passport,
            utilityBill,
            governmentIssuedId,
          },
        });
        return response
          .status(200)
          .json({ error: false, message: "KYC submitted successfully" });
      } catch (error: any) {
        return response
          .status(500)
          .json({ error: true, message: "internal server error" });
      }
    });
  };

  emailVerification = async (request: Request, response: Response) => {
    const { email, token, action } = request.body;
    if (!email) {
      return response
        .status(400)
        .json({ error: true, message: "Email is required" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
    if (action === "send") {
      const verificationToken = Math.floor(
        100000 + Math.random() * 900000
      ).toString();
      await prisma.user.update({
        where: { email },
        data: { emailToken: verificationToken },
      });
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: email,
        subject: "Your Email Verification Code",
        text: `Your verification code is: ${verificationToken}`,
      });
      return response
        .status(200)
        .json({ error: false, message: `Verification code sent to ${email}` });
    } else if (action === "verify") {
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user || user.emailToken !== token) {
        return response
          .status(400)
          .json({ error: true, message: "Invalid or expired token" });
      }
      await prisma.user.update({
        where: { email },
        data: { isVerified: true, emailToken: null },
      });
      return response
        .status(200)
        .json({ error: false, message: "Email verified successfully" });
    } else {
      return response.status(400).json({
        error: true,
        message: "Invalid action. Use 'send' or 'verify'",
      });
    }
  };
}

export default new AuthController();

import { Request, Response } from "express";
import prisma from "../../connections/prisma";
import Validator from "validatorjs";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"

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

      const isPasswordSame = await bcrypt.compare(password, user.password)

      if(!isPasswordSame){
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
        createdAt: user.createdAt
      }


      const token = jwt.sign({ userData }, process.env.JWT_KEY as string, {
        expiresIn: "24hr",
      });

      return response.status(200).json({
        error: false,
        message: "user retreived",
        token
      });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };
}

export default new AuthController();

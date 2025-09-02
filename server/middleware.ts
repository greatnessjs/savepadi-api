import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import prisma from "../server/connections/prisma";
import { AuthenticatedUser } from "./commonInterface";

export const authenticateUser = async (
  request: AuthenticatedUser,
  response: Response,
  next: NextFunction
) => {
  try {
    const token = request.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return response
        .status(401)
        .json({ success: false, message: "Authentication requestuired" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as {
      userId: number;
    };
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
    });

    if (!user) {
      return response
        .status(401)
        .json({ success: false, message: "User not found" });
    }

    request.user = user;
    next();
  } catch (error) {
    response.status(401).json({ success: false, message: "Invalid token" });
  }
};


export const isGroupAdmin = async (
  request: AuthenticatedUser,
  response: Response,
  next: NextFunction
) => {
  try {
    const groupId = parseInt(request.params.groupId);

    const group = await prisma.thriftGroup.findUnique({
      where: { id: groupId },
    });

    if (!group) {
      return response.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    if (group.adminId !== request.user?.id) {
      return response.status(403).json({
        success: false,
        message: "Only group admin can perform this action",
      });
    }

    next();
  } catch (error) {
    next(error);
  }
};

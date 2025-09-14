import { Request, Response } from "express";
import prisma from "../../connections/prisma";

class NotificationController {
  // Send notification
  sendNotification = async (request: Request, response: Response) => {
    try {
      const { userId, message } = request.body;
      if (!userId || !message) {
        return response
          .status(400)
          .json({ error: true, message: "userId and message are required" });
      }
      // Save notification
      const notification = await prisma.notification.create({
        data: { userId, message },
      });
      return response.status(201).json({ success: true, notification });
    } catch (error) {
      return response
        .status(500)
        .json({ error: true, message: "internal server error" });
    }
  };

  // Get notifications for a user
  getNotifications = async (request: Request, response: Response) => {
    try {
      const userId = request.user.id;
      const notifications = await prisma.notification.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
      });
      return response.status(200).json({ success: true, notifications });
    } catch (error) {
      return response
        .status(500)
        .json({ error: true, message: "internal server error" });
    }
  };
}

export default new NotificationController();

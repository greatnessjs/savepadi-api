import { Request, Response } from "express";
import prisma from "../../connections/prisma";

class MessageController {
  // Send a message to a group (group chat)
  sendGroupMessage = async (request: Request, response: Response) => {
    try {
      const { groupId, content } = request.body;
      if (!groupId || !content) {
        return response.status(400).json({ error: true, message: "groupId and content are required" });
      }
      const message = await prisma.message.create({
        data: {
          senderId: request.user.id,
          groupId,
          content,
          isPrivate: false,
        },
      });
      return response.status(201).json({ success: true, message });
    } catch (error) {
      return response.status(500).json({ error: true, message: "internal server error" });
    }
  };

  // Send a private message to group owner
  sendPrivateMessage = async (request: Request, response: Response) => {
    try {
      const { groupId, content } = request.body;
      if (!groupId || !content) {
        return response.status(400).json({ error: true, message: "groupId and content are required" });
      }
      // Find group owner
      const group = await prisma.thriftGroup.findUnique({ where: { id: groupId } });
      if (!group) {
        return response.status(404).json({ error: true, message: "Group not found" });
      }
      const message = await prisma.message.create({
        data: {
          senderId: request.user.id,
          groupId,
          content,
          isPrivate: true,
        },
      });
      return response.status(201).json({ success: true, message });
    } catch (error) {
      return response.status(500).json({ error: true, message: "internal server error" });
    }
  };

  // Get all messages for a group (group chat)
  getGroupMessages = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);
      const messages = await prisma.message.findMany({
        where: { groupId, isPrivate: false },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      });
      return response.status(200).json({ success: true, messages });
    } catch (error) {
      return response.status(500).json({ error: true, message: "internal server error" });
    }
  };

  // Get all private messages between user and group owner
  getPrivateMessages = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);
      const userId = request.user.id;
      const group = await prisma.thriftGroup.findUnique({ where: { id: groupId } });
      if (!group) {
        return response.status(404).json({ error: true, message: "Group not found" });
      }
      const messages = await prisma.message.findMany({
        where: {
          groupId,
          isPrivate: true,
          OR: [
            { senderId: userId },
            { senderId: group.adminId },
          ],
        },
        orderBy: { createdAt: "asc" },
        include: { sender: { select: { id: true, firstName: true, lastName: true } } },
      });
      return response.status(200).json({ success: true, messages });
    } catch (error) {
      return response.status(500).json({ error: true, message: "internal server error" });
    }
  };
}

export default new MessageController();

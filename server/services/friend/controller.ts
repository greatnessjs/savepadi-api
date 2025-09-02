import { Request, Response } from "express";
import prisma from "../../connections/prisma";

class FriendController {
  friendRequest = async (request: Request, response: Response) => {
    try {
      
      const { receiverEmail } = request.body;

      const receiver = await prisma.user.findUnique({
        where: { email: receiverEmail },
      });

      if (!receiver) {
        return response.status(200).json({
          success: true,
          message:
            "Invitation sent to user email. They will be added as a friend if they join the platform.",
        });
      }

      const existingRequest = await prisma.friend.findFirst({
        where: {
          OR: [
            { senderId: request.user.id, receiverId: receiver.id },
            { senderId: receiver.id, receiverId: request.user.id },
          ],
        },
      });

      if (existingRequest) {
        return response.status(400).json({
          success: false,
          message:
            existingRequest.status === "PENDING"
              ? "Friend request already pending"
              : "You are already friends with this user",
        });
      }

      const friendRequest = await prisma.friend.create({
        data: {
          senderId: request.user.id,
          receiverId: receiver.id,
          status: "PENDING",
        },
        include: {
          receiver: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      response.status(201).json({ success: true, request: friendRequest });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  processInviteResponse = async (request: Request, response: Response) => {
    try {
      const requestId = parseInt(request.params.requestId);
      const { status } = request.body;

      if (status !== "ACCEPTED" && status !== "REJECTED") {
        return response
          .status(400)
          .json({ success: false, message: "Invalid status" });
      }

      const friendRequest = await prisma.friend.findUnique({
        where: { id: requestId },
        include: { sender: true },
      });

      if (!friendRequest) {
        return response
          .status(404)
          .json({ success: false, message: "Friend request not found" });
      }

      if (friendRequest.receiverId !== request.user.id) {
        return response.status(403).json({
          success: false,
          message: "Not authorized to update this request",
        });
      }

      const updatedRequest = await prisma.friend.update({
        where: { id: requestId },
        data: { status },
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
      });

      response.json({ success: true, request: updatedRequest });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  getRequestSent = async (request: Request, response: Response) => {
    try {
      const type = request.query.type as string | undefined;

      let whereCondition = {};
      if (type === "sent") {
        whereCondition = { senderId: request.user.id, status: "PENDING" };
      } else if (type === "received") {
        whereCondition = { receiverId: request.user.id, status: "PENDING" };
      } else {
        whereCondition = {
          OR: [{ senderId: request.user.id }, { receiverId: request.user.id }],
          status: "ACCEPTED",
        };
      }

      const requests = await prisma.friend.findMany({
        where: whereCondition,
        include: {
          sender: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          receiver: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });

      response.json({ success: true, requests });
    } catch (error) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

}

export default new FriendController();
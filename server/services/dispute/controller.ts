import { Request, Response } from "express";
import prisma from "../../connections/prisma";

class DisputeController {
  // Log a dispute
  logDispute = async (request: Request, response: Response) => {
    try {
      const { groupId, againstUserId, reason, evidence } = request.body;
      if (!groupId || !againstUserId || !reason) {
        return response
          .status(400)
          .json({
            error: true,
            message: "groupId, againstUserId, and reason are required",
          });
      }
      const dispute = await prisma.dispute.create({
        data: {
          raisedById: request.user.id,
          againstUserId,
          groupId,
          reason,
          evidence,
          status: "OPEN",
        },
      });
      return response.status(201).json({ success: true, dispute });
    } catch (error) {
      return response
        .status(500)
        .json({ error: true, message: "internal server error" });
    }
  };

  // Get all disputes for a group
  getGroupDisputes = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);
      const disputes = await prisma.dispute.findMany({
        where: { groupId },
        orderBy: { createdAt: "desc" },
        include: {
          raisedBy: { select: { id: true, firstName: true, lastName: true } },
          againstUser: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
      });
      return response.status(200).json({ success: true, disputes });
    } catch (error) {
      return response
        .status(500)
        .json({ error: true, message: "internal server error" });
    }
  };
}

export default new DisputeController();

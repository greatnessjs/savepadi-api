import { Request, Response } from "express";
import prisma from "../../connections/prisma";

class ResolutionController {
  // Resolve or reject a dispute
  resolveDispute = async (request: Request, response: Response) => {
    try {
      const { disputeId, status } = request.body;
      if (!disputeId || !["RESOLVED", "REJECTED"].includes(status)) {
        return response
          .status(400)
          .json({
            error: true,
            message: "disputeId and valid status are required",
          });
      }
      const dispute = await prisma.dispute.update({
        where: { id: disputeId },
        data: { status },
      });
      return response.status(200).json({ success: true, dispute });
    } catch (error) {
      return response
        .status(500)
        .json({ error: true, message: "internal server error" });
    }
  };

  // Get all disputes (admin)
  getAllDisputes = async (request: Request, response: Response) => {
    try {
      const disputes = await prisma.dispute.findMany({
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

  // Get my resolutions
  getMyResolutions = async (request: Request, response: Response) => {
    try {
      const userId = request.user.id;
      const disputes = await prisma.dispute.findMany({
        where: { againstUserId: userId, status: "RESOLVED" },
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

export default new ResolutionController();

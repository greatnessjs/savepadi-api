import { Request, Response } from "express";
import prisma from "../../connections/prisma";

class TargetContributionController {
  createTargetGroup = async (request: Request, response: Response) => {
    try {
      const { title, description, amount, memberEmails } = request.body;

      if (!title || !amount || !memberEmails || !Array.isArray(memberEmails)) {
        return response
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }

      const existingUsers = await prisma.user.findMany({
        where: { email: { in: memberEmails } },
      });

      const group = await prisma.$transaction(async (prisma) => {
        const newGroup = await prisma.contributionGroup.create({
          data: {
            title,
            description,
            adminId: request.user.id,
            recipientId: request.user.id,
            amount,
            status: "OPEN",
            approvalsNeeded: 3,
          },
        });

        await prisma.contributionGroupMember.create({
          data: {
            userId: request.user.id,
            groupId: newGroup.id,
            approved: true,
          },
        });

        for (const user of existingUsers) {
          if (user.id !== request.user.id) {
            await prisma.contributionGroupMember.create({
              data: {
                userId: user.id,
                groupId: newGroup.id,
              },
            });
          }
        }

        return newGroup;
      });

      response.status(201).json({ success: true, group });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  editGroup = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);
      const { title, description } = request.body;

      if (!title) {
        return response
          .status(400)
          .json({ success: false, message: "Title is required" });
      }

      const updatedGroup = await prisma.contributionGroup.update({
        where: { id: groupId },
        data: {
          title,
          description,
        },
      });

      response.json({ success: true, group: updatedGroup });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  addMembers = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);
      const { memberEmails } = request.body;

      const group = await prisma.contributionGroup.findUnique({
        where: { id: groupId },
      });

      if (!group) {
        return response
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

      if (group.status !== "OPEN") {
        return response.status(400).json({
          success: false,
          message: "Group is not open for new members",
        });
      }

      const existingUsers = await prisma.user.findMany({
        where: { email: { in: memberEmails } },
      });

      const addedMembers = [];
      for (const user of existingUsers) {
        const existingMember = await prisma.contributionGroupMember.findFirst({
          where: { groupId, userId: user.id },
        });

        if (!existingMember) {
          const newMember = await prisma.contributionGroupMember.create({
            data: {
              userId: user.id,
              groupId,
            },
            include: { user: true },
          });
          addedMembers.push(newMember);
        }
      }

      response.status(201).json({ success: true, addedMembers });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  setRecipient = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);
      const { recipientId, approvalsNeeded, disburseOnApproval } = request.body;

      const group = await prisma.contributionGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        return response
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

      const recipient = await prisma.contributionGroupMember.findFirst({
        where: { groupId, userId: recipientId },
      });

      if (!recipient) {
        return response.status(400).json({
          success: false,
          message: "Recipient must be a group member",
        });
      }

      const updatedGroup = await prisma.contributionGroup.update({
        where: { id: groupId },
        data: {
          recipientId,
          approvalsNeeded: approvalsNeeded || group.approvalsNeeded,
          disburseOnApproval:
            disburseOnApproval !== undefined
              ? disburseOnApproval
              : group.disburseOnApproval,
        },
      });

      response.json({ success: true, group: updatedGroup });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  contribute = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);
      const { amount } = request.body;

      const group = await prisma.contributionGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        return response
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

      if (group.status !== "OPEN") {
        return response.status(400).json({
          success: false,
          message: "Group is not open for contributions",
        });
      }

      const member = await prisma.contributionGroupMember.findFirst({
        where: { groupId, userId: request.user.id },
      });

      if (!member) {
        return response.status(403).json({
          success: false,
          message: "You are not a member of this group",
        });
      }

      if (member.contributed) {
        return response.status(400).json({
          success: false,
          message: "You have already contributed to this group",
        });
      }

      await prisma.contributionGroupMember.update({
        where: { id: member.id },
        data: { contributed: true },
      });

      const members = await prisma.contributionGroupMember.findMany({
        where: { groupId },
      });

      //   const allContributed = members.every((m) => m.contributed);

      //   if (allContributed) {
      //     await prisma.contributionGroup.update({
      //       where: { id: groupId },
      //       data: { status: "READY_FOR_DISBURSEMENT" },
      //     });
      //   }

      response.json({
        success: true,
        message: "Contribution recorded successfully",
      });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  approvedCashout = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);

      const group = await prisma.contributionGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        return response
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

      //   if (group.status !== "READY_FOR_DISBURSEMENT") {
      //     return response
      //       .status(400)
      //       .json({
      //         success: false,
      //         message: "Group is not ready for disbursement",
      //       });
      //   }

      const member = await prisma.contributionGroupMember.findFirst({
        where: { groupId, userId: request.user.id },
      });

      if (!member) {
        return response.status(403).json({
          success: false,
          message: "You are not a member of this group",
        });
      }

      const existingApproval = await prisma.contributionApproval.findFirst({
        where: { groupId, approverId: request.user.id },
      });

      if (existingApproval) {
        return response.status(400).json({
          success: false,
          message: "You have already approved this disbursement",
        });
      }

      await prisma.contributionApproval.create({
        data: {
          groupId,
          approverId: request.user.id,
        },
      });

      const approvalCount = await prisma.contributionApproval.count({
        where: { groupId },
      });
      const enoughApprovals = approvalCount >= group.approvalsNeeded;

      //   if (enoughApprovals && group.disburseOnApproval) {
      //     await prisma.contributionGroup.update({
      //       where: { id: groupId },
      //       data: { status: "COMPLETED" },
      //     });

      //   }

      response.json({
        success: true,
        message: "Approval recorded successfully",
        enoughApprovals,
        approvalsNeeded: group.approvalsNeeded,
        currentApprovals: approvalCount + 1,
      });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  cashout = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);

      const group = await prisma.contributionGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        return response
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

      //   if (group.status !== "READY_FOR_DISBURSEMENT") {
      //     return response.status(400).json({
      //       success: false,
      //       message: "Group is not ready for disbursement",
      //     });
      //   }

      if (group.recipientId !== request.user.id) {
        return response.status(403).json({
          success: false,
          message: "Only the designated recipient can collect the contribution",
        });
      }

      const approvalCount = await prisma.contributionApproval.count({
        where: { groupId },
      });
      if (approvalCount < group.approvalsNeeded) {
        return response.status(400).json({
          success: false,
          message: `Not enough approvals (${approvalCount}/${group.approvalsNeeded})`,
        });
      }

      //   await prisma.contributionGroup.update({
      //     where: { id: groupId },
      //     data: { status: "COMPLETED" },
      //   });

      const totalAmount =
        group.amount *
        (await prisma.contributionGroupMember.count({ where: { groupId } }));

      response.json({
        success: true,
        message: "Contribution collected successfully",
        amount: totalAmount,
      });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  closeGroup = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);

      const group = await prisma.contributionGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        return response
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

    //   if (group.status === "COMPLETED") {
    //     return response
    //       .status(400)
    //       .json({ success: false, message: "Group is already completed" });
    //   }

    //   await prisma.contributionGroup.update({
    //     where: { id: groupId },
    //     data: { status: "CLOSED" },
    //   });

      response.json({ success: true, message: "Group closed successfully" });
    } catch (error: any) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };
}

export default new TargetContributionController();

import { Request, Response } from "express";
import prisma from "../../connections/prisma";

class ThriftController {

  createPercentageBasedGroup = async (request: Request, response: Response) => {
    try {
      const {
        name,
        amount,
        payoutMethod,
        initialPayoutPercentage = 50,
        memberEmails,
      } = request.body;

      if (!name || !amount || !payoutMethod || !memberEmails) {
        return response
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }

      if (initialPayoutPercentage <= 0 || initialPayoutPercentage >= 100) {
        return response.status(400).json({
          success: false,
          message: "Initial payout percentage must be between 0 and 100",
        });
      }

      const existingUsers = await prisma.user.findMany({
        where: { email: { in: memberEmails } },
      });


      const group = await prisma.$transaction(async (prisma) => {
        const newGroup = await prisma.thriftGroup.create({
          data: {
            name,
            amount,
            adminId: request.user.id,
            payoutMethod,
            initialPayoutPercentage,
            status: "ACTIVE",
          },
        });

        await prisma.thriftGroupMember.create({
          data: {
            userId: request.user.id,
            groupId: newGroup.id,
            order: 1,
          },
        });

        for (let i = 0; i < existingUsers.length; i++) {
          const user = existingUsers[i];
          if (user.id !== request.user.id) {
            await prisma.thriftGroupMember.create({
              data: {
                userId: user.id,
                groupId: newGroup.id,
                order: i + 2, 
              },
            });
          }
        }

        return newGroup;
      });

      response.status(201).json({ success: true, group });
    } catch (error) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  createRegularGroup = async (request: Request, response: Response) => {
    try {
      const { name, amount, payoutMethod, memberEmails } = request.body;

      if (!name || !amount || !payoutMethod || !memberEmails) {
        return response
          .status(400)
          .json({ success: false, message: "Missing required fields" });
      }

      const existingUsers = await prisma.user.findMany({
        where: { email: { in: memberEmails } },
      });

      const group = await prisma.$transaction(async (prisma) => {
        const newGroup = await prisma.thriftGroup.create({
          data: {
            name,
            amount,
            adminId: request.user.id,
            payoutMethod,
            status: "ACTIVE",
          },
        });

        await prisma.thriftGroupMember.create({
          data: {
            userId: request.user.id,
            groupId: newGroup.id,
            order: 1,
          },
        });

        for (let i = 0; i < existingUsers.length; i++) {
          const user = existingUsers[i];
          if (user.id !== request.user.id) {
            await prisma.thriftGroupMember.create({
              data: {
                userId: user.id,
                groupId: newGroup.id,
                order: i + 2,
              },
            });
          }
        }

        return newGroup;
      });

      response.status(201).json({ success: true, group });
    } catch (error) {
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

      const group = await prisma.thriftGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        return response
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

      if (group.status !== "ACTIVE") {
        return response
          .status(400)
          .json({ success: false, message: "Group is not active" });
      }

      const member = await prisma.thriftGroupMember.findFirst({
        where: { groupId, userId: request.user.id },
      });

      if (!member) {
        return response.status(403).json({
          success: false,
          message: "You are not a member of this group",
        });
      }

      if (amount !== group.amount) {
        return response.status(400).json({
          success: false,
          message: `Contribution amount must be ${group.amount}`,
        });
      }

      await prisma.thriftGroupMember.update({
        where: { id: member.id },
        data: { contributed: true },
      });


      response.json({
        success: true,
        message: "Contribution recorded successfully",
      });
    } catch (error) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  regularCashout = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);

      const group = await prisma.thriftGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        return response
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

      if (group.initialPayoutPercentage) {
        return response.status(400).json({
          success: false,
          message: "This is a percentage-based group",
        });
      }

      const member = await prisma.thriftGroupMember.findFirst({
        where: { groupId, userId: request.user.id },
      });

      if (!member) {
        return response.status(403).json({
          success: false,
          message: "You are not a member of this group",
        });
      }

      if (member.received) {
        return response.status(400).json({
          success: false,
          message: "You have already collected from this group",
        });
      }

      if (!member.contributed) {
        return response.status(400).json({
          success: false,
          message: "You need to contribute before collecting",
        });
      }

      if (group.payoutMethod === "FIRST_COME") {
        await prisma.thriftGroupMember.update({
          where: { id: member.id },
          data: { received: true },
        });
      } else if (group.payoutMethod === "RANDOM") {
        if (!member.order) {
          const members = await prisma.thriftGroupMember.findMany({
            where: { groupId, received: false },
          });

          const randomOrder = Math.floor(Math.random() * members.length) + 1;
          await prisma.thriftGroupMember.update({
            where: { id: member.id },
            data: { order: randomOrder },
          });
        }
      }

      const payoutAmount = group.amount;

      await prisma.thriftGroupMember.update({
        where: { id: member.id },
        data: { received: true },
      });

      const members = await prisma.thriftGroupMember.findMany({
        where: { groupId },
      });
      const allReceived = members.every((m) => m.received);
      if (allReceived) {
        await prisma.thriftGroup.update({
          where: { id: groupId },
          data: { status: "COMPLETED" },
        });
      }

      response.json({
        success: true,
        message: "Payout collected successfully",
        amount: payoutAmount,
      });
    } catch (error) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  initialCashout = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);

      const group = await prisma.thriftGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        return response
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

      if (!group.initialPayoutPercentage) {
        return response.status(400).json({
          success: false,
          message: "This is not a percentage-based group",
        });
      }

      const member = await prisma.thriftGroupMember.findFirst({
        where: { groupId, userId: request.user.id },
      });

      if (!member) {
        return response.status(403).json({
          success: false,
          message: "You are not a member of this group",
        });
      }

      if (member.payoutStatus !== "NONE") {
        return response.status(400).json({
          success: false,
          message: "You have already collected from this group",
        });
      }

      if (!member.contributed) {
        return response.status(400).json({
          success: false,
          message: "You need to contribute before collecting",
        });
      }

      const totalMembers = await prisma.thriftGroupMember.count({
        where: { groupId },
      });
      const totalPot = group.amount * totalMembers;
      const initialPayout = totalPot * (group.initialPayoutPercentage / 100);

      await prisma.thriftGroupMember.update({
        where: { id: member.id },
        data: {
          initialPayout,
          // payoutStatus: "INITIAL",
        },
      });

      response.json({
        success: true,
        message: "Initial payout collected successfully",
        amount: initialPayout,
      });
    } catch (error) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };

  finalCashout = async (request: Request, response: Response) => {
    try {
      const groupId = parseInt(request.params.groupId);

      const group = await prisma.thriftGroup.findUnique({
        where: { id: groupId },
      });
      if (!group) {
        return response
          .status(404)
          .json({ success: false, message: "Group not found" });
      }

      if (!group.initialPayoutPercentage) {
        return response.status(400).json({
          success: false,
          message: "This is not a percentage-based group",
        });
      }

      const member = await prisma.thriftGroupMember.findFirst({
        where: { groupId, userId: request.user.id },
      });

      if (!member) {
        return response.status(403).json({
          success: false,
          message: "You are not a member of this group",
        });
      }

      // if (member.payoutStatus !== "INITIAL") {
      //   return response.status(400).json({
      //     success: false,
      //     message:
      //       member.payoutStatus === "NONE"
      //         ? "You need to collect initial payout first"
      //         : "You have already collected final payout",
      //   });
      // }

      const members = await prisma.thriftGroupMember.findMany({
        where: { groupId },
      });
      const allCollectedInitial = members.every(
        (m) => m.payoutStatus !== "NONE"
      );

      if (!allCollectedInitial) {
        return response.status(400).json({
          success: false,
          message: "Not all members have collected their initial payout yet",
        });
      }

      const totalMembers = members.length;
      const totalPot = group.amount * totalMembers;
      const initialPayoutTotal =
        totalPot * (group.initialPayoutPercentage / 100);
      const remainingPot = totalPot - initialPayoutTotal;
      const finalPayout = remainingPot / totalMembers;

      // await prisma.thriftGroupMember.update({
      //   where: { id: member.id },
      //   data: {
      //     finalPayout,
      //     payoutStatus: "FINAL",
      //   },
      // });

      // const allCollectedFinal = members.every(
      //   (m) => m.payoutStatus === "FINAL"
      // );

      // if (allCollectedFinal) {
      //   await prisma.thriftGroup.update({
      //     where: { id: groupId },
      //     data: { status: "COMPLETED" },
      //   });
      // }

      response.json({
        success: true,
        message: "Final payout collected successfully",
        amount: finalPayout,
      });
    } catch (error) {
      return response.status(500).json({
        error: true,
        message: "internal server error",
      });
    }
  };
}

export default new ThriftController();

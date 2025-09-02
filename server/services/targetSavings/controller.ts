// import { Request, Response } from "express";
// import prisma from "../../connections/prisma";

// class TargetSavingsController {
//   createGroup = async (request: Request, response: Response) => {
//     try {
//       const { name, description, targetAmount, collectionDate, memberEmails } =
//         request.body;

//       if (!name || !collectionDate) {
//         return response.status(400).json({
//           success: false,
//           message: "Name and collection date are required",
//         });
//       }

//       const collectionDateObj = new Date(collectionDate);
//       if (isNaN(collectionDateObj.getTime())) {
//         return response
//           .status(400)
//           .json({ success: false, message: "Invalid collection date" });
//       }

//       const existingUsers = await prisma.user.findMany({
//         where: { email: { in: memberEmails } },
//       });

//       const group = await prisma.$transaction(async (prisma) => {
//         const newGroup = await prisma.groupSavings.create({
//           data: {
//             name,
//             description,
//             adminId: request.user.id,
//             targetAmount,
//             collectionDate: collectionDateObj,
//             status: "ACTIVE",
//           },
//         });

//         await prisma.groupSavingsMember.create({
//           data: {
//             userId: request.user.id,
//             groupId: newGroup.id,
//           },
//         });

//         for (const user of existingUsers) {
//           if (user.id !== request.user.id) {
//             await prisma.groupSavingsMember.create({
//               data: {
//                 userId: user.id,
//                 groupId: newGroup.id,
//               },
//             });
//           }
//         }

//         return newGroup;
//       });

//       response.status(201).json({ success: true, group });
//     } catch (error) {
//       response
//         .status(500)
//         .json({ success: false, message: "Failed to create savings group" });
//     }
//   };

//   editGroup = async (request: Request, response: Response) => {
//     try {
//       const groupId = parseInt(request.params.groupId);
//       const { name, description, targetAmount, collectionDate } = request.body;

//       if (!name) {
//         return response
//           .status(400)
//           .json({ success: false, message: "Name is required" });
//       }

//       let collectionDateObj;
//       if (collectionDate) {
//         collectionDateObj = new Date(collectionDate);
//         if (isNaN(collectionDateObj.getTime())) {
//           return response
//             .status(400)
//             .json({ success: false, message: "Invalid collection date" });
//         }
//       }

//       const updatedGroup = await prisma.groupSavings.update({
//         where: { id: groupId },
//         data: {
//           name,
//           description,
//           targetAmount,
//           collectionDate: collectionDateObj,
//         },
//       });

//       response.json({ success: true, group: updatedGroup });
//     } catch (error) {
//       response
//         .status(500)
//         .json({ success: false, message: "Failed to update savings group" });
//     }
//   };

//   addMembers = async (request: Request, response: Response) => {
//     try {
//       const groupId = parseInt(request.params.groupId);
//       const { memberEmails } = request.body;

//       const group = await prisma.groupSavings.findUnique({
//         where: { id: groupId },
//       });
//       if (!group) {
//         return response
//           .status(404)
//           .json({ success: false, message: "Group not found" });
//       }

//       if (group.status !== "ACTIVE") {
//         return response
//           .status(400)
//           .json({ success: false, message: "Group is not active" });
//       }

//       const existingUsers = await prisma.user.findMany({
//         where: { email: { in: memberEmails } },
//       });

//       const addedMembers = [];
//       for (const user of existingUsers) {
//         const existingMember = await prisma.groupSavingsMember.findFirst({
//           where: { groupId, userId: user.id },
//         });

//         if (!existingMember) {
//           const newMember = await prisma.groupSavingsMember.create({
//             data: {
//               userId: user.id,
//               groupId,
//             },
//             include: { user: true },
//           });
//           addedMembers.push(newMember);
//         }
//       }

//       response.status(201).json({ success: true, addedMembers });
//     } catch (error) {
//       response
//         .status(500)
//         .json({ success: false, message: "Failed to add members to group" });
//     }
//   };

//   contribute = async (request: Request, response: Response) => {
//     try {
//       const groupId = parseInt(request.params.groupId);
//       const { amount, description } = request.body;

//       const group = await prisma.groupSavings.findUnique({
//         where: { id: groupId },
//       });
//       if (!group) {
//         return response
//           .status(404)
//           .json({ success: false, message: "Group not found" });
//       }

//       if (group.status !== "ACTIVE") {
//         return response.status(400).json({
//           success: false,
//           message: "Group is not active for contributions",
//         });
//       }

//       const member = await prisma.groupSavingsMember.findFirst({
//         where: { groupId, userId: request.user.id },
//       });

//       if (!member) {
//         return response.status(403).json({
//           success: false,
//           message: "You are not a member of this group",
//         });
//       }

//       const contribution = await prisma.groupSavingsContribution.create({
//         data: {
//           userId: request.user.id,
//           groupId,
//           amount,
//           description,
//         },
//       });

//       response.status(201).json({ success: true, contribution });
//     } catch (error) {
//       response
//         .status(500)
//         .json({ success: false, message: "Failed to record contribution" });
//     }
//   };

//   myContribution = async (request: Request, response: Response) => {
//     try {
//       const groupId = parseInt(request.params.groupId);

//       const member = await prisma.groupSavingsMember.findFirst({
//         where: { groupId, userId: request.user.id },
//       });

//       if (!member) {
//         return response.status(403).json({
//           success: false,
//           message: "You are not a member of this group",
//         });
//       }

//       const contributions = await prisma.groupSavingsContribution.findMany({
//         where: { groupId, userId: request.user.id },
//         orderBy: { date: "desc" },
//       });

//       const total = contributions.reduce((sum, c) => sum + c.amount, 0);

//       response.json({ success: true, contributions, total });
//     } catch (error) {
//       response
//         .status(500)
//         .json({ success: false, message: "Failed to fetch contributions" });
//     }
//   };

//   cashout = async (request: Request, response: Response) => {
//     try {
//       const groupId = parseInt(request.params.groupId);

//       const group = await prisma.groupSavings.findUnique({
//         where: { id: groupId },
//       });
//       if (!group) {
//         return response
//           .status(404)
//           .json({ success: false, message: "Group not found" });
//       }

//       const now = new Date();
//       if (now < new Date(group.collectionDate)) {
//         return response.status(400).json({
//           success: false,
//           message: `Collection is not available until ${group.collectionDate.toISOString()}`,
//         });
//       }

//       const member = await prisma.groupSavingsMember.findFirst({
//         where: { groupId, userId: request.user.id },
//       });

//       if (!member) {
//         return response.status(403).json({
//           success: false,
//           message: "You are not a member of this group",
//         });
//       }

//       const contributions = await prisma.groupSavingsContribution.findMany({
//         where: { groupId, userId: request.user.id },
//       });

//       const totalAmount = contributions.reduce((sum, c) => sum + c.amount, 0);

//       if (totalAmount <= 0) {
//         return response.status(400).json({
//           success: false,
//           message: "You have no contributions to collect",
//         });
//       }

//       response.json({
//         success: true,
//         message: "Savings collected successfully",
//         amount: totalAmount,
//       });
//     } catch (error) {
//       response
//         .status(500)
//         .json({ success: false, message: "Failed to collect savings" });
//     }
//   };

//   closeGroup = async (request: Request, response: Response) => {
//     try {
//       const groupId = parseInt(request.params.groupId);

//       const group = await prisma.groupSavings.findUnique({
//         where: { id: groupId },
//       });
//       if (!group) {
//         return response
//           .status(404)
//           .json({ success: false, message: "Group not found" });
//       }

//       if (group.status === "COMPLETED") {
//         return response
//           .status(400)
//           .json({ success: false, message: "Group is already completed" });
//       }

//       await prisma.groupSavings.update({
//         where: { id: groupId },
//         data: { status: "CLOSED" },
//       });

//       response.json({ success: true, message: "Group closed successfully" });
//     } catch (error) {
//       response
//         .status(500)
//         .json({ success: false, message: "Failed to close group" });
//     }
//   };
// }

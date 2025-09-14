import { Request, Response } from "express";
import prisma from "../../connections/prisma";

class AdminController {
  // Get all thrift groups
  getAllThriftGroups = async (request: Request, response: Response) => {
    const groups = await prisma.thriftGroup.findMany({
      orderBy: { createdAt: "desc" },
    });
    return response.status(200).json({ success: true, groups });
  };

  // Get all target contribution groups
  getAllTargetContributionGroups = async (
    request: Request,
    response: Response
  ) => {
    const groups = await prisma.contributionGroup.findMany({
      orderBy: { createdAt: "desc" },
    });
    return response.status(200).json({ success: true, groups });
  };

  // Get all users
  getAllUsers = async (request: Request, response: Response) => {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
    });
    return response.status(200).json({ success: true, users });
  };

  // Get all groups (thrift + target)
  getAllGroups = async (request: Request, response: Response) => {
    const thriftGroups = await prisma.thriftGroup.findMany();
    const targetGroups = await prisma.contributionGroup.findMany();
    return response
      .status(200)
      .json({ success: true, thriftGroups, targetGroups });
  };

  // Disable user
  disableUser = async (request: Request, response: Response) => {
    const { userId } = request.body;
    if (!userId)
      return response
        .status(400)
        .json({ error: true, message: "userId is required" });
    await prisma.user.update({
      where: { id: userId },
      data: { isDisabled: true },
    });
    return response
      .status(200)
      .json({ success: true, message: "User disabled" });
  };
}

export default new AdminController();

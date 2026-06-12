import { prisma } from "../../lib/prisma.js";

export const addMemberToOrganization = async (
  organizationId,
  userId,
  newUserId,
  workspaceId,
  role
) => {
  // Check if requester is an OWNER of the organization
  const requester = await prisma.membership.findFirst({
    where: {
      organizationId,
      userId,
      role: "OWNER",
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!requester) {
    throw new Error(
      "Only organization owners can add members"
    );
  }

  // Check if workspace belongs to the organization
  const workspace = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
      organizationId,
    },
  });

  if (!workspace) {
    throw new Error("Workspace not found in this organization");
  }

  // Check if user already exists as member
  const existingMembership = await prisma.membership.findFirst({
    where: {
      userId: newUserId,
      organizationId,
      workspaceId,
    },
  });

  if (existingMembership) {
    throw new Error("User is already a member of this workspace");
  }

  // Create new membership
  const membership = await prisma.membership.create({
    data: {
      userId: newUserId,
      organizationId,
      workspaceId,
      role,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  return membership;
};

export const listOrganizationMembers = async (
  organizationId,
  userId,
  query = {}
) => {
  // Check if user is a member of the organization
  const userMembership = await prisma.membership.findFirst({
    where: {
      organizationId,
      userId,
    },
  });

  if (!userMembership) {
    throw new Error("Access denied");
  }

  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;

  const memberships = await prisma.membership.findMany({
    skip,
    take: limit,
    where: {
      organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: {
      joinedAt: "desc",
    },
  });

  const total = await prisma.membership.count({
    where: {
      organizationId,
    },
  });

  return {
    success: true,
    total,
    page,
    limit,
    members: memberships,
  };
};

export const updateMemberRole = async (
  organizationId,
  memberId,
  userId,
  newRole
) => {
  // Check if requester is an OWNER
  const requester = await prisma.membership.findFirst({
    where: {
      organizationId,
      userId,
      role: "OWNER",
    },
  });

  if (!requester) {
    throw new Error("Only organization owners can update member roles");
  }

  // Check if membership exists
  const membership = await prisma.membership.findFirst({
    where: {
      id: memberId,
      organizationId,
    },
  });

  if (!membership) {
    throw new Error("Membership not found");
  }

  // Prevent removing the last OWNER
  if (membership.role === "OWNER" && newRole !== "OWNER") {
    const ownerCount = await prisma.membership.count({
      where: {
        organizationId,
        role: "OWNER",
      },
    });

    if (ownerCount === 1) {
      throw new Error(
        "Cannot demote the last organization owner"
      );
    }
  }

  const updated = await prisma.membership.update({
    where: { id: memberId },
    data: {
      role: newRole,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  });

  return updated;
};

export const removeMember = async (
  organizationId,
  memberId,
  userId
) => {
  // Check if requester is an OWNER
  const requester = await prisma.membership.findFirst({
    where: {
      organizationId,
      userId,
      role: "OWNER",
    },
  });

  if (!requester) {
    throw new Error("Only organization owners can remove members");
  }

  // Check if membership exists
  const membership = await prisma.membership.findFirst({
    where: {
      id: memberId,
      organizationId,
    },
  });

  if (!membership) {
    throw new Error("Membership not found");
  }

  // Prevent removing the last OWNER
  if (membership.role === "OWNER") {
    const ownerCount = await prisma.membership.count({
      where: {
        organizationId,
        role: "OWNER",
      },
    });

    if (ownerCount === 1) {
      throw new Error("Cannot remove the last organization owner");
    }
  }

  await prisma.membership.delete({
    where: { id: memberId },
  });

  return { success: true, message: "Member removed successfully" };
};

export const getMemberById = async (
  organizationId,
  memberId,
  userId
) => {
  // Check if user is a member of the organization
  const userMembership = await prisma.membership.findFirst({
    where: {
      organizationId,
      userId,
    },
  });

  if (!userMembership) {
    throw new Error("Access denied");
  }

  const membership = await prisma.membership.findFirst({
    where: {
      id: memberId,
      organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          email: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!membership) {
    throw new Error("Membership not found");
  }

  return membership;
};

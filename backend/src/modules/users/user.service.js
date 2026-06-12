import { prisma } from "../../lib/prisma.js";

export const getAllUsers = async (filters, page, limit) => {
  const where = {};
  if (filters.email) {
    where.email = { contains: filters.email, mode: "insensitive" };
  }
  if (filters.name) {
    where.OR = [
      { firstName: { contains: filters.name, mode: "insensitive" } },
      { lastName: { contains: filters.name, mode: "insensitive" } },
    ];
  }
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
    where,
    skip: (page - 1) * limit,
    take: limit,
  });

  const total = await prisma.user.count({ where });

  return { success: true, page, limit, total, users };
};

export const getUserById = async (id) => {
  return prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
      googleId: true,
      createdAt: true,
      updatedAt: true,
    }
  });
};

export const updateUser = async (id, data) => {
  const user = await prisma.user.findFirst({
    where: { id }
  });
  if (!user) {
    throw new Error("User not found");
  }
  const updatedUser = await prisma.user.update({
    where: { id },
    data: {   
      firstName: data.firstName !== undefined ? data.firstName : user.firstName,
      lastName: data.lastName !== undefined ? data.lastName : user.lastName,
      avatarUrl: data.avatarUrl !== undefined ? data.avatarUrl : user.avatarUrl,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatarUrl: true,
    },
  });
  return updatedUser;
};

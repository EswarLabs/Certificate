import { prisma } from "../../lib/prisma.js";

export const getAllUsers = async (filters, page, limit) => {
  const where = {};
  if (filters.email) {
    where.email = filters.email;
  }
  if (filters.name) {
    where.name = filters.name;
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

  return { page, limit, total: users.length, users };
};

export const getUserById = async (id) => {
  return prisma.user.findUnique({ where: { id } });
};

export const updateUser = async (id, data) => {
  return prisma.user.update({
    where: { id },
    data: {
      firstName: data.firstName,
      lastName: data.lastName,
      avatarUrl: data.avatarUrl,
      updatedAt: new Date(),
    },
  });
};

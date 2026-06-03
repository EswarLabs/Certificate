import prisma from "../../lib/prisma";
import { slugify } from "../../utils/slugify";

export const createOrganization = async (name, userId) => {
  const slug = slugify(name, userId);
  const result = await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({
      data: {
        name,
        slug,
      },
    });
    const workspace = await tx.workspace.create({
      data: {
        name: `${name} Workspace`,
        organizationId: organization.id,
      },
    });
    const membership = await tx.membership.create({
      data: {
        userId,
        organizationId: organization.id,
        role: "OWNER",
      },
    });
    return {
      organization,
      workspace,
      membership,
    };
  });
  return result;
};
export const listOrganizations = async (query, userId) => {
  const page = Number(query.page) || 1;
  const limit = Number(query.limit) || 10;
  const skip = (page - 1) * limit;
  const organizations = await prisma.organization.findMany({
    skip,
    take: limit,
    orderBy: {
      createdAt: "desc",
    },
    where: {
      memberships: {
        some: { userId },
      },
    },
  });
  return organizations;
};

export const getOrganization = async (id, userId) => {
  const organization = await prisma.organization.findFirst({
    where: {
      id,
      memberships: {
        some: { userId },
      },
    },
  });
  return organization;
};

export const updateOrganization = async (id, userId, data) => {
    const organization = await prisma.organization.findFirst({
        where: {
            id,
            memberships: {
                some: { userId, role: "OWNER" },
            }
        }
    });
    if (!organization) {
        throw new Error("Organization not found or access denied");
    }
    const updatedOrganization = await prisma.organization.update({
        where: { id },
        data: {
            name: data.name || organization.name,
            slug: data.name ? slugify(data.name, userId) : organization.slug,
            logoUrl: data.logoUrl || organization.logoUrl,
            updatedAt: new Date(),
            
        }
    });
    return updatedOrganization;
}

export const deleteOrganization = async (id, userId) => {
    const organization = await prisma.organization.findFirst({
        where: {
            id,
            memberships: {
                some: {userId, role: "OWNER" },
            }
        }
    });
    if (!organization) {
        throw new Error("Organization not found or access denied");
    }
    await prisma.organization.delete({
        where: { id },
    });
    return { message: "Organization deleted successfully" };
}


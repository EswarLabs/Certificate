import {prisma} from "../../lib/prisma.js";
import { slugify } from "../../utils/slugify.js";
import { createOrganizationSchema } from "./org.validation.js";

export const createOrganization = async (name, userId) => {
  // validate input
  const parsed = createOrganizationSchema.safeParse({ name });
  if (!parsed.success) {
    throw new Error("Invalid organization name");
  }

  const slug = slugify(name, userId);

  try {
    const result = await prisma.$transaction(
      async (tx) => {
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
            slug: `${slugify("workspace", organization.id)}`,
          },
        });
        const membership = await tx.membership.create({
          data: {
            userId,
            organizationId: organization.id,
            workspaceId: workspace.id,
            role: "OWNER",
          },
        });
        return {
          organization,
          workspace,
          membership,
        };
      },
      {
        maxWait: 10000, // max 10s to wait to acquire transaction
        timeout: 20000, // transaction times out after 20s
      }
    );
    return result;
  } catch (error) {
    console.error("Transaction error:", error);
    throw error;
  }
};

export const listOrganizations = async (query, userId) => {
  try {
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
  } catch (error) {
    console.error('Error listing organizations:', error);
    throw error;
  }
};

export const getOrganization = async (id, userId) => {
  try {
    const organization = await prisma.organization.findFirst({
      where: {
        id,
        memberships: {
          some: { userId },
        },
      },
    });
    return organization;
  } catch (error) {
    console.error('Error fetching organization:', error);
    throw error;
  }
};

export const updateOrganization = async (id, userId, data) => {
  try {
    const organization = await prisma.organization.findFirst({
      where: {
        id,
        memberships: {
          some: { userId, role: "OWNER" },
        },
      },
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
      },
    });
    return updatedOrganization;
  } catch (error) {
    console.error('Error updating organization:', error);
    throw error;
  }
}

export const deleteOrganization = async (id, userId) => {
  try {
    const organization = await prisma.organization.findFirst({
      where: {
        id,
        memberships: {
          some: { userId, role: "OWNER" },
        },
      },
    });
    if (!organization) {
      throw new Error("Organization not found or access denied");
    }
    await prisma.organization.delete({ where: { id } });
    return { message: "Organization deleted successfully" };
  } catch (error) {
    console.error('Error deleting organization:', error);
    throw error;
  }
}


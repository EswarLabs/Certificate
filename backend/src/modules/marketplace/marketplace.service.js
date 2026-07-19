import { prisma } from "../../lib/prisma.js";
import {
  publishTemplateSchema,
  updatePublicTemplateSchema,
  copyTemplateSchema,
  reportTemplateSchema,
} from "./marketplace.validation.js";

// Helper to get or create CreatorProfile
export const getOrCreateCreatorProfile = async (userId) => {
  let profile = await prisma.creatorProfile.findUnique({
    where: { userId },
    include: { user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } } },
  });
  if (!profile) {
    profile = await prisma.creatorProfile.create({
      data: { userId },
      include: { user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } } },
    });
  }
  return profile;
};

export const publishTemplateService = async (userId, orgId, workspaceId, data) => {
  const validated = publishTemplateSchema.parse(data);

  // Check workspace membership
  const membership = await prisma.membership.findFirst({
    where: { userId, workspaceId },
  });
  if (!membership) {
    throw new Error("User is not a member of the workspace");
  }

  // Fetch source template
  const sourceTemplate = await prisma.certificateTemplate.findFirst({
    where: { id: validated.templateId, workspaceId },
  });
  if (!sourceTemplate) {
    throw new Error("Source template not found in this workspace");
  }

  const creator = await getOrCreateCreatorProfile(userId);

  // Extract theme colors or defaults
  const themeColors = ["#1e293b", "#3b82f6", "#ffffff"];

  // Process categories
  const categoryConnections = [];
  for (const catName of validated.categories) {
    const slug = catName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const category = await prisma.templateCategory.upsert({
      where: { slug },
      update: {},
      create: { name: catName, slug },
    });
    categoryConnections.push({ id: category.id });
  }

  // Process tags
  const tagConnections = [];
  for (const tagName of validated.tags) {
    const slug = tagName.toLowerCase().replace(/[^a-z0-9]+/g, "-");
    const tag = await prisma.publicTemplateTag.upsert({
      where: { slug },
      update: {},
      create: { name: tagName, slug },
    });
    tagConnections.push({ id: tag.id });
  }

  const publicTemplate = await prisma.publicTemplate.create({
    data: {
      originalId: sourceTemplate.id,
      creatorId: creator.id,
      title: validated.title,
      description: validated.description,
      coverImageUrl: validated.coverImageUrl || sourceTemplate.thumbnailUrl || null,
      thumbnailUrl: validated.thumbnailUrl || sourceTemplate.thumbnailUrl || null,
      visibility: validated.visibility,
      difficulty: validated.difficulty,
      industry: validated.industry,
      language: validated.language,
      license: validated.license,
      themeColors,
      editorData: sourceTemplate.editorData,
      schemaDefinition: sourceTemplate.schemaDefinition,
      version: 1,
      categories: { connect: categoryConnections },
      tags: { connect: tagConnections },
      versions: {
        create: {
          versionNumber: 1,
          changelog: "Initial publication",
          editorData: sourceTemplate.editorData,
          schemaDefinition: sourceTemplate.schemaDefinition,
        },
      },
    },
    include: {
      creator: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      categories: true,
      tags: true,
    },
  });

  return publicTemplate;
};

export const listPublicTemplates = async ({
  page = 1,
  limit = 12,
  search,
  category,
  tag,
  industry,
  sort = "trending",
}) => {
  const where = {
    visibility: "PUBLIC",
    moderation: "APPROVED",
  };

  if (search) {
    where.OR = [
      { title: { contains: search, mode: "insensitive" } },
      { description: { contains: search, mode: "insensitive" } },
    ];
  }

  if (category) {
    where.categories = { some: { slug: category } };
  }

  if (tag) {
    where.tags = { some: { slug: tag } };
  }

  if (industry && industry !== "All") {
    where.industry = industry;
  }

  let orderBy = { trendingScore: "desc" };
  if (sort === "popular") orderBy = { popularityScore: "desc" };
  if (sort === "newest") orderBy = { createdAt: "desc" };
  if (sort === "copied") orderBy = { copiesCount: "desc" };
  if (sort === "rated") orderBy = { ratingScore: "desc" };

  const skip = (page - 1) * limit;

  const [templates, total] = await Promise.all([
    prisma.publicTemplate.findMany({
      where,
      skip,
      take: limit,
      orderBy,
      include: {
        creator: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
        categories: true,
        tags: true,
      },
    }),
    prisma.publicTemplate.count({ where }),
  ]);

  return { success: true, page, limit, total, templates };
};

export const getPublicTemplateById = async (id, viewerIpHash, userId) => {
  const template = await prisma.publicTemplate.findUnique({
    where: { id },
    include: {
      creator: { include: { user: { select: { firstName: true, lastName: true, avatarUrl: true } } } },
      categories: true,
      tags: true,
      versions: { orderBy: { versionNumber: "desc" }, take: 5 },
    },
  });

  if (!template || (template.visibility !== "PUBLIC" && template.creator.userId !== userId)) {
    throw new Error("Template not found or private");
  }

  // Increment view counts asynchronously
  if (viewerIpHash) {
    prisma.publicTemplateView
      .create({
        data: { publicTemplateId: id, viewerIpHash, userId: userId || null },
      })
      .then(async () => {
        const uniqueViews = await prisma.publicTemplateView.groupBy({
          by: ["viewerIpHash"],
          where: { publicTemplateId: id },
        });
        await prisma.publicTemplate.update({
          where: { id },
          data: {
            viewsCount: { increment: 1 },
            uniqueViewsCount: uniqueViews.length,
          },
        });
      })
      .catch(() => {});
  }

  // Check user interaction states
  let isLiked = false;
  let isFavorited = false;
  if (userId) {
    const [like, fav] = await Promise.all([
      prisma.publicTemplateLike.findUnique({ where: { publicTemplateId_userId: { publicTemplateId: id, userId } } }),
      prisma.publicTemplateFavorite.findUnique({ where: { publicTemplateId_userId: { publicTemplateId: id, userId } } }),
    ]);
    isLiked = !!like;
    isFavorited = !!fav;
  }

  return { success: true, template: { ...template, isLiked, isFavorited } };
};

export const copyPublicTemplateService = async (templateId, userId, data) => {
  const { organizationId, workspaceId } = copyTemplateSchema.parse(data);

  const membership = await prisma.membership.findFirst({
    where: { userId, organizationId, workspaceId },
  });
  if (!membership) {
    throw new Error("User is not a member of target workspace");
  }

  const publicTemplate = await prisma.publicTemplate.findUnique({
    where: { id: templateId },
  });
  if (!publicTemplate || publicTemplate.moderation !== "APPROVED") {
    throw new Error("Template unavailable for copying");
  }

  // Create new template in workspace
  const newTemplate = await prisma.certificateTemplate.create({
    data: {
      workspaceId,
      createdById: userId,
      name: `${publicTemplate.title} (Copy)`,
      description: publicTemplate.description,
      thumbnailUrl: publicTemplate.thumbnailUrl,
      editorData: publicTemplate.editorData,
      schemaDefinition: publicTemplate.schemaDefinition,
      copiedFromPublicId: publicTemplate.id,
    },
  });

  // Log usage & increment copy counters
  await prisma.publicTemplateUsage.create({
    data: {
      publicTemplateId: templateId,
      organizationId,
      workspaceId,
      copiedTemplateId: newTemplate.id,
      userId,
    },
  });

  await prisma.publicTemplate.update({
    where: { id: templateId },
    data: {
      copiesCount: { increment: 1 },
      popularityScore: { increment: 5 },
    },
  });

  await prisma.creatorProfile.update({
    where: { id: publicTemplate.creatorId },
    data: { totalCopies: { increment: 1 } },
  });

  return { success: true, copiedTemplate: newTemplate };
};

export const toggleLikeService = async (templateId, userId) => {
  const existing = await prisma.publicTemplateLike.findUnique({
    where: { publicTemplateId_userId: { publicTemplateId: templateId, userId } },
  });

  if (existing) {
    await prisma.publicTemplateLike.delete({ where: { id: existing.id } });
    const updated = await prisma.publicTemplate.update({
      where: { id: templateId },
      data: { likesCount: { decrement: 1 } },
    });
    return { success: true, isLiked: false, likesCount: updated.likesCount };
  } else {
    await prisma.publicTemplateLike.create({
      data: { publicTemplateId: templateId, userId },
    });
    const updated = await prisma.publicTemplate.update({
      where: { id: templateId },
      data: { likesCount: { increment: 1 }, popularityScore: { increment: 2 } },
    });
    return { success: true, isLiked: true, likesCount: updated.likesCount };
  }
};

export const toggleFavoriteService = async (templateId, userId) => {
  const existing = await prisma.publicTemplateFavorite.findUnique({
    where: { publicTemplateId_userId: { publicTemplateId: templateId, userId } },
  });

  if (existing) {
    await prisma.publicTemplateFavorite.delete({ where: { id: existing.id } });
    const updated = await prisma.publicTemplate.update({
      where: { id: templateId },
      data: { favoritesCount: { decrement: 1 } },
    });
    return { success: true, isFavorited: false, favoritesCount: updated.favoritesCount };
  } else {
    await prisma.publicTemplateFavorite.create({
      data: { publicTemplateId: templateId, userId },
    });
    const updated = await prisma.publicTemplate.update({
      where: { id: templateId },
      data: { favoritesCount: { increment: 1 } },
    });
    return { success: true, isFavorited: true, favoritesCount: updated.favoritesCount };
  }
};

export const reportTemplateService = async (templateId, userId, data) => {
  const validated = reportTemplateSchema.parse(data);
  const report = await prisma.publicTemplateReport.create({
    data: {
      publicTemplateId: templateId,
      reporterUserId: userId,
      reason: validated.reason,
      details: validated.details || null,
    },
  });
  return { success: true, report };
};

export const getCategoriesService = async () => {
  const categories = await prisma.templateCategory.findMany({
    include: { _count: { select: { templates: true } } },
    orderBy: { name: "asc" },
  });
  return { success: true, categories };
};

export const getTagsService = async () => {
  const tags = await prisma.publicTemplateTag.findMany({
    include: { _count: { select: { templates: true } } },
    orderBy: { templates: { _count: "desc" } },
    take: 30,
  });
  return { success: true, tags };
};

export const getCreatorProfileService = async (userId) => {
  const profile = await getOrCreateCreatorProfile(userId);
  return { success: true, profile };
};

export const updateCreatorProfileService = async (userId, data) => {
  const profile = await getOrCreateCreatorProfile(userId);
  const updated = await prisma.creatorProfile.update({
    where: { id: profile.id },
    data: {
      bio: data.bio !== undefined ? data.bio : profile.bio,
      websiteUrl: data.websiteUrl !== undefined ? data.websiteUrl : profile.websiteUrl,
      organization: data.organization !== undefined ? data.organization : profile.organization,
    },
    include: { user: { select: { firstName: true, lastName: true, email: true, avatarUrl: true } } },
  });
  return { success: true, profile: updated };
};

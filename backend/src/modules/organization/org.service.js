import { prisma } from "../../lib/prisma.js";
import { slugify } from "../../utils/slugify.js";
import { createOrganizationSchema } from "./org.validation.js";
import stringSimilarity from "string-similarity";
import crypto from "crypto";
import dns from "dns";

// Use public DNS resolvers — the system resolver may block outbound UDP/TCP DNS
// from server processes on restricted networks.
const dnsResolver = new dns.Resolver();
dnsResolver.setServers(['8.8.8.8', '1.1.1.1', '8.8.4.4']);

/** Promisified resolveTxt that always uses our public DNS resolver */
const resolveTxt = (domain) =>
  new Promise((resolve, reject) =>
    dnsResolver.resolveTxt(domain, (err, records) => {
      if (err) reject(err);
      else resolve(records);
    })
  );

export const createOrganization = async (name, userId) => {
  // validate input
  const parsed = createOrganizationSchema.safeParse({ name });
  if (!parsed.success) {
    throw new Error("Invalid organization name");
  }

  // --- Account-level org creation limit ---
  // Count how many orgs this user owns (is OWNER of)
  const ownedOrgCount = await prisma.membership.count({
    where: { userId, role: "OWNER" },
    // Only count distinct organizations
  });

  // Per-tier limits (V2: read from user.planTier)
  // For now: free tier = 3 orgs max
  const ORG_LIMIT = 3;
  if (ownedOrgCount >= ORG_LIMIT) {
    throw new Error(
      `You have reached the maximum number of organizations (${ORG_LIMIT}). ` +
      `Please upgrade your plan or delete an existing organization.`
    );
  }

  // --- Layer 3: Name Similarity Detection (Anti-Spoofing) ---
  const verifiedOrgs = await prisma.organization.findMany({
    where: { isVerified: true },
    select: { name: true }
  });
  if (verifiedOrgs.length > 0) {
    const verifiedNames = verifiedOrgs.map(o => o.name);
    const bestMatch = stringSimilarity.findBestMatch(name, verifiedNames);
    if (bestMatch.bestMatch.rating > 0.85) {
      throw new Error("Organization name is too similar to a verified organization. Please choose another name or contact support.");
    }
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
    const where = {
      memberships: {
        some: { userId },
      },
    };
    const organizations = await prisma.organization.findMany({
      skip,
      take: limit,
      orderBy: {
        createdAt: "desc",
      },
      where,
    });
    const total = await prisma.organization.count({ where });
    return {
      success: true,
      page,
      limit,
      total,
      organizations,
    };
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

    if (data.name !== undefined) {
      const parsed = createOrganizationSchema.safeParse({ name: data.name });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message || "Invalid organization name");
      }
    }

    const updatedOrganization = await prisma.organization.update({
      where: { id },
      data: {
        name: data.name !== undefined ? data.name : organization.name,
        slug: data.name !== undefined ? slugify(data.name, userId) : organization.slug,
        logoUrl: data.logoUrl !== undefined ? data.logoUrl : organization.logoUrl,
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

export const requestDomainVerification = async (orgId, userId, domain) => {
  // Check if user is owner
  const membership = await prisma.membership.findFirst({
    where: { organizationId: orgId, userId, role: "OWNER" },
  });
  if (!membership) {
    throw new Error("Access denied: Only organization owners can request domain verification.");
  }

  // Clean domain
  const cleanDomain = domain.replace(/^https?:\/\//, '').split('/')[0].toLowerCase();
  if (!cleanDomain || !cleanDomain.includes('.')) {
    throw new Error("Invalid domain format.");
  }

  // Generate secure token
  const token = `certplatform-verify=${crypto.randomBytes(16).toString('hex')}`;
  // 72-hour expiry (more forgiving for DNS propagation delays)
  const expiry = new Date(Date.now() + 72 * 60 * 60 * 1000);

  await prisma.organization.update({
    where: { id: orgId },
    data: {
      verifiedDomain: cleanDomain,
      verificationMethod: "DNS_TXT",
      verificationToken: token,
      verificationStatus: "PENDING",
      verificationExpiry: expiry,
    },
  });

  return { domain: cleanDomain, token, expiry };
};

export const checkDomainVerification = async (orgId, userId) => {
  // Check if user is owner
  const membership = await prisma.membership.findFirst({
    where: { organizationId: orgId, userId, role: "OWNER" },
  });
  if (!membership) {
    throw new Error("Access denied: Only organization owners can verify domain.");
  }

  const org = await prisma.organization.findUnique({ where: { id: orgId } });
  if (!org) {
    throw new Error("Organization not found.");
  }

  if (org.isVerified) {
    return { success: true, message: "Organization is already verified." };
  }

  if (!org.verifiedDomain || !org.verificationToken) {
    throw new Error("No domain verification pending. Request verification first.");
  }

  // If the token has expired, auto-generate a fresh one and return a structured
  // TOKEN_EXPIRED response so the frontend can display the new token to the user.
  if (org.verificationExpiry && new Date() > org.verificationExpiry) {
    const newToken = `certplatform-verify=${crypto.randomBytes(16).toString('hex')}`;
    const newExpiry = new Date(Date.now() + 72 * 60 * 60 * 1000);
    await prisma.organization.update({
      where: { id: orgId },
      data: {
        verificationToken: newToken,
        verificationStatus: "PENDING",
        verificationExpiry: newExpiry,
      },
    });
    return {
      success: false,
      code: 'TOKEN_EXPIRED',
      message: 'Your previous verification token had expired — a new one has been generated. Please update your DNS TXT record with the new token and verify again.',
      newToken,
      newExpiry,
      domain: org.verifiedDomain,
    };
  }

  try {
    // Resolve TXT records using public DNS (avoids system resolver ECONNREFUSED on restricted networks)
    const records = await resolveTxt(org.verifiedDomain);

    // dns.resolveTxt returns an array of arrays (each TXT record is an array of chunked strings)
    const txtStrings = records.map(record => record.join(''));

    const isTokenFound = txtStrings.includes(org.verificationToken);

    if (isTokenFound) {
      await prisma.organization.update({
        where: { id: orgId },
        data: {
          isVerified: true,
          verificationStatus: "VERIFIED",
          verifiedAt: new Date(),
          // Clear token after success
          verificationToken: null,
          verificationExpiry: null,
        },
      });
      return { success: true, message: "Domain successfully verified." };
    } else {
      throw new Error(
        `Verification token not found in TXT records for ${org.verifiedDomain}. ` +
        `Found: ${txtStrings.join(', ') || '(none)'}. DNS may still be propagating.`
      );
    }
  } catch (error) {
    if (error.code === 'ENODATA' || error.code === 'ENOTFOUND') {
      throw new Error(`No TXT records found for ${org.verifiedDomain}. Please check your DNS settings.`);
    }
    if (error.code === 'ECONNREFUSED' || error.code === 'ETIMEDOUT') {
      throw new Error(`DNS lookup failed (network error: ${error.code}). Please try again in a moment.`);
    }
    throw error;
  }
};


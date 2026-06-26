import pkg from './generated/prisma/index.js';
const { PrismaClient } = pkg;

const prisma = new PrismaClient();
const TOKEN = 'certplatform-verify=1becbce21316b70e99e9b4b8365f5e1a';
const DOMAIN = 'glowivo.page';

async function fix() {
  // Try to find by token first
  let org = await prisma.organization.findFirst({
    where: { verificationToken: TOKEN }
  });

  // If token was already cleared, find by domain
  if (!org) {
    console.log('Token not found in DB, looking by domain...');
    org = await prisma.organization.findFirst({ where: { verifiedDomain: DOMAIN } });
  }

  if (!org) {
    console.log('No org found for domain:', DOMAIN);
    return;
  }

  console.log('Found org:', org.id, '|', org.name);
  console.log('  verificationToken:', org.verificationToken);
  console.log('  verificationStatus:', org.verificationStatus);
  console.log('  isVerified:', org.isVerified);
  console.log('  verificationExpiry:', org.verificationExpiry);

  if (org.isVerified) {
    console.log('\nOrg is already verified!');
    return;
  }

  // Restore the token + extend expiry by 72h
  const updated = await prisma.organization.update({
    where: { id: org.id },
    data: {
      verificationToken: TOKEN,
      verifiedDomain: DOMAIN,
      verificationStatus: 'PENDING',
      verificationExpiry: new Date(Date.now() + 72 * 60 * 60 * 1000),
    }
  });

  console.log('\nToken restored + expiry extended to:', updated.verificationExpiry);
  console.log('You can now click "Check Verification" in the app.');
}

fix()
  .catch(e => { console.error(e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());

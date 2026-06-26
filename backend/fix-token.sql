UPDATE "Organization" 
SET "verificationToken" = 'certplatform-verify=1becbce21316b70e99e9b4b8365f5e1a',
    "verificationStatus" = 'PENDING',
    "verificationExpiry" = NOW() + INTERVAL '72 hours'
WHERE "verifiedDomain" = 'glowivo.page'
  AND "isVerified" = false;

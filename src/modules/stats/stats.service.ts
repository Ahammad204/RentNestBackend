import { prisma } from "../../lib/prisma";

const getPublicStats = async () => {
  const [activeListings, landlordResult, tenantResult, properties] = await Promise.all([
    // Active listings count
    prisma.property.count({ where: { status: "AVAILABLE" } }),

    // Distinct landlords who have properties
    prisma.property.findMany({
      select: { landlordId: true },
      where: { status: "AVAILABLE" },
    }),

    // Distinct tenants who left reviews
    prisma.review.findMany({
      select: { tenantId: true },
    }),

    // All property locations for city extraction
    prisma.property.findMany({
      select: { location: true },
      where: { status: "AVAILABLE" },
    }),
  ]);

  // Count unique landlords
  const uniqueLandlords = new Set(landlordResult.map((p) => p.landlordId));

  // Count unique tenants
  const uniqueTenants = new Set(tenantResult.map((r) => r.tenantId));

  // Extract unique cities from location field
  const uniqueCities = new Set<string>();
  for (const p of properties) {
    const parts = p.location.split(",").map((s: string) => s.trim());
    const city = parts[parts.length - 1] || parts[0];
    if (city) uniqueCities.add(city);
  }

  return {
    activeListings,
    verifiedLandlords: uniqueLandlords.size,
    happyTenants: uniqueTenants.size,
    citiesCount: uniqueCities.size,
  };
};

export const statsService = { getPublicStats };
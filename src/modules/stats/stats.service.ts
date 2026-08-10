import { prisma } from "../../lib/prisma";

const getPublicStats = async () => {
  const [activeListings, landlordResult, tenantResult, properties] =
    await Promise.all([
      prisma.property.count({ where: { status: "AVAILABLE" } }),
      prisma.property.findMany({
        select: { landlordId: true },
        where: { status: "AVAILABLE" },
      }),
      prisma.review.findMany({ select: { tenantId: true } }),
      prisma.property.findMany({
        select: { location: true },
        where: { status: "AVAILABLE" },
      }),
    ]);

  const uniqueLandlords = new Set(
    landlordResult.map((p: { landlordId: string }) => p.landlordId)
  );
  const uniqueTenants = new Set(
    tenantResult.map((r: { tenantId: string }) => r.tenantId)
  );

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

const getMonthlyRevenue = async () => {
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const payments = await prisma.payment.findMany({
    where: {
      status: "COMPLETED",
      createdAt: { gte: sixMonthsAgo },
    },
    select: { amount: true, createdAt: true },
  });

  const monthlyData: Record<string, number> = {};
  const now = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyData[key] = 0;
  }

  for (const p of payments) {
    const d = new Date(p.createdAt);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    if (key in monthlyData) {
      monthlyData[key] = (monthlyData[key] ?? 0) + (p.amount ?? 0);
    }
  }

  const monthNames = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];

  return Object.entries(monthlyData).map(([key, amount]) => {
    const [year, month] = key.split("-");
    const monthIndex = Math.max(0, Math.min(11, parseInt(month ?? "01", 10) - 1));
    return {
      month: `${monthNames[monthIndex]} ${year}`,
      amount,
    };
  });
};

const getAdminStats = async () => {
  const [
    usersByRole,
    propertiesByStatus,
    propertiesByCategory,
    propertiesByType,
    rentalsByStatus,
    totalRevenue,
    monthlyRevenue,
    totalUsers,
    totalProperties,
    totalRentals,
    totalReviews,
  ] = await Promise.all([
    prisma.user.groupBy({ by: ["role"], _count: true }),
    prisma.property.groupBy({ by: ["status"], _count: true }),
    prisma.property.groupBy({
      by: ["categoryId"],
      _count: true,
      where: { categoryId: { not: null } },
    }),
    prisma.property.groupBy({ by: ["propertyType"], _count: true }),
    prisma.rentalRequest.groupBy({ by: ["status"], _count: true }),
    prisma.payment.aggregate({
      where: { status: "COMPLETED" },
      _sum: { amount: true },
    }),
    getMonthlyRevenue(),
    prisma.user.count(),
    prisma.property.count(),
    prisma.rentalRequest.count(),
    prisma.review.count(),
  ]);

  const categoryIds = propertiesByCategory
    .map((p: { categoryId: string | null }) => p.categoryId)
    .filter(Boolean) as string[];

  const categories =
    categoryIds.length > 0
      ? await prisma.category.findMany({
          where: { id: { in: categoryIds } },
          select: { id: true, name: true },
        })
      : [];

  const categoryMap = new Map(
    categories.map((c: { id: string; name: string }) => [c.id, c.name])
  );

  return {
    overview: {
      totalUsers,
      totalProperties,
      totalRentals,
      totalReviews,
      totalRevenue: totalRevenue._sum.amount || 0,
    },
    usersByRole: usersByRole.map((r: { role: string; _count: number }) => ({
      role: r.role,
      count: r._count,
    })),
    propertiesByStatus: propertiesByStatus.map((r: { status: string; _count: number }) => ({
      status: r.status,
      count: r._count,
    })),
    propertiesByCategory: propertiesByCategory.map((r: { categoryId: string | null; _count: number }) => ({
      category: categoryMap.get(r.categoryId || "") || "Uncategorized",
      count: r._count,
    })),
    propertiesByType: propertiesByType.map((r: { propertyType: string; _count: number }) => ({
      type: r.propertyType,
      count: r._count,
    })),
    rentalsByStatus: rentalsByStatus.map((r: { status: string; _count: number }) => ({
      status: r.status,
      count: r._count,
    })),
    monthlyRevenue,
  };
};

export const statsService = {
  getPublicStats,
  getAdminStats,
};
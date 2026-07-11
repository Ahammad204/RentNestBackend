import { prisma } from "../../lib/prisma";

const getAllUsersFromDB = async (role?: string) => {
  const where: any = {};

  if (role) {
    where.role = role;
  }

  const users = await prisma.user.findMany({
    where,
    omit: { password: true },
    orderBy: { createdAt: "desc" },
  });

  return users;
};

const banUnbanUserInDB = async (userId: string, status: "ACTIVE" | "BANNED") => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error("User not found");
  }

  if (user.role === "ADMIN") {
    throw new Error("Cannot ban/unban an admin user");
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: { status },
    omit: { password: true },
  });

  return updated;
};

const getAllPropertiesFromDB = async () => {
  const properties = await prisma.property.findMany({
    include: {
      landlord: { select: { id: true, name: true, email: true } },
      category: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return properties;
};

const getAllRentalsFromDB = async () => {
  const rentals = await prisma.rentalRequest.findMany({
    include: {
      tenant: { select: { id: true, name: true, email: true, phone: true } },
      property: { select: { id: true, title: true, location: true, price: true } },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return rentals;
};

export const adminService = {
  getAllUsersFromDB,
  banUnbanUserInDB,
  getAllPropertiesFromDB,
  getAllRentalsFromDB,
};
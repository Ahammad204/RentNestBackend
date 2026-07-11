import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import bcrypt from "bcryptjs";

const connectionString = process.env.DATABASE_URL!;
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });


async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 10);

  // 1. Admin
  const admin = await prisma.user.upsert({
    where: { email: "admin@rentnest.com" },
    update: {},
    create: {
      name: "Admin",
      email: "admin@rentnest.com",
      password: hashedPassword,
      role: "ADMIN",
      profiles: { create: { phone: "01700000000" } },
    },
  });

  // 2. Categories
  const categories = [
    { name: "Apartment", description: "Multi-unit residential building" },
    { name: "House", description: "Single-family detached home" },
    { name: "Studio", description: "Small open-plan apartment" },
    { name: "Condo", description: "Individually owned unit in a building" },
    { name: "Townhouse", description: "Multi-level home sharing walls" },
  ];

  for (const cat of categories) {
    await prisma.category.upsert({
      where: { name: cat.name },
      update: {},
      create: cat,
    });
  }

  // 3. Sample Landlord
  const landlordPassword = await bcrypt.hash("landlord123", 10);
  const landlord = await prisma.user.upsert({
    where: { email: "landlord@test.com" },
    update: {},
    create: {
      name: "Test Landlord",
      email: "landlord@test.com",
      password: landlordPassword,
      role: "LANDLORD",
      profiles: { create: { phone: "01800000000" } },
    },
  });

  // 4. Sample Tenant
  const tenantPassword = await bcrypt.hash("tenant123", 10);
  await prisma.user.upsert({
    where: { email: "tenant@test.com" },
    update: {},
    create: {
      name: "Test Tenant",
      email: "tenant@test.com",
      password: tenantPassword,
      role: "TENANT",
      profiles: { create: { phone: "01900000000" } },
    },
  });

  console.log("Seed completed!");
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
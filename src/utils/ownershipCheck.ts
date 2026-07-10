import { prisma } from "../lib/prisma";

export const verifyOwnership = async (
  resourceId: string,
  userId: string,
) => {
  const property = await prisma.property.findUnique({
    where: { id: resourceId },
    select: { landlordId: true },
  });

  if (!property) throw new Error("Property not found");
  if (property.landlordId !== userId) {
    throw new Error("Forbidden. You don't own this property.");
  }

  return property;
};
import httpStatus from "http-status";
import { prisma } from "../lib/prisma";
import { AppError } from "./AppError";

export const verifyOwnership = async (
  resourceId: string,
  userId: string,
) => {
  const property = await prisma.property.findUnique({
    where: { id: resourceId },
    select: { landlordId: true },
  });

  if (!property) throw new AppError(httpStatus.NOT_FOUND, "Property not found");
  if (property.landlordId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Forbidden. You don't own this property.");
  }

  return property;
};
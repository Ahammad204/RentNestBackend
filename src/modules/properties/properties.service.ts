import { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import { verifyOwnership } from "../../utils/ownershipCheck";

import { CreatePropertyPayload, PropertyFilters } from "./properties.interface";

const getAllPropertiesFromDB = async (filters: PropertyFilters) => {
  const where: Prisma.PropertyWhereInput = { status: "AVAILABLE" };

  if (filters.location) {
    where.location = { contains: filters.location, mode: "insensitive" };
  }

  if (filters.minPrice || filters.maxPrice) {
    where.price = {};
    if (filters.minPrice) where.price.gte = parseFloat(filters.minPrice);
    if (filters.maxPrice) where.price.lte = parseFloat(filters.maxPrice);
  }

  if (filters.propertyType) {
    where.propertyType = filters.propertyType;
  }

  if (filters.categoryId) {
    where.categoryId = filters.categoryId;
  }
  if (filters.amenities) {
    const amenitiesArray = filters.amenities.split(",");
    where.amenities = { hasSome: amenitiesArray };
  }

  const page = parseInt(filters.page || "1");
  const limit = parseInt(filters.limit || "10");
  const skip = (page - 1) * limit;

  const [properties, total] = await Promise.all([
    prisma.property.findMany({
      where,
      skip,
      take: limit,
      include: {
        landlord: {
          select: {
            id: true,
            name: true,
            email: true,
            profiles: { select: { phone: true } },
          },
        },
        category: true,
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.property.count({ where }),
  ]);

  return { properties, meta: { page, limit, total } };
};

const getPropertyByIdFromDB = async (id: string) => {
  const property = await prisma.property.findUniqueOrThrow({
    where: { id },
    include: {
      landlord: {
        select: {
          id: true,
          name: true,
          email: true,
          profiles: { select: { phone: true } },
        },
      },
      category: true,
      reviews: {
        include: {
          tenant: {
            select: { id: true, name: true, email: true },
          },
        },
      },
    },
  });

  return property;
};

const createPropertyIntoDB = async (
  userId: string,
  payload: CreatePropertyPayload,
) => {
  const { title, price, location, propertyType } = payload;

  if (!title || !price || !location || !propertyType) {
    throw new Error("Title, price, location, and propertyType are required");
  }

  if (typeof price !== "number" || price <= 0) {
    throw new Error("Price must be a positive number");
  }

  const property = await prisma.property.create({
    data: {
      ...payload,
      landlordId: userId,
    },
    include: {
      landlord: {
        select: { id: true, name: true, email: true },
      },
      category: true,
    },
  });

  return property;
};

const updatePropertyIntoDB = async (
  userId: string,
  propertyId: string,
  payload: Partial<CreatePropertyPayload>,
) => {
  await verifyOwnership(propertyId, userId);

  if (
    payload.price !== undefined &&
    (typeof payload.price !== "number" || payload.price <= 0)
  ) {
    throw new Error("Price must be a positive number");
  }

  const property = await prisma.property.update({
    where: { id: propertyId },
    data: payload,
    include: {
      landlord: {
        select: { id: true, name: true, email: true },
      },
      category: true,
    },
  });

  return property;
};

const deletePropertyFromDB = async (userId: string, propertyId: string) => {
  await verifyOwnership(propertyId, userId);

  await prisma.property.delete({
    where: { id: propertyId },
  });

  return null;
};

export const propertiesService = {
  getAllPropertiesFromDB,
  getPropertyByIdFromDB,
  createPropertyIntoDB,
  updatePropertyIntoDB,
  deletePropertyFromDB,
};

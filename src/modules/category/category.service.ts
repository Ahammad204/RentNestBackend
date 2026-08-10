import httpStatus from "http-status";
import { AppError } from "../../utils/AppError";
import { prisma } from "../../lib/prisma";

const createCategoryIntoDB = async (payload: {
  name: string;
  description?: string;
}) => {
  const { name, description } = payload;
  if (!name)
    throw new AppError(httpStatus.BAD_REQUEST, "Category name is required");

  const existing = await prisma.category.findUnique({ where: { name } });
  if (existing)
    throw new AppError(
      httpStatus.CONFLICT,
      "Category with this name already exists",
    );

  return prisma.category.create({ data: { name, description } });
};

const getAllCategoriesFromDB = async () => {
  return prisma.category.findMany({
    include: { _count: { select: { properties: true } } },
    orderBy: { createdAt: "desc" },
  });
};

const updateCategoryInDB = async (
  id: string,
  payload: { name?: string; description?: string },
) => {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing)
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");

  if (payload.name && payload.name !== existing.name) {
    const nameTaken = await prisma.category.findUnique({
      where: { name: payload.name },
    });
    if (nameTaken)
      throw new AppError(
        httpStatus.CONFLICT,
        "Category with this name already exists",
      );
  }

  return prisma.category.update({
    where: { id },
    data: {
      ...(payload.name !== undefined && { name: payload.name }),
      ...(payload.description !== undefined && {
        description: payload.description,
      }),
    },
  });
};

const deleteCategoryFromDB = async (id: string) => {
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing)
    throw new AppError(httpStatus.NOT_FOUND, "Category not found");

  const propertyCount = await prisma.property.count({
    where: { categoryId: id },
  });
  if (propertyCount > 0) {
    throw new AppError(
      httpStatus.CONFLICT,
      `Cannot delete category: ${propertyCount} properties are assigned to it`,
    );
  }

  await prisma.category.delete({ where: { id } });
  return { message: "Category deleted successfully" };
};

export const categoryService = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
  updateCategoryInDB,
  deleteCategoryFromDB,
};
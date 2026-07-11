import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { CreateCategoryPayload } from "./category.interface";

const createCategoryIntoDB = async (payload: CreateCategoryPayload) => {
  const { name, description } = payload;

  if (!name) {
    throw new AppError(httpStatus.BAD_REQUEST, "Category name is required");
  }

  const existing = await prisma.category.findUnique({
    where: { name },
  });

  if (existing) {
    throw new AppError(httpStatus.CONFLICT, "Category with this name already exists");
  }

  const category = await prisma.category.create({
    data: { name, description },
  });

  return category;
};

const getAllCategoriesFromDB = async () => {
  const categories = await prisma.category.findMany();
  return categories;
};

export const categoryService = {
  createCategoryIntoDB,
  getAllCategoriesFromDB,
};

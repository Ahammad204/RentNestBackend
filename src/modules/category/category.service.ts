import { prisma } from "../../lib/prisma";
import { CreateCategoryPayload } from "./category.interface";

const createCategoryIntoDB = async (payload: CreateCategoryPayload) => {
  const { name, description } = payload;

  if (!name) {
    throw new Error("Category name is required");
  }

  const existing = await prisma.category.findUnique({
    where: { name },
  });

  if (existing) {
    throw new Error("Category with this name already exists");
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

import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { categoryService } from "./category.service";

const createCategory = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const category = await categoryService.createCategoryIntoDB(req.body);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Category created successfully",
      data: { category },
    });
  },
);

const getAllCategories = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const categories = await categoryService.getAllCategoriesFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Categories fetched successfully",
      data: { categories },
    });
  },
);

export const categoryController = {
  createCategory,
  getAllCategories,
};

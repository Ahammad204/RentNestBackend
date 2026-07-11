import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { propertiesService } from "./properties.service";

const getAllProperties = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const filters = req.query;

    const { properties, meta } =
      await propertiesService.getAllPropertiesFromDB(filters);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Properties fetched successfully",
      data: { properties },
      meta,
    });
  },
);

const getPropertyById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const property = await propertiesService.getPropertyByIdFromDB(
      id as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Property fetched successfully",
      data: { property },
    });
  },
);

const createProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const property = await propertiesService.createPropertyIntoDB(
      req.user?.id as string,
      req.body,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Property created successfully",
      data: { property },
    });
  },
);

const updateProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const property = await propertiesService.updatePropertyIntoDB(
      req.user?.id as string,
      id as string,
      req.body,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Property updated successfully",
      data: { property },
    });
  },
);

const deleteProperty = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    await propertiesService.deletePropertyFromDB(
      req.user?.id as string,
      id as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Property deleted successfully",
      data: null,
    });
  },
);

export const propertiesController = {
  getAllProperties,
  getPropertyById,
  createProperty,
  updateProperty,
  deleteProperty,
};

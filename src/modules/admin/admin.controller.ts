import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { adminService } from "./admin.service";

const getAllUsers = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { role } = req.query;

    const users = await adminService.getAllUsersFromDB(role as string);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Users fetched successfully",
      data: { users },
    });
  },
);

const banUnbanUser = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status || !["ACTIVE", "BANNED"].includes(status)) {
      throw new Error("Status must be ACTIVE or BANNED");
    }

    const user = await adminService.banUnbanUserInDB(id as string, status);

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `User ${status === "BANNED" ? "banned" : "unbanned"} successfully`,
      data: { user },
    });
  },
);

const getAllProperties = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const properties = await adminService.getAllPropertiesFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Properties fetched successfully",
      data: { properties },
    });
  },
);

const getAllRentals = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const rentals = await adminService.getAllRentalsFromDB();

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Rental requests fetched successfully",
      data: { rentals },
    });
  },
);

export const adminController = {
  getAllUsers,
  banUnbanUser,
  getAllProperties,
  getAllRentals,
};

import { Request, Response } from "express";

import httpStatus from "http-status";
import { statsService } from "./stats.service";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";

const getPublicStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await statsService.getPublicStats();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Stats fetched successfully",
    data: stats,
  });
});

const getAdminStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await statsService.getAdminStats();
  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Admin stats fetched successfully",
    data: stats,
  });
});

export const statsController = {
  getPublicStats,
  getAdminStats,
};
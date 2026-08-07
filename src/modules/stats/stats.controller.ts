import { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { statsService } from "./stats.service";

const getPublicStats = catchAsync(async (req: Request, res: Response) => {
  const stats = await statsService.getPublicStats();

  sendResponse(res, {
    success: true,
    statusCode: httpStatus.OK,
    message: "Stats fetched successfully",
    data: stats,
  });
});

export const statsController = { getPublicStats };
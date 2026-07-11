import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { rentalService } from "./rental.service";

const createRentalRequest = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const rentalRequest = await rentalService.createRentalRequestIntoDB(
      req.user?.id as string,
      req.body,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Rental request submitted successfully",
      data: { rentalRequest },
    });
  },
);

const getMyRentalRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const requests = await rentalService.getMyRentalRequestsFromDB(
      req.user?.id as string,
      req.user?.role as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Rental requests fetched successfully",
      data: { requests },
    });
  },
);

const getRentalRequestById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const rentalRequest = await rentalService.getRentalRequestByIdFromDB(
      id as string,
      req.user?.id as string,
      req.user?.role as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Rental request fetched successfully",
      data: { rentalRequest },
    });
  },
);

const getAllLandlordRequests = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const requests = await rentalService.getAllLandlordRequestsFromDB(
      req.user?.id as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Landlord rental requests fetched successfully",
      data: { requests },
    });
  },
);

const updateRentalRequestStatus = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const updated = await rentalService.updateRentalRequestStatusIntoDB(
      id as string,
      req.user?.id as string,
      req.body,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: `Rental request ${updated.status.toLowerCase()} successfully`,
      data: { rentalRequest: updated },
    });
  },
);

export const rentalController = {
  createRentalRequest,
  getMyRentalRequests,
  getRentalRequestById,
  getAllLandlordRequests,
  updateRentalRequestStatus,
};

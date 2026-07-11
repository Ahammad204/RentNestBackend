import { NextFunction, Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { paymentService } from "./payment.service";

const createPayment = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { payment, sessionUrl } = await paymentService.createPaymentSession(
      req.user?.id as string,
      req.body,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.CREATED,
      message: "Payment session created successfully",
      data: { payment, sessionUrl },
    });
  },
);

const handleWebhook = async (req: Request, res: Response) => {
  try {
    const signature = req.headers["stripe-signature"] as string;

    const result = await paymentService.handleWebhook(req.body, signature);

    res.status(httpStatus.OK).json({ received: true, ...result });
  } catch (err: any) {
    res.status(httpStatus.BAD_REQUEST).json({
      error: `Webhook Error: ${err.message}`,
    });
  }
};

const getMyPayments = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const payments = await paymentService.getMyPaymentsFromDB(
      req.user?.id as string,
      req.user?.role as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payments fetched successfully",
      data: { payments },
    });
  },
);

const getPaymentById = catchAsync(
  async (req: Request, res: Response, next: NextFunction) => {
    const { id } = req.params;

    const payment = await paymentService.getPaymentByIdFromDB(
      id as string,
      req.user?.id as string,
      req.user?.role as string,
    );

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: "Payment fetched successfully",
      data: { payment },
    });
  },
);

export const paymentController = {
  createPayment,
  handleWebhook,
  getMyPayments,
  getPaymentById,
};
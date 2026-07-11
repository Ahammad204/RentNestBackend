import Stripe from "stripe";
import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import config from "../../config";
import { AppError } from "../../utils/AppError";
import { CreatePaymentPayload } from "./payment.interface";

const stripe = new Stripe(config.stripe_secret_key);

const createPaymentSession = async (
  tenantId: string,
  payload: CreatePaymentPayload,
) => {
  const { rentalRequestId, method } = payload;

  if (!rentalRequestId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Rental request ID is required");
  }

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: {
      property: {
        select: { id: true, title: true, price: true, location: true },
      },
      payment: true,
    },
  });

  if (!rentalRequest) {
    throw new AppError(httpStatus.NOT_FOUND, "Rental request not found");
  }

  if (rentalRequest.tenantId !== tenantId) {
    throw new AppError(httpStatus.FORBIDDEN, "Forbidden. This is not your rental request.");
  }

  if (rentalRequest.status !== "APPROVED") {
    throw new AppError(httpStatus.BAD_REQUEST, "Payment can only be made for approved rental requests");
  }

  if (rentalRequest.payment) {
    throw new AppError(httpStatus.CONFLICT, "Payment already exists for this rental request");
  }

  const existingFailed = await prisma.payment.findFirst({
    where: {
      rentalRequestId,
      status: "FAILED",
    },
  });

  if (existingFailed) {
    await prisma.payment.delete({
      where: { id: existingFailed.id },
    });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: "usd",
          product_data: {
            name: `Rent: ${rentalRequest.property.title}`,
            description: `Property at ${rentalRequest.property.location}`,
          },
          unit_amount: Math.round(rentalRequest.property.price * 100),
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${config.app_url}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${config.app_url}/payment/cancel?session_id={CHECKOUT_SESSION_ID}`,
    metadata: {
      rentalRequestId,
      tenantId,
      propertyId: rentalRequest.propertyId,
    },
  });

  const payment = await prisma.payment.create({
    data: {
      transactionId: session.id,
      amount: rentalRequest.property.price,
      method: method || "card",
      status: "PENDING",
      rentalRequestId,
    },
    include: {
      rentalRequest: {
        include: {
          property: { select: { id: true, title: true, price: true } },
        },
      },
    },
  });

  return { payment, sessionUrl: session.url };
};

const handleWebhook = async (payload: Buffer, signature: string) => {
  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(
      payload,
      signature,
      config.stripe_webhook_secret,
    );
  } catch (err: any) {
    throw new AppError(httpStatus.BAD_REQUEST, `Webhook signature verification failed: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    const payment = await prisma.payment.findUnique({
      where: { transactionId: session.id },
      include: {
        rentalRequest: true,
      },
    });

    if (!payment) {
      throw new AppError(httpStatus.NOT_FOUND, "Payment record not found for this session");
    }

    if (payment.status === "COMPLETED") {
      return { message: "Payment already processed" };
    }

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: payment.id },
        data: {
          status: "COMPLETED",
          paidAt: new Date(),
        },
      }),
      prisma.rentalRequest.update({
        where: { id: payment.rentalRequestId },
        data: { status: "ACTIVE" },
      }),
      prisma.property.update({
        where: { id: payment.rentalRequest.propertyId },
        data: { status: "RENTED" },
      }),
    ]);

    return {
      message: "Payment completed, rental activated, property marked as rented",
    };
  }

  return { message: `Unhandled event type: ${event.type}` };
};

const handlePaymentFailure = async (sessionId: string) => {
  const payment = await prisma.payment.findUnique({
    where: { transactionId: sessionId },
  });

  if (!payment) return;

  if (payment.status === "PENDING") {
    await prisma.payment.update({
      where: { id: payment.id },
      data: { status: "FAILED" },
    });
  }
};

const getMyPaymentsFromDB = async (userId: string, role: string) => {
  if (role === "TENANT") {
    const payments = await prisma.payment.findMany({
      where: {
        rentalRequest: { tenantId: userId },
      },
      include: {
        rentalRequest: {
          include: {
            property: {
              select: { id: true, title: true, location: true, price: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return payments;
  }

  if (role === "LANDLORD") {
    const payments = await prisma.payment.findMany({
      where: {
        rentalRequest: {
          property: { landlordId: userId },
        },
      },
      include: {
        rentalRequest: {
          include: {
            tenant: { select: { id: true, name: true, email: true } },
            property: {
              select: { id: true, title: true, location: true, price: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return payments;
  }

  if (role === "ADMIN") {
    const payments = await prisma.payment.findMany({
      include: {
        rentalRequest: {
          include: {
            tenant: { select: { id: true, name: true, email: true } },
            property: {
              select: { id: true, title: true, location: true, price: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    return payments;
  }

  throw new AppError(httpStatus.BAD_REQUEST, "Invalid role");
};

const getPaymentByIdFromDB = async (
  paymentId: string,
  userId: string,
  role: string,
) => {
  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
    include: {
      rentalRequest: {
        include: {
          tenant: {
            select: {
              id: true,
              name: true,
              email: true,
              profiles: { select: { phone: true } },
            },
          },
          property: {
            include: {
              landlord: { select: { id: true, name: true, email: true } },
            },
          },
        },
      },
    },
  });

  if (!payment) {
    throw new AppError(httpStatus.NOT_FOUND, "Payment not found");
  }

  if (role === "ADMIN") return payment;

  if (role === "TENANT" && payment.rentalRequest.tenantId !== userId) {
    throw new AppError(httpStatus.FORBIDDEN, "Forbidden. You can only view your own payments.");
  }

  if (
    role === "LANDLORD" &&
    payment.rentalRequest.property.landlordId !== userId
  ) {
    throw new AppError(
      httpStatus.FORBIDDEN,
      "Forbidden. You can only view payments for your properties.",
    );
  }

  return payment;
};

export const paymentService = {
  createPaymentSession,
  handleWebhook,
  handlePaymentFailure,
  getMyPaymentsFromDB,
  getPaymentByIdFromDB,
};

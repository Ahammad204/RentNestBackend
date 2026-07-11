import httpStatus from "http-status";
import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/AppError";
import { CreateReviewPayload } from "./review.interface";

const createReviewIntoDB = async (
  tenantId: string,
  payload: CreateReviewPayload,
) => {
  const { rentalRequestId, rating, comment } = payload;

  if (!rentalRequestId) {
    throw new AppError(httpStatus.BAD_REQUEST, "Rental request ID is required");
  }

  if (rating === undefined || rating === null) {
    throw new AppError(httpStatus.BAD_REQUEST, "Rating is required");
  }

  if (
    typeof rating !== "number" ||
    rating < 1 ||
    rating > 5 ||
    !Number.isInteger(rating)
  ) {
    throw new AppError(httpStatus.BAD_REQUEST, "Rating must be an integer between 1 and 5");
  }

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: { reviews: true },
  });

  if (!rentalRequest) {
    throw new AppError(httpStatus.NOT_FOUND, "Rental request not found");
  }

  if (rentalRequest.tenantId !== tenantId) {
    throw new AppError(httpStatus.FORBIDDEN, "Forbidden. You can only review your own rental requests.");
  }

  if (!["ACTIVE", "COMPLETED"].includes(rentalRequest.status)) {
    throw new AppError(httpStatus.BAD_REQUEST, "You can only review completed rental requests");
  }

  if (rentalRequest.reviews.length > 0) {
    throw new AppError(httpStatus.CONFLICT, "You have already reviewed this rental request");
  }

  const review = await prisma.review.create({
    data: {
      tenantId,
      propertyId: rentalRequest.propertyId,
      rentalRequestId,
      rating,
      comment,
    },
    include: {
      tenant: { select: { id: true, name: true, email: true } },
      property: { select: { id: true, title: true, location: true } },
    },
  });

  return review;
};

const getReviewsByPropertyFromDB = async (propertyId: string) => {
  const reviews = await prisma.review.findMany({
    where: { propertyId },
    include: {
      tenant: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRating = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;

  return {
    reviews,
    averageRating: Math.round(averageRating * 10) / 10,
    totalReviews: reviews.length,
  };
};

export const reviewService = {
  createReviewIntoDB,
  getReviewsByPropertyFromDB,
};

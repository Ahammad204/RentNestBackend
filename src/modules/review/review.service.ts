import { prisma } from "../../lib/prisma";
import { CreateReviewPayload } from "./review.interface";

const createReviewIntoDB = async (
  tenantId: string,
  payload: CreateReviewPayload,
) => {
  const { rentalRequestId, rating, comment } = payload;

  if (!rentalRequestId) {
    throw new Error("Rental request ID is required");
  }

  if (rating === undefined || rating === null) {
    throw new Error("Rating is required");
  }

  if (
    typeof rating !== "number" ||
    rating < 1 ||
    rating > 5 ||
    !Number.isInteger(rating)
  ) {
    throw new Error("Rating must be an integer between 1 and 5");
  }

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalRequestId },
    include: { reviews: true },
  });

  if (!rentalRequest) {
    throw new Error("Rental request not found");
  }

  if (rentalRequest.tenantId !== tenantId) {
    throw new Error("Forbidden. You can only review your own rental requests.");
  }

  if (!["ACTIVE", "COMPLETED"].includes(rentalRequest.status)) {
    throw new Error("You can only review completed rental requests");
  }

  if (rentalRequest.reviews.length > 0) {
    throw new Error("You have already reviewed this rental request");
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

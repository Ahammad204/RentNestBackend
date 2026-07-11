import { prisma } from "../../lib/prisma";
import {
  CreateRentalRequestPayload,
  RentalStatus,
  UpdateRentalRequestPayload,
  ValidTransitions,
} from "./rental.interface";

const VALID_TRANSITIONS: ValidTransitions = {
  PENDING: ["APPROVED", "REJECTED"],
  APPROVED: ["ACTIVE"],
  ACTIVE: ["COMPLETED"],
  REJECTED: [],
  COMPLETED: [],
};

const validateTransition = (current: RentalStatus, next: RentalStatus) => {
  const allowed = VALID_TRANSITIONS[current];

  if (!allowed.includes(next)) {
    throw new Error(
      `Cannot transition rental request from ${current} to ${next}.`,
    );
  }
};

const createRentalRequestIntoDB = async (
  tenantId: string,
  payload: CreateRentalRequestPayload,
) => {
  const { propertyId, moveInDate, message } = payload;

  if (!propertyId) {
    throw new Error("Property ID is required");
  }

  const property = await prisma.property.findUnique({
    where: { id: propertyId },
  });

  if (!property) {
    throw new Error("Property not found");
  }

  if (property.status !== "AVAILABLE") {
    throw new Error("Property is not available for rent");
  }

  if (property.landlordId === tenantId) {
    throw new Error("You cannot rent your own property");
  }

  const existingRequest = await prisma.rentalRequest.findFirst({
    where: {
      tenantId,
      propertyId,
      status: { in: ["PENDING", "APPROVED", "ACTIVE"] },
    },
  });

  if (existingRequest) {
    throw new Error(
      "You already have a pending or active rental request for this property",
    );
  }

  const rentalRequest = await prisma.rentalRequest.create({
    data: {
      tenantId,
      propertyId,
      moveInDate: moveInDate ? new Date(moveInDate) : undefined,
      message,
    },
    include: {
      tenant: { select: { id: true, name: true, email: true } },
      property: {
        select: { id: true, title: true, location: true, price: true },
      },
    },
  });

  return rentalRequest;
};

const getMyRentalRequestsFromDB = async (userId: string, role: string) => {
  if (role === "TENANT") {
    const requests = await prisma.rentalRequest.findMany({
      where: { tenantId: userId },
      include: {
        property: {
          select: {
            id: true,
            title: true,
            location: true,
            price: true,
            images: true,
            landlord: { select: { id: true, name: true, email: true } },
          },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return requests;
  }

  if (role === "LANDLORD") {
    const requests = await prisma.rentalRequest.findMany({
      where: {
        property: { landlordId: userId },
      },
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
          select: { id: true, title: true, location: true, price: true },
        },
        payment: true,
      },
      orderBy: { createdAt: "desc" },
    });
    return requests;
  }

  throw new Error("Invalid role");
};

const getRentalRequestByIdFromDB = async (
  rentalId: string,
  userId: string,
  role: string,
) => {
  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalId },
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
          landlord: {
            select: {
              id: true,
              name: true,
              email: true,
              profiles: { select: { phone: true } },
            },
          },
        },
      },
      payment: true,
    },
  });

  if (!rentalRequest) {
    throw new Error("Rental request not found");
  }

  if (role === "ADMIN") return rentalRequest;

  if (role === "TENANT" && rentalRequest.tenantId !== userId) {
    throw new Error("Forbidden. You can only view your own rental requests.");
  }

  if (role === "LANDLORD" && rentalRequest.property.landlordId !== userId) {
    throw new Error(
      "Forbidden. You can only view requests on your properties.",
    );
  }

  return rentalRequest;
};

const getAllLandlordRequestsFromDB = async (landlordId: string) => {
  const requests = await prisma.rentalRequest.findMany({
    where: {
      property: { landlordId },
    },
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
        select: { id: true, title: true, location: true, price: true },
      },
      payment: true,
    },
    orderBy: { createdAt: "desc" },
  });

  return requests;
};

const updateRentalRequestStatusIntoDB = async (
  rentalId: string,
  landlordId: string,
  payload: UpdateRentalRequestPayload,
) => {
  const { status } = payload;

  const rentalRequest = await prisma.rentalRequest.findUnique({
    where: { id: rentalId },
    include: { property: { select: { landlordId: true } } },
  });

  if (!rentalRequest) {
    throw new Error("Rental request not found");
  }

  if (rentalRequest.property.landlordId !== landlordId) {
    throw new Error("Forbidden. You don't own this property.");
  }

  validateTransition(rentalRequest.status, status);

  const updated = await prisma.rentalRequest.update({
    where: { id: rentalId },
    data: { status },
    include: {
      tenant: { select: { id: true, name: true, email: true } },
      property: {
        select: { id: true, title: true, location: true, price: true },
      },
      payment: true,
    },
  });

  return updated;
};

export const rentalService = {
  createRentalRequestIntoDB,
  getMyRentalRequestsFromDB,
  getRentalRequestByIdFromDB,
  getAllLandlordRequestsFromDB,
  updateRentalRequestStatusIntoDB,
};

import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { rentalController } from "./rental.controller";

const router = Router();

router.post(
  "/",
  auth(Role.TENANT),
  rentalController.createRentalRequest,
);

router.get(
  "/",
  auth(Role.TENANT, Role.LANDLORD),
  rentalController.getMyRentalRequests,
);

router.get(
  "/landlord",
  auth(Role.LANDLORD),
  rentalController.getAllLandlordRequests,
);

router.get(
  "/:id",
  auth(Role.TENANT, Role.LANDLORD, Role.ADMIN),
  rentalController.getRentalRequestById,
);

router.patch(
  "/landlord/:id",
  auth(Role.LANDLORD),
  rentalController.updateRentalRequestStatus,
);

export const rentalRoutes = router;
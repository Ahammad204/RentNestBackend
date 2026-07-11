import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { paymentController } from "./payment.controller";

const router = Router();

router.post("/create", auth(Role.TENANT), paymentController.createPayment);

router.get(
  "/",
  auth(Role.TENANT, Role.LANDLORD, Role.ADMIN),
  paymentController.getMyPayments,
);

router.get(
  "/:id",
  auth(Role.TENANT, Role.LANDLORD, Role.ADMIN),
  paymentController.getPaymentById,
);

export const paymentRoutes = router;

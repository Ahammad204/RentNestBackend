import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { reviewController } from "./review.controller";

const router = Router();

router.post("/", auth(Role.TENANT), reviewController.createReview);

router.get("/property/:propertyId", reviewController.getReviewsByProperty);

export const reviewRoutes = router;

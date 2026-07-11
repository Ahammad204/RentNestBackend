import { Router } from "express";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";
import { adminController } from "./admin.controller";

const router = Router();

router.get("/users", auth(Role.ADMIN), adminController.getAllUsers);
router.patch("/users/:id", auth(Role.ADMIN), adminController.banUnbanUser);
router.get("/properties", auth(Role.ADMIN), adminController.getAllProperties);
router.get("/rentals", auth(Role.ADMIN), adminController.getAllRentals);

export const adminRoutes = router;
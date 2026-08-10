import { Router } from "express";
import { statsController } from "./stats.controller";
import { auth } from "../../middlewares/auth";
import { Role } from "../../../generated/prisma/enums";



const router = Router();

router.get("/", statsController.getPublicStats);
router.get("/admin", auth(Role.ADMIN), statsController.getAdminStats);

export default router;
import { Router } from "express";
import { AuthGuard } from "@/common/middleware";
import { getAllUsers } from "./users.controller";

const router = Router();

router.get('/',
  AuthGuard,
  getAllUsers
);

export { router as userRoutes };
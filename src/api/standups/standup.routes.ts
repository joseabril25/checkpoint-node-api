import { Router } from "express";
import { AuthGuard, ValidateDTO } from "@/common/middleware";
import { CreateStandupRequestDto } from "./DTOs/create-standup.dto";
import { createStandup } from "./standup.controller";

const router = Router();

router.post('/standups',
  AuthGuard, // Ensure the user is authenticated
  ValidateDTO(CreateStandupRequestDto), // Validate the request body
  createStandup // Handle the creation of a standup
);
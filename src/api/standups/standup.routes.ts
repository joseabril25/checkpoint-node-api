import { Router } from "express";
import { AuthGuard, ValidateDTO } from "@/common/middleware";
import { CreateStandupRequestDto, StandupParamsDto, UpdateStandupRequestDto } from "./DTOs/standup.dto";
import { createStandup, updateStandup } from "./standup.controller";

const router = Router();

router.post('/',
  AuthGuard, // Ensure the user is authenticated
  ValidateDTO(CreateStandupRequestDto), // Validate the request body
  createStandup // Handle the creation of a standup
);

router.patch('/:id', 
  AuthGuard, 
  ValidateDTO(StandupParamsDto, 'params'), // Validate the request params
  ValidateDTO(UpdateStandupRequestDto), 
  updateStandup
);

export { router as standupRoutes };
import { Router } from "express";
import { AuthGuard, ValidateDTO } from "@/common/middleware";
import { CreateStandupRequestDto, StandupParamsDto, UpdateStandupRequestDto, GetStandupsQueryDto } from "./DTOs/standup.dto";
import { createStandup, updateStandup, getStandups } from "./standup.controller";

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

router.get('/',
  AuthGuard,
  ValidateDTO(GetStandupsQueryDto, 'query'),
  getStandups
);

export { router as standupRoutes };
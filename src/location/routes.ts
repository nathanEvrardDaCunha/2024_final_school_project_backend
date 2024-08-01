import { Router } from 'express';import {estimateLocationPriceController, getLocationsToReviewController, saveLocationController} from "./controllers";import {authenticateToken} from "../dashboard/middleware";const locationRouter = Router();locationRouter.post('/estimate', estimateLocationPriceController);locationRouter.post('/save', authenticateToken, saveLocationController);locationRouter.get('/review', authenticateToken, getLocationsToReviewController);export default locationRouter;
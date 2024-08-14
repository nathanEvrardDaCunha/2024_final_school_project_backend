import { Router } from 'express';import {	completeLocationPaperworkController, createReservationController, deleteReservationController,	estimateLocationPriceController,	getLocationController, getLocationDetailController, getLocationReservationsController,	getLocationsPendingPublishController,	getLocationsToReviewController,	getPublishedLocationsController, getRentorReservationsController,	getUserPublishedLocationsController, getUserReservationsController,	publishLocationController,	registerPerksController,	removeDocumentController,	saveLocationController,	uploadLocationImageControllerAsImage,	uploadLocationImageControllerAsPaperAsset} from "./controllers";import {authenticateReservationUser, authenticateToken} from "../dashboard/middleware";import multer from 'multer';const upload = multer({ dest: 'uploads/' });const locationRouter = Router();locationRouter.post('/estimate', estimateLocationPriceController);locationRouter.post('/save', authenticateToken, saveLocationController);locationRouter.get('/user/published', authenticateToken, getUserPublishedLocationsController);locationRouter.get('/user/reservations', authenticateToken, getUserReservationsController);locationRouter.get('/review', authenticateToken, getLocationsToReviewController);locationRouter.get('/pending-publish', authenticateToken, getLocationsPendingPublishController);locationRouter.get('/published', getPublishedLocationsController);locationRouter.post('/location/:id/reservations', authenticateReservationUser, createReservationController);locationRouter.get('/:id/rentor-reservations', authenticateToken, getRentorReservationsController);locationRouter.delete('/reservations/:reservationId', authenticateToken, deleteReservationController);locationRouter.get('/published/:id', authenticateToken, getLocationDetailController);locationRouter.get('/:id/reservations', authenticateReservationUser, getLocationReservationsController);locationRouter.post('/:id/reservations', authenticateReservationUser, createReservationController);locationRouter.post('/:id/upload-paper', authenticateToken, upload.single('image'), uploadLocationImageControllerAsPaperAsset);locationRouter.post('/:id/upload-image', authenticateToken, upload.single('image'), uploadLocationImageControllerAsImage);locationRouter.post('/:id/perks', authenticateToken, registerPerksController);locationRouter.post('/:id/complete', authenticateToken, completeLocationPaperworkController);locationRouter.post('/:id/publish', authenticateToken, publishLocationController);locationRouter.delete('/:locationId/document/:documentId', authenticateToken, removeDocumentController);locationRouter.get('/:id', authenticateToken, getLocationController);export default locationRouter;
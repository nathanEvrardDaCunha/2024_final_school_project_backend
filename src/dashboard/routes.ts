import { Router } from 'express';import {getUserInfoController, updateUserByAdmin, updateUserInfoController} from "./controllers";import {authenticateToken} from "./middleware";const dashboardRouter = Router();dashboardRouter.put('/users/:userId', authenticateToken, updateUserByAdmin);dashboardRouter.get('/user', authenticateToken, getUserInfoController);dashboardRouter.put('/user', authenticateToken, updateUserInfoController);export default dashboardRouter;
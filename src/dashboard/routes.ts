import { Router } from 'express';import { getUserInfoController, updateUserInfoController } from "./controllers";import {authenticateToken} from "./middleware";const dashboardRouter = Router();dashboardRouter.get('/user', authenticateToken, getUserInfoController);dashboardRouter.put('/user', authenticateToken, updateUserInfoController);export default dashboardRouter;
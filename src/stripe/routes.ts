import express, { Router } from 'express';import { authenticateToken } from "../dashboard/middleware";import {	createCheckoutSessionController,	createSubscriptionCheckoutSessionController,	webhookHandler} from "./controllers";const stripeRouter = Router();stripeRouter.post('/create-checkout-session', authenticateToken, createCheckoutSessionController);stripeRouter.post('/create-subscription-checkout-session', authenticateToken, createSubscriptionCheckoutSessionController);stripeRouter.post('/webhook', express.raw({type: 'application/json'}), webhookHandler);export default stripeRouter;
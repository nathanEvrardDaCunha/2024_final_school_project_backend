import { PrismaClient } from "@prisma/client";import express from "express";import cors from "cors";import dotenv from 'dotenv';import {initRoutes} from "./routes";dotenv.config();export const prisma = new PrismaClient();async function main() {	const app = express();	const port = 3000;		app.use(cors({		origin: ["http://178.16.131.53:4173"],		optionsSuccessStatus: 200,		credentials: true,	}));		app.use('/stripe/webhook', express.raw({type: 'application/json'}));		app.use(express.json());	initRoutes(app);		app.listen(port, () => {		console.log(`Server running on port ${port}`);	});}main()	.then(async () => {		await prisma.$disconnect();	})	.catch(async (e) => {		console.error(e);		await prisma.$disconnect();		process.exit(1);	});
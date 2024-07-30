import { Request, Response } from 'express';import { fetchAllUsers, login, register } from './services';import { UserStatus } from '@prisma/client';export async function registerController(req: Request, res: Response): Promise<void> {	try {		const { email, firstname, lastname, birthDate, phoneNumber, password, isRenter } = req.body;				const status = isRenter ? UserStatus.RENTER : UserStatus.FREE;				const newUser = await register({			email,			firstname,			lastname,			birthDate: new Date(birthDate),			password,			phoneNumber,			status,		});				res.status(201).json({			message: 'User registered successfully',			userId: newUser.id,		});	} catch (error) {		if (error instanceof Error) {			if (error.message.includes('User with this email already exists')) {				res.status(409).json({ error: error.message });			} else {				console.error('Error registering user:', error);				res.status(400).json({ error: error.message });			}		} else {			console.error('An unknown error occurred:', error);			res.status(500).json({ error: 'An unknown error occurred' });		}	}}export async function fetchAllUsersController(req: Request, res: Response): Promise<void> {	try {		const users = await fetchAllUsers();		res.status(200).json(users);	} catch (error) {		if (error instanceof Error) {			console.error('Error fetching all users:', error);			res.status(500).json({ error: error.message });		} else {			console.error('An unknown error occurred:', error);			res.status(500).json({ error: 'An unknown error occurred' });		}	}}export async function loginController(req: Request, res: Response): Promise<void> {	try {		const { email, password } = req.body;				const loginResult = await login(email, password);				res.status(200).json({			message: 'Login successful',			userId: loginResult.user.id,			token: loginResult.token		});	} catch (error) {		if (error instanceof Error) {			console.error('Error logging in:', error);			res.status(401).json({ error: error.message });		} else {			console.error('An unknown error occurred:', error);			res.status(500).json({ error: 'An unknown error occurred' });		}	}}
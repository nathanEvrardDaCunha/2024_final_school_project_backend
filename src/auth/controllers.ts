import { Request, Response } from 'express';import {banUser, fetchAllUsers, login, promoteUser, register, unbanUser} from './services';import { UserStatus } from '@prisma/client';export async function registerController(req: Request, res: Response): Promise<void> {	try {		const { email, firstname, lastname, birthDate, phoneNumber, password, isRenter } = req.body;				const status = isRenter ? UserStatus.RENTER : UserStatus.FREE;				const newUser = await register({			email,			firstname,			lastname,			birthDate: new Date(birthDate),			password,			phoneNumber,			status,		});				res.status(201).json({			message: 'User registered successfully',			userId: newUser.id,		});	} catch (error) {		if (error instanceof Error) {			if (error.message.includes('User with this email already exists')) {				res.status(409).json({ error: error.message });			} else {				console.error('Error registering user:', error);				res.status(400).json({ error: error.message });			}		} else {			console.error('An unknown error occurred:', error);			res.status(500).json({ error: 'An unknown error occurred' });		}	}}export async function fetchAllUsersController(req: Request, res: Response): Promise<void> {	try {		const users = await fetchAllUsers();		res.status(200).json(users);	} catch (error) {		if (error instanceof Error) {			console.error('Error fetching all users:', error);			res.status(500).json({ error: error.message });		} else {			console.error('An unknown error occurred:', error);			res.status(500).json({ error: 'An unknown error occurred' });		}	}}export async function loginController(req: Request, res: Response): Promise<void> {	try {		const { email, password } = req.body;				const loginResult = await login(email, password);				res.status(200).json({			message: 'Login successful',			userId: loginResult.user.id,			token: loginResult.token,			userStatus: loginResult.user.status		});	} catch (error) {		if (error instanceof Error) {			console.error('Error logging in:', error);			if (error.message.includes('Your account has been banned')) {				res.status(403).json({ error: error.message });			} else {				res.status(401).json({ error: error.message });			}		} else {			console.error('An unknown error occurred:', error);			res.status(500).json({ error: 'An unknown error occurred' });		}	}}export async function banUserController(req: Request, res: Response): Promise<void> {	try {		const userId = parseInt(req.params.userId);		const bannedUser = await banUser(userId);		res.status(200).json({			message: 'User banned successfully',			userId: bannedUser.id,			newStatus: bannedUser.status		});	} catch (error) {		if (error instanceof Error) {			console.error('Error banning user:', error);			if (error.message.includes('Cannot ban an admin user') || error.message.includes('User is already banned')) {				res.status(400).json({ error: error.message });			} else {				res.status(500).json({ error: 'An error occurred while banning the user' });			}		} else {			console.error('An unknown error occurred:', error);			res.status(500).json({ error: 'An unknown error occurred' });		}	}}export async function promoteUserController(req: Request, res: Response): Promise<void> {	try {		const userId = parseInt(req.params.userId);		const promotedUser = await promoteUser(userId);		res.status(200).json({			message: 'User promoted to admin successfully',			userId: promotedUser.id,		});	} catch (error) {		if (error instanceof Error) {			console.error('Error promoting user:', error);			if (error.message.includes('Cannot promote a banned user')) {				res.status(400).json({ error: error.message });			} else {				res.status(500).json({ error: 'An error occurred while promoting the user' });			}		} else {			console.error('An unknown error occurred:', error);			res.status(500).json({ error: 'An unknown error occurred' });		}	}}export async function unbanUserController(req: Request, res: Response): Promise<void> {	try {		const userId = parseInt(req.params.userId);		const unbannedUser = await unbanUser(userId);		res.status(200).json({			message: 'User unbanned successfully',			userId: unbannedUser.id,			newStatus: unbannedUser.status		});	} catch (error) {		if (error instanceof Error) {			console.error('Error unbanning user:', error);			res.status(400).json({ error: error.message });		} else {			console.error('An unknown error occurred:', error);			res.status(500).json({ error: 'An unknown error occurred' });		}	}}
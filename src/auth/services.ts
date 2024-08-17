import { Prisma, User, UserStatus } from '@prisma/client';import {createUser, findUserByEmail, getAllUsers, updateUserStatus} from './repository';import jwt from 'jsonwebtoken';import {findUserById} from "../dashboard/repository";export async function register(userData: {	firstname: string;	lastname: string;	email: string;	password: string;	phoneNumber: string;	birthDate: Date;	status: UserStatus;}): Promise<User> {	try {		const existingUser = await findUserByEmail(userData.email);		if (existingUser) {			throw new Error('User with this email already exists');		}				return await createUser({			...userData,			status: userData.status,		});	} catch (error: unknown) {		if (error instanceof Error) {			throw new Error('Failed to register user: ' + error.message);		} else {			throw new Error('Failed to register user: Unknown error');		}	}}export async function fetchAllUsers(): Promise<User[]> {	try {		return await getAllUsers();	} catch (error: unknown) {		if (error instanceof Error) {			throw new Error('Failed to fetch users: ' + error.message);		} else {			throw new Error('Failed to fetch users: Unknown error');		}	}}export async function login(email: string, password: string): Promise<{ user: User, token: string }> {	try {		const user = await findUserByEmail(email);		if (!user) {			throw new Error('Invalid email or password');		}				if (user.password !== password) {			throw new Error('Invalid email or password');		}				if (user.status === UserStatus.BANNED_RENTER || user.status === UserStatus.BANNED_FREE			|| user.status === UserStatus.BANNED_BAGPACKER_MONTHLY || user.status === UserStatus.BANNED_BAGPACKER_YEARLY			|| user.status === UserStatus.BANNED_EXPLORATOR_MONTHLY || user.status === UserStatus.BANNED_EXPLORATOR_YEARLY) {			throw new Error('Your account has been banned. Please contact support for assistance.');		}				const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, { expiresIn: '1h' });				return { user, token };	} catch (error: unknown) {		if (error instanceof Error) {			throw new Error(error.message);		} else {			throw new Error('Login failed: Unknown error');		}	}}export async function banUser(userId: number): Promise<User> {	try {		const user = await findUserById(userId);		if (!user) {			throw new Error('User not found');		}				let newStatus: UserStatus;		switch (user.status) {			case UserStatus.RENTER:				newStatus = UserStatus.BANNED_RENTER;				break;			case UserStatus.FREE:				newStatus = UserStatus.BANNED_FREE;				break;			case UserStatus.BAGPACKER_MONTHLY:				newStatus = UserStatus.BANNED_BAGPACKER_MONTHLY;				break;			case UserStatus.BAGPACKER_YEARLY:				newStatus = UserStatus.BANNED_BAGPACKER_YEARLY;				break;			case UserStatus.EXPLORATOR_MONTHLY:				newStatus = UserStatus.BANNED_EXPLORATOR_MONTHLY;				break;			case UserStatus.EXPLORATOR_YEARLY:				newStatus = UserStatus.BANNED_EXPLORATOR_YEARLY;				break;			case UserStatus.ADMIN:				throw new Error('Cannot ban an admin user');			case UserStatus.BANNED_RENTER:			case UserStatus.BANNED_FREE:			case UserStatus.BANNED_BAGPACKER_MONTHLY:			case UserStatus.BANNED_BAGPACKER_YEARLY:			case UserStatus.BANNED_EXPLORATOR_MONTHLY:			case UserStatus.BANNED_EXPLORATOR_YEARLY:				throw new Error('User is already banned');			default:				throw new Error('Invalid user status');		}				return await updateUserStatus(userId, newStatus);	} catch (error: unknown) {		if (error instanceof Error) {			throw new Error('Failed to ban user: ' + error.message);		} else {			throw new Error('Failed to ban user: Unknown error');		}	}}export async function promoteUser(userId: number): Promise<User> {	try {		const user = await findUserById(userId);		if (!user) {			throw new Error('User not found');		}		if (user.status === UserStatus.BANNED_RENTER || user.status === UserStatus.BANNED_FREE			|| user.status === UserStatus.BANNED_BAGPACKER_MONTHLY || user.status === UserStatus.BANNED_BAGPACKER_YEARLY			|| user.status === UserStatus.BANNED_EXPLORATOR_MONTHLY || user.status === UserStatus.BANNED_EXPLORATOR_YEARLY) {			throw new Error('Cannot promote a banned user to admin');		}		return await updateUserStatus(userId, UserStatus.ADMIN);	} catch (error: unknown) {		if (error instanceof Error) {			throw new Error('Failed to promote user: ' + error.message);		} else {			throw new Error('Failed to promote user: Unknown error');		}	}}export async function unbanUser(userId: number): Promise<User> {	try {		const user = await findUserById(userId);		if (!user) {			throw new Error('User not found');		}				let newStatus: UserStatus;		switch (user.status) {			case UserStatus.BANNED_RENTER:				newStatus = UserStatus.RENTER;				break;			case UserStatus.BANNED_FREE:				newStatus = UserStatus.FREE;				break;			case UserStatus.BANNED_BAGPACKER_MONTHLY:				newStatus = UserStatus.BAGPACKER_MONTHLY;				break;			case UserStatus.BANNED_BAGPACKER_YEARLY:				newStatus = UserStatus.BAGPACKER_YEARLY;				break;			case UserStatus.BANNED_EXPLORATOR_MONTHLY:				newStatus = UserStatus.EXPLORATOR_MONTHLY;				break;			case UserStatus.BANNED_EXPLORATOR_YEARLY:				newStatus = UserStatus.EXPLORATOR_YEARLY;				break;			default:				throw new Error('User is not banned');		}				return await updateUserStatus(userId, newStatus);	} catch (error: unknown) {		if (error instanceof Error) {			throw new Error('Failed to unban user: ' + error.message);		} else {			throw new Error('Failed to unban user: Unknown error');		}	}}
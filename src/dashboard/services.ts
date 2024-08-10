import {Prisma, User} from '@prisma/client';import { findUserById, updateUserById, findUserByIdWithPassword } from './repository';import {prisma} from "../index";export async function getUserInfo(userId: number): Promise<Omit<User, 'password'> | null> {	try {		const user = await findUserById(userId);		if (!user) {			return null;		}				const { password, ...userInfo } = user;		return userInfo;	} catch (error: unknown) {		if (error instanceof Error) {			throw new Error('Failed to fetch user info: ' + error.message);		} else {			throw new Error('Failed to fetch user info: Unknown error');		}	}}export async function updateUserInfo(userId: number, updateData: Partial<{	email: string;	firstname: string;	lastname: string;	birthDate: Date;	phoneNumber: string;}>): Promise<Omit<User, 'password'> | null> {	try {		const user = await updateUserById(userId, updateData);		if (!user) {			return null;		}				const { password, ...userInfo } = user;		return userInfo;	} catch (error: unknown) {		if (error instanceof Error) {			throw new Error('Failed to update user info: ' + error.message);		} else {			throw new Error('Failed to update user info: Unknown error');		}	}}export async function changeUserPassword(userId: number, currentPassword: string, newPassword: string): Promise<Omit<User, 'password'> | null> {	try {		const user = await findUserByIdWithPassword(userId);		if (!user) {			throw new Error('User not found');		}				if (user.password !== currentPassword) {			throw new Error('Current password is incorrect');		}				const updatedUser = await updateUserById(userId, { password: newPassword });				if (!updatedUser) {			return null;		}				const { password, ...userInfo } = updatedUser;		return userInfo;	} catch (error: unknown) {		if (error instanceof Error) {			throw new Error('Failed to change password: ' + error.message);		} else {			throw new Error('Failed to change password: Unknown error');		}	}}export async function updateUserByIdForAdmin(	userId: number,	updateData: Prisma.UserUpdateInput): Promise<Omit<User, 'password'> | null> {	try {		const user = await prisma.user.update({			where: { id: userId },			data: updateData,			select: {				id: true,				email: true,				firstname: true,				lastname: true,				birthDate: true,				phoneNumber: true,				status: true,			}		});				return user;	} catch (error) {		if (error instanceof Prisma.PrismaClientKnownRequestError) {			if (error.code === 'P2025') {				return null;			}		}		// For other types of errors, we'll throw them to be handled by the caller		throw error;	}}
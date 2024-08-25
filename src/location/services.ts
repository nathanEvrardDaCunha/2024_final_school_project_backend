import {	DocumentStatus,	DocumentType,	Document as PrismaDocument,	Location,	LocationGoodType,	LocationStatus,	LocationType, Perk,	PerkStatus,	PerkType,	Prisma, UserStatus, Reservation, Service,	PrismaClient,} from '@prisma/client';import {	addDocumentToLocationAsImage,	addDocumentToLocationAsPaperAsset,	createLocation,	getLocationFromDB,	getLocationsPendingPublishFromDB,	getLocationsToReviewFromDB,	getPublishedLocationsFromDB,	removeDocumentFromDB,	updateLocationStatus} from "./repository";import fs from 'fs';import {prisma} from "../index";import {PublishedDocument, PublishedLocation} from "./controllers";export interface EstimateLocationPriceParams {	surfaceM2: number;	numberOfBed: number;	maxNumberOfPerson: number;	country: string;	locationType: LocationType;	locationGoodType: LocationGoodType;}export async function estimateLocationPrice(params: EstimateLocationPriceParams): Promise<number> {	let basePrice = 50;		basePrice += params.surfaceM2 * 0.5;	basePrice += params.numberOfBed * 10;	basePrice += params.maxNumberOfPerson * 5;		switch (params.locationType) {		case 'APARTMENT':			basePrice *= 1;			break;		case 'HOUSE':			basePrice *= 1.2;			break;		case 'VILLA':			basePrice *= 1.5;			break;		case 'CABIN':			basePrice *= 1.1;			break;		case 'STUDIO':			basePrice *= 0.9;			break;		case 'LOFT':			basePrice *= 1.1;			break;	}		switch (params.locationGoodType) {		case 'ENTIRE_PLACE':			basePrice *= 1.2;			break;		case 'PRIVATE_ROOM':			basePrice *= 0.8;			break;		case 'SHARED_ROOM':			basePrice *= 0.6;			break;	}		return Math.round(basePrice * 100) / 100;}export async function saveLocation(params: {	country: string;	locationGoodType: LocationGoodType;	maxNumberOfPerson: number;	surfaceM2: number;	numberOfBed: number;	street: string;	locationType: LocationType;	description: string;	title: string;	user: { connect: { id: number } };	pricePerNight: number;}): Promise<Location> {	const locationData: Prisma.LocationCreateInput = {		surfaceM2: params.surfaceM2,		numberOfBed: params.numberOfBed,		maxNumberOfPerson: params.maxNumberOfPerson,		country: params.country,		street: params.street,		locationType: params.locationType,		locationGoodType: params.locationGoodType,		pricePerNight: params.pricePerNight,		title: params.title,		description: params.description,		locationStatus: LocationStatus.BEFORE_PAYMENT,		user: params.user	};		const savedLocation = await createLocation(locationData);	console.log('Location saved in service:', savedLocation);		if (!savedLocation.id) {		throw new Error('Location saved but no id was returned');	}		return savedLocation;}export async function getLocationsToReview() {	return await getLocationsToReviewFromDB();}export async function getLocation(locationId: number) {	return await getLocationFromDB(locationId);}export async function uploadLocationImageAsPaperAsset(locationId: number, file: Express.Multer.File) {	const fileBuffer = fs.readFileSync(file.path);	const document = await addDocumentToLocationAsPaperAsset(locationId, {		file: fileBuffer,		filename: file.originalname,		documentType: DocumentType.PAPER_ASSET,		documentStatus: DocumentStatus.AVAILABLE	});	fs.unlinkSync(file.path); // Delete the file after storing in DB	return await getLocationFromDB(locationId);}export async function uploadLocationImageAsImage(locationId: number, file: Express.Multer.File) {	const fileBuffer = fs.readFileSync(file.path);	const document = await addDocumentToLocationAsImage(locationId, {		file: fileBuffer,		filename: file.originalname,		documentType: DocumentType.IMAGES,		documentStatus: DocumentStatus.AVAILABLE	});	fs.unlinkSync(file.path); // Delete the file after storing in DB	return await getLocationFromDB(locationId);}export async function completeLocationPaperwork(locationId: number) {	return await updateLocationStatus(locationId, LocationStatus.BEFORE_PUBLISHING);}export async function removeDocument(locationId: number, documentId: number) {	return await removeDocumentFromDB(locationId, documentId);}export async function getLocationsPendingPublish(): Promise<Location[]> {	console.log('Entering getLocationsPendingPublish service');	const locations = await getLocationsPendingPublishFromDB();	console.log('Locations fetched from DB:', locations);	return locations;}export async function publishLocation(locationId: number): Promise<Location> {	const location = await getLocationFromDB(locationId);		if (!location) {		throw new Error('Location not found');	}		const documents = await prisma.document.findMany({		where: { locationId: location.id }	});		const imageDocuments = documents.filter(doc => doc.documentType === 'IMAGES');		if (imageDocuments.length < 3) {		throw new Error('At least 3 image documents are required to publish the location');	}		return await updateLocationStatus(locationId, LocationStatus.PUBLISHED);}export async function registerLocationPerks(locationId: number, perkTypes: PerkType[]): Promise<Location> {	const location = await getLocationFromDB(locationId);		if (!location) {		throw new Error('Location not found');	}		await prisma.perk.deleteMany({		where: { locationId: locationId }	});		for (const perkType of perkTypes) {		await prisma.perk.create({			data: {				perkStatus: PerkStatus.AVAILABLE,				perkName: perkType,				perkType: perkType,				location: { connect: { id: locationId } }			}		});	}		return await getLocationFromDB(locationId);}export async function getPublishedLocations(): Promise<PublishedLocation[]> {	try {		const locations = await getPublishedLocationsFromDB();		return locations.map((location: any) => {			const publishedLocation: PublishedLocation = {				id: location.id,				title: location.title || '',				pricePerNight: location.pricePerNight || 0,				surfaceM2: location.surfaceM2 || 0,				maxNumberOfPerson: location.maxNumberOfPerson || 0,				country: location.country || '',				street: location.street || '',				locationType: location.locationType || '',				locationGoodType: location.locationGoodType || '',				documents: []			};						if (Array.isArray(location.documents)) {				publishedLocation.documents = location.documents.map((doc: any) => {					const publishedDoc: PublishedDocument = {						id: doc.id,						file: doc.file ? Buffer.from(doc.file).toString('base64') : '',						filename: doc.filename || '',						documentType: doc.documentType || ''					};					return publishedDoc;				});			}						return publishedLocation;		});	} catch (error) {		console.error('Error in getPublishedLocations service:', error);		throw error;	}}export async function getUserPublishedLocations(userId: number): Promise<PublishedLocation[]> {	try {		const locations = await getPublishedLocationsFromDB();				const userLocations = locations.filter(location => location.userId === userId);				return userLocations.map((location: any) => ({			id: location.id,			title: location.title || '',			pricePerNight: location.pricePerNight || 0,			surfaceM2: location.surfaceM2 || 0,			maxNumberOfPerson: location.maxNumberOfPerson || 0,			country: location.country || '',			street: location.street || '',			locationType: location.locationType || '',			locationGoodType: location.locationGoodType || '',			documents: location.documents.map((doc: any) => ({				id: doc.id,				file: doc.file ? Buffer.from(doc.file).toString('base64') : '',				filename: doc.filename || '',				documentType: doc.documentType || ''			}))		}));	} catch (error) {		console.error('Error in getUserPublishedLocations service:', error);		throw error;	}}type LocationWithUserAndDetails = Location & {	user: { id: number };	documents: PrismaDocument[];	perks: Perk[];};export async function getLocationDetail(locationId: number): Promise<LocationWithUserAndDetails> {	const location = await prisma.location.findUnique({		where: { id: locationId },		include: {			user: {				select: {					id: true,					// Add other user fields you want to include				}			},			documents: true,			perks: true		}	});		if (!location) {		throw new Error('Location not found');	}		// Use a type assertion to assure TypeScript that the structure is correct	return location as unknown as LocationWithUserAndDetails;}export async function getLocationReservations(locationId: number) {	return prisma.reservation.findMany({		where: { locationId },	});}type UserWithStatus = {	id: number;	status: UserStatus;};type LocationWithPrice = {	id: number;	pricePerNight: number;};export async function createReservation(data: {	locationId: number;	userId: number;	startDate: Date;	numberOfNights: number;	numberOfPeople: number;	isForRentor: boolean;}): Promise<Reservation> {	// Check for overlapping reservations	const overlappingReservation = await prisma.reservation.findFirst({		where: {			locationId: data.locationId,			OR: [				{					startDate: { lte: data.startDate },					endDate: { gt: data.startDate },				},				{					startDate: { lt: new Date(data.startDate.getTime() + data.numberOfNights * 24 * 60 * 60 * 1000) },					endDate: { gte: new Date(data.startDate.getTime() + data.numberOfNights * 24 * 60 * 60 * 1000) },				},			],		},	});		if (overlappingReservation) {		throw new Error('Overlapping reservation');	}		return prisma.reservation.create({		data: {			numberOfPeople: data.numberOfPeople,			numberOfNights: data.numberOfNights,			startDate: data.startDate,			endDate: new Date(data.startDate.getTime() + data.numberOfNights * 24 * 60 * 60 * 1000),			isForRentor: data.isForRentor,			user: { connect: { id: data.userId } },			location: { connect: { id: data.locationId } },		},	});}export async function getRentorReservationsForLocation(locationId: number, userId: number) {	// First, check if the user owns the location	const locationOwnership = await prisma.location.findFirst({		where: {			id: locationId,			userId: userId		},		select: { id: true }	});		if (!locationOwnership) {		throw new Error('Unauthorized access or location not found');	}		// If the user owns the location, fetch the reservations	return prisma.reservation.findMany({		where: {			locationId: locationId,			isForRentor: true		},		select: {			id: true,			numberOfPeople: true,			numberOfNights: true,			startDate: true,			endDate: true,			isForRentor: true		}	});}export async function deleteReservation(reservationId: number, userId: number) {	const reservationCheck = await prisma.reservation.findFirst({		where: {			id: reservationId,			location: {				userId: userId			}		},		select: { id: true }	});		if (!reservationCheck) {		throw new Error('Reservation not found or unauthorized access');	}		// If the check passes, delete the reservation	await prisma.reservation.delete({		where: { id: reservationId }	});}export async function getUserReservations(userId: number): Promise<Reservation[]> {	try {		const reservations = await prisma.reservation.findMany({			where: {				userId: userId			},			include: {				location: {					select: {						title: true,						country: true,						street: true,						pricePerNight: true, // Added this line to include pricePerNight					}				}			},			orderBy: {				startDate: Prisma.SortOrder.desc			}		});				return reservations;	} catch (error) {		console.error('Error in getUserReservations service:', error);		throw error;	}}export async function getReservationServices(reservationId: number): Promise<Service[]> {	try {		const services = await prisma.service.findMany({			where: {				reservationId: reservationId			}		});				return services;	} catch (error) {		console.error('Error in getReservationServices service:', error);		throw error;	}}export async function deleteService(serviceId: number): Promise<void> {	try {		await prisma.service.delete({			where: {				id: serviceId			}		});	} catch (error) {		console.error('Error in deleteService service:', error);		throw error;	}}export async function deleteLocation(locationId: number, requestUserId: number): Promise<void> {	const location = await prisma.location.findUnique({		where: { id: locationId },		select: {			user: true,			reservations: {				where: {					endDate: {						gte: new Date()					}				},				select: {					id: true				}			}		}	});		if (!location) {		throw new Error('Location not found');	}		if (location.reservations.length > 0) {		throw new Error('Cannot delete location with active or future reservations');	}		await prisma.$transaction([		prisma.document.deleteMany({ where: { locationId } }),		prisma.perk.deleteMany({ where: { locationId } }),		prisma.reservation.deleteMany({ where: { locationId } }),		prisma.location.delete({ where: { id: locationId } })	]);}type FinanceStats = {	usersByMembership: Partial<Record<UserStatus, number>>;	grossRevenue: number;	revenueByMonth: Record<string, number>;};export async function getLocationFinances(locationId: number, requestUserId: number, userStatus: UserStatus): Promise<FinanceStats> {	const location = await prisma.location.findUnique({		where: { id: locationId },	});		if (!location) {		throw new Error('Location not found');	}		if (location.userId !== requestUserId && userStatus !== 'ADMIN') {		throw new Error('Unauthorized access');	}		const reservations = await prisma.reservation.findMany({		where: { locationId },		include: {			user: {				select: { status: true }			}		}	});		const stats: FinanceStats = {		usersByMembership: {},		grossRevenue: 0,		revenueByMonth: {}	};		for (const reservation of reservations) {		const userStatus = reservation.user.status;		stats.usersByMembership[userStatus] = (stats.usersByMembership[userStatus] || 0) + 1;				const revenue = reservation.numberOfNights * location.pricePerNight;		stats.grossRevenue += revenue;				const month = reservation.startDate.toLocaleString('default', { month: 'long' });		stats.revenueByMonth[month] = (stats.revenueByMonth[month] || 0) + revenue;	}		return stats;}export async function getLocationPaperAssetDocuments(locationId: number, userId: number): Promise<PublishedDocument[]> {	const location = await prisma.location.findUnique({		where: { id: locationId },		include: {			documents: {				where: { documentType: 'PAPER_ASSET' }			}		}	});		if (!location) {		throw new Error('Location not found');	}		return location.documents.map(doc => ({		id: doc.id,		file: doc.file ? doc.file.toString('base64') : '',		filename: doc.filename,		documentType: doc.documentType	}));}export async function getAssociatedServicesForLocation(locationId: number) {	try {		const services = await prisma.service.findMany({			where: {				reservation: {					locationId: locationId				}			},			select: {				id: true,				name: true,				price: true,				reservationId: true,				reservation: {					select: {						id: true,						startDate: true,						numberOfNights: true					}				}			}		});				return services.map(service => ({			id: service.id,			name: service.name,			price: service.price,			reservationId: service.reservationId,			reservationStartDate: service.reservation.startDate,			reservationNights: service.reservation.numberOfNights		}));	} catch (error) {		console.error('Error in getAssociatedServicesForLocation:', error);		throw error;	}}
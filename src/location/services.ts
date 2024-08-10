import {	LocationType,	LocationGoodType,	LocationStatus,	Location,	DocumentStatus,	DocumentType,	PerkType, PerkStatus, Prisma,	} from '@prisma/client';import {	addDocumentToLocationAsImage,	addDocumentToLocationAsPaperAsset,	createLocation, getLocationDetailFromDB,	getLocationFromDB, getLocationsPendingPublishFromDB,	getLocationsToReviewFromDB, getPublishedLocationsFromDB, removeDocumentFromDB,	updateLocationStatus} from "./repository";import fs from 'fs';import {prisma} from "../index";import {PublishedDocument, PublishedLocation} from "./controllers";export interface EstimateLocationPriceParams {	surfaceM2: number;	numberOfBed: number;	maxNumberOfPerson: number;	country: string;	locationType: LocationType;	locationGoodType: LocationGoodType;}export async function estimateLocationPrice(params: EstimateLocationPriceParams): Promise<number> {	let basePrice = 50;		basePrice += params.surfaceM2 * 0.5;	basePrice += params.numberOfBed * 10;	basePrice += params.maxNumberOfPerson * 5;		switch (params.locationType) {		case 'APARTMENT':			basePrice *= 1;			break;		case 'HOUSE':			basePrice *= 1.2;			break;		case 'VILLA':			basePrice *= 1.5;			break;		case 'CABIN':			basePrice *= 1.1;			break;		case 'STUDIO':			basePrice *= 0.9;			break;		case 'LOFT':			basePrice *= 1.1;			break;	}		switch (params.locationGoodType) {		case 'ENTIRE_PLACE':			basePrice *= 1.2;			break;		case 'PRIVATE_ROOM':			basePrice *= 0.8;			break;		case 'SHARED_ROOM':			basePrice *= 0.6;			break;	}		return Math.round(basePrice * 100) / 100;}export async function saveLocation(params: {	country: string;	locationGoodType: LocationGoodType;	maxNumberOfPerson: number;	surfaceM2: number;	numberOfBed: number;	street: string;	locationType: LocationType;	description: string;	title: string;	user: { connect: { id: number } };	pricePerNight: number;}): Promise<Location> {	const locationData: Prisma.LocationCreateInput = {		surfaceM2: params.surfaceM2,		numberOfBed: params.numberOfBed,		maxNumberOfPerson: params.maxNumberOfPerson,		country: params.country,		street: params.street,		locationType: params.locationType,		locationGoodType: params.locationGoodType,		pricePerNight: params.pricePerNight,		title: params.title,		description: params.description,		locationStatus: LocationStatus.BEFORE_PAYMENT,		user: params.user	};		const savedLocation = await createLocation(locationData);	console.log('Location saved in service:', savedLocation);		if (!savedLocation.id) {		throw new Error('Location saved but no id was returned');	}		return savedLocation;}export async function getLocationsToReview() {	return await getLocationsToReviewFromDB();}export async function getLocation(locationId: number) {	return await getLocationFromDB(locationId);}export async function uploadLocationImageAsPaperAsset(locationId: number, file: Express.Multer.File) {	const fileBuffer = fs.readFileSync(file.path);	const document = await addDocumentToLocationAsPaperAsset(locationId, {		file: fileBuffer,		filename: file.originalname,		documentType: DocumentType.PAPER_ASSET,		documentStatus: DocumentStatus.AVAILABLE	});	fs.unlinkSync(file.path); // Delete the file after storing in DB	return await getLocationFromDB(locationId);}export async function uploadLocationImageAsImage(locationId: number, file: Express.Multer.File) {	const fileBuffer = fs.readFileSync(file.path);	const document = await addDocumentToLocationAsImage(locationId, {		file: fileBuffer,		filename: file.originalname,		documentType: DocumentType.IMAGES,		documentStatus: DocumentStatus.AVAILABLE	});	fs.unlinkSync(file.path); // Delete the file after storing in DB	return await getLocationFromDB(locationId);}export async function completeLocationPaperwork(locationId: number) {	return await updateLocationStatus(locationId, LocationStatus.BEFORE_PUBLISHING);}export async function removeDocument(locationId: number, documentId: number) {	return await removeDocumentFromDB(locationId, documentId);}export async function getLocationsPendingPublish(): Promise<Location[]> {	console.log('Entering getLocationsPendingPublish service');	const locations = await getLocationsPendingPublishFromDB();	console.log('Locations fetched from DB:', locations);	return locations;}export async function publishLocation(locationId: number): Promise<Location> {	const location = await getLocationFromDB(locationId);		if (!location) {		throw new Error('Location not found');	}		const documents = await prisma.document.findMany({		where: { locationId: location.id }	});		const imageDocuments = documents.filter(doc => doc.documentType === 'IMAGES');		if (imageDocuments.length < 3) {		throw new Error('At least 3 image documents are required to publish the location');	}		return await updateLocationStatus(locationId, LocationStatus.PUBLISHED);}export async function registerLocationPerks(locationId: number, perkTypes: PerkType[]): Promise<Location> {	const location = await getLocationFromDB(locationId);		if (!location) {		throw new Error('Location not found');	}		await prisma.perk.deleteMany({		where: { locationId: locationId }	});		for (const perkType of perkTypes) {		await prisma.perk.create({			data: {				perkStatus: PerkStatus.AVAILABLE,				perkName: perkType,				perkType: perkType,				location: { connect: { id: locationId } }			}		});	}		return await getLocationFromDB(locationId);}export async function getPublishedLocations(): Promise<PublishedLocation[]> {	try {		const locations = await getPublishedLocationsFromDB();		return locations.map((location: any) => {			const publishedLocation: PublishedLocation = {				id: location.id,				title: location.title || '',				pricePerNight: location.pricePerNight || 0,				surfaceM2: location.surfaceM2 || 0,				maxNumberOfPerson: location.maxNumberOfPerson || 0,				country: location.country || '',				street: location.street || '',				locationType: location.locationType || '',				locationGoodType: location.locationGoodType || '',				documents: []			};						if (Array.isArray(location.documents)) {				publishedLocation.documents = location.documents.map((doc: any) => {					const publishedDoc: PublishedDocument = {						id: doc.id,						file: doc.file ? Buffer.from(doc.file).toString('base64') : '',						filename: doc.filename || '',						documentType: doc.documentType || ''					};					return publishedDoc;				});			}						return publishedLocation;		});	} catch (error) {		console.error('Error in getPublishedLocations service:', error);		throw error;	}}export async function getUserPublishedLocations(userId: number): Promise<PublishedLocation[]> {	try {		const locations = await getPublishedLocationsFromDB();				const userLocations = locations.filter(location => location.userId === userId);				return userLocations.map((location: any) => ({			id: location.id,			title: location.title || '',			pricePerNight: location.pricePerNight || 0,			surfaceM2: location.surfaceM2 || 0,			maxNumberOfPerson: location.maxNumberOfPerson || 0,			country: location.country || '',			street: location.street || '',			locationType: location.locationType || '',			locationGoodType: location.locationGoodType || '',			documents: location.documents.map((doc: any) => ({				id: doc.id,				file: doc.file ? Buffer.from(doc.file).toString('base64') : '',				filename: doc.filename || '',				documentType: doc.documentType || ''			}))		}));	} catch (error) {		console.error('Error in getUserPublishedLocations service:', error);		throw error;	}}export async function getLocationDetail(locationId: number): Promise<Location> {	const location = await getLocationDetailFromDB(locationId);	if (!location) {		throw new Error('Location not found');	}	return location;}export async function getLocationReservations(locationId: number) {	return prisma.reservation.findMany({		where: { locationId },	});}export async function createReservation(data: {	locationId: number;	userId: number;	startDate: Date;	numberOfNights: number;	numberOfPeople: number;	isForRentor: boolean;}) {	// Check for overlapping reservations	const overlappingReservation = await prisma.reservation.findFirst({		where: {			locationId: data.locationId,			OR: [				{					startDate: {						lte: data.startDate,					},					endDate: {						gt: data.startDate,					},				},				{					startDate: {						lt: new Date(data.startDate.getTime() + data.numberOfNights * 24 * 60 * 60 * 1000),					},					endDate: {						gte: new Date(data.startDate.getTime() + data.numberOfNights * 24 * 60 * 60 * 1000),					},				},			],		},	});		if (overlappingReservation) {		throw new Error('Overlapping reservation');	}		return prisma.reservation.create({		data: {			numberOfPeople: data.numberOfPeople,			numberOfNights: data.numberOfNights,			startDate: data.startDate,			endDate: new Date(data.startDate.getTime() + data.numberOfNights * 24 * 60 * 60 * 1000),			isForRentor: data.isForRentor,			userId: data.userId,			locationId: data.locationId,		},	});}
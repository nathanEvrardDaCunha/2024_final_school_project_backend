import { Request, Response } from 'express';import Stripe from 'stripe';import { getLocationById, updateLocation } from '../location/repository';import { LocationStatus } from '@prisma/client';if (!process.env.STRIPE_SECRET_KEY) {	throw new Error('Missing STRIPE_SECRET_KEY in environment variables');}const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {	apiVersion: '2024-06-20',});export const createCheckoutSessionController = async (req: Request, res: Response) => {	try {		const { locationId } = req.body;				const location = await getLocationById(locationId);				if (!location) {			return res.status(404).json({ error: 'Location not found' });		}				const session = await stripe.checkout.sessions.create({			payment_method_types: ['card'],			line_items: [				{					price: process.env.STRIPE_PRICE_ID,					quantity: 1,				},			],			mode: 'subscription',			success_url: `${process.env.FRONTEND_URL}/success?session_id={CHECKOUT_SESSION_ID}`,			cancel_url: `${process.env.FRONTEND_URL}/canceled`,			client_reference_id: locationId.toString(),		});				res.json({ id: session.id });	} catch (error) {		console.error('Error creating checkout session:', error);		res.status(500).json({ error: 'Failed to create checkout session' });	}};export const webhookHandler = async (req: Request, res: Response) => {	const sig = req.headers['stripe-signature'] as string;	let event: Stripe.Event;		console.log('Received webhook');		try {		event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET!);		console.log('Webhook event constructed:', event.type);	} catch (err: unknown) {		const errorMessage = err instanceof Error ? err.message : 'Unknown error';		console.error('Webhook Error:', errorMessage);		res.status(400).send(`Webhook Error: ${errorMessage}`);		return;	}		if (event.type === 'checkout.session.completed') {		console.log('Checkout session completed');		const session = event.data.object as Stripe.Checkout.Session;				if (session.client_reference_id) {			const locationId = parseInt(session.client_reference_id);			console.log('Updating location:', locationId);						try {				const updatedLocation = await updateLocation(locationId, { locationStatus: LocationStatus.SUSPENDED });				console.log(`Location ${locationId} status updated to SUSPENDED:`, updatedLocation);			} catch (error) {				console.error(`Error updating location ${locationId} status:`, error);			}		} else {			console.log('No client_reference_id found in session');		}	} else {		console.log('Event type not handled:', event.type);	}		res.json({ received: true });};
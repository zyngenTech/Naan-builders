import { initializeApp } from 'firebase/app';
import { environment } from '../../environments/environment';

/**
 * Single Firebase App instance for the whole application, created once at
 * module load. Every Firestore/Storage/Auth call anywhere in the app goes
 * through this same instance using the plain Firebase SDK directly -
 * deliberately not AngularFire's wrapper functions/injection tokens.
 *
 * AngularFire's DI-provided Firestore/Storage instances are not safely
 * interchangeable with the plain modular SDK's read/write functions
 * (getDoc, addDoc, etc.) - mixing them was the root cause of unreliable
 * writes (e.g. the Contact form's inquiry submissions intermittently
 * failing). Using one plain SDK instance everywhere removes that risk
 * entirely, and also drops the @angular/fire dependency altogether,
 * which trims bundle size and app-bootstrap work.
 */
export const firebaseApp = initializeApp(environment.firebase);

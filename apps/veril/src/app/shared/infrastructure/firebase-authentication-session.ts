import { Injectable } from '@angular/core';
import {
  getIdTokenResult,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { AuthenticationSession } from '../application/authentication-session';
import { getFirebaseClient } from './firebase-client';

@Injectable()
export class FirebaseAuthenticationSession implements AuthenticationSession {
  async signInWithPassword(email: string, password: string): Promise<void> {
    const { auth } = getFirebaseClient();
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async signOut(): Promise<void> {
    await signOut(getFirebaseClient().auth);
  }

  async isAuthenticated(): Promise<boolean> {
    const { auth } = getFirebaseClient();
    await auth.authStateReady();
    return auth.currentUser !== null && !auth.currentUser.isAnonymous;
  }

  async isKeeper(): Promise<boolean> {
    const { auth } = getFirebaseClient();
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return false;
    const token = await getIdTokenResult(user);
    return token.claims['isKeeper'] === true;
  }

  async isEditorialKeeper(): Promise<boolean> {
    const { auth } = getFirebaseClient();
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user || user.isAnonymous) return false;
    const token = await getIdTokenResult(user);
    return token.claims['editorialAdmin'] === true;
  }
}

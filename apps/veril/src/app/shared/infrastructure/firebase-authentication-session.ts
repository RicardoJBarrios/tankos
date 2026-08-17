import { Injectable } from '@angular/core';
import {
  getIdTokenResult,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import {
  AuthenticationSession,
  AuthenticationSnapshot,
} from '../application/authentication-session';
import { getFirebaseAuthClient } from './firebase-auth-client';

@Injectable()
export class FirebaseAuthenticationSession implements AuthenticationSession {
  async signInWithPassword(email: string, password: string): Promise<void> {
    const auth = getFirebaseAuthClient();
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }

  async signOut(): Promise<void> {
    await signOut(getFirebaseAuthClient());
  }

  async getSnapshot(
    options: {
      readonly forceRefresh?: boolean;
    } = {},
  ): Promise<AuthenticationSnapshot> {
    const auth = getFirebaseAuthClient();
    await auth.authStateReady();
    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      return {
        userId: null,
        isAuthenticated: false,
        isKeeper: false,
        isEditorialAdmin: false,
      };
    }
    const token = await getIdTokenResult(user, options.forceRefresh === true);
    return {
      userId: user.uid,
      isAuthenticated: true,
      isKeeper: token.claims['isKeeper'] === true,
      isEditorialAdmin: token.claims['editorialAdmin'] === true,
    };
  }
}

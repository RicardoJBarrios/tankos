import { Injectable } from '@angular/core';
import { signInAnonymously, User } from 'firebase/auth';
import { getFirebaseClient } from './firebase-client';
import { KeeperSession } from '../application/aquarium-ports';

@Injectable()
export class FirebaseKeeperSession implements KeeperSession {
  async requireAuthenticatedKeeper(): Promise<{ readonly id: string }> {
    const { auth } = getFirebaseClient();
    await auth.authStateReady();

    if (auth.currentUser) {
      return { id: auth.currentUser.uid };
    }

    await signInAnonymously(auth);

    const user = auth.currentUser as User | null;
    if (!user) {
      throw new Error('Authentication did not produce a keeper');
    }

    return { id: user.uid };
  }
}

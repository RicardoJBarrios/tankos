import { Injectable } from '@angular/core';
import { getIdTokenResult } from 'firebase/auth';
import { getFirebaseClient } from './firebase-client';
import { KeeperSession } from '../application/keeper-session';

@Injectable()
export class FirebaseKeeperSession implements KeeperSession {
  async requireAuthenticatedKeeper(): Promise<{ readonly id: string }> {
    const { auth } = getFirebaseClient();
    await auth.authStateReady();

    const user = auth.currentUser;
    if (!user || user.isAnonymous) {
      throw new Error('A persistent keeper session is required');
    }

    const token = await getIdTokenResult(user);
    if (token.claims['isKeeper'] !== true) {
      throw new Error('The authenticated user is not a keeper');
    }

    return { id: user.uid };
  }
}

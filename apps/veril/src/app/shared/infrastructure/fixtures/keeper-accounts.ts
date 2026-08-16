import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { signInWithCustomToken } from 'firebase/auth';
import { getFirebaseClient } from '../firebase-client';

const projectId = 'demo-veril';

function adminAuth() {
  const app =
    getApps().find((candidate) => candidate.name === 'veril-keeper-fixtures') ??
    initializeApp({ projectId }, 'veril-keeper-fixtures');
  return getAuth(app);
}

export async function createKeeperToken(uid = `keeper-${crypto.randomUUID()}`) {
  return adminAuth().createCustomToken(uid, { isKeeper: true });
}

export async function createIdToken(
  uid = `user-${crypto.randomUUID()}`,
  claims: Record<string, boolean> = {},
) {
  const customToken = await adminAuth().createCustomToken(uid, claims);
  return exchangeCustomToken(customToken, uid);
}

export async function signInAsKeeper(uid?: string): Promise<string> {
  const { auth } = getFirebaseClient();
  const token = await createKeeperToken(uid);
  const credential = await signInWithCustomToken(auth, token);
  return credential.user.uid;
}

export async function createKeeperIdToken(
  uid = `keeper-${crypto.randomUUID()}`,
) {
  return createIdToken(uid, { isKeeper: true });
}

async function exchangeCustomToken(customToken: string, uid: string) {
  const response = await fetch(
    'http://127.0.0.1:9099/identitytoolkit.googleapis.com/v1/accounts:signInWithCustomToken?key=demo-veril-api-key',
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: customToken, returnSecureToken: true }),
    },
  );
  if (!response.ok) {
    throw new Error(`Keeper fixture sign-in failed: ${response.status}`);
  }
  const body = (await response.json()) as {
    idToken: string;
  };
  if (!body.idToken) {
    throw new Error(
      `Keeper fixture sign-in returned an incomplete credential: ${JSON.stringify(body)}`,
    );
  }
  return { localId: uid, idToken: body.idToken };
}

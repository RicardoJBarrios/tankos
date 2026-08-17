import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const [uid, action = 'grant'] = process.argv.slice(2);

if (!uid || !['grant', 'revoke'].includes(action)) {
  console.error('Usage: pnpm firebase:set-keeper-claim <uid> [grant|revoke]');
  process.exitCode = 1;
} else {
  const app = getApps()[0] ?? initializeApp();
  const auth = getAuth(app);
  const user = await auth.getUser(uid);

  if (user.providerData.length === 0) {
    throw new Error('Refusing to manage keeper access for an anonymous user');
  }

  const claims = { ...user.customClaims };
  if (action === 'grant') {
    claims.isKeeper = true;
  } else {
    delete claims.isKeeper;
  }

  await auth.setCustomUserClaims(uid, claims);
  console.log(
    `${action === 'grant' ? 'Granted' : 'Revoked'} isKeeper for ${uid}`,
  );
  console.log('The user must sign in again or refresh the ID token.');
}

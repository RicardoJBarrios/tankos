import { getApps, initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

const app =
  getApps().find((candidate) => candidate.name === 'veril-keeper-e2e') ??
  initializeApp({ projectId: 'demo-veril' }, 'veril-keeper-e2e');
const auth = getAuth(app);
const credentials = {
  email: 'keeper@example.test',
  password: 'keeper-password',
};

let user;
try {
  user = await auth.getUserByEmail(credentials.email);
  user = await auth.updateUser(user.uid, {
    password: credentials.password,
    emailVerified: true,
    disabled: false,
  });
} catch {
  user = await auth.createUser({
    uid: 'e2e-keeper',
    ...credentials,
    emailVerified: true,
  });
}

await auth.setCustomUserClaims(user.uid, { isKeeper: true });
console.log(JSON.stringify({ credentials }));

import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  query,
  setDoc,
  Timestamp,
  updateDoc,
} from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const emulatorTest = (name: string, test: () => Promise<void>) => {
  it(name, async () => {
    if (!process.env['FIRESTORE_EMULATOR_HOST']) return;
    await test();
  });
};

describe('units Firestore Rules', () => {
  let environment: RulesTestEnvironment | undefined;
  const path = `units-rules-${String(Date.now())}`;

  beforeAll(async () => {
    if (!process.env['FIRESTORE_EMULATOR_HOST']) return;
    environment = await initializeTestEnvironment({
      projectId: 'demo-tankos',
      firestore: { rules: readFileSync('firestore.rules', 'utf8') },
    });
  });

  afterAll(async () => environment?.cleanup());

  emulatorTest(
    'permite al keeper leer su unidad privada y una pública',
    async () => {
      const admin = testEnvironment()
        .authenticatedContext('admin-rules', { roles: ['admin'] })
        .firestore();
      await setDoc(
        doc(admin, path, 'private'),
        unitRecord('keeper-1', 'private'),
      );
      await setDoc(doc(admin, path, 'public'), unitRecord(undefined, 'public'));
      const keeper = testEnvironment()
        .authenticatedContext('keeper-1', { roles: ['keeper'] })
        .firestore();
      await expect(getDoc(doc(keeper, path, 'private'))).resolves.toBeDefined();
      await expect(getDoc(doc(keeper, path, 'public'))).resolves.toBeDefined();
    },
  );

  emulatorTest(
    'deniega al keeper leer la unidad privada de otro usuario',
    async () => {
      const owner = testEnvironment()
        .authenticatedContext('owner-1', { roles: ['keeper'] })
        .firestore();
      await setDoc(
        doc(owner, path, 'other-private'),
        unitRecord('owner-1', 'private'),
      );
      const other = testEnvironment()
        .authenticatedContext('keeper-2', { roles: ['keeper'] })
        .firestore();
      await expect(getDoc(doc(other, path, 'other-private'))).rejects.toThrow();
    },
  );

  emulatorTest(
    'deniega al keeper cambiar una unidad pública o una representación inválida',
    async () => {
      const admin = testEnvironment()
        .authenticatedContext('admin-1', { roles: ['admin'] })
        .firestore();
      await setDoc(
        doc(admin, path, 'public-update'),
        unitRecord(undefined, 'public'),
      );
      const keeper = testEnvironment()
        .authenticatedContext('keeper-3', { roles: ['keeper'] })
        .firestore();
      await expect(
        updateDoc(doc(keeper, path, 'public-update'), {
          'data.representation.symbol': '',
        }),
      ).rejects.toThrow();
      await expect(
        setDoc(doc(admin, path, 'invalid'), {
          ...unitRecord(undefined, 'public'),
          data: {
            ...unitRecord(undefined, 'public').data,
            representation: {
              symbol: '',
              asciiFallback: 'u',
              position: 'suffix',
              spacing: 'narrow',
            },
          },
        }),
      ).rejects.toThrow();
    },
  );

  emulatorTest(
    'permite al admin acceder a privadas y exige consultas acotadas',
    async () => {
      const admin = testEnvironment()
        .authenticatedContext('admin-2', { roles: ['admin'] })
        .firestore();
      await setDoc(
        doc(admin, path, 'admin-private'),
        unitRecord('keeper-4', 'private'),
      );
      await expect(
        getDoc(doc(admin, path, 'admin-private')),
      ).resolves.toBeDefined();
      await expect(
        getDocs(query(collection(admin, path), limit(1))),
      ).resolves.toBeDefined();
      await expect(getDocs(query(collection(admin, path)))).rejects.toThrow();
    },
  );
});

function testEnvironment(): RulesTestEnvironment {
  if (!environment) throw new Error('Firestore emulator is unavailable');
  return environment;
}

function unitRecord(
  ownerId: string | undefined,
  visibility: 'private' | 'public',
) {
  const now = Timestamp.now();
  return {
    data: {
      code: `TANKOS:RULE-${visibility}-${ownerId ?? 'public'}`,
      ...(ownerId ? { ownerId } : {}),
      visibility,
      system: 'custom',
      representation: {
        symbol: 'u',
        asciiFallback: 'u',
        position: 'suffix',
        spacing: 'narrow',
      },
      catalogueVersion: 'TANKOS-CUSTOM-1',
    },
    lifecycle: { status: 'active' },
    revision: 1,
    metadata: { schemaVersion: 1, createdAt: now, updatedAt: now },
  };
}

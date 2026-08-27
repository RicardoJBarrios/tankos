import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import {
  collection,
  deleteDoc,
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
import { resolve } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';

const emulatorTest = (name: string, test: () => Promise<void>) => {
  it(name, async () => {
    if (!process.env['FIRESTORE_EMULATOR_HOST'])
      throw new Error(
        'FIRESTORE_EMULATOR_HOST is required for Firestore Rules tests',
      );
    await test();
  });
};

let rulesEnvironment: RulesTestEnvironment | undefined;

describe('units Firestore Rules', () => {
  const path = 'units';

  beforeAll(async () => {
    if (!process.env['FIRESTORE_EMULATOR_HOST']) return;
    rulesEnvironment = await initializeTestEnvironment({
      projectId: 'demo-tankos',
      firestore: {
        rules: readFileSync(
          resolve(__dirname, '../../../../firestore.rules'),
          'utf8',
        ),
      },
    });
  });

  afterAll(async () => rulesEnvironment?.cleanup());

  emulatorTest(
    'permite al keeper leer su unidad privada y una pública',
    async () => {
      const admin = testEnvironment()
        .authenticatedContext('admin-rules', { roles: ['admin'] })
        .firestore();
      await setDoc(
        doc(admin, path, 'private'),
        unitRecord('keeper-1', 'private', 'private'),
      );
      await setDoc(
        doc(admin, path, 'public'),
        unitRecord(undefined, 'public', 'public'),
      );
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
        unitRecord('owner-1', 'private', 'other-private'),
      );
      const other = testEnvironment()
        .authenticatedContext('keeper-2', { roles: ['keeper'] })
        .firestore();
      await expect(getDoc(doc(other, path, 'other-private'))).rejects.toThrow();
    },
  );

  emulatorTest('permite al keeper crear su unidad privada', async () => {
    const keeper = testEnvironment()
      .authenticatedContext('keeper-create', { roles: ['keeper'] })
      .firestore();
    await expect(
      setDoc(
        doc(keeper, path, 'keeper-created'),
        unitRecord('keeper-create', 'private', 'keeper-created'),
      ),
    ).resolves.toBeUndefined();
  });

  emulatorTest(
    'no permite cambiar el código ni borrar una unidad activa',
    async () => {
      const admin = testEnvironment()
        .authenticatedContext('admin-hardening', { roles: ['admin'] })
        .firestore();
      const reference = doc(admin, path, 'active-protected');
      await setDoc(
        reference,
        unitRecord(undefined, 'public', 'active-protected'),
      );
      await expect(
        updateDoc(reference, { 'data.code': 'TAMPERED' }),
      ).rejects.toThrow();
      await expect(deleteDoc(reference)).rejects.toThrow();
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
        unitRecord(undefined, 'public', 'public-update'),
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
          ...unitRecord(undefined, 'public', 'invalid'),
          data: {
            ...unitRecord(undefined, 'public', 'invalid').data,
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
        unitRecord('keeper-4', 'private', 'admin-private'),
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

  emulatorTest(
    'impide al propietario manipular lifecycle, revision o metadatos de auditoría',
    async () => {
      const admin = testEnvironment()
        .authenticatedContext('admin-integrity', { roles: ['admin'] })
        .firestore();
      const reference = doc(admin, path, 'integrity-private');
      await setDoc(
        reference,
        unitRecord('keeper-integrity', 'private', 'integrity-private'),
      );
      const keeper = testEnvironment()
        .authenticatedContext('keeper-integrity', { roles: ['keeper'] })
        .firestore();

      await expect(updateDoc(reference, { revision: 99 })).rejects.toThrow();
      await expect(
        updateDoc(reference, { 'lifecycle.status': 'deleted' }),
      ).rejects.toThrow();
      await expect(
        updateDoc(reference, { 'metadata.createdAt': Timestamp.now() }),
      ).rejects.toThrow();
      await expect(
        updateDoc(doc(keeper, path, 'integrity-private'), { revision: 99 }),
      ).rejects.toThrow();
    },
  );

  emulatorTest(
    'exige el vínculo entre el documento y su id de almacenamiento',
    async () => {
      const admin = testEnvironment()
        .authenticatedContext('admin-storage-binding', { roles: ['admin'] })
        .firestore();
      await expect(
        setDoc(
          doc(admin, path, 'alternate-id'),
          unitRecord(undefined, 'public', 'different-id'),
        ),
      ).rejects.toThrow();
    },
  );
});

function testEnvironment(): RulesTestEnvironment {
  if (!rulesEnvironment) throw new Error('Firestore emulator is unavailable');
  return rulesEnvironment;
}

function unitRecord(
  ownerId: string | undefined,
  visibility: 'private' | 'public',
  storageId: string,
) {
  const now = Timestamp.now();
  return {
    data: {
      storageId,
      code: `TANKOS:RULE-${visibility}-${ownerId ?? 'public'}`,
      codeSearchTokens: ['ta', 'tankos:rule'],
      ...(ownerId ? { ownerSearchTokens: ['ke', ownerId] } : {}),
      ...(ownerId ? { ownerId } : {}),
      ...(ownerId ? { ownerName: 'keeper@example.test' } : {}),
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

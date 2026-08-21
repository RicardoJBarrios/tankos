import { initializeApp } from 'firebase/app';
import {
  connectFirestoreEmulator,
  getFirestore,
  orderBy,
  query,
  type Timestamp,
} from 'firebase/firestore';
import { z } from 'zod';
import { createEntityId, createPageCursor } from '@tank-os/data-access';
import {
  createFirestoreCrudRepository,
  type FirestoreRecordDto,
} from './firestore-crud-repository';

const emulatorTest = (name: string, test: () => Promise<void>): void =>
  it(name, async () => {
    if (!process.env['FIRESTORE_EMULATOR_HOST']) {
      if (process.env['REQUIRE_FIRESTORE_EMULATOR'] === 'true') {
        throw new Error(
          'FIRESTORE_EMULATOR_HOST is required for Firestore integration tests',
        );
      }
      return;
    }
    await test();
  });

describe('Firestore CRUD adapter against Firebase Emulator Suite', () => {
  const access = {
    principalId: createEntityId('emulator-keeper'),
    roles: ['keeper'] as const,
  };
  const app = initializeApp(
    { projectId: 'demo-veril' },
    'data-access-emulator',
  );
  const firestore = getFirestore(app);
  const collectionPath = `data-access-test-${Date.now()}`;
  const recordSchema = z.object({
    data: z.object({ name: z.string() }),
    lifecycle: z.object({ status: z.literal('active') }),
    revision: z.number(),
    metadata: z.object({
      schemaVersion: z.number(),
      createdAt: z.custom<Timestamp>((value) => value !== undefined),
      updatedAt: z.custom<Timestamp>((value) => value !== undefined),
      createdBy: z.string(),
      updatedBy: z.string(),
    }),
  }) satisfies z.ZodType<FirestoreRecordDto<{ name: string }>>;

  if (process.env['FIRESTORE_EMULATOR_HOST']) {
    const [host, port] = process.env['FIRESTORE_EMULATOR_HOST'].split(':');
    connectFirestoreEmulator(firestore, host, Number(port));
  }

  emulatorTest(
    'Given the emulator is running, When a record is created and read, Then the adapter maps technical timestamps and data',
    async () => {
      const repository = createFirestoreCrudRepository({
        firestore,
        collectionPath,
        recordSchema,
        createId: (input: { name: string }) => input.name,
        createData: (input: { name: string }) => input,
        updateData: (_data: { name: string }, input: { name: string }) => input,
        buildQuery: (reference, request) =>
          query(reference, orderBy(request.page.orderBy[0].field)),
        encodeCursor: () => createPageCursor('emulator-cursor'),
      });

      const created = await repository.create({
        access,
        input: { name: 'emulator' },
      });
      expect(created.data.name).toBe('emulator');
      expect(created.metadata.createdAt.kind).toBe('instant');
      await expect(
        repository.get({ access, id: createEntityId('emulator') }),
      ).resolves.toMatchObject({
        data: { name: 'emulator' },
        revision: 1,
      });
    },
  );
});

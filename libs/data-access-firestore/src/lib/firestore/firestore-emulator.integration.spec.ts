import {
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { orderBy, query, type Timestamp } from 'firebase/firestore';
import { readFileSync } from 'node:fs';
import { z } from 'zod';
import { afterAll, beforeAll, expect } from 'vitest';
import { createEntityId, createPageCursor } from '@tankos/data-access';
import {
  createFirestoreCrudRepository,
  type FirestoreRecordDto,
} from './firestore-crud-repository';

const emulatorTest = (name: string, test: () => Promise<void>): void =>
  it(name, async () => {
    expect(typeof test).toBe('function');
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
  let testEnvironment: RulesTestEnvironment | undefined;
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

  beforeAll(async () => {
    if (!process.env['FIRESTORE_EMULATOR_HOST']) return;
    testEnvironment = await initializeTestEnvironment({
      projectId: 'demo-veril',
      firestore: {
        rules: readFileSync(
          'libs/data-access-firestore/emulator/emulator.rules',
          'utf8',
        ),
      },
    });
  });
  const requireTestEnvironment = (): RulesTestEnvironment => {
    if (!testEnvironment) {
      throw new Error('Firestore test environment is unavailable');
    }
    return testEnvironment;
  };

  afterAll(async () => {
    await testEnvironment?.cleanup();
  });

  emulatorTest(
    'Given the emulator is running, When a record is created and read, Then the adapter maps technical timestamps and data',
    async () => {
      const access = {
        principalId: createEntityId('emulator-keeper'),
        roles: ['keeper'] as const,
      };
      const firestore = requireTestEnvironment()
        .authenticatedContext('emulator-keeper')
        .firestore();
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

  emulatorTest(
    'Given no authenticated Firebase principal, When a protected record is read, Then Firestore denies the request',
    async () => {
      const unauthenticatedFirestore = requireTestEnvironment()
        .unauthenticatedContext()
        .firestore();
      const repository = createFirestoreCrudRepository({
        firestore: unauthenticatedFirestore,
        collectionPath,
        recordSchema,
        createId: (input: { name: string }) => input.name,
        createData: (input: { name: string }) => input,
        updateData: (_data: { name: string }, input: { name: string }) => input,
        buildQuery: (reference, request) =>
          query(reference, orderBy(request.page.orderBy[0].field)),
        encodeCursor: () => createPageCursor('emulator-cursor'),
      });

      await expect(
        repository.get({
          access: {
            principalId: createEntityId('anonymous'),
            roles: ['keeper'],
          },
          id: createEntityId('emulator'),
        }),
      ).rejects.toMatchObject({ code: 'forbidden' });
    },
  );
});

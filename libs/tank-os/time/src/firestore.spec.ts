import { createFirestoreTimeAdapter } from './firestore';

describe('firestore entry point', () => {
  it('Given the Firestore entry point, When importing it, Then it exposes its adapter factory', () => {
    expect(createFirestoreTimeAdapter).toEqual(expect.any(Function));
  });
});

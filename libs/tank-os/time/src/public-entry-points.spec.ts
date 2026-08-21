import { createFirestoreTimeAdapter } from './firestore';
import { createJsonHttpTimeAdapter } from './json-http';
import { createNativeTimeAdapter, createNativeTimeZoneDatabase } from './index';

describe('transport entry points', () => {
  it('Given the Firestore entry point, When importing it, Then it exposes its adapter factory', () => {
    expect(createFirestoreTimeAdapter).toEqual(expect.any(Function));
  });

  it('Given the JSON/HTTP entry point, When importing it, Then it exposes its adapter factory', () => {
    expect(createJsonHttpTimeAdapter).toEqual(expect.any(Function));
  });

  it('Given the main entry point, When importing it, Then it exposes the native temporal factories', () => {
    expect(createNativeTimeAdapter).toEqual(expect.any(Function));
    expect(createNativeTimeZoneDatabase).toEqual(expect.any(Function));
  });
});

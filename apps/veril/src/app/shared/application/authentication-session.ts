export interface AuthenticationSession {
  signInWithPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  isEditorialKeeper(): Promise<boolean>;
}

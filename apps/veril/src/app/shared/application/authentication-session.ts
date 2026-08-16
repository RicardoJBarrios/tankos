export interface AuthenticationSession {
  signInWithPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  isKeeper(): Promise<boolean>;
  isEditorialKeeper(): Promise<boolean>;
}

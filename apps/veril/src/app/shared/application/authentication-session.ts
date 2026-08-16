export interface AuthenticationSession {
  signInWithPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  isAuthenticated(): Promise<boolean>;
  isKeeper(): Promise<boolean>;
  isEditorialKeeper(): Promise<boolean>;
}

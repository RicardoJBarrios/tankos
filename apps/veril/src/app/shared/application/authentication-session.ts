export type AuthenticationSnapshot = {
  readonly userId: string | null;
  readonly isAuthenticated: boolean;
  readonly isKeeper: boolean;
  readonly isEditorialAdmin: boolean;
};

export interface AuthenticationSession {
  signInWithPassword(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  getSnapshot(options?: {
    readonly forceRefresh?: boolean;
  }): Promise<AuthenticationSnapshot>;
}

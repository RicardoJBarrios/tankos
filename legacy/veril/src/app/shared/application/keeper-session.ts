export interface KeeperSession {
  requireAuthenticatedKeeper(): Promise<{ readonly id: string }>;
}

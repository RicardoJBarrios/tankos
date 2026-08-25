# Accepted Technology Stack

| Technology              | Version/baseline     | Purpose                                                |
| ----------------------- | -------------------- | ------------------------------------------------------ |
| Node                    | 24                   | Runtime and CI baseline                                |
| pnpm                    | 11.17.0              | Workspace package manager                              |
| Nx                      | 23.1.1               | Workspace projects, generators, targets and boundaries |
| Angular                 | 22.1.3               | Application framework                                  |
| Angular Material/CDK    | 22.1.3               | Accessible UI foundation                               |
| TypeScript              | 6.0.2                | Application language                                   |
| Vitest                  | 4.1.11               | Unit test runner                                       |
| Spectator               | 20.0.0               | Angular test ergonomics                                |
| Zod                     | 4.4.3                | Runtime boundary validation                            |
| NgRx Signals            | 22.0.0               | Shared/complex feature state                           |
| Firebase JS SDK         | 12.17.1              | Auth and Firestore client                              |
| AngularFire             | 20.0.1               | Angular integration boundary                           |
| Firebase Emulator Suite | Firebase CLI tooling | Local and integration backend                          |
| Playwright              | workspace baseline   | E2E testing                                            |
| GitHub                  | repository hosting   | Source control and deferred delivery integration       |

Stable compatible releases are preferred. Do not use prereleases, peer overrides
or forced installs. Rejected alternatives remain documented in the relevant ADRs.

# UX Comparison

| UX area           | Common market pattern                                                              | Observed advantage                                 | Observed risk                                                               |
| ----------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------- |
| Onboarding        | Choose tank type, add aquarium/device, configure parameters.                       | Fast start and relevant defaults.                  | Setup becomes long when every feature is configured up front.               |
| Dashboard         | Current parameters, due tasks, alerts, device state and recent activity.           | Useful at-a-glance orientation.                    | Competing concepts create clutter; important actions can be hidden.         |
| Navigation        | Tank selector plus sections for parameters, livestock, tasks, equipment and notes. | Familiar mental model for multiple tanks.          | Deep menus and repeated context switching.                                  |
| Timeline/journal  | Chronological notes, photos, tests and actions.                                    | Preserves change context.                          | Generic timelines become noisy without filtering or causal links.           |
| Calendar          | Recurring maintenance, reminders and due activities.                               | Supports routine work.                             | Users do not want reminders for every action; schedule flexibility matters. |
| Historical review | Parameter charts, tables and trend overlays.                                       | Helps diagnose change.                             | Charts are often hard to read or require too much interaction.              |
| Fiches            | Species, livestock, equipment or pet profile with notes/photos.                    | Keeps context near the subject.                    | Reference content increases scope and maintenance burden.                   |
| Graphs            | Per-parameter trends, ranges and activity overlays.                                | Commonly requested and useful for troubleshooting. | False target ranges or poor precision can mislead.                          |
| Alerts            | Out-of-range value, device failure, task due.                                      | High value when actionable.                        | Notification fatigue and unsafe advice reduce trust.                        |

## UX conclusion

The clearest recurring requirement is low-friction capture followed by useful
context. The clearest recurring failure mode is a feature-rich dashboard that
does not answer “what changed, why does it matter, and what should I do next?”

# Cross-Product Information Model Inventory

This inventory identifies recurring patterns. It is not Veril's domain model.

| Pattern | Seen across products | Common attributes or relationships |
| --- | --- | --- |
| Aquarium/Tank | Nearly all logging apps | Name, type, start date, volume, multiple tanks, selected context. |
| Parameter/Measurement | Logger and controller products | Value, unit, timestamp, target/range, source, trend. |
| Test procedure | Aquarimate and manual-test workflows | Parameter, instructions, timer, reagent/test context. |
| Care activity | Aquarimate, Pocket Marine and reef trackers | Water change, dosing, feeding, cleaning, notes, amount, date. |
| Planned task/reminder | Logger, gardening and maintenance apps | Schedule, recurrence, due state, completion/skip, instructions. |
| Livestock | Logger and species apps | Species, individual/group, addition, status, photos, notes, tank. |
| Equipment/device | Logger and hardware ecosystems | Type, model, location, status, sensor/channel, maintenance. |
| Timeline/Journal | Apps and pet/lab analogues | Ordered records, notes, photos, actions, attached subject. |
| Species/reference | Aquarimate and Pocket Marine | Taxonomy, care guidance, compatibility, wishlist. |
| Alert | Controllers, plant/pet apps | Condition, severity, delivery, acknowledgement, resolution. |
| Export/backup | Aquarimate, ReefLog and pet apps | User-owned records, restore/import, shareable report. |
| Provenance/audit | ELNs and device systems | Source, actor, time, change history, confidence/calibration. |

## Important pattern differences

- Logger products treat the tank as the primary container.
- Controller products treat the device/channel and live state as primary.
- ELNs treat an experiment/sample and audit trail as primary.
- Pet and garden apps treat the cared-for subject plus recurring care as primary.

Veril should not choose among these patterns until its first accepted use case
reveals whether the primary subject is Aquarium, Display, System or an activity.

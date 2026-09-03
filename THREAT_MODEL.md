# UltimateGuitar v0.1 Threat Model

## Scope and assets
UltimateGuitar is a local Windows VST3 instrument. Runtime has no network service, account, credential store or remote code path. The important assets are the user's raw recordings, the packaged sample bank, DAW/plugin stability, deterministic project state, per-user library settings and the integrity of build dependencies.

## Actors and trust boundaries
- Trusted: FL Studio host process, project-owned code after validation, pinned build inputs and product-owned installed sample files after integrity checks.
- Untrusted/partially trusted: MIDI values, host state chunks, manifest TSV bytes, WAV bytes, user-selected filesystem paths and any dependency checkout before pin/origin validation.
- Runtime executes unprivileged inside the DAW. Elevation is reserved for the later system VST3/shared-content installer only.

## Entry points
- MIDI note/velocity/offset events supplied by the host.
- Serialized plugin state restored by the host.
- Manifest rows and relative sample paths.
- RIFF/WAVE chunk sizes and sample payloads.
- `Locate Sample Library` filesystem paths and saved per-user path setting.
- Git dependency origins/revisions used during development and CI.

## Abuse and failure cases
- Path traversal or an absolute manifest path escapes the chosen sample root.
- Malformed RIFF sizes, truncated chunks or hostile frame counts trigger overflow/out-of-bounds reads or oversized allocations.
- Corrupt or hash-mismatched audio silently substitutes the wrong recording.
- Dependency drift, wrong Git origin or dirty vendor trees change the binary without a reviewed source change.
- A malformed host state produces invalid enum/range values or nondeterministic seed restoration.
- Worker teardown races let background loading access destroyed plugin/UI state.
- File I/O, allocation or blocking synchronization reaches the audio callback and destabilizes FL Studio.
- Installer ownership mistakes later delete raw recordings or arbitrary alternate library folders.

## Required mitigations
- Manifest parser rejects absolute paths, `..`, bad ranges, duplicate identities and unreasonable sizes before file access.
- WAV decoder uses bounded RIFF parsing with overflow checks and accepts only stereo 48 kHz IEEE-float32 for v0.1.
- Package/runtime loading verifies declared frame/hash metadata before publishing Ready data.
- Dependencies are origin-checked, clean and pinned to exact revisions; CI actions are full-SHA pinned.
- Loaded sample data becomes immutable before the audio thread can observe it; runtime selection never executes data as code.
- Background worker has explicit stop/join ownership and never calls destroyed UI/plugin objects.
- Audio-thread tests prohibit filesystem I/O, heap allocation, logging and blocking mutexes in the render path.
- Runtime has no network access requirement and stores no secrets; working-tree/CI secret scanning remains enabled.

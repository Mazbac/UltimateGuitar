# Project Definition

## Status
Discovery complete for the first native VST slice. Repository activation remains intentionally pending until the written v0.1 design spec is reviewed.

## Product intent
- Problem: the current Sforzando/SFZ prototype can mis-handle string/sample pools and may produce silent repeated notes; the user needs a dependable native guitar instrument.
- Primary user: a music producer programming metal guitar in FL Studio from the user's own recorded sample library.
- Desired outcome: insert one VST3 instrument, choose Left or Right performance samples, and play/program exact recorded palm-muted notes with convincing variation and no cross-string mixing or missing-take silence.
- First useful release: Windows x64 VST3 implementing Palm Mute / Downstroke / Middle across four strict string zones and both Left/Right banks.
- Explicit non-goals: other articulations, amp/cab FX, chord/fingering engine, macOS, public commercial branding and large raw audio in ordinary Git history.

## Product experience
- Target audience / expertise: DAW user; should not need developer tooling or SFZ knowledge.
- First useful outcome: VST3 loads in FL Studio, reports sample library Ready, then all mapped notes play immediately and reliably.
- Distribution/install expectations: normal per-user Windows install without requiring administrator access where avoidable; VST3 plus versioned sample content.
- Setup/onboarding constraints: automatic sample discovery is primary; a single Locate Sample Library recovery action exists when discovery fails.
- Update/recovery/uninstall expectations: versioned sample bank and settings must be recoverable; uninstall must not leave unexplained runtime artifacts.

## Brand / creative input
- Existing brand/assets: internal project/repository name `UltimateGuitar`; no public release identity approved.
- Colors/typography/tone: not yet a finalized design system; initial direction is compact, dark-neutral and studio-oriented.
- User references/inspiration: existing FL Studio/Sforzando workflow and the user's real Left/Right guitar recordings.
- Explicit durable likes/dislikes: strict no-string-mixing; natural variation; no randomly silent notes; keep the workflow simple inside FL Studio.

## Constraints
- Canonical MIDI mapping is String 1 = 11-23, String 2 = 28-40, String 3 = 45-57, String 4 = 62-74.
- A MIDI note resolves to exactly one string and one selected performance side.
- Current source WAVs are stereo 48 kHz 32-bit IEEE float and must play without quality-damaging offline conversion in the development source.
- Incomplete/non-contiguous take pools are normal and must never create silent round-robin positions.
- Audio-thread work must be real-time safe: no filesystem I/O, blocking locks or heap allocation in the render callback.
- Prefer no paid framework or vendor lock-in; v0.1 architecture uses iPlug2 + VST3.
- The user's raw sample library is product content, not source-control history.

## Acceptance
A cleanly installed Windows x64 VST3 in FL Studio plays every valid mapped note from the correct string and selected Left/Right bank, survives rapid repeated note-ons without unexplained silence, restores its state on project reopen, and passes project verification plus VST3/host smoke tests.

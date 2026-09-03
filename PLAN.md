# Delivery Plan

## Foundation
- [x] Reusable delivery foundation v3 is present and validated.

## UltimateGuitar v0.1 discovery/design
- [x] Recover canonical Left/Right sample library and strict string mapping from live files.
- [x] Audit current WAV count, format and incomplete take pools.
- [x] Compare native VST implementation approaches and select iPlug2 + VST3 direction.
- [x] Define v0.1 scope, non-goals, real-time boundaries, variation rules and release acceptance.
- [x] Write `docs/superpowers/specs/2026-09-03-ultimate-guitar-vst-v0.1-design.md`.
- [ ] User review/approval of the written spec.

## After written-spec approval
1. Invoke the writing-plans workflow and produce the detailed implementation plan.
2. Activate `.project/manifest.json` from template to project mode at lifecycle DEFINE with exact commands and project metadata.
3. Pin the iPlug2/VST3 dependency revisions and establish a reproducible Windows x64 CMake build plus GitHub Actions CI.
4. Build the sample-manifest scanner/validator test-first using tiny synthetic WAV fixtures and validate it against the real local sample library.
5. Build mapping, variation and plugin-state domain logic test-first.
6. Build real-time-safe sample loading/cache, resampling and one-shot voice engine test-first.
7. Add VST3 integration and compact plugin UI, then validate in the Steinberg validator and FL Studio.
8. Enter VERIFY only after complete tests, security/product-experience review, visual evidence and challenger review exist.
9. Package a clean per-user Windows release artifact and verify install/reopen/render/uninstall journeys.

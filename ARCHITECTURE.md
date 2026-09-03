# Architecture Record

## Template architecture
This repository separates stable delivery rules from project-specific implementation.

- `AGENTS.md`: highest-level autonomous operating contract and session-invariance rule.
- `.project/manifest.json`: machine-readable lifecycle, capabilities, context, UI/design, evidence and experience state.
- `.project/context-map.json` + `.automation/context-pack.mjs`: deterministic task/lifecycle-aware context dependency resolution with hash/completeness evidence.
- Root state docs: durable product/execution memory and rationale.
- Manifest-referenced project artifacts: project-specific design/experience/quality-evidence truth when applicable.
- `docs/`: inherited quality, context, design, security, test and release standards.
- `.automation/`: stack-neutral host, schema and context-integrity checks.
- `.github/`: independent CI and review gates.
- Application code: chosen and created only after discovery.

## Architecture principles
1. Prefer the simplest architecture that satisfies real constraints.
2. Minimize dependencies, privileges, public attack surface and hidden coupling.
3. Keep domain logic testable outside UI/infrastructure when practical.
4. Make external systems explicit behind narrow boundaries.
5. Treat migrations, upgrades, backups, install/update/uninstall and rollback as architecture concerns when applicable.
6. No irreversible architectural decision without recording rationale in `DECISIONS.md`.
7. Preserve session invariance: important boundaries and implementation conventions cannot exist only in chat.
8. For substantial changes, verify compatibility with existing users/data before migration.
9. For UI projects, separate product design semantics from third-party component-library details when practical.
10. Treat required context and verification evidence as explicit dependencies; do not rely on model memory or self-attestation.

## Project-specific architecture
The approved v0.1 direction is a Windows x64 VST3 instrument built with pinned iPlug2/VST3 dependencies. Project-owned boundaries are `SampleManifest`, `SampleLibrary`, `VariationEngine`, `VoiceEngine`, `PluginState`, `PluginUI` and a developer/release `LibraryTool`.

The runtime trust boundary is local MIDI + host audio/state input and a versioned local sample bank. The audio callback never performs filesystem I/O, heap allocation, blocking synchronization, logging or UI work. Sample loading/decoding occurs off-thread into immutable buffers held by a process-wide cache shared by plugin instances.

The canonical sparse MIDI map is S1 11-23, S2 28-40, S3 45-57 and S4 62-74. A note maps to exactly one string and the selected Left/Right performance bank. Variation selects only manifest entries that actually exist; incomplete take numbering is valid.

Raw WAVs remain outside ordinary Git history. Development resolves the private source bank through a local override; release packaging creates a stable per-user product-owned sample layout. Detailed v0.1 behavior is defined in `docs/superpowers/specs/2026-09-03-ultimate-guitar-vst-v0.1-design.md`.
## Windows build architecture
Local and CI Windows builds enter a supported Visual Studio 2019/2022/2026 x64 developer environment and use CMake + Ninja. This intentionally avoids reliance on Visual Studio instance registration while preserving MSVC ABI/toolchain behavior.

Build dependencies live only under ignored `.deps/`. iPlug2 is exact-SHA pinned; the nested Steinberg VST3 SDK is exact-SHA pinned and restores only build-required submodules (`base`, `cmake`, `pluginterfaces`, `public.sdk`) during normal bootstrap. Dirty or wrong-origin dependency trees are rejected instead of reset silently.

`THREAT_MODEL.md` is the project security source for runtime/file/dependency trust boundaries. The aggregate `scripts/verify.ps1` combines working-tree secret scan, Python contract tests, Debug/Release native tests and repository/context integrity checks.
## Sample-manifest tooling
`tools/library_manifest.py` is the deterministic development/release boundary from raw recordings to runtime metadata. It maps explicit per-string folder labels to MIDI numbers, validates accepted WAVs as stereo 48 kHz IEEE-float32, hashes each file, and emits LF-normalized TSV rows sorted by side/string/MIDI/take. Missing take numbers are reported but never materialized as empty rows.

A 2026-09-04 live scan validates 1,660 WAVs / 104 pools. Two legacy filenames use `HighStroke` without the normal separator; only that narrow variant is accepted, while side/folder/note matching stays strict. Synthetic fixtures exercise historical 11-entry and current non-contiguous pools without committing private recordings.

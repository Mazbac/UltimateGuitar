# UltimateGuitar VST v0.1 Design

Date: 2026-09-03
Status: APPROVED by user on 2026-09-04
Target: Windows x64 VST3 instrument, FL Studio first

## Product goal
Build a native sample-based metal guitar instrument that replaces the fragile Sforzando mapping with a dependable VST3. The first useful release plays the user's existing palm-mute/downstroke/middle WAV library directly from MIDI, preserves strict string separation, uses the real available takes, and never drops a note because a nominal round-robin take is missing.

The product should feel like an instrument, not a sample-file browser. The user should be able to insert the VST3 in FL Studio, see that the sample library is ready, choose the performance side, and play/program the mapped keys immediately.

## v0.1 scope
- One articulation: Palm Mute / Downstroke / Middle.
- Two independent performance banks: Left and Right.
- Four independent string zones.
- Exact recorded-note playback; no pitch-shifting between sampled notes.
- Per-note variation across all WAVs that actually exist in that note pool.
- Stereo audio output; source WAV channel content is preserved.
- MIDI velocity changes gain only; there are no velocity layers in this library.
- Small deterministic human timing variation, compatible with the existing 0 to +0.8 ms intent.
- State saving for user controls and deterministic variation seed.

## Explicit non-goals for v0.1
- No upstrokes, sustains, power chords, slides, vibrato, lead articulations or scrape/noise system yet.
- No amp/cab/effects chain; the plugin is the guitar source instrument.
- No automatic chord/fingering engine.
- No macOS build in the first release.
- No public commercial naming decision; `UltimateGuitar` is the internal project/repository name for now.
- No large raw WAV files in normal Git history.

## Canonical MIDI/string mapping
MIDI numbers are the source of truth so octave-label differences between hosts cannot change behavior.

| String | Recorded range | MIDI range | Starting-note folder |
|---|---|---:|---|
| String 1 | B0 through B1 | 11-23 | `B Starting Note` |
| String 2 | E2 through E3 | 28-40 | `E Starting Note` |
| String 3 | A3 through A4 | 45-57 | `A Starting Note` |
| String 4 | D5 through D6 | 62-74 | `D Starting Note` |

Keys outside those four ranges are silent in v0.1. The gaps between string zones are intentional. A note can resolve to exactly one string only; there is never cross-string sample mixing.

## Verified current sample library
Local source root during development:
`C:\Users\Alihan & Maaike\Music\UltimateGuitar\00_RAW_Recordings\Palm Mutes\Down Stroke`

Verified on 2026-09-03:
- 1,655 WAV files, about 0.504 GiB.
- Every WAV is RIFF/WAVE, IEEE-float format, stereo, 48 kHz, 32-bit.
- Durations range from about 0.683 s to 1.714 s; median about 0.848 s.
- Normal note pools contain 16 takes.
- Left / String 1 / D# contains 15 takes; take 4 is absent.
- Right / String 1 / E contains 11 takes; takes 8, 12, 13, 14 and 15 are absent.
- Right / String 2 / F contains 15 takes; take 8 is absent.
- Right / String 3 / G# contains 14 takes; takes 4 and 5 are absent.

These incomplete pools are valid input, not runtime errors. The engine enumerates actual manifest entries and never assumes takes 1-16 all exist.

## Architecture choice
Use iPlug2 with its CMake-based out-of-source pattern, pinned to a known revision. Build only the VST3 target for v0.1. iPlug2 provides the plugin wrapper, MIDI/audio integration and IGraphics UI layer while keeping the application logic in project-owned classes.

Why this direction:
- iPlug2 is permissively licensed and explicitly supports closed-source use.
- It supports Windows VST3 and CMake without requiring a paid framework license.
- The VST3 SDK is MIT-licensed from version 3.8 onward.
- It is substantially lighter than HISE for this narrowly scoped native sampler.
- It avoids JUCE licensing becoming a product constraint.

Alternatives considered:
1. Direct Steinberg VST3 SDK + VSTGUI: maximum control and permissive licensing, but materially more wrapper/host boilerplate for no v0.1 user benefit.
2. JUCE: mature and convenient, but licensing is an avoidable constraint for a project that may later be distributed commercially.
3. HISE: excellent sampler features, but too large and opinionated for the first release and would make the engine harder to own incrementally.

Research references:
- https://github.com/iPlug2/iPlug2
- https://iplug2.github.io/docs/md_cmake.html
- https://steinbergmedia.github.io/vst3_dev_portal/pages/VST%2B3%2BLicensing/VST3%2BLicense

## Component boundaries
`SampleManifest`: generated metadata describing every distributable sample: side, string, MIDI note, take id, relative path, format facts and optional integrity metadata.

`SampleLibrary`: validates the manifest, resolves the installed sample root, owns decoded audio and exposes immutable note pools. File I/O never occurs on the real-time audio thread.

`VariationEngine`: owns one independent shuffle bag per side + MIDI note. It selects only existing takes, avoids an immediate repeat across bag boundaries, and uses an instance seed stored in plugin state so behavior is natural but reproducible.

`VoiceEngine`: accepts note-on events, obtains a valid sample from the selected pool, applies velocity gain and human timing, resamples from 48 kHz when the host sample rate differs, and mixes active one-shot voices into stereo output.

`PluginState`: side selection, output gain, humanize amount and deterministic variation seed. State must restore correctly when an FL Studio project is reopened.

`PluginUI`: thin product surface over state/status. It does not own sample-selection or audio rules.

`LibraryTool`: developer/release utility that scans the raw sample source, checks naming/mapping/format constraints, reports incomplete pools, and emits the runtime manifest. CI tests it against tiny synthetic fixtures rather than the private 0.5+ GiB library.

## Real-time and loading model
The current bank is small enough to keep decoded audio in memory once, but not small enough to duplicate per plugin instance. v0.1 therefore uses a process-wide shared sample cache keyed by library/version. Loading occurs on a background thread; the audio callback only reads ready immutable buffers.

Two plugin instances using the same bank share decoded sample memory. This makes the normal Left + Right double-track workflow practical without roughly doubling the sample RAM footprint.

The plugin has explicit states: `Locating library`, `Loading`, `Ready`, and `Library problem`. MIDI received before `Ready` must fail visibly rather than pretending to play. Once `Ready`, a valid mapped note-on must always produce a voice unless a deliberate voice-steal policy is reached.

Palm mutes are one-shot samples. MIDI note-off does not prematurely choke them. Repeated note-ons may overlap; rapid repeated clicks must not become silent because an earlier voice is still active.

No heap allocation, filesystem I/O, blocking mutex, logging or UI work is permitted from the audio callback.

## Variation behavior
Each note pool uses a shuffled bag of the actual available samples. The bag is exhausted before being reshuffled. The first sample of a new bag cannot equal the last sample of the previous bag when the pool contains more than one entry.

This directly fixes the Sforzando-era failure mode where a fixed 16-position sequence could point at a take number that does not exist. A pool of 11 takes is an 11-entry pool, not a 16-entry pool padded with missing positions.

Default human timing range is 0 to +0.8 ms. The UI `Humanize` control scales that maximum from 0% to 100%. The random sequence is deterministic from saved plugin state so project reloads and offline renders are reproducible.

## Visual direction
The interface must carry the aggressive, instantly recognizable visual energy the user likes in the Jackson JS32T Warrior Ferrari Red: saturated Ferrari-red hero surfaces, black hardware-like details, sharp asymmetric/angular geometry, thin metallic highlights and dark fretboard-like secondary surfaces. This is visual inspiration only: do not use Jackson branding, logos, copied product photography, or a literal traced Warrior body. UltimateGuitar must have its own product identity.

Avoid a generic black plugin with a few red knobs. The composition should feel intentionally guitar-shaped/metal-oriented, with a prominent `UltimateGuitar` wordmark treatment and a stylized original angular-guitar motif. Exact tokens/components are defined later in the tracked `DESIGN_SYSTEM.md` before broad UI implementation.

## User experience
The v0.1 editor is a compact studio-tool surface, not a sample-manager UI. It shows:
- Instrument/articulation identity: `Palm Mute / Downstroke / Middle`.
- Library status with a clear Ready/Loading/problem message.
- `Performance` selector: Left or Right. The selected bank is never mixed with the other bank.
- `Humanize` amount, default 100% of the 0.8 ms range.
- `Output` gain.
- A compact four-row string map showing B0-B1, E2-E3, A3-A4 and D5-D6 so the playable zones are obvious.

Source WAV panning is preserved. v0.1 does not hard-pan a Left-bank instance or Right-bank instance; the user can place/pan the two plugin instances in FL Studio as desired.

If the installed sample library is missing or incompatible, the plugin shows one actionable recovery surface with `Locate Sample Library`. Technical paths/errors may be available in diagnostics, but raw stack traces or framework errors are not primary UI copy.

The UI should be resizable/HiDPI-safe and keyboard-operable where controls permit it. The project DESIGN phase converts the Ferrari-red/angular direction above into a tracked design system before broad styling; controls remain compact and studio-oriented rather than becoming decorative clutter.

## Sample distribution and repository policy
Raw recordings remain outside ordinary Git history. The repository stores code, metadata schema, generated sample manifests/reports, tests and tiny synthetic WAV fixtures only.

Developer builds may resolve the real sample bank through a documented local path override. Release packaging installs the versioned read-only sample bank into `%PROGRAMDATA%\UltimateGuitar\Samples\v0.1` and the plugin resolves it automatically. This accompanies the FL Studio-compatible system VST3 install under `Program Files\Common Files\VST3`; a user-selected alternate library root is stored separately in per-user settings.

The release path must not depend on the original `00_RAW_Recordings` folder names being present on another machine. Packaging creates a stable product-owned sample layout from the validated source library.

## Validation and tests
Unit tests must prove:
- All 52 mapped MIDI notes resolve to the correct one and only one string for each side.
- Gap/out-of-range notes do not accidentally borrow another string's samples.
- Filename ordering is numeric by take id, not lexical (`1, 10, 11...`).
- Missing/non-contiguous take numbers do not create empty variation positions.
- A repeated note traverses its real pool without immediate repeats until the pool is exhausted.
- Left and Right variation state is independent.
- Note-off does not choke current one-shot palm-mute voices.
- Saved state restores side, gain, humanize and variation seed.
- 44.1/48/96 kHz host rates produce correct pitch/duration within tolerance.

Integration tests must exercise manifest generation, malformed/missing sample handling, shared-cache behavior across multiple instances, and repeated MIDI bursts without audio-thread allocation/file I/O.

Release verification must include:
- Clean Windows x64 build from a fresh checkout.
- Steinberg VST3 validator pass for the built plugin.
- FL Studio smoke test: load VST3, play every mapped note, hammer repeated notes, switch Left/Right, save/reopen the project, and render a short MIDI fixture.
- Visual inspection at normal and scaled Windows display settings.
- No host crash, dropped valid note, cross-string mapping or hidden sample-library failure.

## Acceptance criteria
v0.1 is acceptable when a cleanly installed VST3 in FL Studio can play every mapped note from the correct string and selected side, repeatedly and rapidly, with no silent round-robin holes. The known 11/14/15-take pools must work continuously without special-case code per note.

A new session must be able to reconstruct the MIDI mapping, sample-pool rules, architecture and next engineering step from the repository without depending on this chat.

# UltimateGuitar VST v0.1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a reliable Windows x64 VST3 guitar instrument for FL Studio that plays the current Palm Mute / Downstroke / Middle Left/Right sample banks with strict string mapping, real-take variation and no silent round-robin holes.

**Architecture:** Keep sample-library tooling, deterministic core rules, audio playback and iPlug2 host/UI integration behind focused boundaries. Raw WAVs stay outside Git; a generated manifest drives a shared immutable sample cache, and the real-time path only reads preloaded buffers and fixed-capacity voice state.

**Tech Stack:** C++17, iPlug2 `d54f69050f517e43b941d88c2a170f0a840b9ee4`, Steinberg VST3 SDK 3.8.1 `3cdf9ca5d1f5b1b21e0a86832aa4abe55607bd96`, CMake, MSVC x64, CTest/custom zero-dependency C++ test harness, Python 3 stdlib tooling, PowerShell, GitHub Actions Windows runner.

**Spec:** `docs/superpowers/specs/2026-09-03-ultimate-guitar-vst-v0.1-design.md`

## Global Constraints
- Target Windows x64 VST3; FL Studio is the primary host.
- Scope is only Palm Mute / Downstroke / Middle, with separate Left and Right banks.
- Canonical MIDI zones: S1 11-23, S2 28-40, S3 45-57, S4 62-74; gaps are intentionally silent.
- Never mix strings or Left/Right banks in a note pool.
- Variation enumerates actual files; missing/non-contiguous take numbers are valid.
- Source WAV contract is stereo 48 kHz 32-bit IEEE-float; unsupported release samples fail validation visibly.
- Audio callback: no filesystem I/O, heap allocation, logging, UI work or blocking mutex.
- Palm mutes are one-shot; MIDI note-off does not choke them.
- Human timing is deterministic and scales 0 to +0.8 ms.
- UI uses original Ferrari-red/black angular metal-guitar language inspired by the Warrior reference, with no Jackson marks, copied photography or traced body design.
- Raw/private WAV files never enter ordinary Git history.
- Preserve the recorded stereo channel content/panning exactly; v0.1 adds no automatic Left/Right hard-pan.
- Play only the exact sample recorded for each mapped MIDI note; never pitch-shift a neighboring sample to cover another key.
- MIDI velocity controls gain only via `velocity/127.0`; v0.1 has no velocity-layer switching.
- Do not add upstrokes, sustains, chords, slides, vibrato, lead/noise articulations, amp/cab/effects, fingering logic, macOS or other plug-in formats in v0.1.
- Do not create a public/commercial release under the `UltimateGuitar` name until the recorded naming/trademark risk is explicitly resolved; this plan produces a locally verified release candidate.

---
## Planned file structure
- `CMakeLists.txt` — project targets, tests and VST3 build entry.
- `cmake/UltimateGuitarDependencies.cmake` — verifies pinned iPlug2/VST3 locations.
- `scripts/bootstrap.ps1` — idempotently clones/pins build dependencies under ignored `.deps/`.
- `scripts/build.ps1` — configures/builds Release or Debug x64.
- `scripts/verify.ps1` — aggregate local verification gate.
- `scripts/package.ps1` — creates versioned VST3 + sample-content release staging.
- `tools/library_manifest.py` — scans/validates raw recordings and emits stable TSV manifest/report.
- `tools/package_samples.py` — copies only manifest-approved WAVs to stable release layout.
- `tests/python/test_library_manifest.py` — scanner and malformed-library regression tests.
- `tests/TestHarness.h`, `tests/TestMain.cpp` — zero-dependency C++ test harness.
- `src/core/SampleTypes.h` — side/string/sample metadata value types.
- `src/core/MidiMap.h/.cpp` — sparse canonical MIDI-to-string mapping.
- `src/core/Manifest.h/.cpp` — runtime TSV parsing and note-pool construction.
- `src/core/VariationEngine.h/.cpp` — deterministic per-pool shuffle bags.
- `src/core/PluginState.h/.cpp` — side/output/humanize/seed state model.
- `src/audio/WavFloatReader.h/.cpp` — constrained float-WAV decoder.
- `src/audio/SampleLibrary.h/.cpp` — validation, loading, shared immutable cache and status.
- `src/audio/VoiceEngine.h/.cpp` — fixed-capacity one-shot playback, velocity, timing and resampling.
- `src/plugin/UltimateGuitar.h/.cpp`, `src/plugin/config.h` — iPlug2 instrument wrapper and host state/MIDI integration.
- `src/ui/DesignTokens.h`, `src/ui/PluginUI.h/.cpp` — product-owned visual language and editor.
- `resources/resource.h` — iPlug2 resource IDs.
- `DESIGN_SYSTEM.md` — durable UI source of truth before broad UI implementation.
- `.github/workflows/quality.yml` — clean Windows build/test/security/context gate.
- `installer/UltimateGuitar.nsi` — FL Studio-compatible NSIS Windows installer definition.

---
### Task 1: Activate the repository and establish the reproducible Windows build

**Files:**
- Create: `CMakeLists.txt`, `cmake/UltimateGuitarDependencies.cmake`, `scripts/bootstrap-toolchain.ps1`, `scripts/bootstrap.ps1`, `scripts/build.ps1`, `scripts/verify.ps1`, `scripts/secret-scan.ps1`, `.github/workflows/quality.yml`, `DESIGN_SYSTEM.md`, `THREAT_MODEL.md`, `src/ui/DesignTokens.h`
- Modify: `.project/manifest.json`, `STATUS.md`, `PLAN.md`, `ARCHITECTURE.md`, `DECISIONS.md`, `.gitignore`, `.project/context-map.json`

**Interfaces:**
- Produces: `IPLUG2_DIR=<repo>/.deps/iPlug2`; VST3 SDK at `.deps/iPlug2/Dependencies/IPlug/VST3_SDK`; CMake target `UltimateGuitarCoreTests`; aggregate `scripts/verify.ps1`.
- Pins: iPlug2 `d54f69050f517e43b941d88c2a170f0a840b9ee4`; VST3 SDK `3cdf9ca5d1f5b1b21e0a86832aa4abe55607bd96`.

- [x] **Step 1: Make the local Windows toolchain bootstrap autonomous**

`scripts/bootstrap-toolchain.ps1` first locates a supported Visual Studio 2019 or 2022 Build Tools/Community installation and confirms MSVC x64, a Windows 10+ SDK and CMake >=3.14 are present. Prefer an already-installed supported toolchain; on the current development machine VS2019 Build Tools at `C:\Program Files (x86)\Microsoft Visual Studio\2019\BuildTools` provides MSVC 14.29, Windows SDK 10.0.19041.0 and CMake 3.20. If no supported installation exists, download Microsoft's official VS 2022 Build Tools bootstrapper from `https://aka.ms/vs/17/release/vs_BuildTools.exe` and invoke it with `--quiet --wait --norestart --nocache --add Microsoft.VisualStudio.Workload.VCTools --add Microsoft.VisualStudio.Component.VC.CMake.Project --includeRecommended`. Resolve the chosen developer environment through its `VsDevCmd.bat -arch=x64`. If Windows requires a UAC consent that automation cannot cross, stop with that single explicit authorization blocker; do not ask the user to select workloads manually.

- [x] **Step 2: Write bootstrap dependency assertions before cloning anything**

Create `cmake/UltimateGuitarDependencies.cmake` so configure fails unless `${IPLUG2_DIR}/iPlug2.cmake` and `${IPLUG2_DIR}/Dependencies/IPlug/VST3_SDK/public.sdk` exist. The error must name `scripts/bootstrap.ps1` as the recovery command.

- [x] **Step 3: Implement the idempotent pinned dependency bootstrap**

`scripts/bootstrap.ps1` must clone iPlug2 into `.deps/iPlug2`, checkout the exact iPlug2 SHA, clone VST3 SDK recursively into `Dependencies/IPlug/VST3_SDK`, checkout the exact VST3 SHA, and reject dirty dependency trees instead of resetting user edits silently.

```powershell
$iplugSha = 'd54f69050f517e43b941d88c2a170f0a840b9ee4'
$vst3Sha  = '3cdf9ca5d1f5b1b21e0a86832aa4abe55607bd96'
# clone when absent; otherwise verify origin, cleanliness and exact HEAD
```

- [x] **Step 4: Create the minimal CMake/test skeleton and verify failure before sources exist**

Configure through the detected x64 `VsDevCmd.bat` environment with the Ninja generator and `-DIPLUG2_DIR=<repo>/.deps/iPlug2`; the dependency guard is contract-tested to fail with an actionable `scripts/bootstrap.ps1` recovery message when dependencies are absent.
- [x] **Step 5: Activate manifest/project lifecycle with exact commands**

Set manifest to `mode: project`, lifecycle `DEFINE`, stack `C++17 + iPlug2/VST3`, runtime `Windows x64 native`, package manager `git-pinned source dependencies`, database `none`; set build/unit/integration/verify commands to the PowerShell/CMake commands created in this task. Mark web-only fields such as Playwright/devUrl explicitly not applicable.

- [x] **Step 6: Create the durable design source before broad UI work**

`DESIGN_SYSTEM.md` must define Ferrari-red hero surfaces, black hardware/fretboard surfaces, angular asymmetric geometry, restrained metallic highlights, compact studio density, original angular-guitar motif, no Jackson marks/copied photography, and control-state/accessibility rules. Mirror numeric/color tokens in `src/ui/DesignTokens.h` rather than scattering literals later.

- [x] **Step 7: Create the concrete threat model and working-tree secret gate**

`THREAT_MODEL.md` records assets (raw recordings, installed sample bank, plugin/DAW stability, settings), entry points (MIDI, host state chunks, manifest TSV, WAV bytes, user-selected paths, build dependencies), and abuse/failure cases (path traversal, malformed RIFF sizes, corrupt/hash-mismatched audio, dependency drift, oversized allocations, worker teardown races). Runtime has no network or credentials. Mitigations are strict manifest/path/WAV validation, pinned dependencies, elevation only for the FL Studio-required machine VST/content install while runtime remains unprivileged, immutable loaded data and no untrusted execution.

`scripts/secret-scan.ps1` obtains tracked files plus `git ls-files --others --exclude-standard`, excludes `.deps/`, `build/` and binary extensions, and fails on PEM private-key headers, `AKIA[0-9A-Z]{16}`, `gh[pousr]_[A-Za-z0-9_]{36,}` or `sk-[A-Za-z0-9_-]{20,}`. It reports only file + pattern class, never the matched secret value.

- [x] **Step 8: Add clean Windows CI**

`.github/workflows/quality.yml` runs on PR/push with `contents: read`, checks out full SHA-pinned actions, uses CMake/MSVC available on `windows-2025`, runs bootstrap, configure, build, CTest, Python unittest, repository validation/context integrity and secret scan; it uses only the already pinned `actions/checkout@d23441a48e516b6c34aea4fa41551a30e30af803` and `actions/setup-node@249970729cb0ef3589644e2896645e5dc5ba9c38`, then leaves build status as the gate; release artifacts are produced by the separately verified packaging path.

- [x] **Step 9: Run activation gates**

Run `node .automation/context-pack.mjs --scope all`, read through the completion marker, then run `node .automation/validate.mjs`, `node .automation/context-integrity.mjs`, `node .automation/context-pack.mjs --check` and `node .automation/self-test.mjs`. Expected: all PASS with lifecycle `DEFINE`.

- [x] **Step 10: Commit**

```bash
git add .project CMakeLists.txt cmake scripts .github DESIGN_SYSTEM.md THREAT_MODEL.md src/ui/DesignTokens.h STATUS.md PLAN.md ARCHITECTURE.md DECISIONS.md .gitignore
git commit -m "build: activate UltimateGuitar native VST project"
```

---
### Task 2: Build the sample-library scanner and stable manifest format

**Files:**
- Create: `tools/library_manifest.py`, `tests/python/test_library_manifest.py`, `tests/fixtures/library/README.md`
- Modify: `scripts/verify.ps1`, `CMakeLists.txt`

**Interfaces:**
- `midi_for_folder(string_number: int, folder_name: str) -> int` performs the explicit sparse folder mapping.
- `parse_wav_filename(side: str, folder_name: str, filename: str) -> int` returns numeric take ID or raises `ValueError`.
- `numeric_take_ids(filenames: list[str], side: str, folder_name: str) -> list[int]` returns numeric ascending takes.
- `scan_library(source: pathlib.Path) -> list[ManifestRow]` validates and returns deterministic rows.
- Produces manifest columns: `side\tstring\tmidi\ttake\trelpath\tframes\tsha256`.
- Produces `library-report.txt` with pool counts/missing nominal take numbers and format summary.
- Exit code 0 only when every accepted file is stereo/48k/32-bit IEEE-float and maps to one canonical note.

- [ ] **Step 1: Write failing Python tests for parsing and known incomplete pools**

```python
class ManifestTests(unittest.TestCase):
    def test_numeric_take_sort_and_holes_are_preserved(self):
        files = ['R1 E Stroke Middle.wav', 'R10 E Stroke Middle.wav', 'R16 E Stroke Middle.wav']
        self.assertEqual(numeric_take_ids(files, 'Right', 'E'), [1, 10, 16])

    def test_string_ranges_are_sparse(self):
        self.assertEqual(midi_for_folder(1, 'B Starting Note'), 11)
        self.assertEqual(midi_for_folder(4, 'D High'), 74)
        self.assertEqual(parse_wav_filename('Right', 'E', 'R10 E Stroke Middle.wav'), 10)
```

- [ ] **Step 2: Run the focused test and confirm RED**

Run: `python -m unittest tests.python.test_library_manifest -v`. Expected: import/function failures because `tools.library_manifest` does not exist.

- [ ] **Step 3: Implement exact folder/note/take parsing plus RIFF format validation**

Use only Python stdlib. Normalize folder labels case-insensitively, but map them through these explicit per-string tables rather than directory order: S1 `b starting note=11,c=12,c#=13,d=14,d#=15,e=16,f=17,f#=18,g=19,g#=20,a high=21,a# high=22,b high=23`; S2 `e starting note=28,f=29,f#=30,g=31,g#=32,a high=33,a# high=34,b high=35,c high=36,c# high=37,d high=38,d# high=39,e high=40`; S3 `a starting note=45,a#=46,b=47,c=48,c#=49,d=50,d#=51,e=52,f=53,f#=54,g=55,g#=56,a high=57`; S4 `d starting note=62,d#=63,e=64,f=65,f#=66,g=67,g#=68,a high=69,a# high=70,b high=71,c high=72,c# high=73,d high=74`.

Accept filenames case-insensitively only when they match `^(L|R)([1-9][0-9]*) ([A-G](?:#)?)( High)? Stroke Middle\.wav$`; the L/R prefix must match the side folder, the note/high token must match the mapped folder, and the numeric take becomes the manifest take ID. `Starting Note` appears only in the folder and is intentionally absent from the WAV filename. Parse RIFF chunks directly so IEEE-float WAV format tag `3` is supported; reject mono, non-48k, non-32-bit, non-float or malformed files with path-specific errors.
- [ ] **Step 4: Add deterministic manifest/report emission**

Normalize relative paths with `/`, sort by `(side, string, midi, take)`, compute SHA-256 while scanning, and write UTF-8 with `\n` line endings. Duplicate `(side,string,midi,take)` entries are fatal; missing take numbers are warnings only.

- [ ] **Step 5: Generate tiny synthetic float-WAV fixtures in the test itself**

The test helper writes a valid RIFF/WAVE format-tag-3 stereo 48k/32-bit file with known frame count; do not commit private recordings. Add invalid mono and invalid 44.1k fixtures to prove rejection.

- [ ] **Step 6: Validate against the real local library**

Run:
```powershell
python tools/library_manifest.py `
  --source 'C:\Users\Alihan & Maaike\Music\UltimateGuitar\00_RAW_Recordings\Palm Mutes\Down Stroke' `
  --manifest build/library/manifest.tsv `
  --report build/library/library-report.txt
```
Expected: 1,655 rows and warnings exactly matching Left S1 D#=15, Right S1 E=11, Right S2 F=15, Right S3 G#=14; no fatal format/mapping errors.

- [ ] **Step 7: Run GREEN and commit**

Run `python -m unittest tests.python.test_library_manifest -v` and `scripts/verify.ps1 -SkipNativeBuild` until PASS, then:
```bash
git add tools tests/python tests/fixtures scripts/verify.ps1 CMakeLists.txt
git commit -m "feat: add deterministic sample manifest scanner"
```

---
### Task 3: Implement canonical MIDI mapping and runtime manifest pools

**Files:**
- Create: `src/core/SampleTypes.h`, `src/core/MidiMap.h`, `src/core/MidiMap.cpp`, `src/core/Manifest.h`, `src/core/Manifest.cpp`, `tests/TestHarness.h`, `tests/TestMain.cpp`, `tests/test_mapping.cpp`, `tests/test_manifest.cpp`
- Modify: `CMakeLists.txt`

**Interfaces:**
```cpp
enum class PerformanceSide : uint8_t { Left, Right };
enum class GuitarString : uint8_t { String1 = 1, String2, String3, String4 };
struct SampleRef { PerformanceSide side; GuitarString stringId; uint8_t midi; uint16_t take; std::string relativePath; uint64_t frames; std::array<uint8_t,32> sha256; };
std::optional<GuitarString> StringForMidi(uint8_t midi) noexcept;
class Manifest { public: static Manifest LoadTsv(const std::filesystem::path&); const std::vector<SampleRef>& Pool(PerformanceSide,uint8_t) const noexcept;
const std::array<uint8_t,32>& Digest() const noexcept; };
```

- [ ] **Step 1: Write RED mapping tests covering all boundaries and gaps**

```cpp
UG_TEST(mapping_is_sparse_and_exclusive) {
  UG_REQUIRE(StringForMidi(11) == GuitarString::String1);
  UG_REQUIRE(StringForMidi(23) == GuitarString::String1);
  UG_REQUIRE(!StringForMidi(24).has_value());
  UG_REQUIRE(StringForMidi(28) == GuitarString::String2);
  UG_REQUIRE(StringForMidi(74) == GuitarString::String4);
  UG_REQUIRE(!StringForMidi(75).has_value());
}
```

- [ ] **Step 2: Implement only the four canonical inclusive ranges**

Use constant range records `{11,23,S1}`, `{28,40,S2}`, `{45,57,S3}`, `{62,74,S4}`; do not infer octave labels or fill gaps.

- [ ] **Step 3: Write RED manifest tests for independent side/note pools**

Construct a temporary TSV with Right/MIDI16 takes `1,10,16`, Left/MIDI16 takes `1,2`, and another string's same pitch-class name. Assert `Pool(Right,16).size()==3`, sorted take IDs are `1,10,16`, and no Left/other-string entries leak in.
- [ ] **Step 4: Implement strict TSV loading and pool indexing**

Reject bad column counts, invalid side/string enums, MIDI outside the declared string's range, duplicate `(side,midi,take)`, unsafe absolute/parent-traversal relative paths, zero frames, paths longer than 512 UTF-8 bytes, more than 4,096 manifest entries, frames above 480,000 (10 seconds at 48 kHz), and malformed SHA-256. Compute and retain SHA-256 of the exact TSV bytes as `Digest()`, then build fixed `[2][128]` vectors so `Pool()` is lookup-only after construction.

- [ ] **Step 5: Run native core tests at x64 Debug and Release**

Run:
```powershell
cmake --build build --config Debug
ctest --test-dir build -C Debug --output-on-failure
cmake --build build --config Release
ctest --test-dir build -C Release --output-on-failure
```
Expected: mapping/manifest tests PASS in both configurations.

- [ ] **Step 6: Commit**

```bash
git add src/core tests CMakeLists.txt
git commit -m "feat: add strict guitar mapping and manifest pools"
```

---

### Task 4: Implement deterministic real-take variation and the plugin state model

**Files:**
- Create: `src/core/VariationEngine.h`, `src/core/VariationEngine.cpp`, `src/core/PluginState.h`, `tests/test_variation.cpp`
- Modify: `CMakeLists.txt`

**Interfaces:**
```cpp
struct PluginState { PerformanceSide side{PerformanceSide::Left}; float outputDb{0.f}; float humanize{1.f}; uint64_t seed{0x5547545253544154ULL}; };
class VariationEngine { public: static constexpr uint32_t kNoSample = UINT32_MAX; explicit VariationEngine(uint64_t seed); uint32_t NextIndex(PerformanceSide side, uint8_t midi, uint32_t poolSize) noexcept; void Reset(uint64_t seed) noexcept; };
```
- [ ] **Step 1: Write RED variation tests for pool holes and bag boundaries**

```cpp
UG_TEST(variation_uses_every_real_entry_without_immediate_repeat) {
  VariationEngine v(1234);
  std::array<bool, 11> seen{};
  uint32_t last = 99;
  for (int i=0;i<11;i++) { auto x=v.NextIndex(PerformanceSide::Right,16,11); UG_REQUIRE(x<11); UG_REQUIRE(x!=last); seen[x]=true; last=x; }
  UG_REQUIRE(std::all_of(seen.begin(),seen.end(),[](bool x){return x;}));
  UG_REQUIRE(v.NextIndex(PerformanceSide::Right,16,11) != last);
}
```

Also assert Left/MIDI16 and Right/MIDI16 advance independently, `poolSize==0` returns `VariationEngine::kNoSample` without mutating other bags, and changing a pool from 16 entries to 11 resets only that bag before generating any index >=11.

- [ ] **Step 2: Implement fixed-capacity per-side/per-MIDI shuffle bags**

Use a small xorshift64* PRNG seeded from plugin seed plus side/MIDI domain separation. Store arrays sized to the maximum supported pool count (64 for v0.1) and Fisher-Yates shuffle indices `0..poolSize-1`; never allocate in `NextIndex()`.

- [ ] **Step 3: Implement the plain state model and run GREEN**

`PluginState` remains framework-independent and contains only side/output/humanize/seed. Host serialization is implemented once in Task 7 through iPlug2 parameters plus the seed state chunk; do not introduce a second textual state format. Run Debug and Release CTest and verify the same seed reproduces the same variation sequence after `Reset(seed)`.

- [ ] **Step 4: Commit**

```bash
git add src/core tests CMakeLists.txt
git commit -m "feat: add deterministic sample variation and state model"
```

---
### Task 5: Decode float WAVs and build the shared immutable sample cache

**Files:**
- Create: `src/audio/WavFloatReader.h`, `src/audio/WavFloatReader.cpp`, `src/audio/SampleLibrary.h`, `src/audio/SampleLibrary.cpp`, `tests/test_wav_reader.cpp`, `tests/test_sample_library.cpp`
- Modify: `CMakeLists.txt`

**Interfaces:**
```cpp
struct StereoSample { uint32_t sourceRate{48000}; uint64_t frames{}; std::vector<float> interleaved; };
struct LoadedSample { uint16_t take{}; StereoSample audio; };
enum class LibraryStatus : uint8_t { Locating, Loading, Ready, Problem };
struct LibraryError { std::string userMessage; std::string diagnostic; };
class LoadedLibrary;
struct LibraryLoadResult { std::shared_ptr<const LoadedLibrary> library; std::optional<LibraryError> error; };
class WavFloatReader { public: static StereoSample Read(const std::filesystem::path& path); };
class LoadedLibrary { public: const std::vector<LoadedSample>& Pool(PerformanceSide side,uint8_t midi) const noexcept; };
class SampleLibraryCache { public: static LibraryLoadResult Load(const std::filesystem::path& root,const Manifest& manifest); };
```

- [ ] **Step 1: Write RED WAV decoder tests**

Generate in-memory/temp RIFF files for valid stereo 48k float32, truncated `data`, PCM-int format tag 1, mono and 44.1k. Assert only the exact v0.1 format succeeds and decoded float values/frames match known samples.

- [ ] **Step 2: Implement bounded RIFF parsing**

Validate RIFF/WAVE signatures, chunk sizes with overflow checks, `fmt` tag 3, channels 2, rate 48000, bits 32, block align 8, `data` byte count divisible by 8 and frame count <=480,000. Copy interleaved floats after verifying all file offsets stay inside file size.

- [ ] **Step 3: Write RED library tests for manifest/file mismatch**

Use a temp root with two manifest entries. Assert missing file, SHA mismatch, frame-count mismatch and unsafe path each return `library == nullptr`, `error.has_value() == true`, and user message exactly `Sample library not found or incompatible.`; a valid library returns no error and exposes pools whose `LoadedSample.take` values exactly match the manifest, never falling back to another string or side.
- [ ] **Step 4: Implement shared cache ownership outside the audio thread**

Cache key is canonical library root + `Manifest::Digest()` (SHA-256 of exact TSV bytes). Use a process-wide map of `std::weak_ptr<const LoadedLibrary>` protected only during `Load()`/lookup on the loader thread; `LoadedLibrary` itself is immutable after construction. The plugin idle/controller side receives the `shared_ptr<const LoadedLibrary>` before Ready is published; the audio path receives only an atomically published raw pointer whose lifetime is retained by plugin-owned shared pointers and never touches the cache mutex.

- [ ] **Step 5: Prove two instances share the same loaded object**

Load the same fixture root/manifest twice and assert `a.get()==b.get()`. Load a second root or changed manifest and assert a different object. Run under Debug and Release CTest.

- [ ] **Step 6: Commit**

```bash
git add src/audio tests CMakeLists.txt
git commit -m "feat: add validated shared sample library"
```

---

### Task 6: Implement the real-time-safe one-shot voice engine

**Files:**
- Create: `src/audio/VoiceEngine.h`, `src/audio/VoiceEngine.cpp`, `tests/test_voice_engine.cpp`
- Modify: `CMakeLists.txt`

**Interfaces:**
```cpp
struct NoteOn { uint8_t midi; uint8_t velocity; int32_t sampleOffset; };
class VoiceEngine {
public:
  static constexpr uint32_t kMaxVoices = 128;
  void Prepare(double hostRate, uint32_t maxBlockFrames);
  void SetLibrary(const LoadedLibrary* library) noexcept;
  bool NoteOnEvent(const NoteOn&, const PluginState&, VariationEngine&) noexcept;
  void Render(float* outL, float* outR, uint32_t frames) noexcept;
  void ResetSequence() noexcept;
};
```

- [ ] **Step 1: Write RED tests for one-shot behavior and valid repeated notes**

Create two known short stereo samples in a fixture `LoadedLibrary`, trigger the same MIDI note repeatedly, call note-off nowhere, and assert every valid note-on creates non-zero output, unequal known left/right channel fixture values remain unequal in the same orientation (source stereo is preserved), and overlapping tails continue. Include the 11-entry pool case for Right/MIDI16.
- [ ] **Step 2: Write RED sample-rate and humanize tests**

At host rates 44,100 / 48,000 / 96,000 Hz, render a known 48k impulse/tone fixture and assert output duration in seconds stays within 1 ms and the tone frequency stays within 0.2%. With `humanize=0`, onset equals MIDI event offset; with `humanize=1`, deterministic added delay is always in `[0, 0.0008*hostRate]` frames and repeats identically after engine reset with the same state seed/event sequence.

- [ ] **Step 3: Add WDL sinc resampling without render-time allocation**

Compile pinned iPlug2 `WDL/resample.cpp` with `WDL_RESAMPLE_TYPE=float`. Each of 128 voice slots owns a preallocated `WDL_Resampler`; `Prepare()` calls `SetMode(false,0,true,64,32)`, `SetRates(48000,hostRate)` and `Prealloc(2, ceil(maxBlockFrames * 48000.0 / hostRate) + 128, maxBlockFrames)`. `Render()` uses one engine-owned stereo scratch buffer allocated in `Prepare()`, never a per-call vector; if a host unexpectedly supplies more than `maxBlockFrames`, `ProcessBlock()` renders it in fixed-size chunks rather than reallocating.

- [ ] **Step 4: Implement fixed voice slots and deterministic stealing**

A voice stores sample pointer, source frame cursor, remaining start delay, gain, start serial and resampler state. `NoteOnEvent()` reads `LoadedLibrary::Pool(state.side,midi)`, passes its actual `pool.size()` to `VariationEngine`, selects that exact `LoadedSample` index, sets gain to `(velocity/127.0f) * DbToAmp(outputDb)`, derives positive timing jitter from `state.seed + eventSerial`, and uses a free slot or steals the oldest active serial when all 128 are busy.

- [ ] **Step 5: Instrument allocation safety in tests**

In the test executable, wrap global `operator new` with a thread-local counter guard around 10,000 `NoteOnEvent()+Render()` calls after `Prepare()`. Expected: zero allocations while the guard is active; missing-library/unmapped notes return false without touching output memory.

- [ ] **Step 6: Stress repeated MIDI and run GREEN**

Hammer each mapped note for at least 1,000 triggers with pool sizes 11, 14, 15 and 16; call `ResetSequence()` and repeat a fixed event list to assert byte-identical output; assert no valid trigger is dropped, outputs remain finite, and deterministic voice stealing prevents exhaustion silence. Run Debug/Release CTest.

- [ ] **Step 7: Commit**

```bash
git add src/audio tests CMakeLists.txt
git commit -m "feat: add real-time-safe palm mute voice engine"
```

---
### Task 7: Integrate the engine into an iPlug2 VST3 instrument

**Files:**
- Create: `src/plugin/UltimateGuitar.h`, `src/plugin/UltimateGuitar.cpp`, `src/plugin/LibraryController.h`, `src/plugin/LibraryController.cpp`, `src/plugin/config.h`, `resources/resource.h`, `tests/test_library_controller.cpp`
- Modify: `CMakeLists.txt`

**Interfaces:**
- iPlug2 parameters: `kParamPerformance` enum Left/Right, `kParamHumanize` percentage 0-100, `kParamOutput` dB -60..+12.
- `LibraryController` publishes atomic/status snapshots `Locating -> Loading -> Ready|Problem` and hands a fully loaded `shared_ptr<const LoadedLibrary>` to the plugin on the non-audio/idle side.
- VST3 identity: name `UltimateGuitar`, unique ID `'UGtr'`, manufacturer ID `'MZBC'`, channel IO `0-2`, subcategory `Instrument|Sampler`.

- [ ] **Step 1: Write RED controller tests for discovery and recovery**

Test automatic discovery order: saved user-selected root, `%PROGRAMDATA%\UltimateGuitar\Samples\v0.1`, development override env `ULTIMATEGUITAR_SAMPLE_ROOT`; invalid roots become `Problem` with user copy `Sample library not found or incompatible.` and retain diagnostic detail separately.

- [ ] **Step 2: Implement `LibraryController` background loading**

The controller owns one persistent C++17 `std::thread`, a request mutex/condition-variable used only by UI/worker code, and an atomic stop flag. Manifest/file loading happens only on that worker. Ready results are exchanged with C++17 `std::atomic_load/std::atomic_store` free functions for `shared_ptr`; destruction signals stop, notifies and joins. No controller mutex or join is ever touched from the audio callback, and no worker accesses a destroyed plugin/UI object.

- [ ] **Step 3: Create the VST3-only iPlug2 target**

Use:
```cmake
iplug_add_plugin(UltimateGuitar
  SOURCES src/plugin/UltimateGuitar.cpp src/plugin/UltimateGuitar.h src/plugin/LibraryController.cpp src/plugin/LibraryController.h src/plugin/config.h resources/resource.h
  FORMATS VST3
  UI IGRAPHICS
  LINK UltimateGuitarCore
)
```
Set the VST3-relevant `config.h` contract exactly: `PLUG_NAME "UltimateGuitar"`, `PLUG_MFR "Mazbac"`, `PLUG_VERSION_HEX 0x00010000`, `PLUG_VERSION_STR "0.1.0"`, `PLUG_UNIQUE_ID 'UGtr'`, `PLUG_MFR_ID 'MZBC'`, `PLUG_URL_STR "https://github.com/Mazbac/UltimateGuitar"`, `PLUG_EMAIL_STR ""`, `PLUG_COPYRIGHT_STR "Copyright 2026 Mazbac"`, `PLUG_CLASS_NAME UltimateGuitar`, `BUNDLE_NAME "UltimateGuitar"`, `BUNDLE_MFR "Mazbac"`, `BUNDLE_DOMAIN "com"`, `PLUG_CHANNEL_IO "0-2"`, `SHARED_RESOURCES_SUBPATH "UltimateGuitar"`, `PLUG_LATENCY 0`, `PLUG_TYPE 1`, `PLUG_DOES_MIDI_IN 1`, `PLUG_DOES_MIDI_OUT 0`, `PLUG_DOES_MPE 0`, `PLUG_DOES_STATE_CHUNKS 1`, `PLUG_HAS_UI 1`, `PLUG_WIDTH 900`, `PLUG_HEIGHT 560`, `PLUG_FPS 60`, `PLUG_SHARED_RESOURCES 0`, `PLUG_HOST_RESIZE 1`, `VST3_SUBCATEGORY "Instrument|Sampler"`. Do not enable formats/features not in the v0.1 scope.
- [ ] **Step 4: Wire iPlug2 parameters and state chunks to the core model**

Initialize Performance with `InitEnum("Performance",0,{"Left","Right"})`, Humanize with `InitPercentage("Humanize",100.)`, and Output with `InitDouble("Output",0.,-60.,12.,0.1,"dB")`. Override `SerializeState(IByteChunk&) const` to write the deterministic seed first and then call `SerializeParams(chunk)`; override `UnserializeState()` to read seed, call `UnserializeParams`, rebuild `PluginState`, reset `VariationEngine`, and refresh UI.

- [ ] **Step 5: Wire MIDI/audio with no note-off choking**

`ProcessMidiMsg()` handles only note-on velocity >0 by enqueuing `{NoteNumber(), Velocity(), mOffset}` into a fixed-capacity event array consumed by `ProcessBlock()`; note-off and note-on velocity 0 are intentionally ignored for one-shot palm mutes. `OnIdle()` takes completed `shared_ptr<const LoadedLibrary>` results from `LibraryController`, appends them to a plugin-owned lifetime vector (old libraries are retained until plugin destruction), and publishes only the newest raw pointer through `std::atomic<const LoadedLibrary*>`. `ProcessBlock()` atomically loads that raw pointer, passes it to `VoiceEngine::SetLibrary()`, clears stereo outputs, triggers queued note-ons, and renders `nFrames` in prepared-size chunks. Track previous host transport/sample position; on transport stopped->running or sample-position rewind, call `VariationEngine::Reset(state.seed)` and `VoiceEngine::ResetSequence()` before processing events so project replay/offline render starts from the same deterministic sequence. No shared_ptr reference-count transition occurs on the audio thread.

- [ ] **Step 6: Prove plugin build and bundle layout**

Run:
```powershell
cmake --build build --config Release --target UltimateGuitar-vst3
Test-Path 'build\out\UltimateGuitar.vst3\Contents\x86_64-win\UltimateGuitar.vst3'
```
Expected: build succeeds and path test is `True`.

- [ ] **Step 7: Run core/controller regression suite and commit**

```bash
git add src/plugin resources CMakeLists.txt tests
git commit -m "feat: integrate guitar engine as VST3 instrument"
```

---

### Task 8: Build the product UI and sample-library recovery flow

**Files:**
- Create: `src/ui/PluginUI.h`, `src/ui/PluginUI.cpp`, `tests/test_ui_contract.cpp`
- Modify: `src/plugin/UltimateGuitar.cpp`, `src/ui/DesignTokens.h`, `DESIGN_SYSTEM.md`, `resources/resource.h`

**Interfaces:**
- Controls/tags: `kCtrlLibraryStatus`, `kCtrlLocateLibrary`, `kCtrlStringMap`, `kCtrlActivity`, `kCtrlOutputMeter`.
- Primary state copy: `PALM MUTE · DOWN · MIDDLE`; status strings exactly `Locating library…`, `Loading samples…`, `Ready`, `Sample library not found or incompatible.`.
- [ ] **Step 1: Write RED UI-contract tests against tokens/copy/layout constants**

Assert token names/ARGB values are stable (`SignalRed #D71920`, `DeepRed #8A0D12`, `HardwareBlack #0B0D10`, `Charcoal #171A1F`, `Metal #B6BDC7`, `Text #F5F7FA`) and that the four displayed rows exactly label `String 1  B0–B1`, `String 2  E2–E3`, `String 3  A3–A4`, `String 4  D5–D6`.

- [ ] **Step 2: Implement the 900x560 angular instrument layout**

Draw an original asymmetrical red polygon/guitar motif directly with IGraphics vector primitives on the left ~45% of the editor; do not embed Jackson imagery. Top area carries `UltimateGuitar` and `PALM MUTE · DOWN · MIDDLE`; right column contains Performance, Humanize and Output controls; lower strip contains library status, four string ranges, MIDI activity and output meter.

- [ ] **Step 3: Implement status/recovery states**

While `Locating`/`Loading`, disable performance controls only when necessary and show truthful status. On `Problem`, show the exact friendly error plus a `Locate Sample Library` button; clicking calls `IGraphics::PromptForDirectory()` and passes the selected path to `LibraryController::RequestRoot(path)`. Cancel leaves the previous state unchanged.

- [ ] **Step 4: Persist the chosen library root outside the audio thread**

Write UTF-8 `%LOCALAPPDATA%\UltimateGuitar\settings.txt` atomically using `settings.txt.tmp` then rename; single line format `sampleRoot=<absolute path>`. On read, reject relative/nonexistent paths and never treat file contents as executable input.

- [ ] **Step 5: Verify scaling and interaction states**

Open editor at 100%, 125%, 150% Windows display scale and resize within 720x448 through 1350x840 logical equivalents. Inspect normal, Loading, Ready and Problem states; verify labels do not clip, contrast stays readable, controls retain visible focus/hover/disabled states, and there is no generic “black panel with red knobs” appearance.

- [ ] **Step 6: Commit**

```bash
git add src/ui src/plugin DESIGN_SYSTEM.md resources tests
git commit -m "feat: add UltimateGuitar instrument UI and recovery flow"
```

---
### Task 9: Package the validated sample bank and build the FL Studio-compatible Windows installer

**Files:**
- Create: `tools/package_samples.py`, `tests/python/test_package_samples.py`, `scripts/bootstrap-installer.ps1`, `scripts/package.ps1`, `installer/UltimateGuitar.nsi`, `docs/THIRD_PARTY_NOTICES.md`
- Modify: `.gitignore`, `scripts/verify.ps1`, `.project/manifest.json`, `ARCHITECTURE.md`, `DECISIONS.md`

**Interfaces:**
- Stable installed VST path: `%ProgramFiles%\Common Files\VST3\UltimateGuitar.vst3` (FL Studio-compatible system VST3 path).
- Stable content root: `%PROGRAMDATA%\UltimateGuitar\Samples\v0.1` (read-only product content shared across users).
- Stable content layout: `manifest.tsv` plus `audio/{L|R}/s{1..4}/m{midi}/t{take:02}.wav`.
- Installer tool: NSIS 3.12, fetched only as a build dependency; NSIS is not required on the end-user machine.

- [ ] **Step 1: Write RED package-layout and integrity tests**

Create a tiny raw-library fixture + scanner manifest, run `package_samples.py`, then assert only manifest-listed files are copied, every output path matches the stable layout, the release manifest contains rewritten paths, frame/hash metadata is preserved, and a source SHA mismatch aborts before producing a final package directory.

- [ ] **Step 2: Implement transactional sample packaging**

Build into `<dest>.staging`, verify every source SHA while copying, emit the rewritten manifest last, then atomically rename staging to the final version directory. On any failure remove only the staging directory; never modify the user's raw recording tree.

- [ ] **Step 3: Add pinned NSIS 3.12 bootstrap**

`scripts/bootstrap-installer.ps1` downloads the official `nsis-3.12.zip` SourceForge release into ignored `.deps/nsis-3.12`, verifies SHA-256 `56581f90db321581c5381193d796fffcf2d24b2f8fed2160a6c6a3baa67f2c4f`, verifies the extracted `makensis.exe /VERSION` reports `v3.12`, and refuses a hash/version mismatch. Record NSIS license/attribution in `docs/THIRD_PARTY_NOTICES.md`.
- [ ] **Step 4: Create the FL Studio-compatible NSIS installer/uninstaller**

Use `SetCompressor /SOLID zlib` and `RequestExecutionLevel admin` because FL Studio documents `C:\Program Files\Common Files\VST3` / `C:\Program Files\VST3` as its required Windows VST3 scan locations. Installer copies the bundle to `$COMMONFILES64\VST3\UltimateGuitar.vst3`, sample content to `$COMMONAPPDATA\UltimateGuitar\Samples\v0.1`, writes an uninstaller under `$COMMONAPPDATA\UltimateGuitar\Uninstall.exe`, and refuses to install if packaged manifest/audio is missing. Do not modify FL Studio settings or registry plugin paths.

- [ ] **Step 5: Define uninstall ownership precisely**

Uninstaller removes only the installed `UltimateGuitar.vst3`, product-owned `%PROGRAMDATA%\UltimateGuitar\Samples\v0.1`, and its uninstaller. Per-user `%LOCALAPPDATA%\UltimateGuitar\settings.txt` is explicitly treated as user preference data and preserved across uninstall/reinstall; a future in-product reset may delete it deliberately. The uninstaller must never delete raw recordings or arbitrary alternate library folders. Remove now-empty machine-wide product directories only after child deletion succeeds.

- [ ] **Step 6: Build a real local package from the 1,655-WAV library**

Run `tools/library_manifest.py` against the verified raw root, `tools/package_samples.py` into `build/package/Samples/v0.1`, copy `build/out/UltimateGuitar.vst3` into staging, then run NSIS to produce `build/release/UltimateGuitar-0.1.0-win64.exe`.

- [ ] **Step 7: Verify clean UAC install/uninstall/reinstall**

Install the candidate with the expected one-time UAC elevation, assert global VST3/ProgramData content paths and per-user settings behavior, launch a plugin scan later in Task 10, uninstall with elevation, assert product-owned installed paths are gone and raw recordings remain byte-identical, then reinstall and assert paths restore correctly.

- [ ] **Step 8: Run packaging tests and commit**

```bash
git add tools scripts installer tests/python docs/THIRD_PARTY_NOTICES.md .gitignore .project/manifest.json ARCHITECTURE.md DECISIONS.md
git commit -m "build: package samples and add Windows installer"
```

---
### Task 10: Validate the real VST3 in Steinberg Validator and FL Studio, then assemble release evidence

**Files:**
- Create: `tools/make_smoke_midi.py`, `tests/python/test_make_smoke_midi.py`, `docs/release/FL_STUDIO_SMOKE.md`, `QUALITY_EVIDENCE.md`, `RELEASE_NOTES.md`
- Modify: `scripts/verify.ps1`, `.project/manifest.json`, `STATUS.md`, `PLAN.md`, `RISKS.md`, `DECISIONS.md`, `ARCHITECTURE.md`

**Interfaces:**
- Smoke MIDI contains every mapped MIDI note once, then rapid repeated-note sections for representative 11/14/15/16-entry pools, on MIDI channel 1.
- Steinberg validator command contract: `validator.exe -e <path-to-UltimateGuitar.vst3>`; zero exit is required.
- FL Studio pass requires load, playback, state restore and offline render from the installed release candidate.

- [ ] **Step 1: Write RED tests for deterministic smoke-MIDI generation**

Parse the generated Standard MIDI File in the test and assert note-on values equal the 52-note canonical set `{11..23,28..40,45..57,62..74}` before the stress section; assert stress sections contain at least 64 hits each for MIDI 16 (11-take pool), MIDI 48 (14-take pool), MIDI 29 (15-take pool) and MIDI 11 (16-take pool).

- [ ] **Step 2: Implement a stdlib-only SMF type-0 generator**

Use 480 PPQ, fixed tempo 120 BPM, velocity 100, 120-tick note lengths and 60-tick gaps. Emit valid variable-length delta times, one track, End-of-Track meta event, and write `build/fixtures/ultimate-guitar-smoke.mid` deterministically.

- [ ] **Step 3: Build Steinberg's pinned validator and run extensive validation**

```powershell
$sdk='.deps\iPlug2\Dependencies\IPlug\VST3_SDK'
cmake -S $sdk -B build\vst3-validator -A x64 -DSMTG_ENABLE_VST3_PLUGIN_EXAMPLES=OFF -DSMTG_ENABLE_VSTGUI_SUPPORT=OFF -DSMTG_CREATE_PLUGIN_LINK=0
cmake --build build\vst3-validator --config Release --target validator
$validator=(Get-ChildItem build\vst3-validator -Recurse -Filter validator.exe | Select-Object -First 1).FullName
& $validator -e (Resolve-Path 'build\out\UltimateGuitar.vst3')
if($LASTEXITCODE -ne 0){ throw 'VST3 validator failed' }
```
- [ ] **Step 4: Install the exact candidate and make FL Studio discover it**

Run the produced `UltimateGuitar-0.1.0-win64.exe` as the current user. Through Desktop Commander/native UI automation, launch FL Studio, open Manage plugins, run a verified scan, and confirm one `UltimateGuitar` VST3 entry resolves from the system `C:\Program Files\Common Files\VST3` path used by the installer. Do not ask the user to click or relay logs.

- [ ] **Step 5: Exercise the golden playback journey in FL Studio**

Create a blank project, insert UltimateGuitar, wait for `Ready`, import `build/fixtures/ultimate-guitar-smoke.mid`, route it to the plugin, and play through the entire fixture twice on Left then twice on Right. Confirm every mapped section produces visible meter/audio activity, no valid repeated-note section becomes silent, and gap notes tested manually (24,27,41,44,58,61,75) remain silent.

- [ ] **Step 6: Exercise persistence and offline render**

Set Performance=Right, Humanize=37%, Output=-3.0 dB; save the project, close FL Studio, reopen the project, and assert the same values and Ready library state. Render the smoke sequence to WAV, verify the output file is non-empty/finite and contains activity in every expected note window, then repeat one render to prove deterministic audio bytes for the same saved seed/state.

- [ ] **Step 7: Exercise recovery state with a deliberately unavailable library**

Temporarily rename only the installed `Samples\v0.1` directory, reopen the plugin and confirm the friendly Problem state plus `Locate Sample Library`; point it to the verified raw-development root or restored packaged root, confirm Loading -> Ready, then restore the installed layout. No raw/internal exception text may appear as primary UI copy.

- [ ] **Step 8: Capture visual/product evidence**

Capture screenshots of Ready and Problem states at normal size plus one high-DPI/scaled state. Review against `DESIGN_SYSTEM.md`: Ferrari-red/angular identity is obvious, Jackson marks/assets are absent, hierarchy remains readable, controls/statuses are coherent, and there is no clipped or generic framework-default UI.
- [ ] **Step 9: Run full engineering/security verification from clean state**

Run `scripts/verify.ps1` from the working tree, then clone the candidate commit into a fresh temporary directory and repeat bootstrap/configure/Release build/tests without copying `.deps`, `build`, raw WAVs or local settings. Scan tracked + relevant untracked candidate files for credential/private-key patterns and run dependency/license review against only the pinned iPlug2, VST3 SDK, WDL and NSIS dependencies. Any high/critical security finding blocks progression.

- [ ] **Step 10: Complete quality evidence before changing lifecycle to VERIFY**

Create `QUALITY_EVIDENCE.md` from the repository template with actual commit SHA, commands/results, validator output location, FL Studio project/render evidence, screenshots, install/uninstall/reinstall results, sample-library audit, supported environment, accessibility/input review and explicit non-applicable items. It must contain zero unresolved template placeholder markers and no invented evidence.

- [ ] **Step 11: Perform the fresh-eyes challenger review**

Re-read the spec and design system without using implementation assumptions; actively try to reject the candidate for silent notes, wrong-string mapping, non-determinism, library-path fragility, realtime allocations, generic UI, bad scaling, host-state failure, installer residue or missing evidence. Fix every reproducible defect with a failing regression test first; record fixes and remaining blockers in `QUALITY_EVIDENCE.md`.

- [ ] **Step 12: Advance lifecycle only when evidence is complete**

Set manifest/STATUS lifecycle to `VERIFY`, regenerate/read full context pack, run context integrity. If every Definition-of-Done gate is green, set `RELEASE_CANDIDATE`, regenerate/read the release context pack and rerun the complete gate. Do not mark `RELEASED` merely because the installer exists.

- [ ] **Step 13: Freeze candidate metadata and commit**

Write `RELEASE_NOTES.md` for `0.1.0` with scope/non-goals and compute SHA-256 for `build/release/UltimateGuitar-0.1.0-win64.exe`. Record the tested source revision + installer hash in `QUALITY_EVIDENCE.md` and `STATUS.md`, then:
```bash
git add tools tests scripts docs/release QUALITY_EVIDENCE.md RELEASE_NOTES.md .project/manifest.json STATUS.md PLAN.md RISKS.md DECISIONS.md ARCHITECTURE.md
git commit -m "test: verify UltimateGuitar v0.1 release candidate"
```

---

## Plan completion contract
Execution is complete only when Tasks 1-10 are checked, each task's tests passed before its commit, the real 1,655-WAV bank was validated/package-tested without entering Git, Steinberg Validator passes, FL Studio golden journeys pass, the installer lifecycle passes, repository/context/CI gates are green and current `QUALITY_EVIDENCE.md` has no unresolved release blocker.

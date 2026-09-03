# Decision Log

Record only durable decisions that future chats must understand. Do not use this as a transcript.

## D-001 — Repository is the source of truth
Status: accepted
Decision: Chat history is disposable; project state, constraints and durable decisions live in Git.
Reason: normal ChatGPT conversations can end or be replaced without warning.

## D-002 — User is product owner, not technical intermediary
Status: accepted
Decision: ChatGPT owns technical execution and uses available tools before requesting user action.
Reason: manual relay work is slow, error-prone and defeats autonomous delivery.

## D-003 — Template is stack-neutral
Status: accepted
Decision: choose technology after product discovery instead of embedding one app stack in the template.
Reason: one reusable template must support different software classes without inherited technical debt.

## D-004 — Independent gates over self-assessment
Status: accepted
Decision: CI, tests, scans and reproducible checks decide readiness; ChatGPT's confidence does not.
Reason: deterministic evidence is more reliable than conversational claims.

## D-005 — Free private-repo main guard
Status: accepted
Decision: activate a versioned local pre-push hook that rejects direct pushes to `main`/`master`; continue using PR + green CI by policy.
Reason: GitHub returned HTTP 403 for both rulesets and classic branch protection on this private repository, requiring GitHub Pro or public visibility. Repository visibility will not be changed implicitly.
Limitation: local hooks are defense-in-depth, not a substitute for server-side enforcement; a capable actor/tool can bypass them. If server-side protection becomes available, require PRs and the stable CI checks there.


## D-006 — Session invariance is the primary continuity invariant
Status: accepted
Decision: replacement chats must reconstruct substantially the same durable project meaning and next priority from repository state without prior transcript dependency.
Reason: repo-first memory is only useful if different sessions converge on the same project interpretation.

## D-007 — Context has explicit source precedence
Status: accepted
Decision: live technical evidence outranks machine-readable state, which outranks durable contracts, execution memory and chat history. Conflicts are reconciled and persisted.
Reason: stale documentation or chat must not override reality silently.

## D-008 — Product experience is a release discipline
Status: accepted
Decision: install/setup/onboarding/daily use/errors/recovery/update/uninstall and other applicable lifecycle surfaces are product quality, not optional polish.
Reason: technically correct software can still be consumer-hostile or visibly immature.

## D-009 — The template owns the design process, projects own their design language
Status: accepted
Decision: require reference-class/platform research, design direction, tokens, component strategy and durable project design sources without imposing one universal component library or visual style.
Reason: cross-chat consistency requires a stable design source, while different product classes and platforms require different design languages.

## D-010 — Required context is resolved deterministically
Status: accepted
Decision: material work uses `.project/context-map.json` + `.automation/context-pack.mjs` to compile the required lifecycle/task/manifest-referenced sources; agents read the generated pack through its completion marker rather than choosing files from memory.
Reason: a repository can contain the right rules and still fail if a model silently skips a relevant source or tool output truncates before EOF.

## D-011 — Quality readiness requires durable evidence, not self-attestation
Status: accepted
Decision: lifecycle VERIFY and later require a manifest-referenced tracked quality-evidence source with complete current results. Mandatory quality policy flags are schema-locked to true.
Reason: a boolean such as `requireVisualReviewForUI: true` proves policy intent but does not prove what was actually reviewed.

## D-012 — Fresh-eyes challenger review is mandatory
Status: accepted
Decision: verification includes an adversarial challenger pass whose goal is to find reasons the candidate should not ship, including hidden assumptions, generic AI/default patterns, missing states, platform/lifecycle gaps and evidence omissions.
Reason: implementation authors/models are vulnerable to familiarity and confirmation bias; independent/fresh review complements deterministic tests.

## D-013 — The template defines proof dimensions, projects define applicable answers
Status: accepted
Decision: keep v3 stack/product-neutral. The template requires intent, component/terminology consistency, realistic-state stress, platform behavior and evidence, while each derived project defines concrete surfaces, breakpoints/windowing, icon system, tokens and applicable environments.
Reason: hard-coding QuickShelf/SaaS-specific design choices would reduce reuse and confuse examples with universal principles.

## D-014 — v0.1 is a native Windows VST3 instrument
Status: accepted
Decision: First release targets Windows x64 VST3 with FL Studio as the primary host and implements only Palm Mute / Downstroke / Middle.
Reason: this directly replaces the current Sforzando workflow with the smallest independently useful native instrument.

## D-015 — Use iPlug2 + VST3 for the first native implementation
Status: accepted
Decision: Use pinned iPlug2 with its CMake/out-of-source pattern and the MIT-licensed VST3 SDK. Keep application/domain code behind project-owned boundaries.
Reason: iPlug2 supports the required Windows VST3 target with a liberal license and avoids paid framework licensing while remaining much lighter than HISE.

## D-016 — MIDI mapping is sparse and string-exclusive
Status: accepted
Decision: MIDI 11-23 maps only to String 1, 28-40 only to String 2, 45-57 only to String 3 and 62-74 only to String 4. Gaps are intentionally silent. Left/Right performance banks never mix.
Reason: this is the verified physical/sample-library structure and fixes prior accidental cross-string mapping.

## D-017 — Variation uses real available samples, never nominal take slots
Status: accepted
Decision: Each side+note has an independent shuffled bag built from manifest entries that actually exist. Missing/non-contiguous take numbers do not create placeholders or silence.
Reason: the real library already contains valid 11/14/15-take pools; fixed 16-position assumptions caused the failure class the native plugin must eliminate.

## D-018 — Raw sample audio stays out of ordinary Git history
Status: accepted
Decision: Git stores code, manifest/schema metadata, reports and tiny fixtures. The private raw WAV library remains an external product asset and release packaging creates a stable installed sample layout.
Reason: the current single articulation is already about 0.5 GiB and future articulations will grow substantially.

## D-019 — v0.1 preloads through a shared process cache
Status: accepted
Decision: Load/decode the validated bank off the audio thread into a process-wide immutable cache shared by plugin instances. Palm mutes remain one-shot and note-off does not choke them.
Reason: the current bank is manageable in memory once, while two normal Left/Right instances should not duplicate roughly 0.5 GiB each. This is simpler and safer than introducing disk streaming in the first release.

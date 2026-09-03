# Risk Register

| Risk | Impact | Required mitigation |
|---|---|---|
| Chat context loss | Work is repeated or assumptions drift | Repo-first deterministic resume procedure + current durable state |
| Cross-chat semantic drift | Different sessions build different interpretations of the same product | Session-invariance contract, durable design/product sources, context-integrity tests |
| Docs/machine/code divergence | New session trusts stale or contradictory state | Source precedence, reconciliation, manifest/schema/context-integrity gates |
| Premature "done" claim | Broken or immature release reaches user | Hard Definition of Done + independent CI + professional experience review |
| UI/design-direction drift | Product becomes visually inconsistent or changes personality across chats | Manifest-referenced design system, tokens, product component layer, visual regression/review |
| Generic AI UI | Coherent but visibly less mature than professional reference products | Reference-class/platform research and explicit maturity review before release |
| Component-library leakage/lock-in | Vendor styling/API defines product identity and makes replacement costly | Explicit component strategy; product abstractions over proven primitives where practical |
| Consumer lifecycle regression | Install/setup/update/uninstall works technically but becomes confusing or fragile | Product Experience Standard + golden lifecycle journeys |
| Security added late | Structural vulnerabilities | Threat model during DEFINE; security tests during every slice |
| Tool-driven accidental change | Data/code loss | Branches, small reversible changes, backups/migrations, rollback |
| Dependency/supply-chain compromise | Build/runtime compromise | Minimal dependencies, lockfiles, scanning, pinned CI actions |
| Local-only success | Release fails on another machine | Clean-install/reproducible build test |
| Over-automation via pixel clicking | Fragile tests/actions | API/CLI/semantic UI automation before coordinate input |
| Scope creep | Endless project / fragile architecture | First useful release + explicit backlog + impact analysis |
| User becomes relay operator | Slow/error-prone development | Exhaust ChatGPT-accessible tools before escalation |
| Private repo lacks server-side branch protection on current GitHub plan | Direct main updates cannot be blocked by GitHub itself | Versioned local pre-push guard + PR/CI policy; enable server-side rules if later supported |

| Required context silently skipped/truncated | Agent follows only part of repository contract | Deterministic context map/compiler, hashes, scoped packs and mandatory completion marker |
| Review self-attestation | "Reviewed" claim exists without proof of surfaces/states exercised | Tracked quality evidence required at VERIFY + challenger status + CI lifecycle enforcement |
| AI/default UI leakage | Functional interface contains arbitrary repetition, decoration, geometry or framework-default behavior | Surface-intent/component contracts + AI-default/removal audit + reference-class challenger review |
| Happy-path/demo-data blindness | UI/experience fails with long, empty, excessive, failed or degraded real-world states | Explicit adversarial content/state/environment testing and regression evidence |
| Mandatory quality gate disabled in derived project | Project weakens template promise while remaining schema-valid | Schema locks non-negotiable quality policy fields to true |

New material risks must be added when discovered and closed only with evidence.
## UltimateGuitar v0.1 project-specific risks

| Risk | Impact | Required mitigation |
|---|---|---|
| Fixed 16-take logic reappears | Valid repeated notes become silent on incomplete pools | Manifest enumerates real files; scanner/variation tests retain historical 11-entry plus current 14/15-take non-contiguous pools |
| String zones overlap or borrow samples | Wrong physical string/timbre plays for a MIDI note | MIDI-number mapping is canonical and unit-tested as one-string-only with intentional silent gaps |
| Per-instance full sample duplication | Normal Left+Right workflow consumes excessive RAM | Process-wide immutable shared cache keyed by library version/root |
| Sample I/O or allocation reaches audio thread | Clicks, dropouts or host instability | Background loading; immutable ready buffers; instrumentation/tests for real-time path constraints |
| Host sample rate differs from 48 kHz recordings | Pitch/duration errors | Explicit resampling path and 44.1/48/96 kHz tests |
| Sample library path changes or packaging differs from raw tree | Plugin loads but cannot find audio | Stable release layout, manifest-relative paths, automatic discovery and Locate Sample Library recovery |
| Future articulations make preload architecture too large | Startup/RAM becomes unacceptable | Keep SampleLibrary boundary streaming-ready; defer streaming until measured bank size/performance requires it |
| Windows toolchain discovery depends on IDE registration | Build bootstrap can falsely report no compiler even when Build Tools exist | Detect VS2019/2022/2026 from filesystem, enter VsDevCmd.bat, use Ninja, and keep CI as independent Windows evidence |
| Internal `UltimateGuitar` name conflicts with an existing public brand | Public distribution may create trademark/confusion risk | Treat as internal codename for v0.1; require explicit public naming/trademark review before external release |

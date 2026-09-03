# UltimateGuitar v0.1 Design System

## Product character
- Desired feeling: aggressive, precise, modern metal instrument; expressive without looking like an amp simulator.
- Primary context: compact native VST3 editor used inside FL Studio while programming guitar MIDI.
- Information density: compact studio-tool density; one glance should reveal readiness, performance side and the playable string zones.
- Interaction principles: immediate, deterministic, low-friction; status and recovery are more important than decorative controls.

## Brand and creative input
- Internal identity: `UltimateGuitar` is the repository/product codename for v0.1, not an approved public commercial brand.
- User reference: Jackson JS32T Warrior Ferrari Red for energy, angularity and red/black contrast only.
- Do not use Jackson logos, copied photography, traced body outlines or protected brand expression.
- Durable preference: Ferrari-red hero geometry, black hardware-like surfaces, sharp asymmetry and restrained metallic highlights.
- Avoid the generic “black plugin with a few red knobs” result.

## Reference class
- Professional guitar instruments/amp suites informed compact performance-control density and familiar control labeling.
- FL Studio host conventions informed resizable third-party plugin behavior and DPI-safe presentation.
- Adopt: clear parameter grouping, readable status, restrained control count, obvious selected states.
- Avoid: deep amp-chain navigation, faux rack hardware, unreadable micro-labels and decorative panels that do not help playback.
- Differentiation: one original angular-guitar visual motif makes this feel like a playable sampled instrument rather than an effects suite.

## Platform conventions
- Target: Windows x64 VST3 hosted primarily in FL Studio.
- Default editor size: 900x560 logical pixels; host resizing is supported.
- Supported review range: approximately 720x448 through 1350x840 plus Windows/host scaling at 100%, 125% and 150%.
- Preserve normal mouse, wheel, keyboard focus and host window behavior; do not create custom window chrome.
- No intentional platform deviation beyond the original instrument-themed drawing inside the plugin editor.

## Foundations
- Canonical code tokens: `src/ui/DesignTokens.h`.
- Colors: SignalRed `#D71920`, DeepRed `#8A0D12`, HardwareBlack `#0B0D10`, Charcoal `#171A1F`, Metal `#B6BDC7`, Text `#F5F7FA`.
- Typography: clear condensed/technical hierarchy when a bundled permissive font is later justified; otherwise use a reliable UI sans fallback with no dependency on a proprietary system font.
- Spacing: 4px base rhythm; primary gaps 8/12/16/24px, with compact control interiors.
- Radius/elevation: mostly sharp or 2-4px corners; depth comes from value separation and thin metallic edges, not soft card shadows.
- Iconography: original simple vector line/glyph language; text accompanies ambiguous actions such as Locate Sample Library.
- Motion: minimal; state transitions may fade briefly but no continuous decorative animation.

## Surface intent and hierarchy
- Primary job: confirm the instrument is Ready and make the selected Left/Right performance playable immediately.
- Top hierarchy: `UltimateGuitar` identity plus `PALM MUTE · DOWN · MIDDLE` articulation identity.
- Main controls: Performance, Humanize and Output; no unrelated parameters in v0.1.
- Supporting information: library status and four canonical string ranges.
- Recovery is promoted only in Problem state; diagnostics remain secondary and technical paths are not normal-facing copy.

## Component strategy and contracts
- Foundation: iPlug2 IGraphics drawing/input primitives wrapped by UltimateGuitar-owned layout and control code.
- Product boundary: feature code consumes named tokens/control contracts instead of scattering colors, sizes or host-framework defaults.
- Equivalent controls share label position, hit-target size, value typography and hover/focus/disabled/selected treatment.
- Minimum interactive target is approximately 32 logical px in compact desktop use; critical recovery actions are larger and text-labeled.
- Focus must remain visible against both red and black surfaces; disabled state must change more than hue alone.
- New one-off geometry requires a product reason and a design-system update before broad reuse.

## Content and terminology
- Canonical labels: `Performance`, `Left`, `Right`, `Humanize`, `Output`, `Locate Sample Library`.
- Canonical statuses: `Locating library…`, `Loading samples…`, `Ready`, `Sample library not found or incompatible.`
- String rows: `String 1  B0–B1`, `String 2  E2–E3`, `String 3  A3–A4`, `String 4  D5–D6`.
- User copy stays musical and task-oriented; raw paths, exception names and framework terminology belong only in diagnostics.
- Long paths/errors must wrap or truncate safely without changing primary layout hierarchy.

## UX patterns and state behavior
- Normal/Ready: controls enabled, selected performance unmistakable, string map visible but secondary.
- Locating/Loading: truthful progress copy; no fake percentages; playback is not presented as ready.
- Problem: friendly error plus one `Locate Sample Library` action; cancellation preserves previous state.
- Success after recovery: transition back to `Ready` without a modal success ceremony.
- Empty/excessive content is limited by fixed v0.1 controls; diagnostics/path content receives stress testing.
- Resize/scaling: preserve hierarchy and hit targets; motif may crop/simplify before controls or labels become unreadable.

## Accessibility and verification
- Keyboard-operable controls where iPlug2 permits; visible focus and no color-only essential state.
- Text/status contrast targets WCAG-AA-like desktop readability even though the product is a native plugin, not a web app.
- Reduced-motion preference is respected by keeping motion non-essential and minimal.
- Before release inspect Ready, Loading and Problem at normal size plus 125% and 150% scaling and at minimum supported editor size.
- Challenger review must specifically reject clipped labels, framework-default controls, generic card layouts, weak selected states and decorative elements with no musical/status purpose.

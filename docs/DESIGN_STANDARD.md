# Product Design and UI/UX Standard

Applies to any project with a user interface. The template defines a professional design process; each derived project owns its own design language.

## Required design sequence
Do not begin broad screen styling from an unconstrained model preference. Work in this order:
1. Product intent and primary user tasks.
2. Current reference-class and target-platform research.
3. Brand/creative inputs and explicit user preferences.
4. Information architecture, surface intent and critical journeys.
5. Product design direction and interaction principles.
6. Design tokens, component architecture and component contracts.
7. Reusable UX patterns, terminology and state behavior.
8. Screens/flows and responsive/windowing/adaptive behavior.
9. AI-default/removal audit and realistic-content stress review.
10. Visual, accessibility, platform-fit and challenger verification.

## Reference-class research
Identify credible professional products that solve comparable problems and authoritative platform guidance. Study navigation, hierarchy, density, terminology, setup, errors, settings, keyboard/touch patterns and lifecycle experience. Extract principles; never copy protected brand expression or assume competitor behavior is correct without evaluating product fit.

## Brand and creative input
The user may provide a complete brand system, only a logo/color, screenshots, websites, imagery, likes/dislikes or raw natural-language impressions. Treat these as design signals. Translate them into a coherent software design language instead of literally reproducing references or applying a brand color everywhere.
## Project design source of truth
Before broad UI implementation, create the manifest-referenced project design system (normally `DESIGN_SYSTEM.md`). It records product character, brand inputs, reference-class conclusions, platform conventions, surface intent/hierarchy, typography, color, spacing, radius/elevation, iconography, motion, component strategy/contracts, terminology, recurring UX patterns, content-stress behavior, accessibility expectations and durable explicit preferences.

A new session reads this source through the deterministic context pack before changing UI. It may not introduce a conflicting design direction merely because another style appears attractive. Material design changes update the design source and rationale first.

## Surface intent and hierarchy
Every material surface has a primary user job. Identify it before arranging cards, panels, controls or metrics. The primary action/information should be obvious; unrelated information and decoration must justify their presence.

Do not add functionality or visual material merely because space exists. When a second user intent becomes important, represent it deliberately through navigation, disclosure or another appropriate pattern rather than diluting the primary surface.

## Design tokens
Use a canonical token source appropriate to the stack for color, typography, spacing, radius, elevation, motion and breakpoints where applicable. Feature code should consume tokens rather than inventing one-off values. New tokens require a system-level reason, not local convenience.

## Component strategy and contracts
Do not hard-code one component library into this template. Select foundations per project using platform fit, accessibility maturity, maintenance, dependency risk, component coverage, customization, performance and brand flexibility.

Prefer: **reuse proven interaction behavior; own the product design**. When practical, wrap third-party primitives behind product components so feature code depends on the product design system rather than a vendor's visual API.

Equivalent controls/actions must share the applicable product contract: geometry, spacing, radius family, typography, icon treatment, states, terminology and action hierarchy. A deviation requires a product/platform reason rather than local preference.
## Content, color, icons and motion
Use concise, consistent terminology. The same product action should not arbitrarily change verbs across surfaces. Color, icons and motion must communicate hierarchy, status, meaning, relationship, progress or completion; purely decorative use requires an explicit design reason.

Use one coherent icon language appropriate to the product/platform. Do not substitute emoji or ad-hoc symbols for product icons merely because they are convenient. Ambiguous icon-only actions require accessible names/tooltips or text where needed.

## Product patterns
Components alone do not create coherent UX. Define reusable patterns for recurring flows such as forms, save/autosave, destructive actions, undo, search/filtering, permissions, connection setup, import/export, progress, empty states, recovery, settings, onboarding, updates and unsaved changes when applicable.

## Required states and platform fit
Every interactive flow deliberately handles normal, hover/focus/disabled, loading, empty, validation, success, error, timeout/offline and destructive states when applicable. Follow target-platform conventions for windowing, navigation, input, menus, permissions, notifications and system integration unless a documented product reason justifies deviation.

Top-level windows/pages/surfaces must have deliberate sizing/adaptation behavior. Resizability, breakpoints, orientation, zoom/text scaling and maximum/minimum states are product decisions where applicable, not accidental framework defaults.

## Realistic-content and stress design
Do not validate only tidy demo content. Exercise empty, minimal, normal, excessive and awkward/long realistic content, plus localization expansion when relevant. Verify loading, error and recovery states that creators do not normally see during happy-path development.
## AI-default / removal audit
Assume first-pass generated UI contains unexamined defaults. Before maturity review, challenge repetition, unnecessary cards/panels, arbitrary accents, decorative effects, inconsistent component geometry, duplicate information, vague icons, excessive controls and terminology drift.

For each material element ask whether it helps the user complete the surface's job or understand state. Remove or simplify elements that do neither. The goal is not minimalism for its own sake; it is intentional information and interaction.

## Accessibility and responsive quality
Keyboard navigation, visible focus, semantic structure, contrast, target sizes and reduced-motion behavior are first-class requirements. Web products target WCAG 2.2 AA unless stricter requirements apply. Responsive/adaptive behavior is designed deliberately rather than patched after desktop completion.

## Visual evidence
For web UI, use semantic automation to exercise critical flows and capture current representative states across the project's declared environments. Inspect browser console/network failures and maintain visual regression baselines once stable. Other platforms use the strongest available semantic/test interface plus screenshots or equivalent visual evidence.

Evidence must cover material surfaces and high-risk states, not only the easiest default screen. Screenshots support visual judgment; they do not replace semantic/state assertions.

## Professional maturity and challenger review
ChatGPT visually inspects final surfaces against the project design system, declared review coverage, platform and chosen reference class. Review hierarchy, density, alignment, typography, component consistency, terminology, platform fit, microcopy, stress states and interaction polish.

Then perform a fresh-eyes challenger pass whose goal is to find reasons the candidate should not ship. Fix unexplained gaps before release and record the evidence in the manifest-referenced quality evidence.

A UI feature is not done merely because it functions, passes automation or looks internally consistent. It must preserve the project design system and withstand evidence-based maturity review.

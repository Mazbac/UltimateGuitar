# Professional Product Experience Standard

Applies to every user-facing product surface. UI polish alone is insufficient: installation, first use, daily use, failure recovery, updates and removal are part of the product where applicable.

## Quality target
The product should not expose avoidable implementation complexity or feel materially less mature than credible professional products in its reference class. Professional parity means comparable care, coherence and platform fit, not visual copying.

## Experience principles
- Optimize time to first useful outcome.
- Choose safe, sensible defaults instead of asking users to configure technical details the product can infer or own.
- Use progressive disclosure: common paths stay simple; advanced control remains available when justified.
- Respect target-platform conventions unless a deliberate documented product reason justifies deviation.
- Prefer familiar terminology and interactions over novelty for its own sake.
- Provide immediate, truthful feedback for actions and background work.
- Design recoverable errors and avoid dead ends.
- Preserve user intent and data across restart, update and transient failure where the product requires it.
- Do not expose stack traces, raw protocol errors, ports, internal IDs or implementation jargon to ordinary users unless the product is explicitly developer-facing.

## Lifecycle journey
For each applicable product, deliberately design and verify: obtain/distribution, install, first launch, permissions, setup/onboarding, first value, normal use, settings/advanced use, failure/recovery, update/migration, repair/reset, uninstall/data cleanup and reinstall.

## Setup and onboarding
Onboarding exists only when it reduces uncertainty or enables required setup. Keep it brief, contextual and skippable when the product can remain usable without it. Explain benefits and consequences rather than implementation details. Never use onboarding to compensate for unclear core navigation.

## Defaults and permissions
Defaults should serve the primary user safely. Ask for permissions at the moment their value is clear, request the narrowest permission that works, explain denials and recovery, and never require elevated/admin access merely for developer convenience.

## Feedback, progress and errors
Long-running work must not look frozen. Show progress or honest indeterminate activity, permit cancellation when safe, and preserve enough state to recover. Error messages state what happened in user terms, what was affected and what the user or product can do next.

## Content design
Use concise, consistent, task-specific language. Actions describe their result (`Create project`, `Remove account`) rather than generic labels (`Submit`, `OK`) when context benefits. Destructive confirmations name the object and consequence. Internal exception text belongs in diagnostics, not primary UI.

## Performance as experience
Set project-appropriate expectations for launch, interaction latency, background work and resource usage. Measure critical paths where performance can affect usability. Performance regressions that make an accepted journey materially worse are product regressions.

## Install, update and uninstall
Consumer-facing install paths must avoid unnecessary command-line steps, elevation, reboots and hidden prerequisites. Product identity, version and publisher/distribution trust must be correct for the platform. Updates preserve supported user data and configuration, migrations are tested, and uninstall removes product-owned runtime artifacts while handling user data according to explicit product policy.

## Golden journeys
Every project defines a small set of observable end-to-end journeys representing real user value. Include, when applicable: new-user first value, returning-user primary task, failure/recovery, upgrade/migration and uninstall/reinstall. Verification tooling follows the platform; the journey contract is platform-neutral.

## Real-world and stress experience
Do not judge experience only with tidy data and happy paths. Exercise realistic long/awkward content, empty/minimal/excessive data, permission denial, cancellation, failures, restart/resume and degraded dependencies where applicable. A user-visible state that can realistically occur is part of the product even when developers rarely encounter it.

## Professional experience and challenger review
Before release, review material journeys and final surfaces for maturity gaps: confusing setup, developer leakage, weak hierarchy, inconsistent terminology, unnecessary choices, unrecoverable errors, platform violations, poor perceived performance and visibly unfinished states.

Then run a fresh-eyes challenger pass whose goal is to find reasons the candidate should not ship. Challenge hidden assumptions, default/framework behavior, missing feedback, lifecycle friction and evidence gaps rather than confirming the implementation author's expectations. Record results in the manifest-referenced quality evidence.

## Reference-class calibration
For products with meaningful user interaction, inspect current credible products in the same class and authoritative target-platform guidance before broad design. Extract patterns and maturity expectations; do not clone brand expression or proprietary layouts. Record durable conclusions in the project design/product sources.

## Applicability
Not every project has an installer, updater or visual UI. Mark non-applicable capabilities explicitly in the project manifest instead of silently skipping them. The burden is to make the actual user lifecycle professional for the product type that exists.
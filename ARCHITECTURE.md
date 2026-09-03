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
UNSET until discovery. Replace this section with concrete components, data flows, trust boundaries, deployment/distribution topology and project conventions.
# Release and Recovery

## Release path
1. Start from a clean committed revision whose current independent CI/gates are green.
2. Generate/read the `release` context pack through its completion marker and reconcile durable status with Git/runtime evidence; stale `GREEN` text is not release evidence.
3. Confirm `quality.evidence` is current, complete (`PASS` overall and challenger), and refers to the candidate being promoted.
4. Build/package in a reproducible clean environment when feasible; restore declared dependencies rather than relying on developer-machine residue.
5. Run the full applicable verification suite against the release candidate/artifact, including context integrity, golden journeys, adversarial states and product maturity evidence.
6. Verify install/deploy, data migration/update, rollback, recovery and uninstall/reinstall where applicable.
7. Verify product identity, version and distribution/signing/trust expectations appropriate to the target platform.
8. Create versioned release notes tied to the exact tested revision/artifact.
9. Deploy/install the tested artifact, not an ad-hoc developer workspace.
10. Run production/release-artifact smoke tests and record the result in `STATUS.md`.

## Failure handling
Prefer rollback to emergency unverified edits when a released change causes serious regression. Preserve logs/evidence before cleanup where safe. Fix through a branch with a regression test and the same context, quality, security and product-experience gates.

## Chat/session recovery
A session may end at any time. Before a logical stopping point, persist durable state. A replacement chat reconstructs from the deterministic context pack plus GitHub/working-tree/runtime evidence rather than guessing from prior conversation summaries.
Minimum resume truth is resolved by `.project/context-map.json` and manifest references rather than a hand-maintained chat checklist. The default pack includes core product/execution state; task-scoped packs add relevant design/security/testing/release sources.

After reading the pack completely:
- inspect Git status/branches/open PRs/current CI as live technical evidence;
- run validator and context-integrity checks;
- reconcile conflicts using `docs/CONTEXT_INTEGRITY.md`;
- regenerate scoped context before entering material domain work.

Never leave the only copy of an important decision, design preference, migration instruction, blocker or verification result inside chat history.

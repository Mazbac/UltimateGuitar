# Tool and Autonomy Policy

Choose the most deterministic interface available.

## Priority order
1. Native connector/API for structured remote state and writes.
2. Local CLI/filesystem/process control through Desktop Commander.
3. Application-supported automation/test APIs.
4. Playwright semantic browser automation for web interfaces.
5. OS accessibility/UI automation for native GUI-only tasks.
6. Raw coordinate mouse/keyboard automation only when no stable semantic interface exists.

## Rules
- Resolve required repository context through the context compiler before material work; do not substitute selective manual reading from memory.
- Read current live state before mutating it.
- Prefer idempotent/reversible operations and verify postconditions.
- Never use UI clicking when a stable API or CLI exposes the same operation more safely.
- Never ask the user to relay logs/screenshots/commands that available tooling can obtain.
- Screenshots are evidence for visual quality, not a replacement for DOM/state assertions.
- For material design/product-experience work, research current authoritative platform guidance and credible reference-class products when it can improve the decision.
- Persist durable conclusions from research; do not require future chats to repeat research merely to rediscover an accepted decision.
- Keep dev/test credentials scoped and out of tracked files.
- Do not broaden Desktop Commander filesystem permissions simply for convenience.

## Escalation to the user
Escalate only for genuinely non-delegable product judgment, legal/financial consent, MFA/human verification, unavailable credentials/authorization, physical-world actions, or a destructive choice whose intended outcome cannot be inferred safely.

When escalation is necessary, explain the single blocking decision/action and continue everything else that can be completed independently.
# Security Standard

Security is a release requirement and starts in DEFINE. Use OWASP ASVS as a verification baseline for web applications and apply equivalent platform guidance for other software classes.

## Required design posture
- Least privilege for users, services, tokens, filesystem, network and CI permissions.
- Deny by default; authorization is server-side or at the trusted enforcement boundary.
- Validate untrusted input and encode/escape output for its destination context.
- Use parameterized/prepared data access; never build executable queries/commands from untrusted strings.
- No secret, API key, password, session token or private certificate in Git, logs, screenshots or client bundles.
- Minimize dependencies and remote services; pin/lock versions where appropriate and review updates.
- No dynamic remote code execution, unsafe deserialization or arbitrary file execution paths without an explicit reviewed product requirement.
- Protect state-changing browser requests from CSRF where the architecture requires it; use secure cookie/session properties and strong authentication flows.
- Sensitive actions require explicit authorization and should be auditable where appropriate.

## Threat model
For each material system, record assets, actors, entry points, trust boundaries, data classifications, abuse cases and mitigations. Revisit it when auth, permissions, public endpoints, file handling, payments, plugins/extensions or external integrations change.

## Verification
Run applicable SAST, dependency/vulnerability and secret checks; add authorization/tenant-isolation tests; test malformed/hostile inputs at trust boundaries; review security-sensitive diffs separately. Working-tree secret scans must include relevant untracked, non-ignored candidate files so a secret is detectable before first commit; CI independently scans the committed candidate. High/critical findings block release unless proven not applicable with recorded evidence.

Security controls may not be disabled merely to pass a test or accelerate a release.

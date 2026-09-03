# Security Policy

## Development
All derived projects inherit `docs/SECURITY_STANDARD.md`. Security-sensitive changes require threat-model impact review and applicable automated verification before release.

## Secrets
Never commit credentials, tokens, private keys or production secrets. If a secret is exposed, rotate/revoke it rather than merely deleting it from the latest commit.

## Vulnerabilities
Do not publish exploitable vulnerability details in a public issue before remediation. For private projects, document the finding, severity, affected versions, mitigation and regression test in the project repository using the least exposed suitable channel.

## Release blocking
Unresolved high/critical findings block release unless evidence shows the finding is not applicable or is a scanner false positive. Record that evidence.

# Security Policy

## Reporting a vulnerability

If you find a security issue, **please don't open a public issue.** Instead, use [GitHub Security Advisories](https://github.com/kasparek-net/pagedog/security/advisories/new) to report it privately.

We'll acknowledge within a few days and aim to ship a fix or mitigation as soon as possible.

## Scope

This project is a self-hosted tool. The hosted reference instance (if any) is provided as-is with no SLA. Vulnerabilities of interest:

- Authentication / authorization bypass (Clerk integration, watch ownership)
- SSRF via `/api/preview` or watch URL fetches (despite DNS rebind protection)
- XSS in the dashboard or via the iframe picker breakout
- CSRF on state-changing API routes
- Cron secret leakage or timing attacks
- Privilege escalation between users

Out of scope: rate limit tuning, missing security headers on static assets, social engineering.

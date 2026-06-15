# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in Truss, please do not open a public GitHub issue. Instead, use GitHub's private vulnerability reporting feature:

**[Report a vulnerability](https://github.com/PracticalMind/truss/security/advisories/new)**

Include the following in your report:

- A clear description of the vulnerability
- Steps to reproduce it
- The potential impact
- Any suggested fix, if you have one

You will receive a response within 48 hours acknowledging the report. We will keep you updated as we investigate and work toward a fix. Once the issue is resolved, we will coordinate a disclosure timeline with you.

## Scope

The following are in scope:

- The Truss backend API (`backend/`)
- The Truss frontend (`frontend/`)
- The Docker Compose setup (`docker-compose.yml`)

The following are out of scope:

- Vulnerabilities in third-party dependencies that are not exploitable within Truss
- Issues in infrastructure managed by Supabase, Upstash, Render, or Vercel

## Supported Versions

Only the latest version of the `main` branch is actively maintained and eligible for security fixes.

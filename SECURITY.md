# Security Policy

The **Hardware-Inference** team and community take the security and integrity of our tools and calculators seriously. We appreciate the responsible disclosure of any vulnerabilities found within this codebase.

---

## Supported Versions

Only the latest active development versions receive security updates and bug fixes.

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1.0 | :x:                |

---

## Reporting a Vulnerability

If you discover a security vulnerability, flaw, or data leakage issue, please follow coordinated disclosure:

1. **Do not report security vulnerabilities through public GitHub issues, discussions, or pull requests.**
2. Send an email to the project maintainer:
   - **Contact**: [jhaabhijeet864@gmail.com](mailto:jhaabhijeet864@gmail.com)
   - **Subject**: `[SECURITY] Vulnerability Report - Hardware-Inference`
3. Alternatively, report via **GitHub Security Advisories**:
   - Navigate to the repository's **Security** tab -> **Advisories** -> **Report a vulnerability**.

### What to Include in Your Report

To help us investigate and remediate the issue promptly, please include:
- A clear description of the vulnerability and its potential impact.
- Affected component(s), file path(s), or function(s).
- Step-by-step reproduction instructions or a minimal Proof of Concept (PoC).
- Any prerequisites, environmental details, or browser/runtime specifications.
- Suggestions or mitigation strategies if you have them.

---

## Response Timeline & Coordinated Disclosure

- **Acknowledgment**: Within 48 hours of receipt.
- **Triage & Assessment**: Within 5 business days, confirming validity and impact severity.
- **Fix & Disclosure**: We will collaborate on a fix and coordinate the release of a patched version alongside an advisory credit (unless you prefer anonymity).

---

## Security Best Practices for Users & Contributors

- **Client-Side Calculations**: The estimator runs primarily client-side; ensure any external APIs or third-party inference backends communicate via TLS/HTTPS.
- **Dependency Hygiene**: Dependencies are checked periodically via Dependabot and automated CI audits. Ensure any local dependencies are kept up-to-date.
- **Model Files & Checkpoints**: Avoid downloading arbitrary external model weights or running untrusted benchmarks outside isolated sandbox environments.

Thank you for helping keep Hardware-Inference safe! 🛡️

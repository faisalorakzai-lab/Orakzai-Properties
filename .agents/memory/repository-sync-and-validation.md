---
name: Repository sync and validation
description: Notes about working from the public Orakzai Properties repository in this workspace.
---

The public repository can be read without a GitHub OAuth connection, but pushing and deployment still require a secure authorized integration; never use credentials pasted into chat.

**Why:** The workspace starter shell did not include the full frontend artifact, and the pulled repository currently has a generated API client mismatch that breaks unrelated screens during typecheck, dependency scanning, and production bundling.

**How to apply:** Keep focused UI changes isolated, report the repository-wide baseline build issue separately, and ask the user to authorize GitHub before attempting push or external deployment.
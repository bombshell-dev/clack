---
"@clack/core": patch
---

Cancel a prompt when its input stream ends (e.g. stdin is `/dev/null` or piped input runs out) instead of leaving the returned promise pending forever.

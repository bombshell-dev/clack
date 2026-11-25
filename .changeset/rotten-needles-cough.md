---
"@clack/core": patch
---

Render cancelled frame when aborted by a signal. When cancelling a prompt, we render a final frame to allow for cancellation messages. Signal abortions were missing this logic.

---
"@clack/prompts": patch
---

Fix `path` directory mode so pressing Enter with an existing directory `initialValue` submits that current directory instead of the first child option, and add regression coverage for immediate submit and child-directory navigation.

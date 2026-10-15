---
"@clack/prompts": patch
---

Use an explicit undefined check when forwarding autocomplete initialValue so 0, false, and empty strings remain selectable instead of falling back to the first option.

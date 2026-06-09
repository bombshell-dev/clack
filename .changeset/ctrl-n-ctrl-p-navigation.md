---
'@clack/core': minor
---

Add emacs-style `ctrl+n` and `ctrl+p` keybindings for `down`/`up` navigation. They work as default aliases in every cursor-driven prompt (`select`, `multi-select`, `group-multiselect`, `date`, `confirm`), navigate the option list in `autocomplete`, and move the cursor between lines in `multi-line` (where the raw control bytes were previously inserted into the text).

# Project Memory & Protocols

## Task Tracking Protocol
> **CRITICAL:** This protocol must be followed at the end of every task execution.

- **ALWAYS** update the global task tracker at:
  `d:\AndroidStudioProjects\follo\task_tracker.md`
  
- **When to update:**
  - After completing a feature or sub-feature.
  - Before notifying the user of completion.
  - When changing task status (e.g., from todo `[ ]` to done `[x]`).

- **How to update:**
  - Mark completed items with `[x]`.
  - Ensure the tracker reflects the *actual* state of the codebase.
  - If new tasks are discovered, add them to the appropriate section.

## Translation Key Protocol
> **CRITICAL:** Never use a translation key (e.g., `t('common.logged')`) in UI code without first verifying it exists in **both** `en.json` and `ko.json`.

- **Before using any `t()` call**, confirm the key exists in the locale files. If it doesn't, add it.
- **Never use fallbacks** like `t('key') || 'Fallback'` as a substitute for adding the actual key — this masks missing translations and creates inconsistency across languages.
- **Applies especially to**: timeline event status labels, log-type display text (gratitude, activity, symptom), and any new feature labels.

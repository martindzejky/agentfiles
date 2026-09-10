---
name: no-inline-imports-rules
description: Keep ES module imports at the top of the file instead of inline imports. Always apply when creating, editing, or reviewing *.ts, *.tsx, *.js, or *.jsx files.
user-invocable: false
paths:
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.js'
  - '**/*.jsx'
---

Always place imports at the top of the module. Avoid inline imports in function bodies, type annotations, or interface fields unless there is a strict circular-dependency reason and it is documented.

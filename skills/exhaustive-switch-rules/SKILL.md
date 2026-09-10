---
name: exhaustive-switch-rules
description: Requires a never check in the default branch of switches over discriminated unions or enums. Always apply when creating, editing, or reviewing *.ts, *.tsx, *.js, or *.jsx files.
user-invocable: false
paths:
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.js'
  - '**/*.jsx'
---

In switch statements over discriminated unions or enums, use a `never` check in the default case so newly added variants cause compile-time failures until handled.

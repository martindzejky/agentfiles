---
name: javascript-typescript-rules
description: JavaScript and TypeScript conventions for exhaustive switches and top-of-file imports. Always apply when creating, editing, or reviewing *.ts, *.tsx, *.js, or *.jsx files.
user-invocable: false
paths:
  - '**/*.ts'
  - '**/*.tsx'
  - '**/*.js'
  - '**/*.jsx'
---

In switch statements over discriminated unions or enums, use a `never` check in the default case so newly added variants cause compile-time failures until handled.

Always place imports at the top of the module. Avoid inline imports in function bodies, type annotations, or interface fields unless there is a strict circular-dependency reason and it is documented.

---
name: prisma-rules
description: Never generate Prisma migrations by hand; run pnpm prisma migrate dev after schema changes. Always apply when creating, editing, or reviewing *.prisma files.
user-invocable: false
paths:
  - '**/*.prisma'
---

Never generate Prisma migrations on your own. Whenever you update the Prisma schema file (`schema.prisma`), you must run `pnpm prisma migrate dev`.

# Hierarchical and parallel FSMs

Back to [SKILL.md](../SKILL.md).

## When

Flat state count grows past ~8, or orthogonal concerns multiply combinations (idle/walk/run × none/attack/block).

## Hierarchical

Outer machine: high-level (`on_ground`, `in_air`). Inner machine: details (`idle`, `walk`).

```
entity
└── state_machine
    ├── on_ground
    │   └── sub_state_machine
    │       ├── idle
    │       └── walk
    └── in_air
        └── sub_state_machine
            ├── jump
            └── fall
```

Parent `enter`/`exit` enables/disables the sub-machine and enters/exits its current state. Parent checks transitions *out*; sub-machine handles transitions *within*.

## Parallel

```
entity
├── movement_sm
├── combat_sm
└── animation reads both (or glue on root)
```

Each machine owns one concern. Do not let two machines write the same field. Root still owns the public API and shared state.

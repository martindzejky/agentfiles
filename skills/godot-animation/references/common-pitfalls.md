# Animation pitfalls (2D)

| Symptom | Cause | Fix |
|---------|-------|-----|
| snaps instead of blending | only `AnimationPlayer.play()` | AnimationTree state machine / blend tree |
| AnimationTree silent | `active` false or wrong `anim_player` | enable + point at Player |
| `travel()` does nothing | missing transition | add arrows in state machine editor |
| sprite never changes | bad track node path | fix path after rename/reparent |
| Call Method never fires | typo or wrong target | match method + node path exactly |
| blend params ignored | wrong parameter string | use Inspector path `parameters/<name>/blend_position` |
| one-shot looks stuck | forcing restart every frame | rely on same-name `play()` no-op; restart only when needed |
| loop wrong on SpriteFrames | loop mode unset / deprecated API | set loop mode per animation; 4.7+ use `LOOP_*` |
| `play()` ignored | already playing that name | expected no-op; `seek(0)` / stop / other clip to restart |

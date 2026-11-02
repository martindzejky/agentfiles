# Readable native node graphs

Adapted from upstream graph-style, reported live-checked on Studio 21.1 on 27 September 2026. Preserve this layout vocabulary through native FlowView/ViewInfo. Existing graph conventions and user edits take precedence.

- **One left-to-right spine:** the Background Merge chain or scene ladder is a straight row ending at MediaOut.
- **Layer columns above their Merges:** source→effects→transform flows down into Foreground; side inputs left, masks right; spine masks below, flowing upward.
- **Nested bands:** sub-stacks get their own horizontal band; each scene has a labeled backdrop above its ladder Merge.
- **Stepped fans:** stagger farther branches downward so wires pass below nearer blocks.
- **Controls/shared assets top-left:** make CTRL, notes, and shared sources easy to find. Splines/modifiers generally have no tile.
- **Whitespace for thumbnails:** upstream used a 110×33 flow-pixel grid, chains three rows apart, spine tools at least 1.5 columns apart. Verify display and API units.
- **Labeled Underlays:** nest layer boxes inside scene boxes with margins. The author's roles: slate scenes, amber controls, gray shared assets, violet text, teal UI, blue 3D, green caches, red-brown film ladders.

Name components and roles consistently: S2_Title_Text, Card03_Fill, Card03_Mask, Card03_Xf, CTRL_Gallery. Names are functional expression identities; do not casually rename them during layout.

Groups/macros make sense for editable components with intentional ports; Underlays allow direct inspection. The upstream connector's limitations updating inside Groups are not universal Fusion limitations here. Do not change wiring, Merge strategy, or grouping just to tidy accepted work.

## Coordinate and selection traps

Upstream measured FlowView SetPos in grid units while serialized OperatorInfo Pos used pixel centers: ((x+0.5)*110,(y+0.5)*33), with half-column/whole-row snapping. Verify current signatures and position readback before large layouts.

Underlays used a different anchor (horizontal center/top in serialized ViewInfo); pasted positions needed correction. Upstream saw first-created Underlays drawn above later ones, so created inner boxes before containing boxes. Check the UI.

Deleting a normally selected Underlay in the UI can delete its contents. Select only the box deliberately; do not equate UI deletion with the author's script deletion of the backdrop alone. Tidy only the changed branch during a local revision. Preserve a render baseline when layout work includes structural changes.

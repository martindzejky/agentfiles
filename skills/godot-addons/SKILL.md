---
name: godot-addons
description: Quick reference for EditorPlugin addons — plugin.cfg, @tool, custom types, inspector plugins, docks, configuration warnings. Use when building or editing editor extensions.
---

# Godot Addons

Quick reference for editor extensions.

## Layout

```
addons/my_plugin/
├── plugin.cfg
├── plugin.gd          # @tool + extends EditorPlugin
├── my_inspector.gd    # optional EditorInspectorPlugin
├── my_dock.tscn       # optional dock
└── icons/my_node.svg
```

```ini
[plugin]

name="My Plugin"
description="Short summary"
author="You"
version="1.0.0"
script="plugin.gd"
```

Enable: Project → Project Settings → Plugins.

## @tool & warnings

```gdscript
@tool
extends Node2D

@export var sprite: Sprite2D:
  set(value):
    sprite = value
    if is_inside_tree():
      update_configuration_warnings()

func _ready() -> void:
  if Engine.is_editor_hint():
    update_configuration_warnings()

func _get_configuration_warnings() -> PackedStringArray:
  var warnings: PackedStringArray = []
  if sprite == null:
    warnings.append('assign the sprite reference')
  return warnings
```

Guard editor-only paths with `Engine.is_editor_hint()`. Call `update_configuration_warnings()` when relevant exports or resources change, not every frame.

## Generated nodes, when a tool needs them

Distinguish temporary previews from content intentionally saved into a scene. `add_child()` establishes the tree relationship; `owner` determines scene persistence. Do not assign ownership merely to display a preview. In particular, do not fall back to owning preview children by the reusable template root: every instance can then inherit them alongside its own baked children.

For baked output, assign the intended scene owner explicitly. Mark the tool's generated children so regeneration replaces only its own output and preserves authored nodes. Verify repeated generation and save/reopen of both the template and a containing scene; check for duplicate children and name clashes. This guidance applies only when implementing generated editor content, not to ordinary scene setup.

## EditorPlugin

Everything added in `_enter_tree()` must be removed in `_exit_tree()`.

```gdscript
@tool
extends EditorPlugin

func _enter_tree() -> void:
  add_custom_type(
    'MyNode',
    'Node2D',
    preload('res://addons/my_plugin/my_node.gd'),
    preload('res://addons/my_plugin/icons/my_node.svg')
  )
  add_tool_menu_item('My Plugin Action', _on_tool_menu_item)

func _exit_tree() -> void:
  remove_custom_type('MyNode')
  remove_tool_menu_item('My Plugin Action')

func _on_tool_menu_item() -> void:
  print('triggered')
```

## Inspector / docks

- `EditorInspectorPlugin`: `_can_handle` → `_parse_property` / `_parse_begin`; pair with `EditorProperty`
- Dock: `add_control_to_dock(slot, control)` then `remove_control_from_docks` + `queue_free()` on exit
- Custom Resource pickers / preview generators via `EditorInterface`

## Reload

Disable/enable the plugin after structural changes. `@tool` hot-reloads simple edits; new types/docks need a full cycle. Prefer `push_error` / `push_warning` to silent fails.

## Docs

- [Making plugins](https://docs.godotengine.org/en/stable/tutorials/plugins/editor/making_plugins.html)
- [EditorPlugin](https://docs.godotengine.org/en/stable/classes/class_editorplugin.html)
- [Inspector plugins](https://docs.godotengine.org/en/stable/tutorials/plugins/editor/inspector_plugins.html)
- [Running code in the editor](https://docs.godotengine.org/en/stable/tutorials/plugins/running_code_in_the_editor.html)

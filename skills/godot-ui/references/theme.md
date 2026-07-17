# Theme (thin)

Assign one `Theme` on the root `Control`. Descendants inherit; walk stops at the nearest ancestor with a theme.

## StyleBoxFlat

```gdscript
var style := StyleBoxFlat.new()
style.bg_color = Color(0.1, 0.1, 0.12, 0.95)
style.set_corner_radius_all(8)
style.set_border_width_all(2)
style.border_color = Color(0.5, 0.55, 0.7)
$dialog_panel.add_theme_stylebox_override('panel', style)
```

## Overrides

```gdscript
$title.add_theme_font_size_override('font_size', 32)
$title.add_theme_color_override('font_color', Color.WHITE)
$margin.add_theme_constant_override('margin_left', 16)
```

Prefer overrides over cloning entire themes. Docs: [Theme](https://docs.godotengine.org/en/stable/classes/class_theme.html), [Using Themes](https://docs.godotengine.org/en/stable/tutorials/ui/gui_using_theme_editor.html).

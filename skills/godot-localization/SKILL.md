---
name: godot-localization
description: Godot i18n — tr(), Control auto-translate, semantic keys, CSV vs PO, format after tr, RTL, NOTIFICATION_TRANSLATION_CHANGED.
---

# Godot Localization

## Instructions

- Wrap user-facing strings in `tr()` (or set Control `text` to a translation key). Prefer semantic keys: `MENU_START`, `HUD_HEALTH`.
- Register CSV/PO under Project Settings → Localization → Translations.
- Format **after** translate: `tr('PLAYER_HEALTH') % health`, never `tr('KEY' % value)`.
- Prefer CSV for spreadsheet workflows; prefer PO for gettext tooling and translator collaboration. Both support contexts and plural forms (`tr_n`).
- For code-built strings, rebuild in `_notification(NOTIFICATION_TRANSLATION_CHANGED)`. Static Control keys with auto-translate refresh automatically — no signal to connect or disconnect.
- Persist locale with ConfigFile (`user://`); apply on boot before UI builds when possible.

## Keys and Controls

Prefer `CATEGORY_CONTEXT` keys (`MENU_MAIN_START`, `ITEM_SWORD_NAME`) over English-as-key for production.

```gdscript
label.text = tr('MENU_START')
health_label.text = tr('PLAYER_HEALTH') % current_health
```

Controls auto-translate `text` / `tooltip_text` / `placeholder_text` when the value matches a key. Set `auto_translate_mode = Node.AUTO_TRANSLATE_MODE_DISABLED` to opt out. Prefer keys in the scene for static labels.

Register files in Project Settings (preferred) or at runtime:

```gdscript
TranslationServer.add_translation(load('res://translations/de.po') as Translation)
```

## CSV vs PO

**CSV** — first column keys, then locale columns:

```csv
keys,en,de
MENU_START,Start Game,Spiel starten
PLAYER_HEALTH,Health: %d,Gesundheit: %d
```

**PO** — industry tools, per-locale files, plural forms, contexts.

```gdscript
var msg := tr_n('ONE_ENEMY', 'MANY_ENEMIES', count) % count
```

CSV supports a `?context` column and a `?plural` column containing the plural message key. Continuation rows with empty key/context/plural cells carry the extra translated forms required by each locale. `tr_n()` selects a form; it does not insert the count, so format afterward and include the placeholder in the translations.

CSV entries using contexts or plurals need explicit `tr()` / `tr_n()` calls; automatic Control translation does not handle those entries.

## Switch locale

```gdscript
func set_language(locale_code: String) -> void:
  TranslationServer.set_locale(locale_code)
```

Controls with keys refresh automatically. Code-built strings must rebuild on translation change:

```gdscript
func _ready() -> void:
  _rebuild_dynamic_text()


func _notification(what: int) -> void:
  if what == NOTIFICATION_TRANSLATION_CHANGED:
    _rebuild_dynamic_text()
```

## RTL

```gdscript
func _apply_layout() -> void:
  var locale := TranslationServer.get_locale()
  var rtl := TextServerManager.get_primary_interface().is_locale_right_to_left(locale)
  layout_direction = (
    Control.LAYOUT_DIRECTION_RTL if rtl else Control.LAYOUT_DIRECTION_LTR
  )
```

Prefer `Control.LAYOUT_DIRECTION_APPLICATION_LOCALE` on root UI when the whole tree should follow locale. Assign fonts that cover target scripts (Noto, etc.). Mixed direction in RichTextLabel: `[ltr]100/200[/ltr]`.

## Pitfalls

| Symptom                              | Fix                                                                                                           |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| key shows as text                    | register translation in Project Settings                                                                      |
| UI not updating                      | use keys / `tr()`, not raw literals                                                                           |
| `%s` literal in UI                   | format after `tr()`                                                                                           |
| plural wrong with CSV                | check `?plural`, continuation rows, locale, and form order                                                    |
| RTL still LTR                        | set `layout_direction` / fonts                                                                                |
| dynamic UI stale after locale switch | rebuild in `_notification(NOTIFICATION_TRANSLATION_CHANGED)`, or set Control text to keys with auto-translate |

Docs: [CSV localization](https://docs.godotengine.org/en/stable/tutorials/i18n/localization_using_spreadsheets.html) · [gettext localization](https://docs.godotengine.org/en/stable/tutorials/i18n/localization_using_gettext.html).

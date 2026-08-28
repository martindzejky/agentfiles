---
name: git-commit-style
description: Defines git commit messages style. Use when writing git commit messages or when the user asks for commit message style.
---

# Git title

The first line of a commit message is the title.

## Instructions

- start with a capital letter, rest lowercase
- proper names keep their usual capitals (Prettier, Eslint, Svelte)
- keep it simple
- 2-8 words max
- prefer no verb
- no punctuation, no trailing period

## Examples

- Initial commit
- Add Prettier config
- Update dependencies to latest
- Checkout page
- Analytics setup

## Ticket

If we are on a feature branch and this branch contains a Jira ticket number, prefix it to the commit message title. For example, on a branch named `EPIK-552-settings-view`, commits should be `EPIK-552 Commit message`. Do NOT use unnecessary parentheses like `[EPIK-552] Commit message`.

The part after the ticket also starts with a capital letter.

- EPIK-482 Bump headless components
- APP-6899 New login flow components
- EBOX-113 Storybook stories for the checkout page

This does not apply to GitHub issues. Do not prefix commits with GitHub issue numbers (e.g. `#42`); link the issue in the pull request instead.

# Git description

After the title, there's an empty line, and then the commit description.

## When to write it

Usually the title is enough and there's no need for extra information in the form. Only include the git commit description if:

- the git diff does not already tell the whole clear story
- the commit would benefit from extra information like reasoning or context for the change
- you want to capture extra information along the git diff
- the user asks you to write one

## Instructions

- descriptions are written like regular prose, with capital letters and regular punctuation
- do not use em dashes
- keep the description concise
- include the necessary information efficiently
- refer to external context if relevant (like tickets, bugs reports, pull requests, repositories), but only if it is relevant to the commit and matches some of the rules above when to write a description
- always end the git commit message with a trailing newline

---
name: commit-changes
description: Commits current changes after validation, respecting the staging area and git commit style. Use when the user explicitly invokes /commit-changes or asks to commit their work.
user-invocable: true
disable-model-invocation: true
---

# Commit changes

Make a commit with the current changes. Do not modify the staging - if there are some files staged, only commit those. If nothing is staged, commit everything. Learn the "git commit style" skill to use proper commit messages.

Before making the commit, if you haven't done so already, run the standard repository checks like linting, formatting, tests, and fix any issues that pop up prior to making the commit.

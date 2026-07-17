#!/bin/sh
set -eu

# Cloud install. Runs when an agent starts in the cloud.
# This workspace IS agentfiles — link skills/rules/etc from the checkout.

ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT"
git submodule update --init --recursive
HOME="$HOME" ./install

#!/usr/bin/env node

import { capturePostToolUse } from '../core/captures.mjs';
import { normalizePostToolUse, run } from './runtime.mjs';

run('postToolUse', normalizePostToolUse, capturePostToolUse);

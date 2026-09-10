#!/usr/bin/env node

import { capturePostToolFailure } from '../core/captures.mjs';
import { normalizePostToolFailure, run } from './runtime.mjs';

run('postToolUseFailure', normalizePostToolFailure, capturePostToolFailure);

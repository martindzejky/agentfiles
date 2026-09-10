#!/usr/bin/env node

import { captureSubagentStop } from '../core/captures.mjs';
import { normalizeSubagentStop, run } from './runtime.mjs';

run('subagentStop', normalizeSubagentStop, captureSubagentStop);

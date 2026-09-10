#!/usr/bin/env node

import { captureSubagentStart } from '../core/captures.mjs';
import { normalizeSubagentStart, run } from './runtime.mjs';

run('SubagentStart', normalizeSubagentStart, captureSubagentStart);

#!/usr/bin/env node

import { capturePromptSubmit } from '../core/captures.mjs';
import { normalizePromptSubmit, run } from './runtime.mjs';

run('UserPromptSubmit', normalizePromptSubmit, capturePromptSubmit);

#!/usr/bin/env node

import { captureAssistantResponse } from '../core/captures.mjs';
import { normalizeAssistantResponse, run } from './runtime.mjs';

run('Stop', normalizeAssistantResponse, captureAssistantResponse);

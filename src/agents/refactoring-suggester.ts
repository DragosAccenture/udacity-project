import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { REFACTORING_SUGGESTER_PROMPT } from '../prompts/index.js';

/**
 * Identifies opportunities to improve code structure and modernize patterns.
 */
export const refactoringSuggester: AgentDefinition = {
  description:
    'Use this agent to identify concrete refactoring opportunities that improve code structure, readability, maintainability, and modern programming practices. Use it for structural improvements and modernization rather than security analysis or test-coverage analysis.',

  prompt: REFACTORING_SUGGESTER_PROMPT,

  model: 'inherit',

  tools: ['Read', 'Glob', 'Grep', 'Skill']
};

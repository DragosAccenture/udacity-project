import type { AgentDefinition } from '@anthropic-ai/claude-agent-sdk';
import { TEST_COVERAGE_ANALYZER_PROMPT } from '../prompts/index.js';

/**
 * Evaluates test completeness and recommends specific missing test cases.
 */
export const testCoverageAnalyzer: AgentDefinition = {
  description:
    'Use this agent to compare source code with existing tests, identify untested functions, classes, branches, and edge cases, and suggest specific missing test cases. Use it for test-completeness analysis rather than general code-quality review or refactoring.',

  prompt: TEST_COVERAGE_ANALYZER_PROMPT,

  model: 'inherit',

  tools: ['Read', 'Glob', 'Grep', 'Skill']
};

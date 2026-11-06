import { CODE_QUALITY_ANALYZER_PROMPT } from '../prompts/index.js';
/**
 * Analyzes source code for security, performance, reliability,
 * and maintainability concerns.
 */
export const codeQualityAnalyzer = {
    description: `Use this agent to inspect source code for security vulnerabilities, performance problems, 
     reliability risks, code smells, and maintainability concerns. 
     Use it for code-quality analysis, not test-coverage measurement or refactoring implementation.`,
    prompt: CODE_QUALITY_ANALYZER_PROMPT,
    model: 'inherit',
    tools: ['Read', 'Glob', 'Grep', 'Skill']
};
//# sourceMappingURL=code-quality-analyzer.js.map
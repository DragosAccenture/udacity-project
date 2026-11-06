import { query } from '@anthropic-ai/claude-agent-sdk';
import { ReviewReportJSONSchema } from './types/report-types.js';
import { buildOrchestratorPrompt } from './prompts/index.js';
import { logger } from './utils/logger.js';
import { mcpServersConfig } from './config/mcp.config.js';
import { codeQualityAnalyzer, testCoverageAnalyzer, refactoringSuggester } from './agents/index.js';
/**
 * Main Code Review Orchestrator
 * Coordinates subagents to analyze pull requests and generate comprehensive reports
 */
export class CodeReviewOrchestrator {
    options;
    constructor(options = {}) {
        this.options = options;
    }
    /**
     * Review a pull request using parallel subagent analysis
     * @param owner - Repository owner
     * @param repo - Repository name
     * @param prNumber - Pull request number
     * @returns Complete review report
     */
    async reviewPullRequest(owner, repo, prNumber) {
        const startTime = Date.now();
        const model = process.env.ANTHROPIC_MODEL || 'claude-opus-5-5';
        logger.info('Starting code review', { owner, repo, prNumber });
        try {
            const orchestratorPrompt = buildOrchestratorPrompt(owner, repo, prNumber);
            let report = null;
            for await (const message of query({
                prompt: orchestratorPrompt,
                options: {
                    model,
                    agents: {
                        'code-quality-analyzer': codeQualityAnalyzer,
                        'test-coverage-analyzer': testCoverageAnalyzer,
                        'refactoring-suggester': refactoringSuggester
                    },
                    mcpServers: mcpServersConfig,
                    allowedTools: ['Read', 'Glob', 'Grep', 'Skill', 'Task'],
                    outputFormat: {
                        type: 'json_schema',
                        schema: ReviewReportJSONSchema
                    }
                }
            })) {
                // Handle structured output result
                if (message.type === 'result' &&
                    message.subtype === 'success' &&
                    message.structured_output) {
                    report = message.structured_output;
                    break;
                }
                // Handle structured output retry exhaustion
                if (message.type === 'result' &&
                    message.subtype === 'error_max_structured_output_retries') {
                    throw new Error('Structured output generation failed after maximum retries');
                }
                // Handle other errors
                if (message.type === 'result' && message.subtype !== 'success') {
                    throw new Error(`Agent error: ${message.errors?.join(', ') || 'Unknown error'}`);
                }
            }
            if (!report) {
                throw new Error('Failed to extract ReviewReport from agent response');
            }
            const duration = Date.now() - startTime;
            logger.info('Code review completed', {
                owner,
                repo,
                prNumber,
                score: report.summary.overallScore,
                duration,
                status: 'success'
            });
            return report;
        }
        catch (error) {
            const duration = Date.now() - startTime;
            logger.error('Code review failed', {
                owner,
                repo,
                prNumber,
                error: error.message,
                duration,
                status: 'failed'
            });
            throw error;
        }
    }
}
//# sourceMappingURL=orchestrator.js.map
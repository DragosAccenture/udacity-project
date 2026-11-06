import { ReviewReport } from './types/report-types.js';
/**
 * Orchestrator configuration options
 */
export interface OrchestratorOptions {
    rateLimits?: {
        maxRequestsPerMinute: number;
        maxTokensPerMinute: number;
        maxConcurrent: number;
    };
}
/**
 * Main Code Review Orchestrator
 * Coordinates subagents to analyze pull requests and generate comprehensive reports
 */
export declare class CodeReviewOrchestrator {
    private options;
    constructor(options?: OrchestratorOptions);
    /**
     * Review a pull request using parallel subagent analysis
     * @param owner - Repository owner
     * @param repo - Repository name
     * @param prNumber - Pull request number
     * @returns Complete review report
     */
    reviewPullRequest(owner: string, repo: string, prNumber: number): Promise<ReviewReport>;
}
//# sourceMappingURL=orchestrator.d.ts.map
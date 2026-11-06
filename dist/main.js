import 'dotenv/config';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { CodeReviewOrchestrator } from './orchestrator.js';
import { ReportGenerator, formatError, logger } from './utils/index.js';
async function main() {
    try {
        const [, , owner, repo, prNumberArg] = process.argv;
        // Validate command-line arguments
        if (!owner || !repo || !prNumberArg) {
            console.error('Usage: npm run dev -- <owner> <repo> <pull-request-number>');
            process.exitCode = 1;
            return;
        }
        const prNumber = Number(prNumberArg);
        if (!Number.isInteger(prNumber) || prNumber <= 0) {
            console.error(`Invalid pull request number: "${prNumberArg}". ` +
                'It must be a positive integer.');
            process.exitCode = 1;
            return;
        }
        // Validate authentication
        const hasAnthropicAuth = Boolean(process.env.ANTHROPIC_API_KEY);
        const hasAwsCredentials = Boolean(process.env.AWS_ACCESS_KEY_ID &&
            process.env.AWS_SECRET_ACCESS_KEY);
        if (!hasAnthropicAuth && !hasAwsCredentials) {
            console.error('Authentication is not configured.\n' +
                'Set ANTHROPIC_API_KEY for the Anthropic API, or set ' +
                'AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, and AWS_REGION ' +
                'for Amazon Bedrock.');
            process.exitCode = 1;
            return;
        }
        if (hasAwsCredentials && !hasAnthropicAuth && !process.env.AWS_REGION) {
            console.error('AWS_REGION is required when using Amazon Bedrock authentication.');
            process.exitCode = 1;
            return;
        }
        if (hasAnthropicAuth) {
            logger.info('Using Anthropic API authentication');
        }
        else {
            logger.info('Using AWS Bedrock authentication', {
                region: process.env.AWS_REGION
            });
        }
        // Validate model
        if (!process.env.ANTHROPIC_MODEL) {
            console.error('ANTHROPIC_MODEL is not configured.\n' +
                'Set it to the appropriate model identifier for your provider.\n' +
                'For Anthropic API, use an Anthropic model ID.\n' +
                'For Amazon Bedrock, use the appropriate Bedrock model ID or inference profile.');
            process.exitCode = 1;
            return;
        }
        logger.info('Starting pull request review', {
            owner,
            repo,
            prNumber,
            model: process.env.ANTHROPIC_MODEL
        });
        // Run review
        const orchestrator = new CodeReviewOrchestrator();
        const result = await orchestrator.reviewPullRequest(owner, repo, prNumber);
        // Generate reports
        const generator = new ReportGenerator();
        const markdown = generator.generateMarkdownReport(result);
        const html = generator.generateHTMLReport(result);
        const json = generator.generateJSONReport(result);
        const reportsDir = join(process.cwd(), 'reports');
        await mkdir(reportsDir, { recursive: true });
        const safeOwner = owner.replace(/[^a-zA-Z0-9._-]/g, '-');
        const safeRepo = repo.replace(/[^a-zA-Z0-9._-]/g, '-');
        const baseName = `${safeOwner}-${safeRepo}-pr-${prNumber}`;
        const markdownPath = join(reportsDir, `${baseName}.md`);
        const htmlPath = join(reportsDir, `${baseName}.html`);
        const jsonPath = join(reportsDir, `${baseName}.json`);
        await Promise.all([
            writeFile(markdownPath, markdown, 'utf8'),
            writeFile(htmlPath, html, 'utf8'),
            writeFile(jsonPath, json, 'utf8')
        ]);
        logger.info('Code review completed successfully', {
            markdown: markdownPath,
            html: htmlPath,
            json: jsonPath
        });
        console.log('Review completed successfully.');
        console.log(`Markdown: ${markdownPath}`);
        console.log(`HTML:     ${htmlPath}`);
        console.log(`JSON:     ${jsonPath}`);
    }
    catch (error) {
        console.error(`Code review failed: ${formatError(error)}`);
        process.exitCode = 1;
    }
}
await main();
//# sourceMappingURL=main.js.map
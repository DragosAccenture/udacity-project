import { describe, expect, it } from 'vitest';
import { z } from 'zod';

import {
  CodeQualityResultSchema,
  TestCoverageResultSchema,
  RefactoringSuggestionSchema,
  CodeQualityResultJSONSchema,
  TestCoverageResultJSONSchema,
  RefactoringSuggestionJSONSchema,
  ReviewReportSchema,
  ReviewReportJSONSchema
} from '../src/types/index.js';

const validCodeQuality = {
  file: 'src/example.ts',
  issues: [
    {
      line: 10,
      severity: 'high',
      category: 'security',
      description: 'User input is not validated.',
      suggestion: 'Validate the input before using it.'
    }
  ],
  overallScore: 75,
  summary: 'One significant issue was found.'
};

const validTestCoverage = {
  file: 'src/example.ts',
  hasTests: true,
  testFiles: ['tests/example.test.ts'],
  untestedPaths: [
    {
      type: 'branch',
      location: 'src/example.ts:20',
      priority: 'high',
      reasoning: 'The error branch has no corresponding test.',
      suggestedTest: 'Pass invalid input and verify the expected error.'
    }
  ],
  coverageEstimate: 80,
  summary: 'Most important behavior is covered.'
};

const validRefactoring = {
  file: 'src/example.ts',
  suggestions: [
    {
      type: 'extract-function',
      location: 'src/example.ts:30-45',
      impact: 'medium',
      description: 'Extract the validation logic into a separate function.',
      before: 'if (value) { /* validation logic */ }',
      after: 'validateValue(value);',
      benefits: 'Reduces complexity and improves reuse.'
    }
  ],
  summary: 'One useful refactoring opportunity was identified.'
};

describe('CodeQualityResultSchema', () => {
  it('accepts valid data', () => {
    expect(() => CodeQualityResultSchema.parse(validCodeQuality)).not.toThrow();
  });

  it('rejects invalid severity', () => {
    expect(() =>
      CodeQualityResultSchema.parse({
        ...validCodeQuality,
        issues: [
          {
            ...validCodeQuality.issues[0],
            severity: 'extreme'
          }
        ]
      })
    ).toThrow(z.ZodError);
  });

  it('rejects missing required fields', () => {
    const { file: _file, ...invalidData } = validCodeQuality;

    expect(() => CodeQualityResultSchema.parse(invalidData))
      .toThrow(z.ZodError);
  });

  it('accepts boundary scores of 0 and 100', () => {
    expect(() =>
      CodeQualityResultSchema.parse({
        ...validCodeQuality,
        overallScore: 0
      })
    ).not.toThrow();

    expect(() =>
      CodeQualityResultSchema.parse({
        ...validCodeQuality,
        overallScore: 100
      })
    ).not.toThrow();
  });

  it('rejects scores outside 0 to 100', () => {
    expect(() =>
      CodeQualityResultSchema.parse({
        ...validCodeQuality,
        overallScore: 101
      })
    ).toThrow(z.ZodError);
  });

  it('accepts an empty issues array', () => {
    expect(() =>
      CodeQualityResultSchema.parse({
        ...validCodeQuality,
        issues: []
      })
    ).not.toThrow();
  });
});

describe('TestCoverageResultSchema', () => {
  it('accepts valid data', () => {
    expect(() =>
      TestCoverageResultSchema.parse(validTestCoverage)
    ).not.toThrow();
  });

  it('accepts a file without tests', () => {
    expect(() =>
      TestCoverageResultSchema.parse({
        ...validTestCoverage,
        hasTests: false,
        testFiles: [],
        untestedPaths: [],
        coverageEstimate: 0
      })
    ).not.toThrow();
  });

  it('rejects an invalid path type', () => {
    expect(() =>
      TestCoverageResultSchema.parse({
        ...validTestCoverage,
        untestedPaths: [
          {
            ...validTestCoverage.untestedPaths[0],
            type: 'method'
          }
        ]
      })
    ).toThrow(z.ZodError);
  });

  it('rejects an invalid priority', () => {
    expect(() =>
      TestCoverageResultSchema.parse({
        ...validTestCoverage,
        untestedPaths: [
          {
            ...validTestCoverage.untestedPaths[0],
            priority: 'urgent'
          }
        ]
      })
    ).toThrow(z.ZodError);
  });

  it('accepts coverage boundaries', () => {
    expect(() =>
      TestCoverageResultSchema.parse({
        ...validTestCoverage,
        coverageEstimate: 0
      })
    ).not.toThrow();

    expect(() =>
      TestCoverageResultSchema.parse({
        ...validTestCoverage,
        coverageEstimate: 100
      })
    ).not.toThrow();
  });
});

describe('RefactoringSuggestionSchema', () => {
  it('accepts valid data', () => {
    expect(() =>
      RefactoringSuggestionSchema.parse(validRefactoring)
    ).not.toThrow();
  });

  it('accepts an empty suggestions array', () => {
    expect(() =>
      RefactoringSuggestionSchema.parse({
        ...validRefactoring,
        suggestions: []
      })
    ).not.toThrow();
  });

  it('rejects an unsupported refactoring type', () => {
    expect(() =>
      RefactoringSuggestionSchema.parse({
        ...validRefactoring,
        suggestions: [
          {
            ...validRefactoring.suggestions[0],
            type: 'rewrite-everything'
          }
        ]
      })
    ).toThrow(z.ZodError);
  });

  it('rejects invalid impact', () => {
    expect(() =>
      RefactoringSuggestionSchema.parse({
        ...validRefactoring,
        suggestions: [
          {
            ...validRefactoring.suggestions[0],
            impact: 'critical'
          }
        ]
      })
    ).toThrow(z.ZodError);
  });
});

describe('ReviewReportSchema', () => {
  const validReport = {
    pullRequest: {
      owner: 'octocat',
      repo: 'Hello-World',
      number: 1
    },
    fileReviews: [
      {
        file: 'src/example.ts',
        codeQuality: validCodeQuality,
        testCoverage: validTestCoverage,
        refactorings: validRefactoring
      }
    ],
    summary: {
      totalFiles: 1,
      overallScore: 75,
      criticalIssues: 0,
      highPriorityTests: 1,
      refactoringOpportunities: 1
    },
    recommendations: [
      {
        priority: 'high',
        category: 'testing',
        description: 'Add coverage for the error branch.',
        files: ['src/example.ts']
      }
    ],
    metadata: {
      analyzedAt: '2026-11-03T10:00:00.000Z',
      duration: 1000,
      agentVersions: {
        codeQuality: '1.0',
        testCoverage: '1.0',
        refactoring: '1.0'
      }
    }
  };

  it('accepts a valid complete report', () => {
    expect(() => ReviewReportSchema.parse(validReport)).not.toThrow();
  });

  it('accepts empty file reviews and recommendations', () => {
    expect(() =>
      ReviewReportSchema.parse({
        ...validReport,
        fileReviews: [],
        recommendations: [],
        summary: {
          ...validReport.summary,
          totalFiles: 0
        }
      })
    ).not.toThrow();
  });

  it('rejects invalid recommendation priority', () => {
    expect(() =>
      ReviewReportSchema.parse({
        ...validReport,
        recommendations: [
          {
            ...validReport.recommendations[0],
            priority: 'urgent'
          }
        ]
      })
    ).toThrow(z.ZodError);
  });
});

describe('JSON Schema exports', () => {
  it('exports JSON schemas as objects', () => {
    expect(CodeQualityResultJSONSchema).toBeTypeOf('object');
    expect(TestCoverageResultJSONSchema).toBeTypeOf('object');
    expect(RefactoringSuggestionJSONSchema).toBeTypeOf('object');
    expect(ReviewReportJSONSchema).toBeTypeOf('object');
  });

  it('marks CodeQualityResult required properties', () => {
    const required = CodeQualityResultJSONSchema.required as string[];

    expect(required).toEqual(
      expect.arrayContaining([
        'file',
        'issues',
        'overallScore',
        'summary'
      ])
    );
  });

  it('marks TestCoverageResult required properties', () => {
    const required = TestCoverageResultJSONSchema.required as string[];

    expect(required).toEqual(
      expect.arrayContaining([
        'file',
        'hasTests',
        'testFiles',
        'untestedPaths',
        'coverageEstimate',
        'summary'
      ])
    );
  });

  it('marks ReviewReport required properties', () => {
    const required = ReviewReportJSONSchema.required as string[];

    expect(required).toEqual(
      expect.arrayContaining([
        'pullRequest',
        'fileReviews',
        'summary',
        'recommendations',
        'metadata'
      ])
    );
  });
});

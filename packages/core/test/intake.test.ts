import { describe, it, expect } from 'vitest';
import { IntakeParser } from '../src/intake-parser.js';

describe('Intake Parser', () => {
  const sampleMarkdown = `
### Affected Component
consensus/p2p-engine

### Observed Failure
When a peer reconnects under 200ms latency, the state machine triggers a panic due to race condition.
Stack trace shows deadlock on mutex handoff.

### Acceptance Criteria
- [ ] Add atomic mutex handoff to SyncBuffer
- [ ] 50 iterations of partition_reconnect_spec pass without error
- [ ] Zero throughput regressions on benchmarks

### Evidence
See the CI test run: https://github.com/openwork/core-consensus/actions/runs/123456
Log dump: https://gist.github.com/ci-logs/panic.log
Reproduction commit 4a8fea4b22c01111111111111111111111111111
  `;

  it('parses GitHub issue markdown into structured Ticket', () => {
    const ticket = IntakeParser.parseIssue({
      id: 'issue-104',
      repo: 'openwork/core-consensus',
      title: 'P2P State Race Condition on Reconnect',
      sourceUrl: 'https://github.com/openwork/core-consensus/issues/104',
      body: sampleMarkdown,
      maintainerApproved: true,
    });

    expect(ticket.id).toBe('issue-104');
    expect(ticket.repo).toBe('openwork/core-consensus');
    expect(ticket.affectedComponent).toBe('consensus/p2p-engine');
    expect(ticket.observedFailure).toContain('state machine triggers a panic');
    expect(ticket.acceptanceConditions.length).toBe(3);
    expect(ticket.acceptanceConditions[0]).toContain('atomic mutex handoff');
    expect(ticket.publicEvidence.length).toBeGreaterThanOrEqual(3);
    expect(ticket.publicEvidence.some((e) => e.includes('actions/runs/123456'))).toBe(true);
    expect(ticket.publicEvidence.some((e) => e.includes('commit:'))).toBe(true);

    // Verify feature estimation detects critical urgency and high breadth
    expect(ticket.features?.urgency).toBeGreaterThanOrEqual(0.85);
    expect(ticket.features?.breadthOfEffect).toBeGreaterThanOrEqual(0.80);
    expect(ticket.features?.evidenceConfidence).toBeGreaterThanOrEqual(0.85);
  });

  it('validates tickets and flags missing acceptance criteria or repo', () => {
    const malformed = IntakeParser.parseIssue({
      id: 'issue-bad',
      repo: '',
      title: 'Broken issue',
      sourceUrl: 'https://github.com/openwork/core-consensus/issues/999',
      body: 'No sections or conditions here',
    });

    const validation = IntakeParser.validate(malformed);
    expect(validation.isValid).toBe(false);
    expect(validation.errors.some((e) => e.includes('Repository is required'))).toBe(true);
    expect(validation.errors.some((e) => e.includes('Acceptance conditions cannot be empty'))).toBe(true);
    expect(validation.warnings.length).toBeGreaterThan(0);
  });
});

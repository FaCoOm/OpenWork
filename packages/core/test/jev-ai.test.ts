import { describe, it, expect } from 'vitest';
import { JevAiService } from '../src/jev-ai-service.js';

describe('JevAiService', () => {
  it('should initialize and perform heuristic fallback analysis when no key is set', async () => {
    const service = new JevAiService({ apiKey: '' });

    const result = await service.analyzeIssue(
      'Critical peer isolation deadlock during gossip propagation',
      'Consensus nodes stall under 3+ simultaneous resets.',
      ['https://github.com/openwork-protocol/consensus-p2p/issues/101']
    );

    expect(result.provider).toBe('DETERMINISTIC_FALLBACK');
    expect(result.features.urgency).toBeGreaterThan(0.9);
    expect(result.detectedComponent).toBe('p2p/gossip_sub.go');
    expect(result.rationales.length).toBeGreaterThan(0);
  });

  it('should detect routine documentation issues with low urgency', async () => {
    const service = new JevAiService({ apiKey: '' });

    const result = await service.analyzeIssue(
      'Fix typo in comment in math_utils.go',
      'Spelling error in exported docstring comment line 42.'
    );

    expect(result.features.urgency).toBeLessThan(0.3);
    expect(result.detectedComponent).toBe('common/math_utils.go');
  });

  it('should flag unverified reports with low evidence confidence', async () => {
    const service = new JevAiService({ apiKey: '' });

    const result = await service.analyzeIssue(
      'Random crash on RPC server',
      'Process terminated unexpectedly with no repro steps.',
      []
    );

    expect(result.features.evidenceConfidence).toBeLessThan(0.4);
  });
});

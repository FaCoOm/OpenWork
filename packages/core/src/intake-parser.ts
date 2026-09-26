/**
 * Issue Intake Parser
 *
 * Parses GitHub-style issue markdown and templates into structured,
 * verifiable Ticket objects, extracting acceptance conditions, evidence references,
 * and estimating intrinsic feature dimensions.
 */

import { Ticket, TicketFeatures } from './types.js';

export interface RawIssueInput {
  id: string;
  repo: string;
  title: string;
  sourceUrl: string;
  body: string;
  reportedAt?: number;
  maintainerApproved?: boolean;
  isEligible?: boolean;
}

export class IntakeParser {
  /**
   * Parses raw markdown issue text into a strongly typed Ticket.
   */
  public static parseIssue(input: RawIssueInput): Ticket {
    const { id, repo, title, sourceUrl, body, reportedAt = Date.now(), maintainerApproved = false, isEligible = true } = input;

    const affectedComponent = IntakeParser.extractComponent(body, title);
    const observedFailure = IntakeParser.extractObservedFailure(body);
    const acceptanceConditions = IntakeParser.extractAcceptanceConditions(body);
    const publicEvidence = IntakeParser.extractPublicEvidence(body);

    const features = IntakeParser.estimateFeatures(
      title,
      observedFailure,
      affectedComponent,
      acceptanceConditions,
      publicEvidence
    );

    return {
      id,
      repo,
      title: title.trim(),
      sourceUrl,
      affectedComponent,
      observedFailure,
      acceptanceConditions,
      publicEvidence,
      reportedAt,
      isEligible,
      maintainerApproved,
      features,
    };
  }

  /**
   * Extracts affected component from markdown sections or titles.
   */
  public static extractComponent(body: string, title: string): string {
    const componentRegex = /(?:###?\s*(?:Affected Component|Component|Subsystem|Module)[:\s]*\n*)([^\n#]+)/i;
    const match = body.match(componentRegex);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }

    // Heuristic: check title prefixes like [p2p], (consensus), core:
    const prefixMatch = title.match(/^(?:\[([^\]]+)\]|\(([^\)]+)\)|([a-zA-Z0-9_-]+):)/);
    if (prefixMatch) {
      return (prefixMatch[1] || prefixMatch[2] || prefixMatch[3]).trim();
    }

    return 'core/general';
  }

  /**
   * Extracts observed failure description from body.
   */
  public static extractObservedFailure(body: string): string {
    const failureRegex = /(?:###?\s*(?:Observed Failure|Problem|Bug Description|Failure Description)[:\s]*\n*)([\s\S]*?)(?=\n###?|$)/i;
    const match = body.match(failureRegex);
    if (match && match[1]?.trim()) {
      return match[1].trim();
    }

    // Fallback: take first paragraph
    const firstPara = body.split('\n\n')[0] ?? '';
    return firstPara.trim() || 'No detailed observed failure provided.';
  }

  /**
   * Extracts acceptance criteria / conditions from markdown lists or checkboxes.
   */
  public static extractAcceptanceConditions(body: string): string[] {
    const conditions: string[] = [];

    // Look for dedicated section
    const sectionRegex = /(?:###?\s*(?:Acceptance Criteria|Acceptance Conditions|Definition of Done|Requirements)[:\s]*\n*)([\s\S]*?)(?=\n###?|$)/i;
    const match = body.match(sectionRegex);
    const targetText = match ? match[1] : body;

    // Match checkboxes `- [ ] ...` or bullet items `- ...` or `* ...` or `1. ...`
    const lines = targetText.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      const checkboxMatch = trimmed.match(/^[-*]\s*\[[\sxX]\]\s*(.+)$/);
      if (checkboxMatch && checkboxMatch[1]) {
        conditions.push(checkboxMatch[1].trim());
        continue;
      }

      if (match) {
        // If inside dedicated acceptance section, also parse bullet points or numbered lists
        const bulletMatch = trimmed.match(/^(?:[-*]|\d+\.)\s+(.+)$/);
        if (bulletMatch && bulletMatch[1]) {
          conditions.push(bulletMatch[1].trim());
        }
      }
    }

    return conditions;
  }

  /**
   * Extracts public evidence links, commit hashes, CI runs, and logs.
   */
  public static extractPublicEvidence(body: string): string[] {
    const evidence: string[] = [];

    // URLs (HTTP / HTTPS / IPFS)
    const urlRegex = /(https?:\/\/[^\s\)\],]+|ipfs:\/\/[^\s\)\],]+)/gi;
    let urlMatch: RegExpExecArray | null;
    while ((urlMatch = urlRegex.exec(body)) !== null) {
      const url = urlMatch[1];
      if (!evidence.includes(url)) {
        evidence.push(url);
      }
    }

    // Git commit hashes (40-char hex)
    const commitRegex = /\b([0-9a-f]{40})\b/gi;
    let commitMatch: RegExpExecArray | null;
    while ((commitMatch = commitRegex.exec(body)) !== null) {
      const hash = `commit:${commitMatch[1]}`;
      if (!evidence.includes(hash)) {
        evidence.push(hash);
      }
    }

    // Check for explicit reproduction code block
    if (body.includes('```') && (body.toLowerCase().includes('reproduce') || body.toLowerCase().includes('trace') || body.toLowerCase().includes('panic:'))) {
      if (!evidence.includes('inline:reproduction_trace')) {
        evidence.push('inline:reproduction_trace');
      }
    }

    return evidence;
  }

  /**
   * Heuristic estimation of ticket features when explicit labels are absent.
   */
  public static estimateFeatures(
    title: string,
    failure: string,
    component: string,
    acceptanceConditions: string[],
    evidence: string[]
  ): TicketFeatures {
    const combined = `${title} ${failure} ${component}`.toLowerCase();

    // Urgency indicators
    let urgency = 0.5;
    if (/critical|panic|deadlock|race condition|consensus break|exploit|vulnerability|data loss|crash/i.test(combined)) {
      urgency = 0.90;
    } else if (/typo|doc|comment|readme|style|formatting|cleanup|refactor/i.test(combined)) {
      urgency = 0.15;
    } else if (/slow|optimize|performance|memory leak/i.test(combined)) {
      urgency = 0.65;
    }

    // Breadth indicators
    let breadthOfEffect = 0.40;
    if (/consensus|p2p|network|protocol|state machine|mempool|core/i.test(component) || /all peers|entire cluster|global/i.test(combined)) {
      breadthOfEffect = 0.85;
    } else if (/helper|util|doc|test|script|devops/i.test(component)) {
      breadthOfEffect = 0.20;
    }

    // Public benefit
    let publicBenefit = 0.50;
    if (urgency > 0.7 && breadthOfEffect > 0.6) {
      publicBenefit = 0.90;
    } else if (urgency < 0.3 && breadthOfEffect < 0.3) {
      publicBenefit = 0.25;
    }

    // Feasibility
    let feasibility = 0.50;
    if (acceptanceConditions.length >= 2) {
      feasibility = 0.80;
    } else if (acceptanceConditions.length === 1) {
      feasibility = 0.65;
    } else {
      feasibility = 0.30;
    }

    // Evidence confidence
    let evidenceConfidence = 0.30;
    if (evidence.length >= 2) {
      evidenceConfidence = 0.90;
    } else if (evidence.length === 1) {
      evidenceConfidence = 0.60;
    } else {
      evidenceConfidence = 0.20;
    }

    return {
      urgency: Number(urgency.toFixed(2)),
      breadthOfEffect: Number(breadthOfEffect.toFixed(2)),
      publicBenefit: Number(publicBenefit.toFixed(2)),
      feasibility: Number(feasibility.toFixed(2)),
      evidenceConfidence: Number(evidenceConfidence.toFixed(2)),
    };
  }

  /**
   * Validates whether a ticket satisfies basic schema invariants.
   */
  public static validate(ticket: Ticket): { isValid: boolean; errors: string[]; warnings: string[] } {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!ticket.id || ticket.id.trim().length === 0) {
      errors.push('Ticket ID is required.');
    }
    if (!ticket.repo || ticket.repo.trim().length === 0) {
      errors.push('Repository is required.');
    }
    if (!ticket.title || ticket.title.trim().length === 0) {
      errors.push('Title is required.');
    }
    if (!ticket.acceptanceConditions || ticket.acceptanceConditions.length === 0) {
      errors.push('Acceptance conditions cannot be empty.');
    }
    if (!ticket.publicEvidence || ticket.publicEvidence.length === 0) {
      warnings.push('No public evidence or links attached to ticket.');
    }
    if (!ticket.maintainerApproved) {
      warnings.push('Ticket has not yet been marked approved by maintainer.');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

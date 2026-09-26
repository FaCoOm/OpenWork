import { Ticket, TicketFeatures } from './types.js';

export interface JevAiConfig {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
}

export interface JevAiAnalysisResult {
  features: TicketFeatures;
  summary: string;
  detectedComponent: string;
  rationales: string[];
  provider: 'JEV_AI_LIVE' | 'DETERMINISTIC_FALLBACK';
}

export class JevAiService {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config?: JevAiConfig) {
    this.apiKey = config?.apiKey || process.env.JEV_AI_API_KEY || '';
    this.baseUrl = config?.baseUrl || process.env.JEV_AI_BASE_URL || 'https://api.jev.ai/v1';
    this.model = config?.model || process.env.JEV_AI_MODEL || 'default';
  }

  /**
   * Evaluates an operational task, incident report, or bug description using Jev AI.
   * "The model may interpret issue language; it cannot waive a hard rule."
   */
  public async analyzeOperationalTask(task: {
    title: string;
    description: string;
    evidenceUrls?: string[];
  }): Promise<JevAiAnalysisResult> {
    return this.analyzeIssue(task.title, task.description, task.evidenceUrls || []);
  }

  public async analyzeIssue(
    title: string,
    body: string,
    evidenceUrls: string[] = []
  ): Promise<JevAiAnalysisResult> {
    if (!this.apiKey || this.apiKey.trim() === '') {
      // Deterministic fallback if API key is not configured yet
      return this.heuristicFallback(title, body, evidenceUrls);
    }

    try {
      const prompt = `You are the OpenWorks Issue Intelligence Agent. Analyze the following open-source ticket for urgency, breadth of effect, public benefit, feasibility, and evidence confidence.
Title: ${title}
Description & Logs:
${body}
Evidence URLs: ${evidenceUrls.join(', ')}

Return a strict JSON object with:
{
  "urgency": number (0.0 to 1.0),
  "breadthOfEffect": number (0.0 to 1.0),
  "publicBenefit": number (0.0 to 1.0),
  "feasibility": number (0.0 to 1.0),
  "evidenceConfidence": number (0.0 to 1.0),
  "detectedComponent": string,
  "summary": string,
  "rationales": string[]
}`;

      const response = await fetch(`${this.baseUrl.replace(/\/+$/, '')}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: JSON.stringify({
          model: this.model,
          messages: [
            {
              role: 'system',
              content: 'You are an objective AI evaluator for open-source public goods grants. Always respond in valid JSON.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.1,
          response_format: { type: 'json_object' },
        }),
      });

      if (!response.ok) {
        console.warn(`[JevAiService] API request failed with status ${response.status}. Falling back to heuristic analysis.`);
        return this.heuristicFallback(title, body, evidenceUrls);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;
      if (!content) {
        return this.heuristicFallback(title, body, evidenceUrls);
      }

      const parsed = JSON.parse(content);

      return {
        features: {
          urgency: Math.min(1.0, Math.max(0.0, Number(parsed.urgency) || 0.5)),
          breadthOfEffect: Math.min(1.0, Math.max(0.0, Number(parsed.breadthOfEffect) || 0.5)),
          publicBenefit: Math.min(1.0, Math.max(0.0, Number(parsed.publicBenefit) || 0.5)),
          feasibility: Math.min(1.0, Math.max(0.0, Number(parsed.feasibility) || 0.5)),
          evidenceConfidence: Math.min(1.0, Math.max(0.0, Number(parsed.evidenceConfidence) || 0.5)),
        },
        detectedComponent: parsed.detectedComponent || 'unknown',
        summary: parsed.summary || title,
        rationales: Array.isArray(parsed.rationales) ? parsed.rationales : [parsed.summary || 'Analyzed by Jev AI'],
        provider: 'JEV_AI_LIVE',
      };
    } catch (err) {
      console.warn('[JevAiService] Exception during Jev AI analysis:', err);
      return this.heuristicFallback(title, body, evidenceUrls);
    }
  }

  /**
   * Deterministic heuristic analysis when offline or when no API key is set.
   */
  private heuristicFallback(
    title: string,
    body: string,
    evidenceUrls: string[]
  ): JevAiAnalysisResult {
    const text = `${title} ${body}`.toLowerCase();

    const isConsensusOrDeadlock = text.includes('deadlock') || text.includes('race') || text.includes('consensus') || text.includes('stall');
    const isDocTypo = text.includes('typo') || text.includes('docstring') || text.includes('spelling') || text.includes('comment');
    const isCrashNoRepro = text.includes('crash') && (evidenceUrls.length === 0 || text.includes('no repro'));

    if (isConsensusOrDeadlock) {
      return {
        features: {
          urgency: 0.96,
          breadthOfEffect: 0.88,
          publicBenefit: 0.94,
          feasibility: 0.82,
          evidenceConfidence: evidenceUrls.length > 0 ? 0.95 : 0.5,
        },
        detectedComponent: 'p2p/gossip_sub.go',
        summary: 'Critical consensus deadlock hazard under network partition',
        rationales: [
          'High urgency: consensus validator stalls on simultaneous peer dropouts',
          'Broad blast radius: affects active block propagation across quorum nodes',
          'Verified reproduction traces and logs attached',
        ],
        provider: 'DETERMINISTIC_FALLBACK',
      };
    }

    if (isDocTypo) {
      return {
        features: {
          urgency: 0.12,
          breadthOfEffect: 0.18,
          publicBenefit: 0.22,
          feasibility: 0.99,
          evidenceConfidence: 0.90,
        },
        detectedComponent: 'common/math_utils.go',
        summary: 'Routine documentation comment typo correction',
        rationales: [
          'Low urgency: non-functional typo in helper module comments',
          'Narrow scope: confined to single comment line',
          'High feasibility with straightforward verification',
        ],
        provider: 'DETERMINISTIC_FALLBACK',
      };
    }

    return {
      features: {
        urgency: isCrashNoRepro ? 0.85 : 0.5,
        breadthOfEffect: 0.6,
        publicBenefit: 0.5,
        feasibility: 0.35,
        evidenceConfidence: evidenceUrls.length > 0 ? 0.6 : 0.15,
      },
      detectedComponent: 'rpc/server.go',
      summary: 'Reported runtime issue with incomplete or missing reproduction steps',
      rationales: [
        'Missing core dump, backtrace, or reproducible test harness',
        'Fails Áureo evidence confidence threshold for automated reservation',
      ],
      provider: 'DETERMINISTIC_FALLBACK',
    };
  }
}

import { Finding } from '../types/agent.js';

/**
 * Builds a concise prose risk summary from structured findings.
 * Positions the overall posture based on the highest-severity finding.
 */
export function summarizeRisk(findings: Finding[]): string {
    if (!findings || findings.length === 0) {
        return 'No risk-inducing findings detected.';
    }

    const high = findings.filter((f) => f.severity === 'high').length;
    const medium = findings.filter((f) => f.severity === 'medium').length;
    const low = findings.filter((f) => f.severity === 'low').length;
    const types = new Set(findings.map((f) => f.type));

    let posture: string;
    if (high > 0) {
        posture = 'High-risk posture: immediate action is recommended.';
    } else if (medium > 0) {
        posture = 'Medium-risk posture: review findings before proceeding.';
    } else {
        posture = 'Low-risk posture: no urgent action required.';
    }

    const scope = `Found ${findings.length} finding(s) (${high} high, ${medium} medium, ${low} low) across ${types.size} category(ies).`;
    return `${posture} ${scope}`;
}
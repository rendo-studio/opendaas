export const GUIDE_HINT = "Run `opendaas guide` for the canonical Agent-first OpenDaaS Workflow Guide.";

export function withGuideHint(description: string): string {
  return `${description.trim()} ${GUIDE_HINT}`;
}

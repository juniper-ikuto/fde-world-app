// ── Role keyword mapping ──
// Shared between client components and the server-only DB module.

export const ROLE_KEYWORDS: Record<string, string[]> = {
  se: ["solutions engineer", "solutions consultant"],
  fde: ["forward deployed engineer", "fde"],
  presales: ["pre-sales", "presales", "sales engineer"],
  tam: [
    "technical account manager",
    "customer engineer",
  ],
  impl: [
    "implementation engineer",
    "integration engineer",
  ],
  deployment: [
    "deployment strategist",
    "deployment engineer",
  ],
  cse: [
    "customer success engineer",
    "customer success manager",
  ],
};

export const ROLE_LABELS: Record<string, string> = {
  fde: "Forward Deployed Engineer",
  se: "Solutions Engineer",
  presales: "Pre-Sales / Sales Engineer",
  tam: "Technical Account Manager",
  impl: "Implementation Engineer",
  deployment: "Deployment Strategist",
  cse: "Customer Success Engineer",
};

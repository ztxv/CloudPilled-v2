import type { Domain, DomainId, TaskStatement } from './types';

/**
 * Source: AWS Certified Cloud Practitioner (CLF-C02) Exam Guide, version 1.0,
 * https://d1.awsstatic.com/training-and-certification/docs-cloud-practitioner/AWS-Certified-Cloud-Practitioner_Exam-Guide.pdf
 * Verified against the AWS certification page on 2026-11-24.
 */
export const EXAM = {
  code: 'CLF-C02',
  name: 'AWS Certified Cloud Practitioner',
  totalQuestions: 65,
  scoredQuestions: 50,
  unscoredQuestions: 15,
  minutes: 90,
  passingScaled: 700,
  scaleMin: 100,
  scaleMax: 1000,
  guideUrl:
    'https://d1.awsstatic.com/training-and-certification/docs-cloud-practitioner/AWS-Certified-Cloud-Practitioner_Exam-Guide.pdf',
  pageUrl: 'https://aws.amazon.com/certification/certified-cloud-practitioner/',
  verifiedOn: '2026-11-24',
} as const;

export const DOMAINS: Domain[] = [
  {
    id: 1,
    name: 'Cloud Concepts',
    short: 'Concepts',
    weight: 24,
    blurb: 'Why cloud, how AWS thinks about good design, how teams migrate, and the economics behind it.',
  },
  {
    id: 2,
    name: 'Security and Compliance',
    short: 'Security',
    weight: 30,
    blurb: 'Who secures what, how access is controlled, and which services protect, monitor, and audit.',
  },
  {
    id: 3,
    name: 'Cloud Technology and Services',
    short: 'Services',
    weight: 34,
    blurb: 'Global infrastructure and the core compute, database, network, storage, AI, and integration services.',
  },
  {
    id: 4,
    name: 'Billing, Pricing, and Support',
    short: 'Billing',
    weight: 12,
    blurb: 'Pricing models, cost tools, consolidated billing, support options, and where to get help.',
  },
];

export const TASKS: TaskStatement[] = [
  { id: '1.1', domain: 1, title: 'Define the benefits of the AWS Cloud.' },
  { id: '1.2', domain: 1, title: 'Identify design principles of the AWS Cloud.' },
  { id: '1.3', domain: 1, title: 'Understand the benefits of and strategies for migration to the AWS Cloud.' },
  { id: '1.4', domain: 1, title: 'Understand concepts of cloud economics.' },
  { id: '2.1', domain: 2, title: 'Understand the AWS shared responsibility model.' },
  { id: '2.2', domain: 2, title: 'Understand AWS Cloud security, governance, and compliance concepts.' },
  { id: '2.3', domain: 2, title: 'Identify AWS access management capabilities.' },
  { id: '2.4', domain: 2, title: 'Identify components and resources for security.' },
  { id: '3.1', domain: 3, title: 'Define methods of deploying and operating in the AWS Cloud.' },
  { id: '3.2', domain: 3, title: 'Define the AWS global infrastructure.' },
  { id: '3.3', domain: 3, title: 'Identify AWS compute services.' },
  { id: '3.4', domain: 3, title: 'Identify AWS database services.' },
  { id: '3.5', domain: 3, title: 'Identify AWS network services.' },
  { id: '3.6', domain: 3, title: 'Identify AWS storage services.' },
  {
    id: '3.7',
    domain: 3,
    title: 'Identify AWS artificial intelligence and machine learning (AI/ML) services and analytics services.',
  },
  { id: '3.8', domain: 3, title: 'Identify services from other in-scope AWS service categories.' },
  { id: '4.1', domain: 4, title: 'Compare AWS pricing models.' },
  { id: '4.2', domain: 4, title: 'Understand resources for billing, budget, and cost management.' },
  { id: '4.3', domain: 4, title: 'Identify AWS technical resources and AWS Support options.' },
];

export const domainById = (id: DomainId): Domain => {
  const d = DOMAINS.find((x) => x.id === id);
  if (!d) throw new Error(`Unknown domain ${id}`);
  return d;
};

export const taskById = (id: string): TaskStatement | undefined => TASKS.find((t) => t.id === id);

export const tasksForDomain = (id: DomainId): TaskStatement[] => TASKS.filter((t) => t.domain === id);

/**
 * Split n questions across domains in proportion to the published weights
 * (largest-remainder method). 65 → 16 / 19 / 22 / 8.
 */
export function domainMix(n: number): Record<DomainId, number> {
  const raw = DOMAINS.map((d) => ({ id: d.id, exact: (n * d.weight) / 100 }));
  const out = Object.fromEntries(raw.map((r) => [r.id, Math.floor(r.exact)])) as Record<DomainId, number>;
  let left = n - Object.values(out).reduce((a, b) => a + b, 0);
  const order = [...raw].sort((a, b) => (b.exact % 1) - (a.exact % 1));
  for (const r of order) {
    if (left <= 0) break;
    out[r.id] += 1;
    left -= 1;
  }
  return out;
}

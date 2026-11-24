import { S } from '../builders';
import type { Lesson } from '../types';

export const DOMAIN4_LESSONS: Lesson[] = [
  {
    id: 'pricing-models',
    domain: 4,
    tasks: ['4.1'],
    title: 'How AWS pricing works',
    summary: 'On-Demand, Savings Plans, Reserved, Spot, and dedicated options, plus data transfer and storage pricing.',
    minutes: 10,
    objectives: [
      'Choose the right compute purchasing option for a workload pattern.',
      'Compare Savings Plans with Reserved Instances and describe their flexibility.',
      'Explain which data transfer is generally free and which is charged.',
      'Explain how storage tiers affect price.',
    ],
    blocks: [
      {
        t: 'p',
        x: 'AWS pricing rests on three ideas: **pay for what you use**, **pay less when you commit** to steady usage, and **pay less per unit as you use more**. For compute, the question is almost always: how predictable is the workload, and can it tolerate interruption?',
      },
      {
        t: 'compare',
        title: 'Compute purchasing options',
        cols: ['Option', 'How it works', 'Pick it when…'],
        rows: [
          ['On-Demand', 'Pay for compute by the second or hour with no commitment.', 'Workloads are short, spiky, or unpredictable, or you are just starting out.'],
          ['Savings Plans', 'Commit to a consistent amount of usage (measured in $/hour) for 1 or 3 years in exchange for lower prices. Compute Savings Plans apply flexibly across instance families, Regions, and services such as Fargate and Lambda; EC2 Instance Savings Plans are tied to a family in a Region.', 'Usage is steady and you want savings with flexibility.'],
          ['Reserved Instances (RIs)', 'Commit to specific instance configurations for 1 or 3 years for a lower rate. Convertible RIs allow changing instance attributes; Standard RIs are less flexible.', 'Workloads are steady and predictable.'],
          ['Spot Instances', 'Use spare EC2 capacity at a steep discount; AWS can reclaim it with short notice.', 'Fault-tolerant, flexible, interruptible work such as batch jobs.'],
          ['Dedicated Hosts', 'A physical server fully dedicated to you.', 'Compliance rules or licenses tied to physical sockets/cores.'],
          ['Dedicated Instances', 'Instances that run on hardware dedicated to a single customer account.', 'You need hardware isolation without managing the whole host.'],
          ['Capacity Reservations', 'Reserve EC2 capacity in a specific Availability Zone for any duration.', 'You must be sure capacity is available when needed.'],
        ],
        caption: 'Savings Plans and Reserved Instances reduce the *price*. Capacity Reservations guarantee *availability*. They solve different problems.',
      },
      {
        t: 'callout',
        kind: 'confusion',
        title: 'Reserved Instances in AWS Organizations',
        x: 'With consolidated billing, Reserved Instance discounts can be shared across the accounts in an organization, so unused reservations in one account can benefit another.',
      },
      { t: 'h', x: 'Data transfer' },
      {
        t: 'ul',
        items: [
          '**Data transfer into AWS** from the internet is generally free.',
          '**Data transfer out to the internet** is charged, usually with volume-based tiers.',
          '**Between Regions** is charged; moving data **between Availability Zones** in a Region can also incur charges.',
          'Traffic that stays within the same AZ over private addresses is generally free.',
        ],
      },
      {
        t: 'p',
        x: 'Rule of thumb: **in is cheap, out and across are not.** Using a CDN such as CloudFront and keeping chatty components together can reduce data-transfer cost.',
      },
      { t: 'h', x: 'Storage pricing' },
      {
        t: 'p',
        x: 'Storage price depends on the **service**, the **tier or class** (frequent-access classes cost more per GB to store but less to retrieve), the **amount** stored, and sometimes **requests and retrieval**. Use S3 Lifecycle policies and Intelligent-Tiering to move data to cheaper tiers automatically.',
      },
      {
        t: 'callout',
        kind: 'note',
        title: 'Free Tier',
        x: 'AWS offers a Free Tier for exploring services, but its structure and limits change over time. Check the current Free Tier page rather than relying on remembered numbers.',
      },
    ],
    checks: [
      S('c-pr-1', '4.1', 'Which EC2 purchasing option is best for a fault-tolerant batch job that can be interrupted?', 'Spot Instances', ['On-Demand Instances :: Reliable but at a higher price than this use case needs.', 'Dedicated Hosts :: These address licensing and compliance needs.', 'Capacity Reservations :: These guarantee capacity rather than reduce cost.'], 'fault-tolerant … interrupted', 'Spot suits interruptible, flexible workloads at the lowest cost.', ['spot']),
      S('c-pr-2', '4.1', 'Which option commits a company to a consistent amount of compute usage for one or three years in exchange for lower prices, with flexibility across instance families?', 'Compute Savings Plans', ['On-Demand Instances :: No commitment and no discount.', 'Spot Instances :: These have no commitment but can be interrupted.', 'Dedicated Hosts :: These are physical servers.'], 'commits … consistent amount … flexibility across instance families', 'Compute Savings Plans trade commitment for flexible savings.', ['savings-plans']),
      S('c-pr-3', '4.1', 'Which data transfer is generally free?', 'Data transferred in to AWS from the internet', ['Data transferred out to the internet :: Outbound data transfer to the internet is charged, so it is not the free case.', 'Data transferred between Regions :: Inter-Region data transfer is charged, so it is not the free case.', 'Data transferred between Availability Zones :: This can be charged.'], 'generally free', 'Inbound data transfer from the internet is generally not charged.', ['ec2-pricing']),
    ],
    refs: ['ec2-pricing', 'purchasing-options', 'savings-plans', 'reserved-instances', 'spot', 'dedicated-hosts', 'capacity-reservations', 'free-tier'],
  },
  {
    id: 'cost-management',
    domain: 4,
    tasks: ['4.2'],
    title: 'Estimating, tracking, and controlling cost',
    summary: 'Pricing Calculator, Cost Explorer, Budgets, tags, Cost and Usage Report, and consolidated billing.',
    minutes: 9,
    objectives: [
      'Pick the right cost tool: estimate, analyze, alert, or report.',
      'Explain consolidated billing in AWS Organizations.',
      'Describe cost allocation tags and how they connect to billing reports.',
    ],
    blocks: [
      {
        t: 'compare',
        title: 'Which cost tool?',
        cols: ['Tool', 'Answers…', 'Clue'],
        rows: [
          ['AWS Pricing Calculator', 'What will this architecture cost *before* I build it?', '"estimate", "before deploying"'],
          ['AWS Cost Explorer', 'Where has my money gone, and what is the trend? Visualize and analyze past costs and usage, with forecasts.', '"analyze spending over time"'],
          ['AWS Budgets', 'Tell me when I exceed (or am forecast to exceed) a cost or usage threshold.', '"alert", "threshold"'],
          ['AWS Cost and Usage Report (CUR)', 'Give me the most detailed cost and usage data to analyze myself.', '"most detailed", "line-item data"'],
          ['AWS Billing Conductor', 'Customize billing data and pricing views for chargeback or showback to business units or customers.', '"custom pricing for internal billing"'],
        ],
      },
      {
        t: 'callout',
        kind: 'tip',
        title: 'Before / during / after',
        x: '**Before** you build: Pricing Calculator. **While** running: Budgets to alert you. **After**: Cost Explorer to analyze, CUR for deep dives.',
      },
      { t: 'h', x: 'Cost allocation tags' },
      {
        t: 'p',
        x: '**Tags** are key-value labels on resources, such as `project=website` or `team=data`. **Cost allocation tags** let you group costs by those labels. You must **activate** them in the billing console, and then they appear in cost reports such as Cost Explorer and the Cost and Usage Report. There are **AWS-generated** tags and **user-defined** tags.',
      },
      { t: 'h', x: 'AWS Organizations and consolidated billing' },
      {
        t: 'ul',
        items: [
          '**AWS Organizations** lets you centrally manage multiple AWS accounts, including applying policies.',
          '**Consolidated billing** combines the charges of all accounts in an organization into **one bill** paid by the management account.',
          'Combined usage can reach **volume pricing discounts** sooner, and Savings Plans and Reserved Instance discounts can be **shared** across accounts.',
        ],
      },
      {
        t: 'ul',
        items: [
          '**AWS Compute Optimizer** and **AWS Trusted Advisor** identify rightsizing and other cost-saving opportunities.',
          'Official **AWS pricing pages** for each service list current prices; prices vary by Region.',
        ],
      },
    ],
    checks: [
      S('c-cost-1', '4.2', 'Which tool estimates the cost of an architecture before it is deployed?', 'AWS Pricing Calculator', ['AWS Cost Explorer :: Analyzes costs you have already incurred.', 'AWS Budgets :: Alerts on thresholds.', 'AWS Trusted Advisor :: Gives recommendations about existing resources.'], 'estimates … before it is deployed', 'The Pricing Calculator models future cost.', ['pricing-calculator']),
      S('c-cost-2', '4.2', 'Which tool sends an alert when actual or forecast spending exceeds a threshold?', 'AWS Budgets', ['AWS Pricing Calculator :: The Pricing Calculator estimates planned costs; it does not alert on spending thresholds.', 'AWS Cost and Usage Report :: Provides detailed data but not threshold alerts.', 'AWS CloudTrail :: Records API calls.'], 'alert … exceeds a threshold', 'Budgets tracks spending against thresholds and notifies you.', ['budgets']),
      S('c-cost-3', '4.2', 'What is a benefit of consolidated billing in AWS Organizations?', 'A single bill for multiple accounts, with combined usage that can qualify for volume discounts', ['Automatic deletion of unused resources :: Billing features do not delete resources.', 'Free support for all accounts :: Support plans are separate.', 'Unlimited free data transfer :: Consolidated billing does not make data transfer free.'], 'consolidated billing', 'Consolidated billing provides one bill and aggregated usage for volume pricing.', ['consolidated-billing']),
    ],
    refs: ['pricing-calculator', 'cost-explorer', 'budgets', 'cur', 'billing-conductor', 'cost-tags', 'consolidated-billing', 'organizations', 'compute-optimizer'],
  },
  {
    id: 'support-plans',
    domain: 4,
    tasks: ['4.3'],
    title: 'AWS Support plans',
    summary: 'What Basic support includes, how paid tiers differ, and what a Technical Account Manager is — with both plan-name generations.',
    minutes: 8,
    objectives: [
      'Describe what every AWS customer gets with Basic Support.',
      'Explain how paid support tiers differ in response time, access, and proactive help.',
      'Know which tier level includes a designated Technical Account Manager (TAM).',
      'Recognize both the exam guide’s plan names and AWS’s current plan names.',
    ],
    blocks: [
      {
        t: 'callout',
        kind: 'warn',
        title: 'Plan names have changed since the exam guide',
        x: 'The CLF-C02 exam guide names **Developer, Business, Enterprise On-Ramp, and Enterprise** support. AWS’s current Support pages list **Basic, Business Support+, Enterprise Support, and Unified Operations**, and state that Developer, Business, and Enterprise On-Ramp are discontinued on January 1, 2027. Learn the *tiers and what each adds*; if an exam question uses the older names, the concepts below still apply.',
      },
      { t: 'h', x: 'Basic Support: included for everyone' },
      {
        t: 'ul',
        items: [
          '24/7 access to customer service for **account and billing questions** and service quota increases.',
          'Access to documentation, whitepapers, support forums (AWS re:Post), and best-practice guides.',
          '**AWS Health** (service health and your account’s events) and a **limited set of AWS Trusted Advisor checks**.',
          '**No** technical support cases with engineers.',
        ],
      },
      { t: 'h', x: 'Paid tiers: what changes as you go up' },
      {
        t: 'compare',
        title: 'The ladder (concepts, both naming generations)',
        cols: ['Level', 'Guide naming', 'Current naming', 'What the level adds'],
        rows: [
          ['Entry paid', 'Developer', '(discontinued Jan 1, 2027)', 'Technical support for testing and early development; slower response targets.'],
          ['Production', 'Business', 'Business Support+', '24/7 technical support by phone, web, and chat; faster response for production issues; full set of Trusted Advisor checks.'],
          ['Business-critical', 'Enterprise On-Ramp', '(discontinued; moves to Enterprise Support)', 'Faster response for business-critical systems and access to a pool of Technical Account Managers.'],
          ['Enterprise', 'Enterprise', 'Enterprise Support', 'Fastest response for business-critical issues, a **designated Technical Account Manager (TAM)**, proactive guidance and reviews.'],
          ['Mission-critical (new)', '—', 'Unified Operations', 'Designated experts and enhanced operations for mission-critical workloads.'],
        ],
        caption: 'Higher tiers cost more and bring faster response times, more proactive help, and more personal AWS contacts.',
      },
      {
        t: 'callout',
        kind: 'tip',
        title: 'The most testable facts',
        x: '**Basic** is free and has no technical support. **24/7 technical support from engineers** needs a paid tier. A **designated TAM** points to the **Enterprise** level. Higher tier = faster guaranteed response for severe issues.',
      },
      {
        t: 'p',
        x: 'Exact response-time targets, prices, and feature lists are updated by AWS; use the Compare Support Plans page for current details rather than memorizing numbers.',
      },
    ],
    checks: [
      S('c-sup-1', '4.3', 'Which support is included for all AWS customers at no additional cost?', 'Basic Support', ['Business-level support :: Business-level support is a paid tier, so it is not included at no extra cost.', 'Enterprise-level support :: Enterprise-level support is a paid tier, so it is not included at no extra cost.', 'AWS Managed Services :: A separate paid service.'], 'included for all … no additional cost', 'Basic Support is available to every customer.', ['support-plans']),
      S('c-sup-2', '4.3', 'A company wants a designated Technical Account Manager (TAM). Which level of AWS Support provides this?', 'Enterprise-level support', ['Basic Support :: Basic Support does not include a designated Technical Account Manager.', 'Business-level support :: No designated TAM at this level.', 'AWS re:Post :: A community forum.'], 'designated Technical Account Manager', 'The designated TAM is a feature of the Enterprise level.', ['support-plans']),
      S('c-sup-3', '4.3', 'Which capability requires a paid AWS Support tier rather than Basic Support?', '24/7 technical support from cloud support engineers by phone or chat', ['Access to AWS documentation :: Available to all.', 'Account and billing support :: Included with Basic.', 'Participation in AWS re:Post :: Available to all.'], 'requires a paid AWS Support tier', 'Technical support cases with engineers need a paid tier.', ['support-plans']),
    ],
    refs: ['support-plans-page', 'support-plans', 'support-start', 'trusted-advisor', 'health'],
  },
  {
    id: 'technical-resources',
    domain: 4,
    tasks: ['4.3'],
    title: 'Getting help: resources, partners, and expert assistance',
    summary: 'Documentation, re:Post, Health, Trusted Advisor, abuse reporting, the partner network, and AWS experts.',
    minutes: 7,
    objectives: [
      'Know where to find documentation, whitepapers, and community answers.',
      'Explain what AWS Health and AWS Trusted Advisor are for.',
      'Describe the roles of AWS Partners, AWS Marketplace, Professional Services, and Solutions Architects.',
      'Know where to report abuse of AWS resources.',
    ],
    blocks: [
      { t: 'h', x: 'Official places to learn and ask' },
      {
        t: 'compare',
        title: 'Technical resources',
        cols: ['Resource', 'Use it for'],
        rows: [
          ['AWS Documentation and Whitepapers', 'Authoritative technical guides, user guides, and in-depth papers.'],
          ['AWS Knowledge Center', 'Answers to the most commonly asked support questions, with step-by-step fixes.'],
          ['AWS re:Post', 'Community Q&A with AWS and community experts.'],
          ['AWS Prescriptive Guidance', 'Time-tested strategies, guides, and patterns, for example for migrations and modernization.'],
          ['AWS Architecture Center', 'Reference architectures and diagrams.'],
          ['AWS Blogs', 'Announcements, how-tos, and best practices.'],
        ],
      },
      { t: 'h', x: 'Monitoring your environment' },
      {
        t: 'ul',
        items: [
          '**AWS Health** (the AWS Health Dashboard and AWS Health API) shows service health and events that affect *your* resources, so you can plan around them.',
          '**AWS Trusted Advisor** gives recommendations on cost optimization, security, performance, fault tolerance, and more. The set of checks available depends on your support plan.',
          'The **AWS Trust and Safety** team receives reports of abuse of AWS resources, such as spam, malware, or suspected misuse; use AWS’s abuse-reporting form.',
        ],
      },
      { t: 'h', x: 'People and partners' },
      {
        t: 'compare',
        title: 'Who can help',
        cols: ['Option', 'What they provide'],
        rows: [
          ['AWS Partner Network (APN) / AWS Partners', 'Independent software vendors (ISVs) that build software on AWS, and system integrators that help design, migrate, and manage. Benefits for partners include training and certification, events, and co-selling opportunities.'],
          ['AWS Marketplace', 'A catalog for finding and buying third-party software, data, and services, with billing consolidated through AWS.'],
          ['AWS Professional Services', 'AWS’s own consultants who help customers achieve specific cloud outcomes.'],
          ['AWS Solutions Architects', 'Help customers design effective architectures on AWS.'],
        ],
      },
      {
        t: 'callout',
        kind: 'confusion',
        title: 'Professional Services vs. Partners',
        x: 'Professional Services are **AWS’s own** consultants. Partners are **independent companies** (ISVs and system integrators) in the AWS ecosystem.',
      },
    ],
    checks: [
      S('c-res-1', '4.3', 'Where can a customer find answers to commonly asked support questions with step-by-step resolutions?', 'AWS Knowledge Center', ['AWS Artifact :: This provides compliance reports.', 'AWS Budgets :: This tracks spending.', 'AWS Snowball :: This transfers data.'], 'commonly asked support questions', 'The Knowledge Center curates frequent questions and fixes.', ['knowledge-center']),
      S('c-res-2', '4.3', 'Which AWS offering provides a personalized view of AWS service events that may affect a customer’s resources?', 'AWS Health Dashboard', ['AWS Trusted Advisor :: Gives best-practice recommendations.', 'AWS Pricing Calculator :: The Pricing Calculator estimates planned costs; it does not report AWS service events.', 'Amazon Macie :: Finds sensitive data.'], 'events that may affect a customer’s resources', 'AWS Health reports events relevant to your account.', ['health']),
      S('c-res-3', '4.3', 'Which team helps customers achieve specific cloud outcomes as AWS’s own consultants?', 'AWS Professional Services', ['AWS Partner Network :: Independent companies.', 'AWS Marketplace :: A software catalog.', 'AWS re:Post :: A community forum.'], 'AWS’s own consultants', 'Professional Services are AWS’s consulting organization.', ['professional-services']),
    ],
    refs: ['whitepapers', 'knowledge-center', 'repost', 'prescriptive', 'architecture-center', 'health', 'trusted-advisor', 'report-abuse', 'partners', 'marketplace', 'professional-services'],
  },
];

import type { ConceptCard } from './types';

const C = (id: string, task: string, front: string, back: string, ref: string, points?: string[]): ConceptCard => ({
  id: `concept:${id}`, task, front, back, ref, ...(points ? { points } : {}),
});

/**
 * Concept flashcards: lists, comparisons, and rules that the exam asks you to recall.
 * Service-by-service cards come from the atlas; these cover the ideas between the services.
 * Ids are permanent: review schedules are keyed on them.
 */
export const CONCEPTS: ConceptCard[] = [
  // ───── Domain 1 ─────
  C('six-advantages', '1.1', 'What are the six advantages of cloud computing?', 'Variable expense, economies of scale, no capacity guessing, speed and agility, no data-center upkeep, and going global in minutes.', 'six-advantages', [
    'Trade fixed expense for variable expense', 'Benefit from massive economies of scale', 'Stop guessing capacity', 'Increase speed and agility', 'Stop spending money running and maintaining data centers', 'Go global in minutes']),
  C('elasticity', '1.1', 'Elasticity vs. scalability: what is the difference?', 'Elasticity is scalability that happens automatically in both directions.', 'six-advantages', [
    'Scalability: able to handle growth by adding resources', 'Elasticity: capacity grows and shrinks automatically with demand', 'Clue for elasticity: capacity shrinks again to save money']),
  C('service-models', '1.1', 'IaaS vs. PaaS vs. SaaS: who manages what?', 'IaaS: you manage the OS and up. PaaS: you manage only your code and data. SaaS: you just use the finished product.', 'cloud-models', [
    'IaaS example: Amazon EC2', 'PaaS example: AWS Elastic Beanstalk', 'SaaS example: a web-based email or CRM product']),
  C('six-pillars', '1.2', 'Name the six pillars of the Well-Architected Framework.', 'Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, Sustainability.', 'waf-framework', [
    'Sustainability is the newest pillar', 'Reliability = recover from failure; Performance Efficiency = choose the right resources']),
  C('reliability-vs-performance', '1.2', 'Reliability vs. Performance Efficiency: how do you tell them apart in a question?', 'Keeping the system up or recovering from failure is Reliability. Choosing efficient resource types for the workload is Performance Efficiency.', 'waf-framework'),
  C('design-principles', '1.2', 'Which design habits keep appearing in answers?', 'Stop guessing capacity, automate, design for failure, loosely couple components, prefer managed and serverless services, decide with data.', 'waf-framework'),
  C('caf-perspectives', '1.3', 'Name the six perspectives of the AWS Cloud Adoption Framework.', 'Business, People, Governance, Platform, Security, Operations.', 'caf-page', [
    'Business: investments line up with business outcomes', 'People: culture, leadership, workforce', 'Governance: orchestrate initiatives, manage risk', 'Platform: build and operate the cloud platform', 'Security: confidentiality, integrity, availability', 'Operations: services delivered at the level the business needs']),
  C('seven-rs', '1.3', 'What are the 7 Rs of migration?', 'Rehost, Replatform, Refactor, Repurchase, Relocate, Retain, Retire.', 'migration-strategies', [
    'Rehost = lift and shift, no changes', 'Replatform = small optimizations, such as moving to a managed database', 'Refactor = redesign to be cloud native', 'Repurchase = switch to a different product, often SaaS', 'Retain = keep as is for now; Retire = decommission']),
  C('migration-tools', '1.3', 'Which service migrates a database, and which converts its schema?', 'AWS DMS moves the data (including continuous replication). AWS SCT converts the schema when the engines differ.', 'dms'),
  C('capex-opex', '1.4', 'Fixed (capital) vs. variable (operating) expense in the cloud?', 'The cloud swaps large upfront purchases for pay-as-you-go costs that follow usage.', 'six-advantages', [
    'Compare total cost of ownership (TCO): facilities, power, hardware, staff, licenses']),
  C('byol', '1.4', 'BYOL vs. license included?', 'BYOL: use licenses you already own. License included: the license cost is part of the AWS price.', 'license-manager'),
  C('rightsizing', '1.4', 'What is rightsizing, and which tool recommends it?', 'Matching resource size to what the workload really needs. AWS Compute Optimizer recommends better-sized resources.', 'compute-optimizer'),

  // ───── Domain 2 ─────
  C('srm-split', '2.1', 'Security “of” the cloud vs. security “in” the cloud?', 'AWS secures the infrastructure that runs AWS services (of the cloud). You secure what you put in it and how you configure it (in the cloud).', 'shared-resp', [
    'AWS: facilities, hardware, hypervisor, global network', 'You: data, IAM access, guest OS patching, firewall rules, encryption choices']),
  C('shared-controls', '2.1', 'Give examples of shared controls.', 'Patch management, configuration management, and awareness and training apply to both AWS and you, in different layers.', 'shared-resp', [
    'Patching: AWS patches the infrastructure, you patch your guest OS and apps']),
  C('srm-by-service', '2.1', 'How does responsibility shift across EC2, RDS, and Lambda?', 'More managed means more done by AWS: EC2 you patch the guest OS; RDS AWS patches the engine and OS; Lambda AWS manages the servers. You always own your data and access.', 'shared-resp'),
  C('artifact-vs-audit', '2.2', 'AWS Artifact vs. AWS Audit Manager?', 'Artifact: AWS’s own compliance reports and agreements. Audit Manager: evidence about your usage for your audits.', 'artifact'),
  C('trail-watch-config', '2.2', 'CloudTrail vs. CloudWatch vs. Config?', 'CloudTrail records who did what (API activity). CloudWatch watches performance (metrics, logs, alarms). Config records configuration and its changes against rules.', 'cloudtrail'),
  C('guardduty-inspector', '2.2', 'GuardDuty vs. Inspector?', 'GuardDuty detects active threats in logs and behavior. Inspector scans workloads for vulnerabilities.', 'guardduty'),
  C('security-services', '2.2', 'Macie, Detective, Security Hub: what is each for?', 'Macie finds sensitive data in S3. Detective investigates the root cause of findings. Security Hub aggregates and prioritizes security findings.', 'security-hub'),
  C('encryption-states', '2.2', 'Encryption in transit vs. at rest?', 'In transit protects data moving over a network (TLS/HTTPS). At rest protects stored data (S3, EBS, RDS).', 's3-encryption'),
  C('kms-hsm-acm', '2.2', 'KMS vs. CloudHSM vs. Certificate Manager?', 'KMS creates and controls encryption keys. CloudHSM is a dedicated hardware module you control. ACM provisions TLS certificates.', 'kms'),
  C('iam-parts', '2.3', 'IAM users, groups, roles, and policies?', 'Users are identities with long-term credentials. Groups collect users. Roles are assumed for temporary credentials. Policies are JSON documents that define permissions.', 'iam'),
  C('root-user', '2.3', 'How do you protect the root user?', 'Enable MFA, avoid access keys, and use it only for tasks that require it, such as closing the account.', 'iam-root-tasks'),
  C('least-privilege', '2.3', 'What is least privilege?', 'Grant only the permissions needed to do a job, and no more.', 'iam-best'),
  C('identity-center-cognito', '2.3', 'IAM Identity Center vs. Cognito?', 'Identity Center: your workforce signing in to AWS accounts and business apps. Cognito: your app’s customers signing in to your application.', 'iam-identity-center'),
  C('sg-vs-nacl', '2.4', 'Security group vs. network ACL?', 'Security group: stateful, instance level, allow rules only. Network ACL: stateless, subnet level, allow and deny rules.', 'security-groups'),
  C('waf-vs-shield', '2.4', 'AWS WAF vs. AWS Shield?', 'WAF filters web requests for exploits like SQL injection. Shield defends against DDoS attacks; Shield Standard is included automatically.', 'waf'),
  C('trusted-advisor', '2.4', 'What does Trusted Advisor do?', 'It inspects your environment and recommends improvements across cost, performance, security, fault tolerance, quotas, and operations. Available checks depend on your support plan.', 'trusted-advisor'),

  // ───── Domain 3 ─────
  C('access-methods', '3.1', 'Console, CLI, SDK, or infrastructure as code?', 'Console for exploring and one-offs. CLI for scripting. SDKs for code. Infrastructure as code (CloudFormation) for repeatable environments.', 'cli'),
  C('vpn-vs-dx', '3.1', 'Site-to-Site VPN vs. Direct Connect?', 'VPN: encrypted tunnel over the internet, quick to set up. Direct Connect: dedicated private connection with consistent performance.', 'direct-connect'),
  C('region-az-edge', '3.2', 'Region vs. Availability Zone vs. edge location?', 'A Region is a geographic area with multiple isolated Availability Zones (data centers). Edge locations cache content close to users.', 'regions-az'),
  C('multi-az-multi-region', '3.2', 'When do you use multiple AZs, and when multiple Regions?', 'Multiple AZs for high availability. Multiple Regions for disaster recovery, lower latency worldwide, and data sovereignty.', 'global-infra'),
  C('edge-offerings', '3.2', 'Local Zones vs. Wavelength vs. Outposts?', 'Local Zones: compute near a big city. Wavelength: inside telecom 5G networks. Outposts: AWS infrastructure in your own data center.', 'local-zones'),
  C('ec2-families', '3.3', 'Which EC2 family for which workload?', 'General purpose is balanced. Compute optimized for CPU-heavy work. Memory optimized for in-memory data. Storage optimized for fast local disk. Accelerated for GPUs.', 'ec2-types'),
  C('containers', '3.3', 'ECS vs. EKS vs. Fargate?', 'ECS: AWS-native container orchestration. EKS: managed Kubernetes. Fargate: serverless compute that runs containers for either, with no servers to manage.', 'ecs'),
  C('elb-autoscaling', '3.3', 'What do a load balancer and Auto Scaling each do?', 'A load balancer spreads traffic across healthy targets. Auto Scaling adds and removes instances to match demand, which gives elasticity.', 'elb'),
  C('rds-vs-dynamo', '3.4', 'RDS/Aurora vs. DynamoDB?', 'Relational, SQL, joins and transactions: RDS or Aurora. Massive scale with simple key lookups and a flexible schema: DynamoDB.', 'rds'),
  C('multi-az-vs-replica', '3.4', 'RDS Multi-AZ vs. read replicas?', 'Multi-AZ keeps a standby in another AZ for automatic failover (availability). Read replicas serve extra read traffic (scaling reads).', 'rds-multi-az'),
  C('cache-vs-memorydb', '3.4', 'ElastiCache vs. MemoryDB?', 'ElastiCache is an in-memory cache in front of a database. MemoryDB is a durable, Redis-compatible in-memory database.', 'memorydb'),
  C('vpc-parts', '3.5', 'Public subnet, private subnet, internet gateway, NAT gateway?', 'Public subnets route to the internet through an internet gateway. Private subnets reach out through a NAT gateway but are not reachable from the internet.', 'vpc'),
  C('cf-vs-ga', '3.5', 'CloudFront vs. Global Accelerator?', 'CloudFront caches content at edge locations. Global Accelerator does not cache; it routes traffic over the AWS network using static anycast IPs.', 'cloudfront'),
  C('storage-types', '3.6', 'S3 vs. EBS vs. EFS?', 'S3: objects over HTTP at huge scale. EBS: a disk for one EC2 instance. EFS: a shared file system many instances can mount.', 's3'),
  C('s3-classes', '3.6', 'How do you choose an S3 storage class?', 'Standard for frequent access. Intelligent-Tiering for unknown patterns. Standard-IA and One Zone-IA for infrequent access. Glacier classes for archives, with Deep Archive the cheapest.', 's3-classes'),
  C('instance-store', '3.6', 'What is instance store storage?', 'Temporary block storage attached to the host. The data is lost when the instance stops or terminates.', 'instance-store'),
  C('athena-vs-redshift', '3.7', 'Athena vs. Redshift?', 'Athena runs serverless SQL directly on data in S3. Redshift is a data warehouse you load data into for repeated, complex analytics.', 'athena'),
  C('ml-speech-text', '3.7', 'Polly, Transcribe, Translate, Comprehend, Textract?', 'Polly speaks (text to speech). Transcribe listens (speech to text). Translate converts languages. Comprehend understands text. Textract reads scanned documents.', 'comprehend'),
  C('sqs-sns-eb', '3.8', 'SQS vs. SNS vs. EventBridge?', 'SQS: a queue that consumers pull from. SNS: push one message to many subscribers. EventBridge: route events to targets using rules.', 'sqs'),
  C('ci-cd-order', '3.8', 'How do CodeCommit, CodeBuild, CodeDeploy, and CodePipeline fit together?', 'Source in CodeCommit, build and test in CodeBuild, deploy with CodeDeploy, and orchestrate the stages with CodePipeline.', 'codepipeline'),
  C('workspaces-appstream', '3.8', 'WorkSpaces vs. AppStream 2.0?', 'WorkSpaces delivers a full virtual desktop. AppStream 2.0 streams individual applications to a browser.', 'workspaces'),

  // ───── Domain 4 ─────
  C('compute-pricing', '4.1', 'Which EC2 purchasing option for which pattern?', 'On-Demand: short or unpredictable. Savings Plans and Reserved Instances: steady usage with a 1 or 3 year commitment. Spot: flexible and interruptible. Dedicated Hosts: licensing or compliance on physical servers.', 'purchasing-options'),
  C('sp-vs-ri', '4.1', 'Savings Plans vs. Reserved Instances?', 'Both trade a commitment for lower prices. Compute Savings Plans are the most flexible, applying across instance families, Regions, Fargate, and Lambda.', 'savings-plans'),
  C('capacity-reservation', '4.1', 'Capacity Reservation vs. Dedicated Instance vs. Dedicated Host?', 'Capacity Reservation guarantees capacity in an AZ. Dedicated Instances run on hardware dedicated to your account. Dedicated Hosts give you a whole physical server.', 'capacity-reservations'),
  C('data-transfer', '4.1', 'Which data transfer is free and which is charged?', 'In from the internet is generally free. Out to the internet and between Regions is charged; moving between AZs can be too.', 'ec2-pricing'),
  C('cost-tools', '4.2', 'Pricing Calculator vs. Cost Explorer vs. Budgets?', 'Pricing Calculator: estimate before you build. Cost Explorer: analyze past spend. Budgets: alert when spend crosses a threshold.', 'pricing-calculator'),
  C('cur-conductor', '4.2', 'What are the Cost and Usage Report and Billing Conductor?', 'The Cost and Usage Report is the most detailed cost data. Billing Conductor customizes billing data for chargeback or showback.', 'cur'),
  C('consolidated-billing', '4.2', 'What does consolidated billing give you?', 'One bill for all accounts in an AWS Organization, combined usage for volume discounts, and shared Savings Plan and Reserved Instance benefits.', 'consolidated-billing'),
  C('cost-tags', '4.2', 'How do cost allocation tags work?', 'You label resources with key-value tags, activate them in billing, and they then group costs in reports such as Cost Explorer and the Cost and Usage Report.', 'cost-tags'),
  C('support-ladder', '4.3', 'What does AWS Support include at each level?', 'Basic is free: billing and account help, docs, forums, limited Trusted Advisor. Paid tiers add engineers by phone and chat and faster response. A designated TAM comes at the Enterprise level.', 'support-plans', [
    'Plan names changed after the exam guide: see the Support plans lesson']),
  C('health-vs-ta', '4.3', 'AWS Health vs. Trusted Advisor?', 'Health shows AWS events that affect your resources. Trusted Advisor recommends best-practice improvements for your account.', 'health'),
  C('experts', '4.3', 'Professional Services vs. Partners vs. Marketplace?', 'Professional Services are AWS’s own consultants. Partners are independent ISVs and system integrators. Marketplace is the catalog for buying third-party software.', 'professional-services'),
];

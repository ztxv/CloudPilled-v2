import { S } from '../builders';
import type { Lesson } from '../types';

export const DOMAIN2_LESSONS: Lesson[] = [
  {
    id: 'shared-responsibility',
    domain: 2,
    tasks: ['2.1'],
    title: 'Who secures what: the shared responsibility model',
    summary: 'Security of the cloud versus security in the cloud, and how the line moves by service.',
    minutes: 8,
    objectives: [
      'State what AWS is responsible for and what the customer is responsible for.',
      'Recognize shared controls such as patching and configuration management.',
      'Explain how responsibility shifts between Amazon EC2, Amazon RDS, and AWS Lambda.',
    ],
    blocks: [
      {
        t: 'p',
        x: 'Security on AWS is a partnership. AWS is responsible for **security of the cloud**; you are responsible for **security in the cloud**. This is the most-tested idea in the Security and Compliance domain.',
      },
      {
        t: 'compare',
        title: 'The two halves',
        cols: ['', 'AWS: security of the cloud', 'Customer: security in the cloud'],
        rows: [
          ['What it covers', 'The infrastructure that runs AWS services: hardware, software, networking, and facilities.', 'Whatever you put in and configure on those services.'],
          ['Examples', 'Physical data-center security, hosts and hypervisor, the global network, managed-service software.', 'Your data, who has access (IAM), encryption choices, guest operating system and application patching, firewall rules.'],
        ],
      },
      { t: 'h', x: 'Three kinds of control' },
      {
        t: 'ul',
        items: [
          '**Inherited controls** — you get them automatically from AWS, for example physical and environmental controls.',
          '**Shared controls** — apply to both, but in different contexts. *Patch management:* AWS patches the infrastructure; you patch your guest OS and applications. *Configuration management:* AWS configures its infrastructure; you configure your own guest OS, databases, and applications. *Awareness and training:* AWS trains its staff; you train yours.',
          '**Customer-specific controls** — depend on what you deploy, for example service and communications protection or zone security you configure yourself.',
        ],
      },
      { t: 'h', x: 'The line moves with the service' },
      {
        t: 'compare',
        title: 'Responsibility by service type',
        cols: ['Service', 'AWS manages', 'You manage'],
        rows: [
          ['Amazon EC2 (infrastructure)', 'Physical hosts, virtualization, network', 'Guest OS and its patches, applications, security group rules, data, IAM'],
          ['Amazon RDS (managed database)', 'Host and database engine patching, backups tooling, hardware', 'Your data, who can reach and log in to the database, network access, encryption settings'],
          ['AWS Lambda (serverless)', 'Servers, OS, runtime patching, scaling', 'Your function code, its permissions (IAM roles), and the data it handles'],
        ],
        caption: 'The more managed the service, the more AWS takes on — but you always own your data and your access decisions.',
      },
      {
        t: 'callout',
        kind: 'tip',
        title: 'Two-question shortcut',
        x: 'Ask: "Is this about the physical or foundational infrastructure?" → AWS. "Is this about my data, my users, or how I configured something?" → customer. For patching, it depends on the layer.',
      },
      {
        t: 'callout',
        kind: 'confusion',
        title: 'Managed does not mean "not my problem"',
        x: 'Even with Amazon RDS or AWS Lambda, you still decide who can access your resources and how your data is protected. Responsibility for data and identity never moves to AWS.',
      },
    ],
    checks: [
      S('c-srm-1', '2.1', 'Under the shared responsibility model, who is responsible for the physical security of AWS data centers?', 'AWS', ['The customer :: Customers cannot access or secure AWS facilities.', 'Both equally :: Physical security is an inherited control that AWS owns entirely.', 'A third-party auditor :: Auditors assess controls; they do not operate them.'], 'physical security of AWS data centers', 'Physical security of facilities is part of security *of* the cloud, which AWS owns.', ['shared-resp']),
      S('c-srm-2', '2.1', 'Who is responsible for patching the guest operating system on an Amazon EC2 instance?', 'The customer', ['AWS :: AWS patches the host and virtualization layer, not your guest OS.', 'The AWS Support team :: Support does not manage customer instances by default.', 'Amazon Inspector :: Inspector finds vulnerabilities but does not patch.'], 'guest operating system on an Amazon EC2 instance', 'With EC2 the customer manages the guest OS, including updates and security patches.', ['shared-resp']),
      S('c-srm-3', '2.1', 'Which is a customer responsibility regardless of which AWS service is used?', 'Deciding who can access their data and resources', ['Maintaining the hypervisor :: AWS operates the virtualization layer.', 'Securing the physical network cabling :: AWS owns the facilities and network infrastructure.', 'Replacing failed hardware :: AWS handles hardware.'], 'regardless of which AWS service', 'Identity, access, and data protection decisions always remain with the customer.', ['shared-resp']),
    ],
    refs: ['shared-resp', 'iam-best'],
  },
  {
    id: 'governance-encryption',
    domain: 2,
    tasks: ['2.2'],
    title: 'Compliance, governance, and encryption',
    summary: 'Finding compliance evidence, understanding encryption options, and the key services behind them.',
    minutes: 9,
    objectives: [
      'Find AWS compliance reports and agreements with AWS Artifact.',
      'Explain that compliance varies by industry, location, and service.',
      'Distinguish encryption in transit from encryption at rest.',
      'Match AWS KMS, AWS CloudHSM, and AWS Certificate Manager to their jobs.',
    ],
    blocks: [
      {
        t: 'p',
        x: 'AWS infrastructure is audited against many compliance programs, but **compliance is shared too**: AWS’s certifications cover the infrastructure; you still must use services in a compliant way. Requirements also differ by **industry** (for example healthcare or payments) and **geography**, and **not every AWS service is in scope for every program**.',
      },
      { t: 'h', x: 'Where to find compliance information' },
      {
        t: 'compare',
        title: 'Compliance resources',
        cols: ['Resource', 'What it gives you'],
        rows: [
          ['AWS Artifact', 'On-demand access to AWS security and compliance reports (for example, audit reports) and online agreements. This is the exam’s answer for "download AWS’s compliance documents".'],
          ['AWS Compliance Programs page', 'Lists the compliance programs AWS supports, by region and industry.'],
          ['AWS Audit Manager', 'Helps you continuously collect evidence from your own AWS usage to prepare for audits.'],
        ],
      },
      {
        t: 'callout',
        kind: 'confusion',
        title: 'Artifact vs. Audit Manager',
        x: 'Artifact = *AWS’s* compliance reports and agreements. Audit Manager = collecting evidence about *your* usage for *your* audits.',
      },
      { t: 'h', x: 'Encryption: in transit and at rest' },
      {
        t: 'ul',
        items: [
          '**Encryption in transit** protects data as it moves between places, typically with TLS (HTTPS). AWS Certificate Manager provisions and manages the TLS certificates.',
          '**Encryption at rest** protects stored data, such as objects in Amazon S3, volumes in Amazon EBS, or databases in Amazon RDS. Many services integrate with AWS KMS to encrypt data at rest.',
        ],
      },
      {
        t: 'compare',
        title: 'Encryption services',
        cols: ['Service', 'What it does', 'Clue'],
        rows: [
          ['AWS Key Management Service (AWS KMS)', 'Create and control the cryptographic keys used to encrypt your data; integrates with many AWS services.', '"create and manage encryption keys"'],
          ['AWS CloudHSM', 'Dedicated hardware security module (HSM) in the AWS Cloud that you control.', '"dedicated hardware", "single-tenant HSM", "compliance requires your own HSM"'],
          ['AWS Certificate Manager (ACM)', 'Provision, manage, and deploy public and private TLS certificates.', '"TLS/SSL certificates for HTTPS"'],
          ['AWS Secrets Manager', 'Store and rotate secrets such as database credentials and API keys.', '"rotate database credentials"'],
        ],
      },
      {
        t: 'callout',
        kind: 'example',
        title: 'Worked example',
        x: 'A company stores sensitive reports in Amazon S3 and must protect them both on the way to the bucket and while stored. It uses HTTPS (encryption in transit, with an ACM certificate on its own endpoints) and server-side encryption with a KMS key (encryption at rest).',
      },
    ],
    checks: [
      S('c-gov-1', '2.2', 'Where can a customer download AWS’s security and compliance reports on demand?', 'AWS Artifact', ['AWS Audit Manager :: Audit Manager collects evidence from your own usage; it is not the library of AWS reports.', 'AWS Config :: Config tracks your resource configurations.', 'Amazon Inspector :: Inspector scans workloads for vulnerabilities.'], 'download AWS’s … reports on demand', 'AWS Artifact is the self-service portal for AWS compliance reports and agreements.', ['artifact']),
      S('c-gov-2', '2.2', 'Which protects data while it is moving between a user’s browser and an application?', 'Encryption in transit, for example using TLS', ['Encryption at rest :: This protects stored data.', 'Multi-factor authentication :: This verifies identity at sign-in, not data in motion.', 'A security group :: This filters traffic but does not encrypt it.'], 'while it is moving', 'Encryption in transit, typically TLS/HTTPS, protects data as it travels over networks.', ['s3-encryption']),
      S('c-gov-3', '2.2', 'Which service lets you create and control encryption keys used by other AWS services?', 'AWS Key Management Service (AWS KMS)', ['AWS Certificate Manager :: ACM manages TLS certificates, not data-encryption keys.', 'AWS Secrets Manager :: This stores and rotates secrets such as credentials.', 'AWS Shield :: This protects against DDoS attacks.'], 'create and control encryption keys', 'KMS creates and manages cryptographic keys and integrates with many AWS services.', ['kms']),
    ],
    refs: ['artifact', 'compliance-programs', 'kms', 'cloudhsm', 'acm', 'audit-manager'],
  },
  {
    id: 'monitoring-detection',
    domain: 2,
    tasks: ['2.2'],
    title: 'Logging, monitoring, and threat detection',
    summary: 'Which service records, watches, audits, scans, or investigates — the "who did what" toolkit.',
    minutes: 10,
    objectives: [
      'Tell Amazon CloudWatch, AWS CloudTrail, and AWS Config apart.',
      'Match Amazon GuardDuty, Amazon Inspector, Amazon Macie, Amazon Detective, and AWS Security Hub to their jobs.',
      'Locate where security-related logs and reports come from.',
    ],
    blocks: [
      {
        t: 'p',
        x: 'AWS offers many services that sound similar. Learn them as *questions they answer*. The exam usually gives the question and asks for the service.',
      },
      {
        t: 'compare',
        title: 'Monitoring, logging, and auditing',
        cols: ['Service', 'Answers the question…', 'Clue'],
        rows: [
          ['Amazon CloudWatch', 'How is it performing right now? Collects metrics, logs, and alarms.', '"CPU utilization", "alarm", "dashboard"'],
          ['AWS CloudTrail', 'Who did what, when, and from where? Records API calls and account activity.', '"audit", "API activity", "who deleted the bucket"'],
          ['AWS Config', 'What does my configuration look like, how has it changed, and is it compliant with rules?', '"configuration history", "compliance rules"'],
          ['AWS Audit Manager', 'How do I gather evidence for an audit?', '"evidence", "audit readiness"'],
        ],
        caption: 'CloudWatch watches performance; CloudTrail records actions; Config records configuration and its changes.',
      },
      { t: 'h', x: 'Security and threat-detection services' },
      {
        t: 'compare',
        title: 'Which security service?',
        cols: ['Service', 'What it does', 'Clue'],
        rows: [
          ['Amazon GuardDuty', 'Threat detection that continuously analyzes logs and activity for suspicious behavior, such as unusual API calls or compromised instances.', '"malicious activity", "threat detection"'],
          ['Amazon Inspector', 'Automated vulnerability management that scans workloads (for example EC2 instances and container images) for software vulnerabilities and unintended exposure.', '"vulnerabilities", "CVEs", "scan instances"'],
          ['Amazon Macie', 'Discovers and protects sensitive data, such as personally identifiable information, in Amazon S3.', '"PII in S3"'],
          ['Amazon Detective', 'Investigates and finds the root cause of security findings by analyzing related data.', '"investigate", "root cause"'],
          ['AWS Security Hub', 'Aggregates and prioritizes security findings and checks from multiple AWS services and partners in one place.', '"central view of security findings", "security posture"'],
        ],
      },
      {
        t: 'callout',
        kind: 'confusion',
        title: 'GuardDuty vs. Inspector',
        x: 'GuardDuty looks for *active threats* in logs and behavior. Inspector looks for *weaknesses* (vulnerabilities) in your workloads before they are exploited.',
      },
      { t: 'h', x: 'Where do the logs and reports come from?' },
      {
        t: 'ul',
        items: [
          '**CloudTrail** for account and API activity (who did what).',
          '**CloudWatch Logs** for application and service logs, and metrics for performance.',
          '**Access reports in IAM**, such as the credential report and last-accessed information, show which credentials and permissions are actually used.',
        ],
      },
      {
        t: 'callout',
        kind: 'example',
        title: 'Worked example',
        x: 'A security analyst wants to know which IAM user deleted an S3 bucket yesterday. That is an audit trail of API calls: **AWS CloudTrail**. Another team wants an alert when CPU stays above 80% for ten minutes: **Amazon CloudWatch** alarm.',
      },
    ],
    checks: [
      S('c-mon-1', '2.2', 'Which service records API calls made in an AWS account so you can audit who did what?', 'AWS CloudTrail', ['Amazon CloudWatch :: CloudWatch tracks metrics and logs for performance, not account API history.', 'AWS Config :: Config tracks resource configuration changes.', 'Amazon GuardDuty :: GuardDuty detects threats; it is not the audit log itself.'], 'audit who did what', 'CloudTrail records API activity across your account.', ['cloudtrail']),
      S('c-mon-2', '2.2', 'Which service scans EC2 instances and container images for software vulnerabilities?', 'Amazon Inspector', ['Amazon Macie :: Macie finds sensitive data in S3.', 'Amazon Detective :: Detective investigates findings; it does not scan for vulnerabilities.', 'AWS Shield :: Shield mitigates DDoS attacks.'], 'scans … for software vulnerabilities', 'Amazon Inspector provides automated vulnerability scanning.', ['inspector']),
      S('c-mon-3', '2.2', 'Which service discovers sensitive data such as personally identifiable information in Amazon S3?', 'Amazon Macie', ['Amazon GuardDuty :: GuardDuty detects suspicious activity, not sensitive data in buckets.', 'AWS KMS :: KMS manages encryption keys.', 'AWS Config :: Config tracks configuration compliance.'], 'sensitive data … in Amazon S3', 'Macie uses machine learning and pattern matching to discover sensitive data in S3.', ['macie']),
    ],
    refs: ['cloudwatch', 'cloudtrail', 'config', 'guardduty', 'inspector', 'security-hub', 'macie', 'detective', 'audit-manager'],
  },
  {
    id: 'access-management',
    domain: 2,
    tasks: ['2.3'],
    title: 'Controlling access with IAM',
    summary: 'Users, groups, roles, and policies; protecting the root user; MFA; and single sign-on.',
    minutes: 11,
    objectives: [
      'Describe IAM users, groups, roles, and policies, and apply least privilege.',
      'Explain why and how the root user is protected, and what only the root user can do.',
      'Choose between access keys, roles, and MFA for a described situation.',
      'Explain what AWS IAM Identity Center and federation are for.',
    ],
    blocks: [
      {
        t: 'p',
        x: '**AWS Identity and Access Management (IAM)** controls *who* can sign in (authentication) and *what* they can do (authorization). IAM itself is a feature of your account at no additional charge.',
      },
      {
        t: 'compare',
        title: 'IAM building blocks',
        cols: ['Concept', 'What it is', 'Use it for'],
        rows: [
          ['User', 'An identity for one person or application with long-term credentials.', 'A specific person who needs access.'],
          ['Group', 'A collection of IAM users; permissions attached to the group apply to all members.', 'Giving a team the same permissions.'],
          ['Role', 'An identity with permissions that anyone or anything can *assume*, getting temporary credentials.', 'AWS services (for example an EC2 instance reading S3), cross-account access, federated users.'],
          ['Policy', 'A JSON document that defines permissions (allow or deny actions on resources).', 'Granting least-privilege access.'],
        ],
      },
      {
        t: 'ul',
        items: [
          '**AWS managed policies** are created and maintained by AWS. **Customer managed policies** you write yourself for tighter, custom permissions.',
          '**Principle of least privilege:** grant only the permissions required to do a job, and no more.',
          'Prefer **roles with temporary credentials** over long-term access keys. An application on EC2 should use an instance role, not hard-coded keys.',
        ],
      },
      { t: 'h', x: 'The root user' },
      {
        t: 'p',
        x: 'The **root user** is the identity created with the account, with complete access to everything. Protect it: enable **multi-factor authentication (MFA)**, do not create access keys for it unless truly needed, and **do not use it for everyday tasks** — use an administrative identity instead.',
      },
      {
        t: 'p',
        x: 'A few tasks do require the root user. Examples from the IAM documentation: changing certain account settings for a standalone account, closing the account, restoring IAM permissions when the only administrator has locked themselves out, and signing up for AWS GovCloud (US).',
      },
      { t: 'h', x: 'Credentials and secrets' },
      {
        t: 'ul',
        items: [
          '**MFA** adds a second factor (for example a code or security key) on top of a password.',
          '**Password policies** set rules such as minimum length and rotation for IAM users.',
          '**Access keys** (an access key ID and secret) are for programmatic access through the CLI, SDKs, and APIs. Treat them like passwords, rotate them, and never commit them to code.',
          '**AWS Secrets Manager** stores and rotates secrets like database credentials. **AWS Systems Manager Parameter Store** can store configuration values and secrets.',
        ],
      },
      { t: 'h', x: 'Workforce sign-in and federation' },
      {
        t: 'ul',
        items: [
          '**AWS IAM Identity Center** (successor to AWS Single Sign-On) gives workforce users single sign-on access to multiple AWS accounts and applications from one place.',
          '**Identity federation** lets users sign in with an external identity provider (for example a corporate directory) instead of creating separate IAM users.',
          '**Cross-account IAM roles** let identities in one account assume a role in another account.',
          '**Amazon Cognito** provides sign-up and sign-in for the users of *your* web and mobile applications.',
        ],
      },
      {
        t: 'callout',
        kind: 'confusion',
        title: 'IAM Identity Center vs. Cognito',
        x: 'Identity Center is for your *workforce* signing in to AWS accounts and business apps. Cognito is for your app’s *customers* (consumers) signing in to your application.',
      },
    ],
    checks: [
      S('c-iam-1', '2.3', 'What is the recommended way to give an application running on an Amazon EC2 instance access to an S3 bucket?', 'Attach an IAM role to the instance', ['Embed an IAM user’s access keys in the application code :: Long-term keys in code are easily leaked.', 'Use the root user’s credentials :: The root user should not be used for routine tasks.', 'Make the bucket public :: This exposes data to everyone.'], 'application running on an Amazon EC2 instance', 'Roles provide temporary credentials automatically, with no long-term keys to manage.', ['iam-roles']),
      S('c-iam-2', '2.3', 'Which practice best protects the AWS account root user?', 'Enable multi-factor authentication and avoid using it for daily tasks', ['Share the password with the administrators :: Sharing weakens accountability and security.', 'Create access keys and store them in a repository :: Keys in code are a major risk.', 'Use it for all administration for convenience :: The root user should be reserved for tasks that require it.'], 'protects the … root user', 'MFA plus limiting use of the root user to tasks that require it is the standard guidance.', ['iam-best', 'iam-root-tasks']),
      S('c-iam-3', '2.3', 'Which principle says to grant only the permissions needed to perform a task?', 'Least privilege', ['Defense in depth :: This is layering multiple controls, not limiting individual permissions.', 'Separation of duties :: This splits critical tasks across people.', 'Shared responsibility :: This divides security duties between AWS and the customer.'], 'only the permissions needed', 'Least privilege means granting the minimum permissions required.', ['iam-best']),
    ],
    refs: ['iam', 'iam-best', 'iam-root-tasks', 'iam-mfa', 'iam-roles', 'iam-policies', 'iam-identity-center', 'secrets-manager'],
  },
  {
    id: 'security-resources',
    domain: 2,
    tasks: ['2.4'],
    title: 'Network protection and security resources',
    summary: 'Security groups, network ACLs, AWS WAF, AWS Shield, and where to find security guidance.',
    minutes: 9,
    objectives: [
      'Compare security groups and network ACLs.',
      'Match AWS WAF, AWS Shield, AWS Firewall Manager, and AWS Network Firewall to the threat they handle.',
      'Know where to get security information and third-party security products.',
      'Explain what AWS Trusted Advisor checks.',
    ],
    blocks: [
      { t: 'h', x: 'Controlling traffic inside your network' },
      {
        t: 'compare',
        title: 'Security groups vs. network ACLs',
        cols: ['', 'Security group', 'Network ACL (NACL)'],
        rows: [
          ['Applies to', 'An instance’s network interface (resource level)', 'A subnet (all resources in it)'],
          ['State', 'Stateful: return traffic is automatically allowed', 'Stateless: you must allow return traffic explicitly'],
          ['Rules', 'Allow rules only', 'Allow and deny rules, evaluated in order'],
        ],
        caption: 'Think "security group = instance firewall, NACL = subnet firewall".',
      },
      { t: 'h', x: 'Protecting against attacks' },
      {
        t: 'compare',
        title: 'Edge and network protection',
        cols: ['Service', 'Protects against…', 'Clue'],
        rows: [
          ['AWS WAF', 'Common web exploits (for example SQL injection and cross-site scripting) by filtering HTTP(S) requests with rules.', '"web application firewall", "block SQL injection"'],
          ['AWS Shield', 'Distributed denial-of-service (DDoS) attacks. Shield Standard is automatically included at no extra cost; Shield Advanced adds enhanced protection and support.', '"DDoS"'],
          ['AWS Firewall Manager', 'Central management of firewall rules (for example WAF) across accounts in an organization.', '"manage rules across accounts"'],
          ['AWS Network Firewall', 'Managed network firewall and intrusion prevention for your VPCs.', '"network traffic filtering at the VPC level"'],
        ],
      },
      {
        t: 'callout',
        kind: 'confusion',
        title: 'WAF vs. Shield',
        x: 'WAF inspects the *content* of web requests (layer 7 rules). Shield defends against *volumetric floods* that try to overwhelm your resources (DDoS).',
      },
      { t: 'h', x: 'Finding help, products, and recommendations' },
      {
        t: 'ul',
        items: [
          '**AWS Marketplace** is a digital catalog where you can find, buy, and deploy third-party software and security products.',
          '**AWS Security Center**, the **AWS Security Blog**, and the **AWS Knowledge Center** are official places to find security guidance and answers to common questions.',
          '**AWS Trusted Advisor** inspects your environment and recommends improvements in areas such as cost optimization, performance, security, fault tolerance, service quotas, and operational excellence. Which checks you see depends on your AWS Support plan.',
        ],
      },
      {
        t: 'callout',
        kind: 'tip',
        title: 'Exam tip',
        x: 'If a question wants a recommendation that checks your account against best practices (such as an open security group port or unused resources), it is usually **Trusted Advisor**.',
      },
    ],
    checks: [
      S('c-sec-1', '2.4', 'Which statement about security groups is correct?', 'They are stateful and apply at the instance level', ['They are stateless and apply at the subnet level :: That describes network ACLs.', 'They can contain explicit deny rules :: Security groups support allow rules only.', 'They protect against DDoS attacks :: DDoS protection is the role of AWS Shield.'], 'security groups', 'Security groups are stateful, instance-level firewalls with allow rules.', ['security-groups']),
      S('c-sec-2', '2.4', 'Which service helps protect a web application from SQL injection and cross-site scripting?', 'AWS WAF', ['AWS Shield :: Shield targets DDoS attacks.', 'Amazon Macie :: Macie finds sensitive data in S3.', 'AWS KMS :: KMS manages encryption keys.'], 'SQL injection and cross-site scripting', 'AWS WAF filters web requests using rules for common exploits.', ['waf']),
      S('c-sec-3', '2.4', 'Where can a company find and purchase third-party security software that runs on AWS?', 'AWS Marketplace', ['AWS Artifact :: Artifact provides compliance reports.', 'AWS Trusted Advisor :: Trusted Advisor gives recommendations.', 'AWS Organizations :: Organizations manages multiple accounts.'], 'third-party security software', 'AWS Marketplace is the catalog for third-party software and security products.', ['marketplace']),
    ],
    refs: ['security-groups', 'nacl', 'waf', 'shield', 'firewall-manager', 'network-firewall', 'marketplace', 'trusted-advisor', 'security-center', 'security-blog', 'knowledge-center'],
  },
];

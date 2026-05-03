// The user asked to hardcode this for now. This is exposed in page source; replace the placeholder with your Nvidia API key before using Study Buddy.
const NVIDIA_API_KEY='PASTE_KEY_HERE';
const NVIDIA_MODEL='moonshotai/kimi-k2-instruct';
const AI_SYSTEM_PROMPT='You are a professional AWS Cloud Practitioner (CCP) study guide assistant. Your role is to help the user prepare for the AWS Certified Cloud Practitioner exam (CLF-C02). You are knowledgeable about AWS services, the Shared Responsibility Model, the Well-Architected Framework, AWS pricing models, support plans, and core cloud concepts. Keep answers concise, accurate, and exam-relevant. When a question is ambiguous, ask for clarification. When the user asks about non-AWS topics, gently redirect. When asked, generate practice MC questions in the format: question, four options A-D, and a one-sentence explanation. Never speculate — if you are unsure of a detail, say so.';
const CATS={
  compute:    {label:'Compute',     color:'#ff9f0a'},
  storage:    {label:'Storage',     color:'#ffd60a'},
  database:   {label:'Database',    color:'#0a84ff'},
  network:    {label:'Networking',  color:'#5ac8fa'},
  security:   {label:'Security',    color:'#30d158'},
  messaging:  {label:'Messaging',   color:'#ff375f'},
  monitoring: {label:'Monitoring',  color:'#64d2ff'},
  mgmt:       {label:'Management',  color:'#bf5af2'},
  ml:         {label:'ML / AI',     color:'#ff453a'},
  billing:    {label:'Billing',     color:'#5e5ce6'},
};

const SERVICES=[
  {sym:'EC2',name:'Elastic Compute Cloud',cat:'compute',
   what:'Virtual servers in the cloud. You pick CPU, RAM, OS, and storage. The backbone of AWS compute — spin up a server in minutes, pay by the hour/second.',
   tips:['On-Demand: pay per second, no commitment','Reserved: 1–3 yr commit, up to 72% cheaper','Spot: up to 90% off but AWS can reclaim anytime','Dedicated Host: physical server for you (compliance)','AMI = OS snapshot/template used to launch instances','Security Groups = virtual firewall for EC2','Key pairs = how you SSH in (never lose the .pem)'],
   tags:['IaaS','Virtual Machine','Scalable','Exam Favorite']},

  {sym:'Lambda',name:'AWS Lambda',cat:'compute',
   what:'Run code WITHOUT managing servers. Upload a function, define a trigger, AWS handles everything else. Billed per 1ms of execution — you pay nothing when idle.',
   tips:['Serverless — zero server management','Triggers: API Gateway, S3 events, DynamoDB, SNS...','Max execution time: 15 minutes per invocation','Scales automatically — one to one million requests','Langs: Python, Node.js, Java, Go, Ruby, .NET','Pairs with API Gateway to build cheap REST APIs'],
   tags:['Serverless','Event-driven','FaaS','Exam Favorite']},

  {sym:'ECS',name:'Elastic Container Service',cat:'compute',
   what:'Run Docker containers on AWS. ECS manages the cluster of EC2 instances (or Fargate) that your containers run on.',
   tips:['EC2 launch type: you manage the servers','Fargate launch type: serverless — AWS manages infra','Task Definition = blueprint (image, CPU, RAM)','Service = keeps N tasks running at all times','Integrates with ECR for storing container images'],
   tags:['Containers','Docker','Managed']},

  {sym:'EKS',name:'Elastic Kubernetes Service',cat:'compute',
   what:'Managed Kubernetes on AWS. If your team already runs Kubernetes, EKS lets you do that without managing the control plane.',
   tips:['AWS manages the Kubernetes control plane','Works with EC2 nodes OR Fargate pods','CCP exam: know it exists, deep K8s knowledge not required'],
   tags:['Kubernetes','Containers','Managed']},

  {sym:'Fargate',name:'AWS Fargate',cat:'compute',
   what:'Serverless compute engine for containers. Works with ECS and EKS. Define CPU/RAM requirements — Fargate provisions infrastructure invisibly.',
   tips:['No EC2 instances to manage — truly serverless','Pay only for CPU and memory your container uses','Great for unpredictable or spiky workloads'],
   tags:['Serverless','Containers','No-Ops']},

  {sym:'Beanstalk',name:'Elastic Beanstalk',cat:'compute',
   what:'PaaS that auto-handles deployment, load balancing, scaling, and health monitoring. Upload your code and EB figures out the rest.',
   tips:['Supports: Java, Python, Node.js, PHP, Ruby, Go, .NET, Docker','Still uses EC2 under the hood','Free to use — pay only for the underlying resources','PaaS = Platform as a Service'],
   tags:['PaaS','Auto-deploy','Developer-friendly']},

  {sym:'Lightsail',name:'Amazon Lightsail',cat:'compute',
   what:'Simplified VPS for beginners. Predictable flat monthly pricing. Small apps, blogs, and developers who want a simple server without AWS complexity.',
   tips:['Bundles compute + storage + DNS + static IP in one price','Not as flexible as EC2 but way simpler','Good for: WordPress, small Node apps, dev/test'],
   tags:['Simplified','VPS','Beginner-friendly']},

  {sym:'Batch',name:'AWS Batch',cat:'compute',
   what:'Run hundreds of thousands of batch computing jobs. AWS manages the infrastructure — you define the job. No servers to maintain.',
   tips:['Dynamically provisions EC2/Spot for your jobs','Ideal for: ETL, simulations, genomics, financial modeling','vs Lambda: Batch = long-running jobs, Lambda = short bursts'],
   tags:['Batch Jobs','Managed','Scalable']},

  {sym:'S3',name:'Simple Storage Service',cat:'storage',
   what:'Object storage — store any file at virtually unlimited scale. Files stored in "buckets." Massively durable: 99.999999999% (11 nines).',
   tips:['Object = file + metadata. Bucket = container for objects','Storage classes: Standard, Intelligent-Tiering, Standard-IA, One Zone-IA, Glacier, Glacier Deep Archive','Glacier = cheapest, slowest retrieval (archival)','Versioning: keep multiple versions of same object','S3 is NOT a file system — it\'s object/flat storage','Bucket names must be globally unique','Can host static websites'],
   tags:['Object Storage','Global','11 Nines','Exam Favorite']},

  {sym:'EBS',name:'Elastic Block Store',cat:'storage',
   what:'Persistent block storage volumes that attach to EC2 — like a virtual hard drive. Data survives if you stop/restart EC2.',
   tips:['Volumes live in ONE Availability Zone only','Types: gp3/gp2 (general), io1/io2 (high IOPS), st1, sc1','Snapshots stored in S3 → can recreate volumes','One EBS volume attaches to ONE EC2 at a time (usually)'],
   tags:['Block Storage','EC2','Persistent','AZ-locked']},

  {sym:'EFS',name:'Elastic File System',cat:'storage',
   what:'Managed NFS that multiple EC2 instances can access simultaneously. Scales automatically — no provisioning needed.',
   tips:['Multi-AZ: mounts across multiple AZs (unlike EBS)','Shared access: many EC2s read/write the same file system','Use case: content management, web serving, data sharing','More expensive than EBS — use only when you need shared access'],
   tags:['File System','Shared','Multi-AZ','NFS']},

  {sym:'FSx',name:'Amazon FSx',cat:'storage',
   what:'Fully managed third-party file systems. FSx for Windows File Server (SMB) or FSx for Lustre (HPC). For workloads needing native Windows or HPC file systems.',
   tips:['FSx for Windows: SMB protocol, Active Directory integration','FSx for Lustre: HPC, ML training, video processing'],
   tags:['File System','Windows','HPC']},

  {sym:'S3 Glacier',name:'S3 Glacier',cat:'storage',
   what:'Ultra-cheap long-term archival storage within S3. Three retrieval tiers: Instant (milliseconds), Flexible (hours), Deep Archive (12+ hrs).',
   tips:['Deep Archive: cheapest storage on AWS (~$1/TB/month)','Data not immediately accessible — retrieval takes time','Lifecycle policies auto-move objects to Glacier'],
   tags:['Archive','Cold Storage','Compliance','Cheap']},

  {sym:'Storage GW',name:'Storage Gateway',cat:'storage',
   what:'Hybrid cloud storage — connects your on-premises environment to AWS. Lets on-prem apps use S3, EBS, or Glacier transparently.',
   tips:['Three types: File Gateway, Volume Gateway, Tape Gateway','Key use case: backup on-prem data to S3 seamlessly','Appears as local file share or iSCSI to your servers'],
   tags:['Hybrid','On-Premises','Migration']},

  {sym:'RDS',name:'Relational Database Service',cat:'database',
   what:'Managed relational databases. AWS handles patching, backups, scaling, and failover. Supports MySQL, PostgreSQL, MariaDB, Oracle, SQL Server, and Aurora.',
   tips:['Multi-AZ: auto failover to standby in another AZ (HA)','Read Replicas: copies for read scaling — NOT auto failover','Automated backups: up to 35 days point-in-time recovery','You manage: schemas, queries, data. AWS manages: infra','NOT serverless (except Aurora Serverless)'],
   tags:['SQL','Managed','Multi-AZ','Exam Favorite']},

  {sym:'Aurora',name:'Amazon Aurora',cat:'database',
   what:'AWS-built relational DB, fully compatible with MySQL and PostgreSQL but up to 5x faster. 6 copies of data across 3 AZs automatically.',
   tips:['Aurora Serverless: auto-scales capacity up/down to zero','Storage auto-grows in 10GB increments up to 128TB','Faster and cheaper than RDS for high-volume workloads','Part of RDS family — same managed experience'],
   tags:['SQL','High Performance','MySQL/Postgres','Exam Favorite']},

  {sym:'DynamoDB',name:'Amazon DynamoDB',cat:'database',
   what:'Serverless NoSQL key-value and document database. Single-digit millisecond performance at any scale. Auto-scales based on demand.',
   tips:['NoSQL: no fixed schema, stores JSON-like items','Two modes: On-Demand (pay per request) or Provisioned','DynamoDB Streams: capture changes in real time','Global Tables: multi-region, fully replicated','DAX = DynamoDB Accelerator (in-memory cache, microseconds)'],
   tags:['NoSQL','Serverless','Key-Value','Exam Favorite']},

  {sym:'ElastiCache',name:'Amazon ElastiCache',cat:'database',
   what:'In-memory caching service. Supports Redis and Memcached. Dramatically speeds up apps by caching frequent database queries in RAM.',
   tips:['Redis: persistence, pub/sub, Lua scripting, replicas','Memcached: simpler, multi-threaded, no persistence','Use case: session stores, leaderboards, real-time analytics','Reduces database load significantly'],
   tags:['Cache','Redis','In-Memory','Performance']},

  {sym:'Redshift',name:'Amazon Redshift',cat:'database',
   what:'Cloud data warehouse for analytics. Run SQL queries across petabytes of data. Columnar storage makes complex aggregations blazing fast.',
   tips:['OLAP — not for transactional queries','Redshift Spectrum: query data in S3 without loading','Integrates with Tableau, QuickSight','Redshift = analytics, RDS = operational/transactional'],
   tags:['Data Warehouse','OLAP','Analytics','SQL']},

  {sym:'Neptune',name:'Amazon Neptune',cat:'database',
   what:'Managed graph database. Optimized for highly connected data — social networks, fraud detection, recommendation engines.',
   tips:['Graph DB: nodes and edges, not tables','Use cases: social graphs, knowledge graphs, fraud detection'],
   tags:['Graph DB','Managed','Social Networks']},

  {sym:'DocumentDB',name:'Amazon DocumentDB',cat:'database',
   what:'MongoDB-compatible managed document database. Stores JSON-like BSON documents. Easy migration for existing MongoDB workloads.',
   tips:['Use when you need MongoDB workloads on AWS','Fully managed: backups, patching, scaling handled'],
   tags:['NoSQL','MongoDB-compat','Documents']},

  {sym:'VPC',name:'Virtual Private Cloud',cat:'network',
   what:'Your private, logically isolated network in AWS. Define your own IP ranges, subnets, routing tables, and gateways. Every account gets a default VPC.',
   tips:['Public subnets: have route to internet via IGW','Private subnets: no direct internet access','NAT Gateway: lets private subnets reach internet (outbound only)','Security Groups (stateful) vs NACLs (stateless)','VPC Peering: connect two VPCs privately'],
   tags:['Networking','Isolation','Subnets','Exam Favorite']},

  {sym:'Route 53',name:'Amazon Route 53',cat:'network',
   what:'Scalable DNS service. Register domains, route users to the closest/healthiest endpoint, and set up health checks.',
   tips:['Routing: Simple, Weighted, Latency, Failover, Geolocation','Failover routing: route to backup if primary is down','Weighted: split traffic % between endpoints (A/B testing)','Health checks: auto-reroute if endpoint is unhealthy'],
   tags:['DNS','Domain','Routing','Exam Favorite']},

  {sym:'CloudFront',name:'Amazon CloudFront',cat:'network',
   what:'Content Delivery Network (CDN). Caches your content at 400+ edge locations worldwide so users get data from the nearest server.',
   tips:['Edge Locations: cache copies of content globally','Origins: S3, EC2, ELB, or any HTTP server','OAC: restrict S3 access to CloudFront only','Great for: static sites, video streaming, APIs','Reduces load on origin servers'],
   tags:['CDN','Edge','Low Latency','Exam Favorite']},

  {sym:'ELB',name:'Elastic Load Balancing',cat:'network',
   what:'Distributes incoming traffic across multiple targets so no single instance is overwhelmed. Three types for different use cases.',
   tips:['ALB: HTTP/HTTPS, path/host routing, Layer 7','NLB: TCP/UDP, ultra-low latency, Layer 4, millions req/sec','GLB: for network appliances (firewalls, intrusion detection)','Classic LB: legacy — avoid for new projects'],
   tags:['Load Balancer','HA','Traffic','Exam Favorite']},

  {sym:'API GW',name:'API Gateway',cat:'network',
   what:'Create, publish, and manage REST, HTTP, and WebSocket APIs at scale. Acts as the front door for your backend services.',
   tips:['Fully managed: throttling, caching, auth, monitoring','Pairs naturally with Lambda for serverless APIs','Supports: API keys, IAM auth, Cognito, Lambda authorizers','Stages: deploy to dev/staging/prod independently'],
   tags:['API','Serverless','REST','WebSocket']},

  {sym:'Direct Connect',name:'AWS Direct Connect',cat:'network',
   what:'Dedicated private fiber connection from your data center directly to AWS. More reliable and faster than internet-based VPN.',
   tips:['Private: traffic never touches the public internet','Lower latency and consistent bandwidth vs VPN','Expensive to set up — for enterprises needing guaranteed throughput','Combine with VPN for encrypted + private connection'],
   tags:['Hybrid','Private','Dedicated','On-Premises']},

  {sym:'VPN',name:'Site-to-Site VPN',cat:'network',
   what:'Encrypted connection between your on-premises network and AWS VPC over the public internet. Faster to set up than Direct Connect.',
   tips:['Uses IPsec encryption over internet','Virtual Private Gateway (VGW) on AWS side','Less reliable than Direct Connect but cheaper and faster to provision'],
   tags:['Hybrid','Encrypted','On-Premises']},

  {sym:'IAM',name:'Identity & Access Management',cat:'security',
   what:'Control who can do what in your AWS account. Create users, groups, and roles with fine-grained permissions using JSON policies. Free service.',
   tips:['Root account: all-powerful — never use for daily work','Users: individual people. Groups: collections of users. Roles: for services','Policies: JSON docs defining Allow/Deny permissions','Principle of Least Privilege: grant only what\'s needed','MFA: enable always, especially for root account','Access Keys: for CLI/API access (not console login)'],
   tags:['Access Control','Users','Roles','Exam Favorite']},

  {sym:'Cognito',name:'Amazon Cognito',cat:'security',
   what:'Add user sign-up, sign-in, and access control to web/mobile apps. Handles the heavy lifting of auth so you don\'t have to build it yourself.',
   tips:['User Pools: authentication — sign up/in, JWT tokens','Identity Pools: authorization — grant AWS credentials to users','Supports social login (Google, Facebook, Apple) and SAML'],
   tags:['Auth','Users','Mobile','Identity']},

  {sym:'KMS',name:'Key Management Service',cat:'security',
   what:'Create and manage encryption keys for data at rest and in transit. Integrates with almost every AWS service. Keys never leave KMS unencrypted.',
   tips:['CMK: Customer Managed Keys — you control rotation, deletion','AWS Managed Keys: AWS rotates automatically','Used by S3, EBS, RDS, DynamoDB for server-side encryption','CloudHSM: dedicated hardware security module (stricter compliance)'],
   tags:['Encryption','Keys','Compliance','Exam Favorite']},

  {sym:'Secrets Mgr',name:'Secrets Manager',cat:'security',
   what:'Store and automatically rotate database credentials, API keys, and passwords. Apps retrieve secrets programmatically — no hardcoding.',
   tips:['Auto-rotation: rotates RDS/Aurora passwords on a schedule','vs SSM Parameter Store: Secrets Manager = rotation + sharing; Parameter Store = config + cheaper'],
   tags:['Secrets','Rotation','Credentials']},

  {sym:'WAF',name:'Web Application Firewall',cat:'security',
   what:'Protects web apps from common exploits: SQL injection, XSS, bad bots. Attach to CloudFront, ALB, or API Gateway.',
   tips:['Rules: define allow/block/count conditions on HTTP requests','Managed Rules: pre-built rulesets from AWS and third parties','Rate limiting: block IPs sending too many requests'],
   tags:['Firewall','Web Security','DDoS adjacent']},

  {sym:'Shield',name:'AWS Shield',cat:'security',
   what:'DDoS protection for AWS workloads. Shield Standard is free and auto-applied. Shield Advanced is paid with 24/7 DDoS response team.',
   tips:['Standard: free, automatic protection against common DDoS','Advanced: ~$3,000/month, financial protection, AWS DRT access','Protects: EC2, ELB, CloudFront, Route 53, Global Accelerator'],
   tags:['DDoS','Protection','Always-on','Exam Favorite']},

  {sym:'GuardDuty',name:'Amazon GuardDuty',cat:'security',
   what:'Intelligent threat detection. Continuously monitors your AWS accounts for malicious activity using ML and threat intelligence feeds.',
   tips:['Analyzes: VPC Flow Logs, DNS logs, CloudTrail events','No agents to install — works at the account level','Detects: compromised EC2, cryptomining, unusual API calls','30-day free trial — then billed on data analyzed'],
   tags:['Threat Detection','ML','Security Intelligence']},

  {sym:'Inspector',name:'Amazon Inspector',cat:'security',
   what:'Automated vulnerability scanning for EC2 instances and container images. Finds software vulnerabilities and network exposure issues.',
   tips:['Scans EC2 instances and ECR container images automatically','Generates prioritized findings with remediation guidance','vs GuardDuty: Inspector = vulnerability scanning, GuardDuty = threat detection'],
   tags:['Vulnerability','Scanning','EC2','Containers']},

  {sym:'Macie',name:'Amazon Macie',cat:'security',
   what:'Uses ML to automatically discover and protect sensitive data in S3. Detects PII, financial data, credentials, and more.',
   tips:['Scans S3 buckets for sensitive data exposure','Generates alerts if sensitive data is in public buckets','GDPR/compliance use case — know where your sensitive data lives'],
   tags:['Data Security','S3','PII','Compliance']},

  {sym:'Config',name:'AWS Config',cat:'security',
   what:'Continuously audits and records your AWS resource configurations. Shows config history and can alert/auto-remediate drift from compliance.',
   tips:['Config Rules: define what compliant looks like, AWS checks','Timeline view: see how a resource\'s config changed over time','Use case: ensure S3 buckets are never public, EC2s have MFA'],
   tags:['Compliance','Audit','Config History']},

  {sym:'SNS',name:'Simple Notification Service',cat:'messaging',
   what:'Pub/Sub messaging. Publishers send to a topic; all subscribers receive it simultaneously. Fan-out notifications to many consumers at once.',
   tips:['Push-based: SNS pushes messages to subscribers','Subscribers: Lambda, SQS, HTTP, email, SMS, mobile push','One-to-many: one message → many subscribers at once','Use case: send alerts, trigger multiple systems from one event'],
   tags:['Pub/Sub','Push','Fan-out','Exam Favorite']},

  {sym:'SQS',name:'Simple Queue Service',cat:'messaging',
   what:'Fully managed message queue. Producers put messages in, consumers poll and process them. Decouples microservices so they don\'t need to be simultaneously available.',
   tips:['Pull-based: consumers poll the queue for messages','Standard Queue: best-effort ordering, at-least-once delivery','FIFO Queue: strict ordering, exactly-once processing, slower','Visibility Timeout: hides message while being processed','Dead Letter Queue (DLQ): failed messages after max retries','One-to-one: each message processed by ONE consumer'],
   tags:['Queue','Decoupling','Pull','Exam Favorite']},

  {sym:'EventBridge',name:'Amazon EventBridge',cat:'messaging',
   what:'Serverless event bus. Route events between AWS services, SaaS apps, and your own apps. Formerly CloudWatch Events.',
   tips:['Rules: match events and route to targets (Lambda, SQS...)','Event Bus: default (AWS), custom, or partner (Salesforce, Datadog)','Schedule: run targets on a cron schedule'],
   tags:['Event Bus','Serverless','Routing','Event-driven']},

  {sym:'Kinesis',name:'Amazon Kinesis',cat:'messaging',
   what:'Real-time data streaming platform. Ingest and process massive streams of data (logs, clickstreams, IoT) in real time.',
   tips:['Data Streams: real-time, custom processing, replay-capable','Firehose: load streams into S3/Redshift — no code needed','Analytics: run SQL on streaming data in real time','vs SQS: Kinesis = streaming/analytics at scale, SQS = simple queues'],
   tags:['Streaming','Real-time','IoT','Big Data']},

  {sym:'Amazon MQ',name:'Amazon MQ',cat:'messaging',
   what:'Managed Apache ActiveMQ and RabbitMQ broker. Use when migrating on-premises apps that already use standard messaging protocols.',
   tips:['Use when: existing apps using AMQP, MQTT, or STOMP protocols','When NOT to use: new apps — use SQS/SNS instead (simpler)'],
   tags:['ActiveMQ','RabbitMQ','Managed','Migration']},

  {sym:'CloudWatch',name:'Amazon CloudWatch',cat:'monitoring',
   what:'Monitoring and observability service. Collect metrics, logs, and events from all AWS resources. Set alarms and trigger automated responses.',
   tips:['Metrics: numerical data over time (CPU%, requests/sec...)','Logs: raw log streams from EC2, Lambda, etc.','Alarms: trigger when metric crosses threshold → SNS, Auto Scaling','Dashboards: custom visualizations of your metrics','Default metrics: free. Custom metrics: paid.'],
   tags:['Monitoring','Metrics','Logs','Exam Favorite']},

  {sym:'CloudTrail',name:'AWS CloudTrail',cat:'monitoring',
   what:'Audit every API call made in your AWS account. Who did what, when, from where. Enabled by default — logs stored in S3.',
   tips:['Records: all API calls (console, CLI, SDK, services)','Retention: 90 days in console, indefinite if sent to S3','Management Events: control plane ops (create/delete resources)','Data Events: data plane ops (S3 reads, Lambda invocations) — extra cost','Integrity Validation: detect if logs were tampered'],
   tags:['Audit','API Logging','Compliance','Exam Favorite']},

  {sym:'X-Ray',name:'AWS X-Ray',cat:'monitoring',
   what:'Distributed tracing for applications. Visualize requests as they flow through your microservices — find bottlenecks across Lambda, EC2, API Gateway.',
   tips:['Service Map: visual graph of your app\'s components and health','Traces: end-to-end request path across services','Segments & Subsegments: measure time spent in each component'],
   tags:['Tracing','Debugging','Microservices','Performance']},

  {sym:'Trusted Advisor',name:'AWS Trusted Advisor',cat:'monitoring',
   what:'Real-time guidance to optimize your AWS environment. Checks across Cost, Performance, Security, Fault Tolerance, and Service Limits.',
   tips:['Free: 7 core checks (security groups, S3 perms, MFA on root...)','Business/Enterprise: full ~115 checks unlocked','Know the 5 check categories for the CCP exam'],
   tags:['Optimization','Best Practices','Cost','Exam Favorite']},

  {sym:'Health Dashboard',name:'AWS Health Dashboard',cat:'monitoring',
   what:'Personalized view of AWS service health relevant to YOUR account. See planned maintenance, ongoing incidents, and historical events.',
   tips:['Service Health: global AWS status (public)','Personal Health: YOUR account\'s affected resources (private)','vs Status Page: Status Page = everyone, Health Dashboard = just you'],
   tags:['Incidents','Maintenance','Account-specific']},

  {sym:'CloudFormation',name:'AWS CloudFormation',cat:'mgmt',
   what:'Infrastructure as Code (IaC). Define all AWS resources in a JSON/YAML template and CloudFormation provisions everything in the right order.',
   tips:['Stack: collection of AWS resources from one template','Change Sets: preview changes before applying them','Drift Detection: detect manual changes that diverged from template','Free service — pay only for resources created','vs Terraform: both IaC, CloudFormation is AWS-native'],
   tags:['IaC','Templates','Automation','Exam Favorite']},

  {sym:'CDK',name:'Cloud Development Kit',cat:'mgmt',
   what:'Define cloud infrastructure using real programming languages (TypeScript, Python, Java, C#) instead of YAML. Compiles to CloudFormation.',
   tips:['Higher-level abstractions: Constructs, Stacks, Apps','Great for developers who prefer code over config files','CCP exam: know it exists as a dev-friendly IaC option'],
   tags:['IaC','Code','Developer-friendly']},

  {sym:'Systems Mgr',name:'AWS Systems Manager',cat:'mgmt',
   what:'Unified interface to view and manage AWS infrastructure. Run commands on EC2 fleets, manage configs, patch automatically — no SSH needed.',
   tips:['Session Manager: browser-based shell to EC2 without SSH','Parameter Store: store config values and secrets (cheaper than Secrets Manager)','Patch Manager: auto-patch EC2 instances on a schedule','Run Command: run scripts across multiple EC2s at once'],
   tags:['Operations','Patch','Parameters','No-SSH']},

  {sym:'Control Tower',name:'AWS Control Tower',cat:'mgmt',
   what:'Set up and govern a multi-account AWS environment. Automates account creation and enforces guardrails using AWS Organizations.',
   tips:['Landing Zone: pre-configured multi-account environment','Guardrails: preventive (SCPs) and detective (Config rules)','Builds on top of AWS Organizations'],
   tags:['Multi-account','Governance','Organizations']},

  {sym:'Organizations',name:'AWS Organizations',cat:'mgmt',
   what:'Centrally manage multiple AWS accounts as one. Consolidated billing, account grouping into OUs, and Service Control Policies (SCPs).',
   tips:['Management Account: the root/master account','OUs: group accounts by team/department/environment','SCPs: apply permission guardrails to OUs or accounts','Consolidated Billing: combine usage across accounts for volume discounts'],
   tags:['Multi-account','Billing','SCPs','Exam Favorite']},

  {sym:'Service Catalog',name:'AWS Service Catalog',cat:'mgmt',
   what:'IT teams create a curated catalog of approved AWS products. End users self-serve within guardrails — no need to know CloudFormation.',
   tips:['Portfolio: collection of products','Enables self-service while maintaining governance'],
   tags:['Governance','Self-service','Products']},

  {sym:'SageMaker',name:'Amazon SageMaker',cat:'ml',
   what:'Fully managed ML platform. Build, train, and deploy machine learning models at scale without managing infrastructure.',
   tips:['Studio: web IDE for ML development','Training: spin up GPU clusters, train, shut down automatically','Endpoints: deploy models as REST APIs instantly','CCP exam: know it as the go-to managed ML service'],
   tags:['Machine Learning','Managed','Training','Inference']},

  {sym:'Rekognition',name:'Amazon Rekognition',cat:'ml',
   what:'Computer vision as an API. Analyze images and video to detect objects, people, text, faces, and more — no ML expertise needed.',
   tips:['Use cases: content moderation, facial verification, label detection','API-based: just send an image, get structured results','Video analysis: detect activities in stored or streaming video'],
   tags:['Computer Vision','Images','Video','No-ML-needed']},

  {sym:'Polly',name:'Amazon Polly',cat:'ml',
   what:'Text-to-speech service. Converts text into lifelike speech in dozens of languages and voices using deep learning.',
   tips:['SSML: control pronunciation, pauses, emphasis in markup','Output: MP3, OGG, PCM audio streams','Use cases: voice apps, accessibility, e-learning, IVR systems'],
   tags:['TTS','Voice','Speech','Accessibility']},

  {sym:'Transcribe',name:'Amazon Transcribe',cat:'ml',
   what:'Automatic Speech Recognition (ASR). Convert audio to text automatically. Supports multiple speakers, custom vocabulary, and real-time transcription.',
   tips:['Transcribe Medical: specialized vocabulary for healthcare','Custom Vocabulary: teach it industry-specific terms'],
   tags:['Speech-to-Text','ASR','Audio','Transcription']},

  {sym:'Translate',name:'Amazon Translate',cat:'ml',
   what:'Neural machine translation. Translate text between 75+ languages at scale. Fast, affordable, and improving continuously.',
   tips:['Custom Terminology: preserve brand names and technical terms','Batch: translate documents stored in S3'],
   tags:['Translation','NLP','Languages','Global']},

  {sym:'Lex',name:'Amazon Lex',cat:'ml',
   what:'Build conversational chatbots using the same tech as Alexa. Handles speech-to-text, natural language understanding, and dialog management.',
   tips:['Intents: what the user wants to do','Slots: information you need to collect (like form fields)','Integrates with Lambda for business logic, Connect for call centers'],
   tags:['Chatbot','NLU','Voice','Alexa-tech']},

  {sym:'Comprehend',name:'Amazon Comprehend',cat:'ml',
   what:'Natural Language Processing as a service. Extract insights from text: sentiment, key phrases, entities, language detection, and topics.',
   tips:['Sentiment Analysis: positive/negative/neutral/mixed','Entity Recognition: extract names, orgs, dates from text','Use case: analyze customer reviews and support tickets at scale'],
   tags:['NLP','Text Analysis','Sentiment','Entities']},

  {sym:'Pricing Calc',name:'AWS Pricing Calculator',cat:'billing',
   what:'Free web tool to estimate your monthly AWS bill BEFORE spending any money. Model any architecture and share estimates as links.',
   tips:['No AWS account needed to use it','URL: calculator.aws','Save and share estimate URLs with stakeholders','CCP exam: this is for ESTIMATING costs before deployment'],
   tags:['Cost Estimation','Planning','Free Tool','Exam Favorite']},

  {sym:'Cost Explorer',name:'AWS Cost Explorer',cat:'billing',
   what:'Visualize and analyze your actual AWS spending over time. Filter by service, region, tag, or account. Forecast future costs.',
   tips:['Default: 12 months historical data, 12 months forecast','Rightsizing Recommendations: find oversized EC2 instances','Savings Plans recommendations based on your actual usage','Enable once — free to use'],
   tags:['Cost Analysis','Historical','Forecasting','Exam Favorite']},

  {sym:'Budgets',name:'AWS Budgets',cat:'billing',
   what:'Set custom cost and usage budgets. Get alerts when you\'re forecasted to exceed thresholds. Can trigger automated actions.',
   tips:['Types: Cost, Usage, Savings Plans, Reservation budgets','First 2 budgets free, $0.02/day after','vs Cost Explorer: Budgets = proactive alerts, Explorer = reactive analysis'],
   tags:['Alerts','Spending Limits','Proactive','Exam Favorite']},

  {sym:'Cost Tags',name:'Cost Allocation Tags',cat:'billing',
   what:'Tag AWS resources with key-value labels (Project, Env, Team). Activate in billing console to break costs down by team or project.',
   tips:['AWS-generated tags: CreatedBy, etc.','User-defined: whatever makes sense for your org','Must ACTIVATE tags in billing console before they appear in Cost Explorer'],
   tags:['Tagging','Cost Attribution','Organization']},

  {sym:'Savings Plans',name:'AWS Savings Plans',cat:'billing',
   what:'Commit to a consistent compute usage ($/hour) for 1 or 3 years in exchange for up to 72% discount. More flexible than Reserved Instances.',
   tips:['Compute SP: applies to Lambda, Fargate, EC2 any region/instance','EC2 Instance SP: specific family in one region, deepest discount','vs Reserved Instances: Savings Plans more flexible, same/better discounts'],
   tags:['Discounts','Commitment','Cost Savings','Exam Favorite']},

  {sym:'Support Plans',name:'AWS Support Plans',cat:'billing',
   what:'Tiered support: Basic (free), Developer, Business, Enterprise On-Ramp, and Enterprise. Higher tiers unlock faster response and dedicated TAMs.',
   tips:['Basic: free, Trusted Advisor core checks, no technical support','Developer: email support, 1 contact, business hours','Business: 24/7 phone/chat, <1hr for production down','Enterprise: TAM, <15min for business-critical down'],
   tags:['Support','TAM','SLA','Exam Favorite']},

  {sym:'Consolidated Billing',name:'Consolidated Billing',cat:'billing',
   what:'One bill for all accounts in an AWS Organization. Share volume discounts across accounts. Simplifies payment management.',
   tips:['Payer account = management account in Organizations','RI and Savings Plan discounts automatically shared across accounts','One credit card, one invoice, one place to analyze total spend'],
   tags:['Organizations','One Bill','Volume Discounts','Exam Favorite']},
];

/* ── Curated comparisons (the pairs CCP exam loves) ── */
const COMPARISONS=[
  {title:'SQS vs SNS', subtitle:'Queue vs Pub/Sub',
   items:[
     {sym:'SQS', cat:'messaging', points:['Pull-based — consumers poll the queue','One-to-one: each message processed by ONE consumer','Decouples microservices','Persists messages until consumed (or DLQ)','Standard or FIFO']},
     {sym:'SNS', cat:'messaging', points:['Push-based — subscribers receive instantly','One-to-many: fan-out to many subscribers','Subscribers: Lambda, SQS, email, SMS, HTTP','No message persistence after delivery','Topic-based pub/sub']},
   ],
   takeaway:'SQS to decouple work between two services. SNS to broadcast one event to many. Common combo: SNS → multiple SQS queues.'},

  {title:'RDS vs DynamoDB', subtitle:'SQL vs NoSQL',
   items:[
     {sym:'RDS', cat:'database', points:['Relational / SQL with fixed schema','MySQL, Postgres, MariaDB, Oracle, SQL Server','Multi-AZ for HA, Read Replicas for scaling reads','Vertical scaling (bigger instance)','Best for joins, transactions, structured data']},
     {sym:'DynamoDB', cat:'database', points:['NoSQL key-value & document, no fixed schema','Single-digit ms latency at any scale','Serverless — auto scales','Horizontal scaling built in','Best for high traffic, simple access patterns']},
   ],
   takeaway:'Need SQL, joins, complex queries → RDS. Need massive scale, simple lookups, serverless → DynamoDB.'},

  {title:'EBS vs EFS vs S3', subtitle:'Block vs File vs Object',
   items:[
     {sym:'EBS', cat:'storage', points:['Block storage — like a virtual hard drive','Attaches to ONE EC2 (single AZ)','Lowest latency','Use: OS root, databases on EC2']},
     {sym:'EFS', cat:'storage', points:['File storage — managed NFS','Many EC2s mount it simultaneously','Multi-AZ, auto-scales','Use: shared content, web servers']},
     {sym:'S3', cat:'storage', points:['Object storage — files in buckets','Unlimited scale, 11 nines durability','Accessed via HTTP API, not mounted','Use: backups, media, static sites, data lake']},
   ],
   takeaway:'EBS = one EC2, fastest. EFS = many EC2s share files. S3 = anything-can-fetch-it object store.'},

  {title:'Direct Connect vs Site-to-Site VPN', subtitle:'Hybrid connectivity',
   items:[
     {sym:'Direct Connect', cat:'network', points:['Dedicated private fiber to AWS','Never touches public internet','Consistent low latency, high bandwidth','Weeks to provision, expensive','Use: enterprises, regulated workloads']},
     {sym:'Site-to-Site VPN', cat:'network', points:['Encrypted IPsec tunnel over internet','Quick to set up (minutes)','Cheaper, less reliable than DX','Latency varies with internet','Use: temporary or budget-sensitive']},
   ],
   takeaway:'Direct Connect for guaranteed performance and private path. VPN for fast, encrypted, internet-based connection. Combine both for encrypted + private.'},

  {title:'GuardDuty vs Inspector vs Macie', subtitle:'Three security services often confused',
   items:[
     {sym:'GuardDuty', cat:'security', points:['Threat detection across the account','Analyzes VPC Flow Logs, DNS, CloudTrail','Detects compromised EC2, crypto-mining, etc.','No agents needed']},
     {sym:'Inspector', cat:'security', points:['Vulnerability scanning of EC2 + ECR','Finds CVEs, network exposure','Per-resource focus','Use: pre-deployment hardening']},
     {sym:'Macie', cat:'security', points:['Sensitive data discovery in S3','Detects PII, financial info, credentials','Uses ML to classify content','Use: GDPR / data leakage compliance']},
   ],
   takeaway:'Threats happening now → GuardDuty. Software vulns on instances → Inspector. Sensitive data sitting in S3 → Macie.'},

  {title:'ECS vs EKS vs Fargate', subtitle:'Three ways to run containers',
   items:[
     {sym:'ECS', cat:'compute', points:['AWS-native container orchestrator','Simple Task Definitions and Services','Tight AWS integration','Less complex than Kubernetes']},
     {sym:'EKS', cat:'compute', points:['Managed Kubernetes (K8s API)','Use if your team already runs K8s','Multi-cloud portability','Steeper learning curve']},
     {sym:'Fargate', cat:'compute', points:['Serverless compute for containers','Works WITH ECS or EKS (not separate)','No EC2 to manage at all','Pay per CPU/RAM the container uses']},
   ],
   takeaway:'ECS or EKS pick the orchestrator. Fargate is the launch type that runs them serverlessly. Mix and match.'},

  {title:'Pricing Calculator vs Cost Explorer vs Budgets', subtitle:'Estimate vs Analyze vs Alert',
   items:[
     {sym:'Pricing Calc', cat:'billing', points:['Estimate costs BEFORE deploying','No AWS account required','Model architectures, share URLs','Forward-looking only']},
     {sym:'Cost Explorer', cat:'billing', points:['Analyze ACTUAL spending after the fact','12 mo history, 12 mo forecast','Filter by service, tag, account','Reactive: see what happened']},
     {sym:'Budgets', cat:'billing', points:['Set thresholds & get alerts','Cost, usage, RI/SP coverage','Proactive: notify before overspend','Can trigger automated actions']},
   ],
   takeaway:'Calculator before. Cost Explorer after. Budgets to be warned along the way.'},

  {title:'Savings Plans vs Reserved Instances vs Spot vs On-Demand', subtitle:'EC2 pricing models',
   items:[
     {sym:'On-Demand', cat:'compute', points:['Pay per second, no commitment','Most expensive','Use: short-term, unpredictable workloads']},
     {sym:'Reserved Instances', cat:'compute', points:['1 or 3 year commitment','Up to 72% off On-Demand','Locked to instance family/region','Use: steady, predictable load']},
     {sym:'Savings Plans', cat:'compute', points:['Commit to $/hour for 1 or 3 yr','Same/better discounts than RI','More flexible across families & services','Covers Lambda + Fargate too']},
     {sym:'Spot', cat:'compute', points:['Up to 90% off On-Demand','AWS can reclaim with 2 min notice','Use: fault-tolerant, batch, stateless']},
   ],
   takeaway:'Steady use → Savings Plan or RI. Flexible compute → Savings Plan. Interruptible → Spot. Bursty / short → On-Demand.'},

  {title:'SQS Standard vs FIFO', subtitle:'Throughput vs ordering guarantees',
   items:[
     {sym:'SQS Standard', cat:'messaging', points:['Nearly unlimited API throughput','At-least-once delivery','Best-effort ordering only','Design consumers to handle duplicates','Default choice for high-volume decoupling']},
     {sym:'SQS FIFO', cat:'messaging', points:['Strict ordering within message groups','Exactly-once processing behavior','5-minute deduplication interval','Lower default throughput than Standard','Use when order or duplicate prevention matters']},
   ],
   takeaway:'Standard is the scalable default. FIFO is for ordered workflows where duplicates would break business logic.'},

  {title:'S3 hot storage classes', subtitle:'Frequent and infrequent access',
   items:[
     {sym:'S3 Standard', cat:'storage', points:['Frequent access data','Millisecond retrieval','Stored across 3+ AZs','No minimum storage duration','Highest availability general-purpose tier']},
     {sym:'Standard-IA', cat:'storage', points:['Infrequent access, still millisecond retrieval','Stored across 3+ AZs','Lower storage cost, retrieval fees apply','30-day minimum storage duration','Use for backups and DR data']},
     {sym:'One Zone-IA', cat:'storage', points:['Infrequent access in one AZ','Lower cost than Standard-IA','Not resilient to AZ loss','Retrieval fees apply','Use only for recreatable data']},
     {sym:'Intelligent-Tiering', cat:'storage', points:['Automatically moves objects by access pattern','Good when access is unknown or changing','Frequent and infrequent tiers use milliseconds access','Small monitoring/automation charge','Can include optional archive tiers']},
   ],
   takeaway:'Know the access pattern first. Standard for hot, IA for colder, One Zone-IA only for replaceable data, Intelligent-Tiering when patterns are unpredictable.'},

  {title:'S3 Glacier tiers', subtitle:'Archive retrieval tradeoffs',
   items:[
     {sym:'Glacier Instant', cat:'storage', points:['Archive data with millisecond retrieval','For rarely accessed data needed immediately','Stored across 3+ AZs','90-day minimum duration','Retrieval fees apply']},
     {sym:'Glacier Flexible', cat:'storage', points:['Lowest-cost flexible archive tier','Retrieval in minutes to hours','Objects must be restored before access','90-day minimum duration','Use when immediate access is not required']},
     {sym:'Deep Archive', cat:'storage', points:['Cheapest long-term archive storage','Retrieval takes hours','For data accessed less than once a year','180-day minimum duration','Use for compliance archives']},
   ],
   takeaway:'Instant is cold but immediately readable. Flexible is slower and cheaper. Deep Archive is cheapest and slowest.'},

  {title:'RDS Multi-AZ vs Read Replicas', subtitle:'Availability vs read scaling',
   items:[
     {sym:'Multi-AZ', cat:'database', points:['Main goal: high availability','Synchronous standby in another AZ','Automatic failover on outage','Standby DB instance usually does not serve app reads','Use for production resilience']},
     {sym:'Read Replica', cat:'database', points:['Main goal: scale read traffic','Asynchronous replication from source','Can be same AZ, cross-AZ, or cross-Region','Can be manually promoted if needed','Use for reporting or read-heavy apps']},
   ],
   takeaway:'Multi-AZ keeps the database available. Read replicas offload read traffic. They solve different problems and are often combined.'},

  {title:'VPC Peering vs Transit Gateway vs Direct Connect', subtitle:'Private network connectivity',
   items:[
     {sym:'VPC Peering', cat:'network', points:['One-to-one private VPC connection','Same or cross-account, same or cross-Region','No transitive routing','Simple for a small number of VPCs','No separate gateway appliance']},
     {sym:'Transit GW', cat:'network', points:['Regional hub router for many VPCs and VPNs','Supports transitive routing through attachments','Centralizes route tables and segmentation','Scales better than full-mesh peering','Best for multi-VPC networks']},
     {sym:'Direct Connect', cat:'network', points:['Dedicated private connection from on-premises to AWS','Consistent bandwidth and latency','Can connect through DX Gateway to VPCs or Transit Gateway','Not an internet VPN','Best for enterprise hybrid connectivity']},
   ],
   takeaway:'Peering is simple point-to-point. Transit Gateway is the hub. Direct Connect is the dedicated on-premises path into AWS.'},

  {title:'IAM Users vs Groups vs Roles', subtitle:'Identity building blocks',
   items:[
     {sym:'IAM Users', cat:'security', points:['Long-term identity in one AWS account','Can have password and access keys','Use sparingly; federation is preferred for humans','Represents one person or workload','Attach policies directly only when necessary']},
     {sym:'IAM Groups', cat:'security', points:['Collection of IAM users','Apply permissions to many users at once','A user can belong to multiple groups','Groups are not principals in resource policies','Cannot contain other groups']},
     {sym:'IAM Roles', cat:'security', points:['Assumable identity with permissions','No long-term password or access keys','Provides temporary STS credentials','Best for AWS services, federation, and cross-account access','Use instead of embedded access keys']},
   ],
   takeaway:'Users are identities, groups organize user permissions, roles are assumed for temporary access. Roles are the modern default where possible.'},

  {title:'WAF vs Shield vs GuardDuty', subtitle:'Filter, protect, detect',
   items:[
     {sym:'WAF', cat:'security', points:['Web application firewall','Filters HTTP/S requests at Layer 7','Blocks SQL injection, XSS, bad bots, rate spikes','Attach to CloudFront, ALB, API Gateway, AppSync','Preventive web traffic control']},
     {sym:'Shield', cat:'security', points:['Managed DDoS protection','Standard is automatic for AWS customers','Advanced adds response team and cost protection','Focuses on availability during DDoS attacks','Protects edge and network-facing resources']},
     {sym:'GuardDuty', cat:'security', points:['Threat detection service','Analyzes CloudTrail, VPC Flow Logs, DNS, and more','Finds suspicious API use, malware, crypto-mining, exfiltration','No agent required for foundational detection','Detective, not a traffic firewall']},
   ],
   takeaway:'WAF blocks bad web requests. Shield absorbs DDoS. GuardDuty alerts when suspicious activity is happening.'},

  {title:'Public vs Private vs Hybrid cloud', subtitle:'Foundational cloud models',
   items:[
     {sym:'Public Cloud', cat:'mgmt', points:['Provider-owned infrastructure delivered over the internet','Shared global platform with logical isolation','Pay-as-you-go managed services','AWS is a public cloud provider','Best for speed, scale, and broad services']},
     {sym:'Private Cloud', cat:'mgmt', points:['Cloud-like environment dedicated to one organization','Often hosted on-premises or single-tenant','More direct control over hardware and policy','Organization usually owns more operations','Useful for strict legacy or regulatory needs']},
     {sym:'Hybrid Cloud', cat:'mgmt', points:['Combines public cloud and private/on-premises environments','Common during migrations','Useful when some workloads must stay local','Needs networking and identity integration','Examples: VPN, Direct Connect, Storage Gateway']},
   ],
   takeaway:'Public cloud is shared provider infrastructure. Private cloud is dedicated. Hybrid connects both into one operating model.'},

  {title:'CapEx vs OpEx', subtitle:'Cloud economics',
   items:[
     {sym:'CapEx', cat:'billing', points:['Capital expense: buy assets up front','Data centers, servers, networking gear','Capacity planning happens before demand is known','Risk of idle or under-sized hardware','Traditional on-premises model']},
     {sym:'OpEx', cat:'billing', points:['Operating expense: pay as you consume','AWS pay-as-you-go pricing fits here','Scale up or down with demand','No large upfront hardware purchase required','Turns fixed expense into variable expense']},
   ],
   takeaway:'CCP framing: cloud helps trade fixed CapEx for variable OpEx, paying for what you use instead of guessing capacity in advance.'},

  {title:'CloudFormation vs CDK vs Beanstalk', subtitle:'IaC vs code abstractions vs PaaS',
   items:[
     {sym:'CloudFormation', cat:'mgmt', points:['Native AWS Infrastructure as Code','YAML/JSON templates describe resources','Deploys resources as stacks','Change sets preview updates','Best when you want declarative AWS-native IaC']},
     {sym:'CDK', cat:'mgmt', points:['Define infrastructure in programming languages','Synthesizes to CloudFormation templates','Uses constructs, stacks, and apps','Developer-friendly abstraction over IaC','Best when teams prefer code over YAML']},
     {sym:'Beanstalk', cat:'compute', points:['Platform as a Service for applications','Upload code; AWS handles provisioning details','Manages load balancing, scaling, monitoring','Uses services like EC2, Auto Scaling, and ELB underneath','Best for app deployment without designing every resource']},
   ],
   takeaway:'CloudFormation is templates. CDK is code that produces templates. Beanstalk is managed app deployment, not general-purpose IaC.'},

  {title:'Managed Microsoft AD vs Simple AD vs AD Connector', subtitle:'Directory Service choices',
   items:[
     {sym:'Managed Microsoft AD', cat:'security', points:['Actual Microsoft Active Directory managed by AWS','Best for AD-aware workloads needing real AD features','Supports trusts with existing AD','Use for larger or enterprise Windows environments','AWS manages domain controllers in AWS']},
     {sym:'Simple AD', cat:'security', points:['Low-cost Samba 4 compatible directory','Basic AD features for smaller workloads','Standalone directory in AWS','No trust relationships or MFA support','Use when you do not need full Microsoft AD']},
     {sym:'AD Connector', cat:'security', points:['Gateway/proxy to existing on-premises AD','Does not cache directory data in AWS','Users keep corporate credentials','Requires network connectivity to on-premises','Use when AD stays on-premises']},
   ],
   takeaway:'Managed Microsoft AD hosts real AD in AWS. Simple AD is basic and low cost. AD Connector points AWS apps back to your existing on-premises directory.'},
];

/* ── Hand-curated MC scenarios (CCP exam patterns) ── */
const SCENARIOS=[
  // ── Compute ──
  {q:'Your team needs to run containerized microservices but does not want to manage any EC2 servers or container hosts. Which option fits best?',
   options:['ECS on EC2','AWS Fargate','Elastic Beanstalk','Amazon Lightsail'],
   correct:'AWS Fargate',
   why:'Fargate is the serverless launch type for containers (works with ECS or EKS). No EC2 to manage.',
   cat:'compute'},

  {q:'A workload runs 24/7 with steady, predictable usage for the next three years. Which EC2 pricing model gives the deepest discount?',
   options:['On-Demand','3-year Reserved Instance, All Upfront','Spot Instances','Dedicated Host'],
   correct:'3-year Reserved Instance, All Upfront',
   why:'A 3-yr All Upfront RI gives the deepest EC2 discount (up to ~72%). Steady, predictable load is the canonical RI use case.',
   cat:'compute'},

  {q:'You have a fault-tolerant batch job that can be interrupted and restarted. You want the lowest possible cost per compute hour. Which EC2 pricing model?',
   options:['On-Demand','Reserved Instances','Spot Instances','Dedicated Host'],
   correct:'Spot Instances',
   why:'Spot offers up to 90% off but AWS can reclaim instances with 2 minutes notice. Perfect for fault-tolerant, interruptible workloads.',
   cat:'compute'},

  {q:'Which service runs code on demand without provisioning servers and bills per millisecond of execution time?',
   options:['Amazon EC2','AWS Lambda','AWS Fargate','Elastic Beanstalk'],
   correct:'AWS Lambda',
   why:'Lambda is FaaS — upload a function, define a trigger, pay per millisecond of execution. Idle = $0.',
   cat:'compute'},

  {q:'A developer wants to deploy a Node.js web app and have AWS automatically handle the load balancer, Auto Scaling, and capacity provisioning. Which service is most appropriate?',
   options:['EC2','Elastic Beanstalk','Lambda','CloudFormation'],
   correct:'Elastic Beanstalk',
   why:'Beanstalk is a PaaS — upload code, AWS handles deployment, LB, scaling, and health monitoring under the hood.',
   cat:'compute'},

  {q:'A workload uses Lambda and Fargate consistently and the team wants flexibility across services and Regions. Which discount option fits best?',
   options:['EC2 Reserved Instances','Compute Savings Plan','EC2 Instance Savings Plan','Spot Instances'],
   correct:'Compute Savings Plan',
   why:'Compute Savings Plan covers EC2, Lambda, AND Fargate across any Region/family. Most flexible option.',
   cat:'compute'},

  {q:'What is an AMI in AWS?',
   options:['A managed Kubernetes service','An Amazon Machine Image — a template used to launch EC2 instances','A monitoring dashboard','An encryption key type'],
   correct:'An Amazon Machine Image — a template used to launch EC2 instances',
   why:'AMI = Amazon Machine Image. Contains the OS, configuration, and software template used to launch EC2 instances.',
   cat:'compute'},

  // ── Storage ──
  {q:'You need ultra-cheap long-term archive storage for compliance data that is rarely accessed and can wait 12+ hours for retrieval. Which storage class?',
   options:['S3 Standard','S3 Standard-IA','S3 Glacier Flexible Retrieval','S3 Glacier Deep Archive'],
   correct:'S3 Glacier Deep Archive',
   why:'Deep Archive is the cheapest AWS storage. Retrieval takes 12+ hours, ideal for rarely-accessed compliance archives.',
   cat:'storage'},

  {q:'Multiple EC2 instances across two Availability Zones need to share the same file system simultaneously. Which service?',
   options:['Amazon EBS','Amazon EFS','Amazon S3','FSx for Lustre'],
   correct:'Amazon EFS',
   why:'EFS is managed NFS that mounts across multiple EC2s and multiple AZs simultaneously. EBS is single-AZ and typically attaches to one EC2.',
   cat:'storage'},

  {q:'A single EC2 instance running a database needs persistent low-latency block storage. Which is most appropriate?',
   options:['Amazon S3','Amazon EFS','Amazon EBS','AWS Storage Gateway'],
   correct:'Amazon EBS',
   why:'EBS provides persistent block storage attached to one EC2 — like a virtual hard drive. Low latency for databases.',
   cat:'storage'},

  {q:'A company wants to back up on-premises data to AWS so the on-prem servers can use it as a local file share. Which service?',
   options:['S3 Transfer Acceleration','AWS DataSync','AWS Storage Gateway','Amazon EFS'],
   correct:'AWS Storage Gateway',
   why:'Storage Gateway connects on-prem to AWS storage. File Gateway exposes it as a local NFS/SMB share.',
   cat:'storage'},

  {q:'How durable is data stored in Amazon S3 Standard, by AWS design?',
   options:['99.9% (3 nines)','99.99% (4 nines)','99.999999999% (11 nines)','100%'],
   correct:'99.999999999% (11 nines)',
   why:'S3 is designed for 11 nines of durability — objects are replicated across multiple facilities within a Region.',
   cat:'storage'},

  // ── Database ──
  {q:'You need a fully managed NoSQL database with single-digit millisecond latency that scales automatically. Which service?',
   options:['Amazon RDS','Amazon Aurora','Amazon DynamoDB','Amazon Redshift'],
   correct:'Amazon DynamoDB',
   why:'DynamoDB is serverless NoSQL (key-value & document) with single-digit ms latency at any scale.',
   cat:'database'},

  {q:'A team wants a relational database with automatic failover to a standby in another Availability Zone. Which feature do they need?',
   options:['Read Replica','Multi-AZ deployment','Aurora Global Database','Cross-Region snapshot'],
   correct:'Multi-AZ deployment',
   why:'RDS Multi-AZ creates a synchronous standby in another AZ with automatic failover. Read Replicas scale reads — they are NOT for HA.',
   cat:'database'},

  {q:'Your app makes the same database query thousands of times per second. You want to dramatically reduce database load with sub-millisecond response times. Which service?',
   options:['DynamoDB','Amazon ElastiCache','Aurora Serverless','Read Replicas'],
   correct:'Amazon ElastiCache',
   why:'ElastiCache (Redis or Memcached) is in-memory caching — sub-ms latency, dramatically reduces database load.',
   cat:'database'},

  {q:'You need to run complex analytical SQL queries across petabytes of historical data. Which service is best?',
   options:['Amazon RDS','Amazon Aurora','Amazon Redshift','Amazon DynamoDB'],
   correct:'Amazon Redshift',
   why:'Redshift is the cloud data warehouse — columnar storage, built for OLAP analytics on large datasets.',
   cat:'database'},

  {q:'Which AWS database is fully compatible with MySQL and PostgreSQL but offers up to 5x the performance of standard MySQL?',
   options:['Amazon RDS for MySQL','Amazon Aurora','Amazon DynamoDB','Amazon DocumentDB'],
   correct:'Amazon Aurora',
   why:'Aurora is AWS-built, MySQL- and PostgreSQL-compatible, with up to 5x MySQL performance and 6 copies across 3 AZs.',
   cat:'database'},

  // ── Networking ──
  {q:'You want to cache static content at edge locations around the world to reduce latency for global users. Which service?',
   options:['Route 53','Amazon CloudFront','Global Accelerator','API Gateway'],
   correct:'Amazon CloudFront',
   why:'CloudFront is the AWS CDN — caches content at 400+ edge locations globally for low-latency delivery.',
   cat:'network'},

  {q:'You need to register a new domain name and route traffic to AWS resources with automatic failover if a server is unhealthy. Which service?',
   options:['CloudFront','Amazon VPC','Amazon Route 53','AWS Direct Connect'],
   correct:'Amazon Route 53',
   why:'Route 53 is DNS + domain registrar with health checks and failover routing policies.',
   cat:'network'},

  {q:'A company needs a private dedicated network connection from their data center to AWS that does not traverse the public internet. Which service?',
   options:['Site-to-Site VPN','AWS Direct Connect','VPC Peering','AWS Transit Gateway'],
   correct:'AWS Direct Connect',
   why:'Direct Connect provides a dedicated private fiber link to AWS — never touches the public internet, consistent bandwidth.',
   cat:'network'},

  {q:'In a VPC, what allows EC2 instances in a private subnet to make outbound requests to the internet (e.g. download patches) without being directly reachable from the internet?',
   options:['Internet Gateway','NAT Gateway','Virtual Private Gateway','Customer Gateway'],
   correct:'NAT Gateway',
   why:'NAT Gateway lets private subnet instances initiate outbound internet traffic without being publicly reachable.',
   cat:'network'},

  {q:'Which is stateful and acts as a virtual firewall at the EC2 instance level?',
   options:['Network ACL','Security Group','AWS WAF','Route Table'],
   correct:'Security Group',
   why:'Security Groups are stateful instance-level firewalls. NACLs are stateless and operate at the subnet level.',
   cat:'network'},

  // ── Security ──
  {q:'According to AWS best practices, what should you do with the root account credentials?',
   options:['Use them for daily admin tasks','Share with the team for emergencies','Enable MFA, lock them away, and create IAM users for daily work','Store them in S3 as a backup'],
   correct:'Enable MFA, lock them away, and create IAM users for daily work',
   why:'Best practice: never use root for daily work, enable MFA on root, and create IAM users with least-privilege permissions.',
   cat:'security'},

  {q:'Which AWS service helps you store, retrieve, and automatically rotate database credentials?',
   options:['AWS IAM','AWS KMS','AWS Secrets Manager','AWS Certificate Manager'],
   correct:'AWS Secrets Manager',
   why:'Secrets Manager stores secrets and can auto-rotate RDS / Aurora passwords on a schedule.',
   cat:'security'},

  {q:'You need to detect unusual API activity, compromised EC2 instances, and crypto-mining behavior in your AWS account. Which service?',
   options:['Amazon Inspector','Amazon Macie','Amazon GuardDuty','AWS Shield'],
   correct:'Amazon GuardDuty',
   why:'GuardDuty is AWS\'s threat detection service — it analyzes VPC Flow Logs, DNS, and CloudTrail for malicious activity.',
   cat:'security'},

  {q:'Which service automatically discovers and protects sensitive data such as PII and credit-card numbers in S3?',
   options:['Amazon GuardDuty','Amazon Inspector','Amazon Macie','AWS Config'],
   correct:'Amazon Macie',
   why:'Macie uses ML to discover and classify sensitive data (PII, financial info, credentials) in S3 buckets.',
   cat:'security'},

  {q:'Which service provides DDoS protection automatically and free of charge for AWS resources like CloudFront and Route 53?',
   options:['AWS WAF','AWS Shield Standard','AWS Shield Advanced','AWS Firewall Manager'],
   correct:'AWS Shield Standard',
   why:'Shield Standard is free and automatic for all AWS customers. Shield Advanced is paid (~$3K/mo) with extra benefits.',
   cat:'security'},

  {q:'Which service is used to create and manage encryption keys used to encrypt data at rest in S3, EBS, and RDS?',
   options:['AWS Secrets Manager','AWS KMS','AWS CloudHSM','AWS IAM'],
   correct:'AWS KMS',
   why:'KMS (Key Management Service) creates and manages encryption keys used by most AWS services. CloudHSM is a dedicated HW option for stricter compliance.',
   cat:'security'},

  {q:'You want to grant an EC2 instance temporary permissions to read from an S3 bucket without storing access keys on the instance. What should you use?',
   options:['An IAM User with access keys','An IAM Role attached to the instance','A bucket policy referencing the instance ID','Hard-coded credentials in user data'],
   correct:'An IAM Role attached to the instance',
   why:'IAM Roles provide temporary credentials to AWS services. Never store long-lived access keys on EC2.',
   cat:'security'},

  {q:'Which is the AWS recommendation for assigning permissions to IAM users?',
   options:['Grant full administrator access by default','Apply the principle of least privilege','Use the root account for all users','Disable MFA to simplify access'],
   correct:'Apply the principle of least privilege',
   why:'Least privilege: grant only the permissions needed to perform the task. Foundational AWS security best practice.',
   cat:'security'},

  // ── Messaging ──
  {q:'You want to fan out a single message to many subscribers (a Lambda, an SQS queue, and an email) at the same time. Which service?',
   options:['Amazon SQS','Amazon SNS','Amazon EventBridge','Amazon MQ'],
   correct:'Amazon SNS',
   why:'SNS is pub/sub — one published message goes to all subscribers (Lambda, SQS, HTTP, email, SMS) simultaneously.',
   cat:'messaging'},

  {q:'You need to decouple two microservices so a producer can drop a message and a consumer can pick it up later. Which service?',
   options:['Amazon SNS','Amazon SQS','Amazon Kinesis','Amazon EventBridge'],
   correct:'Amazon SQS',
   why:'SQS is a pull-based queue. Producer puts a message in, consumer polls it later. Decouples services.',
   cat:'messaging'},

  {q:'You need to ingest and process millions of clickstream events per second in real time. Which is the best fit?',
   options:['Amazon SQS','Amazon SNS','Amazon Kinesis Data Streams','Amazon EventBridge'],
   correct:'Amazon Kinesis Data Streams',
   why:'Kinesis is built for real-time data streaming at massive scale — clickstreams, IoT, logs, metrics.',
   cat:'messaging'},

  // ── Monitoring ──
  {q:'Which service records every API call made in your AWS account for auditing and compliance?',
   options:['Amazon CloudWatch','AWS CloudTrail','AWS Config','AWS X-Ray'],
   correct:'AWS CloudTrail',
   why:'CloudTrail logs every API call (who, what, when, from where). CloudWatch is for metrics and logs; Config tracks resource state.',
   cat:'monitoring'},

  {q:'Which service collects metrics and logs and triggers alarms when a metric crosses a threshold?',
   options:['AWS CloudTrail','Amazon CloudWatch','AWS X-Ray','AWS Trusted Advisor'],
   correct:'Amazon CloudWatch',
   why:'CloudWatch handles metrics, logs, dashboards, and alarms. CloudTrail is for API audit logs.',
   cat:'monitoring'},

  {q:'Which service provides automated recommendations across cost optimization, performance, security, fault tolerance, and service limits?',
   options:['AWS Config','AWS Trusted Advisor','AWS Compute Optimizer','AWS Health Dashboard'],
   correct:'AWS Trusted Advisor',
   why:'Trusted Advisor checks across 5 categories: Cost Optimization, Performance, Security, Fault Tolerance, Service Limits.',
   cat:'monitoring'},

  // ── Management ──
  {q:'A company has 30 AWS accounts and wants one consolidated bill, volume discounts, and central permission guardrails. Which service?',
   options:['AWS Control Tower','AWS Organizations','AWS Config','AWS Service Catalog'],
   correct:'AWS Organizations',
   why:'Organizations provides consolidated billing, OUs, and SCPs across multiple accounts. Control Tower builds on top of it.',
   cat:'mgmt'},

  {q:'Which service lets you define infrastructure (EC2, RDS, VPC) as JSON or YAML templates?',
   options:['AWS CloudFormation','AWS Systems Manager','AWS OpsWorks','AWS Service Catalog'],
   correct:'AWS CloudFormation',
   why:'CloudFormation is AWS-native IaC. Templates are JSON/YAML. CDK compiles to CloudFormation but uses real code.',
   cat:'mgmt'},

  // ── Billing ──
  {q:'You want to estimate the monthly cost of an architecture BEFORE deploying anything. Which tool?',
   options:['AWS Cost Explorer','AWS Budgets','AWS Pricing Calculator','AWS Cost & Usage Report'],
   correct:'AWS Pricing Calculator',
   why:'Pricing Calculator estimates costs before deployment. Cost Explorer analyzes actual spending after the fact. Budgets sends proactive alerts.',
   cat:'billing'},

  {q:'You want to receive an alert when your monthly spend is forecasted to exceed $500. Which service?',
   options:['AWS Cost Explorer','AWS Trusted Advisor','AWS Budgets','Cost Allocation Tags'],
   correct:'AWS Budgets',
   why:'Budgets are proactive — set thresholds and get alerts when forecast exceeds them.',
   cat:'billing'},

  {q:'Which AWS Support plan provides 24/7 access to a dedicated Technical Account Manager (TAM)?',
   options:['Basic','Developer','Business','Enterprise On-Ramp / Enterprise'],
   correct:'Enterprise On-Ramp / Enterprise',
   why:'Enterprise (and Enterprise On-Ramp at a smaller scale) includes a TAM. Business has 24/7 support but no dedicated TAM.',
   cat:'billing'},

  // ── ML ──
  {q:'Which service automatically transcribes audio recordings to text?',
   options:['Amazon Polly','Amazon Lex','Amazon Transcribe','Amazon Translate'],
   correct:'Amazon Transcribe',
   why:'Transcribe = speech-to-text (ASR). Polly is the opposite (text-to-speech). Lex builds chatbots. Translate handles languages.',
   cat:'ml'},

  {q:'Which service lets you build chatbots using the same technology as Alexa?',
   options:['Amazon Lex','Amazon Polly','Amazon Comprehend','Amazon Rekognition'],
   correct:'Amazon Lex',
   why:'Lex builds conversational interfaces using NLU and dialog management — the engine behind Alexa.',
   cat:'ml'},

  {q:'Which fully managed service helps developers build, train, and deploy machine-learning models at scale?',
   options:['Amazon Rekognition','Amazon SageMaker','Amazon Comprehend','Amazon Forecast'],
   correct:'Amazon SageMaker',
   why:'SageMaker is the end-to-end managed ML platform: build, train, deploy. The other services are pre-built ML APIs for specific tasks.',
   cat:'ml'},

  // ── Cloud concepts (Shared Responsibility, Well-Architected, Regions/AZs) ──
  {q:'Under the AWS Shared Responsibility Model, who is responsible for patching the operating system on an EC2 instance?',
   options:['AWS','The customer','Both AWS and the customer equally','It depends on the Region'],
   correct:'The customer',
   why:'Customers are responsible for security IN the cloud — including OS patching on EC2. AWS patches the underlying hypervisor/host.',
   cat:null},

  {q:'Under the AWS Shared Responsibility Model, who is responsible for the physical security of AWS data centers?',
   options:['The customer','AWS','Both equally','Third-party auditors'],
   correct:'AWS',
   why:'AWS is responsible for security OF the cloud — physical hardware, data centers, networking infrastructure.',
   cat:null},

  {q:'Which of the following is a key benefit of cloud computing over on-premises infrastructure?',
   options:['Trade capital expense for variable expense','Total elimination of all IT staff','Always cheaper than on-prem in every scenario','No need for security best practices'],
   correct:'Trade capital expense for variable expense',
   why:'A core cloud benefit: replace upfront CapEx (servers, data centers) with pay-as-you-go OpEx.',
   cat:null},

  {q:'What is an AWS Availability Zone?',
   options:['A single data center','One or more discrete data centers within a Region, isolated from each other','A geographic Region of the world','An edge location for caching content'],
   correct:'One or more discrete data centers within a Region, isolated from each other',
   why:'An AZ is one or more isolated data centers within a Region with redundant power, networking, and connectivity.',
   cat:null},

  {q:'How many pillars does the AWS Well-Architected Framework consist of?',
   options:['3','5','6','12'],
   correct:'6',
   why:'Six pillars: Operational Excellence, Security, Reliability, Performance Efficiency, Cost Optimization, and Sustainability.',
   cat:null},

  {q:'Which factor should NOT influence the choice of an AWS Region?',
   options:['Compliance and data residency requirements','Service availability in that Region','Pricing differences between Regions','The login URL of the AWS console'],
   correct:'The login URL of the AWS console',
   why:'Region choice is driven by compliance, latency to users, service availability, and cost — not the console URL.',
   cat:null},
];

/* ── Persistent state ── */
const KNOWN_KEY='aws-ccp-known';
const KNOWN=new Set();
(function loadKnown(){
  try{
    const raw=localStorage.getItem(KNOWN_KEY);
    if(raw){JSON.parse(raw).forEach(s=>KNOWN.add(s));}
  }catch(e){}
})();
function saveKnown(){
  try{localStorage.setItem(KNOWN_KEY, JSON.stringify([...KNOWN]));}catch(e){}
}

const STATS_KEY='aws-ccp-quiz-stats';
const STATS=loadStats();
function loadStats(){
  try{
    const raw=localStorage.getItem(STATS_KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      return {
        byQuestion: parsed.byQuestion || {},
        byCategory: parsed.byCategory || {},
        byService: parsed.byService || {},
        history: parsed.history || [],
      };
    }
  }catch(e){}
  return {byQuestion:{}, byCategory:{}, byService:{}, history:[]};
}
function saveStats(){
  try{localStorage.setItem(STATS_KEY, JSON.stringify(STATS));}catch(e){}
}
function inferQuestionServiceSym(q){
  if(q.sym)return q.sym;
  const correctSvc=SERVICES.find(s=>s.name===q.correct || s.sym===q.correct);
  if(correctSvc)return correctSvc.sym;
  const hay=(q.q+' '+q.why+' '+q.correct).toLowerCase();
  const found=SERVICES.find(s=>hay.includes(s.sym.toLowerCase()) || hay.includes(s.name.toLowerCase()));
  return found ? found.sym : null;
}
function recordQuizStat(q, correct){
  const qKey=q.q;
  const catKey=q.cat || 'general';
  const sym=inferQuestionServiceSym(q);
  if(!STATS.byQuestion[qKey])STATS.byQuestion[qKey]={seen:0,missed:0};
  if(!STATS.byCategory[catKey])STATS.byCategory[catKey]={seen:0,missed:0};
  if(sym && !STATS.byService[sym])STATS.byService[sym]={seen:0,missed:0};
  STATS.byQuestion[qKey].seen++;
  STATS.byCategory[catKey].seen++;
  if(sym)STATS.byService[sym].seen++;
  if(!correct){
    STATS.byQuestion[qKey].missed++;
    STATS.byCategory[catKey].missed++;
    if(sym)STATS.byService[sym].missed++;
  }
  saveStats();
}
function getQuizStatsSummary(){
  const rows=Object.values(STATS.byQuestion);
  const seen=rows.reduce((sum,r)=>sum+(r.seen||0),0);
  const missed=rows.reduce((sum,r)=>sum+(r.missed||0),0);
  const correct=Math.max(0,seen-missed);
  const history=STATS.history || [];
  const last=history.length ? history[history.length-1] : null;
  const best=history.reduce((top,r)=>!top || r.pct>top.pct ? r : top,null);
  return {
    seen,
    missed,
    correct,
    pct:seen?Math.round((correct/seen)*100):0,
    quizzes:history.length,
    last,
    best,
  };
}
function resetStats(){
  Object.keys(STATS.byQuestion).forEach(k=>delete STATS.byQuestion[k]);
  Object.keys(STATS.byCategory).forEach(k=>delete STATS.byCategory[k]);
  Object.keys(STATS.byService).forEach(k=>delete STATS.byService[k]);
  STATS.history=[];
  saveStats();
}

const PREFS_KEY='aws-ccp-prefs';
const PREFS=loadPrefs();
function loadPrefs(){
  try{
    const raw=localStorage.getItem(PREFS_KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      return {
        timer:!!parsed.timer,
        weakSpots:!!parsed.weakSpots,
      };
    }
  }catch(e){}
  return {timer:false,weakSpots:false};
}
function savePrefs(){
  try{localStorage.setItem(PREFS_KEY, JSON.stringify(PREFS));}catch(e){}
}

const SRS_KEY='aws-ccp-srs';
const SRS=loadSrs();
function loadSrs(){
  try{
    const raw=localStorage.getItem(SRS_KEY);
    if(raw)return JSON.parse(raw) || {};
  }catch(e){}
  return {};
}
function saveSrs(){
  try{localStorage.setItem(SRS_KEY, JSON.stringify(SRS));}catch(e){}
}
function resetSrs(){
  Object.keys(SRS).forEach(k=>delete SRS[k]);
  saveSrs();
}
function getSrsRatedCount(){
  return Object.values(SRS).reduce((sum,r)=>sum+(r.reps||0),0);
}

const STREAK_KEY='aws-ccp-streak';
const STREAK=loadStreak();
function localYmd(date){
  const k=date || new Date();
  return k.getFullYear()+'-'+String(k.getMonth()+1).padStart(2,'0')+'-'+String(k.getDate()).padStart(2,'0');
}
function localDateFromYmd(ymd){
  const parts=ymd.split('-').map(n=>parseInt(n,10));
  return new Date(parts[0],parts[1]-1,parts[2]);
}
function addDays(date,delta){
  const d=new Date(date.getFullYear(),date.getMonth(),date.getDate());
  d.setDate(d.getDate()+delta);
  return d;
}
function daysBetween(a,b){
  const start=localDateFromYmd(a);
  const end=localDateFromYmd(b);
  return Math.round((end-start)/86400000);
}
function loadStreak(){
  try{
    const raw=localStorage.getItem(STREAK_KEY);
    if(raw){
      const parsed=JSON.parse(raw);
      return {
        daily: parsed.daily || {},
        currentStreak: parsed.currentStreak || 0,
        longestStreak: parsed.longestStreak || 0,
        totalActiveDays: parsed.totalActiveDays || 0,
        dailyGoal: parsed.dailyGoal || 10,
        lastActiveDate: parsed.lastActiveDate || '',
      };
    }
  }catch(e){}
  return {
    daily:{},
    currentStreak:0,
    longestStreak:0,
    totalActiveDays:0,
    dailyGoal:10,
    lastActiveDate:'',
  };
}
function ensureStreakDay(ymd){
  if(!STREAK.daily[ymd])STREAK.daily[ymd]={actions:0,met:false};
  STREAK.daily[ymd].actions=STREAK.daily[ymd].actions || 0;
  STREAK.daily[ymd].met=!!STREAK.daily[ymd].met;
  return STREAK.daily[ymd];
}
function saveStreak(){
  STREAK.totalActiveDays=Object.values(STREAK.daily).filter(d=>(d.actions||0)>0).length;
  try{localStorage.setItem(STREAK_KEY, JSON.stringify(STREAK));}catch(e){}
}
function recordAction(){
  const today=localYmd();
  const todayRow=ensureStreakDay(today);
  const wasMet=todayRow.met;

  if(STREAK.lastActiveDate!==today){
    if(!STREAK.lastActiveDate){
      STREAK.currentStreak=1;
    }else{
      const gap=daysBetween(STREAK.lastActiveDate,today);
      const prev=STREAK.daily[STREAK.lastActiveDate];
      STREAK.currentStreak=(gap===1 && prev && prev.met)
        ? Math.max(1,STREAK.currentStreak+1)
        : 1;
    }
    STREAK.lastActiveDate=today;
  }else if(STREAK.currentStreak<1){
    STREAK.currentStreak=1;
  }

  todayRow.actions++;
  todayRow.met=todayRow.actions>=STREAK.dailyGoal;
  STREAK.longestStreak=Math.max(STREAK.longestStreak,STREAK.currentStreak);
  saveStreak();
  renderStreakChip(todayRow.met && !wasMet);
  if(document.getElementById('settings-panel').classList.contains('open'))renderSettingsPanel();
}
function getStreakSummary(){
  const today=localYmd();
  const todayRow=ensureStreakDay(today);
  const last=STREAK.lastActiveDate;
  let displayStreak=STREAK.currentStreak || 0;
  if(!last){
    displayStreak=0;
  }else{
    const gap=daysBetween(last,today);
    const lastRow=STREAK.daily[last];
    if(gap>1 || (gap===1 && (!lastRow || !lastRow.met)))displayStreak=0;
  }
  const base=localDateFromYmd(today);
  const days=[];
  for(let i=13;i>=0;i--){
    const ymd=localYmd(addDays(base,-i));
    const row=STREAK.daily[ymd];
    days.push({
      ymd,
      actions:row ? row.actions || 0 : 0,
      met:row ? !!row.met : false,
      state:row ? (row.met?'met':((row.actions||0)>0?'some':'none')) : 'none',
    });
  }
  return {
    currentStreak:displayStreak,
    longestStreak:STREAK.longestStreak || 0,
    totalActiveDays:STREAK.totalActiveDays || 0,
    dailyGoal:STREAK.dailyGoal || 10,
    todayActions:todayRow.actions || 0,
    todayMet:!!todayRow.met,
    days,
  };
}
function setDailyGoal(goal){
  STREAK.dailyGoal=goal;
  const today=localYmd();
  const row=ensureStreakDay(today);
  row.met=row.actions>=STREAK.dailyGoal;
  saveStreak();
  renderStreakChip();
}
function resetStreak(){
  Object.keys(STREAK.daily).forEach(k=>delete STREAK.daily[k]);
  STREAK.currentStreak=0;
  STREAK.longestStreak=0;
  STREAK.totalActiveDays=0;
  STREAK.dailyGoal=10;
  STREAK.lastActiveDate='';
  saveStreak();
  renderStreakChip();
}
function renderStreakChip(pulse){
  const summary=getStreakSummary();
  const chip=document.getElementById('streak-chip');
  const count=document.getElementById('streak-count');
  if(!chip || !count)return;
  count.textContent=summary.currentStreak;
  chip.classList.toggle('dim',summary.currentStreak<1);
  if(pulse){
    chip.classList.remove('pulse');
    void chip.offsetWidth;
    chip.classList.add('pulse');
  }
  renderStreakPopover();
}
function renderStreakPopover(){
  const pop=document.getElementById('streak-popover');
  if(!pop)return;
  const s=getStreakSummary();
  const pct=Math.min(100,Math.round((s.todayActions/s.dailyGoal)*100));
  pop.innerHTML=`
    <div class="streak-pop-title">Daily streak</div>
    <div class="streak-progress">${s.todayActions} / ${s.dailyGoal} today</div>
    <div class="streak-progress-bar"><div class="streak-progress-fill" style="width:${pct}%"></div></div>
    <div class="streak-mini-stats">
      <div class="streak-mini-stat">
        <div class="streak-mini-num">${s.currentStreak}</div>
        <div class="streak-mini-label">Current</div>
      </div>
      <div class="streak-mini-stat">
        <div class="streak-mini-num">${s.longestStreak}</div>
        <div class="streak-mini-label">Longest</div>
      </div>
    </div>
    <div class="streak-days">
      ${s.days.map(d=>`<span class="streak-day ${d.state}" title="${escapeHtml(d.ymd)}: ${d.actions}"></span>`).join('')}
    </div>
  `;
}
function toggleStreakPopover(event){
  if(event)event.stopPropagation();
  renderStreakPopover();
  document.getElementById('streak-popover').classList.toggle('open');
}

const state={
  mode:'browse',     // 'browse' | 'flashcards' | 'compare' | 'quiz' | 'ai'
  filter:'all',
  search:'',
  hideKnown:false,
  flashIndex:0,
  flashFlipped:false,
  flashShuffle:false,
  flashOrder:[],     // array of sym strings, current deck order
  quiz:{
    phase:'setup',   // 'setup' | 'active' | 'results'
    count:10,
    questions:[],    // array of {q, options, correct, why, cat}
    idx:0,
    picked:null,     // currently picked option string (null = unanswered)
    answers:[],      // per-question {pickedIdx, picked, correct:bool}
    weakSpots:PREFS.weakSpots,
    timer:PREFS.timer,
    timeRemaining:0,
    timerHandle:null,
    timedOut:false,
    resultRecorded:false,
  },
  ai:{
    messages:[],
    streaming:false,
  },
};

/* ── Mode switching ── */
function setMode(mode){
  if(state.mode===mode)return;
  if(state.mode==='quiz' && mode!=='quiz')stopQuizTimer();
  state.mode=mode;
  document.querySelectorAll('.mode-btn').forEach(b=>{
    const on=b.dataset.mode===mode;
    b.classList.toggle('active',on);
    b.setAttribute('aria-selected',on?'true':'false');
  });
  // Compare and AI hide search+filters (curated / chat). Quiz hides search but keeps filters.
  const showSearch = mode==='browse' || mode==='flashcards';
  const showFilters = mode!=='compare' && mode!=='ai';
  document.getElementById('search-wrap').style.display=showSearch?'':'none';
  document.getElementById('filters').style.display=showFilters?'':'none';

  if(mode==='flashcards'){rebuildFlashDeck();}
  if(mode==='quiz'){
    stopQuizTimer();
    state.quiz.phase='setup';
    state.quiz.questions=[];
    state.quiz.idx=0;
    state.quiz.picked=null;
    state.quiz.answers=[];
    state.quiz.timedOut=false;
    state.quiz.timeRemaining=0;
    state.quiz.resultRecorded=false;
  }
  render();
}

/* ── Filters ── */
function renderFilters(){
  const c=document.getElementById('filters');
  c.innerHTML='';

  const allBtn=document.createElement('button');
  allBtn.className='filter-btn'+(state.filter==='all'?' active':'');
  allBtn.textContent='All';
  allBtn.onclick=()=>setFilter('all');
  c.appendChild(allBtn);

  Object.entries(CATS).forEach(([key,meta])=>{
    const btn=document.createElement('button');
    btn.className='filter-btn'+(state.filter===key?' active':'');
    btn.dataset.cat=key;
    btn.style.setProperty('--cat-color',meta.color);
    btn.innerHTML=`<span class="dot"></span>${meta.label}`;
    btn.onclick=()=>setFilter(key);
    c.appendChild(btn);
  });

  const knownBtn=document.createElement('button');
  knownBtn.className='filter-btn toggle-known'+(state.hideKnown?' active':'');
  knownBtn.id='hide-known-btn';
  knownBtn.title='Hide cards you marked as known';
  knownBtn.innerHTML=`
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 2l2.9 6.9L22 10l-5.5 4.7L18.2 22 12 18.3 5.8 22l1.7-7.3L2 10l7.1-1.1z"/>
    </svg>
    <span id="hide-known-label">${state.hideKnown?'Showing unknown':'Hide known'}</span>
  `;
  knownBtn.onclick=()=>{
    state.hideKnown=!state.hideKnown;
    if(state.mode==='flashcards')rebuildFlashDeck();
    renderFilters();
    render();
  };
  c.appendChild(knownBtn);
}

function setFilter(f){
  state.filter=f;
  if(state.mode==='flashcards')rebuildFlashDeck();
  if(state.mode==='quiz' && state.quiz.phase!=='setup'){
    state.quiz.phase='setup';
    state.quiz.questions=[];
    state.quiz.idx=0;
    state.quiz.picked=null;
    state.quiz.answers=[];
  }
  renderFilters();
  render();
}

function clearSearch(){
  document.getElementById('search').value='';
  filterCards();
}

function filterCards(){
  state.search=document.getElementById('search').value.trim().toLowerCase();
  document.getElementById('search-clear').classList.toggle('show', state.search.length>0);
  if(state.mode==='flashcards')rebuildFlashDeck();
  render();
}

function visible(s){
  if(state.hideKnown && KNOWN.has(s.sym))return false;
  const matchCat=state.filter==='all'||s.cat===state.filter;
  if(!state.search)return matchCat;
  const hay=(s.sym+' '+s.name+' '+s.cat+' '+s.tags.join(' ')+' '+s.what).toLowerCase();
  return matchCat&&hay.includes(state.search);
}

/* ── Card builder ── */
function buildCard(s){
  const card=document.createElement('div');
  card.className='card cat-'+s.cat+(KNOWN.has(s.sym)?' is-known':'');
  card.innerHTML=`
    <button class="card-star${KNOWN.has(s.sym)?' is-known':''}" aria-label="Mark as known" data-sym="${escapeHtml(s.sym)}">
      <svg class="star-line" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 2l2.9 6.9L22 10l-5.5 4.7L18.2 22 12 18.3 5.8 22l1.7-7.3L2 10l7.1-1.1z"/>
      </svg>
      <svg class="star-fill" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12 2l2.9 6.9L22 10l-5.5 4.7L18.2 22 12 18.3 5.8 22l1.7-7.3L2 10l7.1-1.1z"/>
      </svg>
    </button>
    <div class="card-cat">${CATS[s.cat].label}</div>
    <div class="card-sym">${escapeHtml(s.sym)}</div>
    <div class="card-name">${escapeHtml(s.name)}</div>
    <div class="card-tag"><span>${escapeHtml(s.tags[0])}</span></div>
  `;
  card.querySelector('.card-star').addEventListener('click', e=>{
    e.stopPropagation();
    toggleKnown(s.sym);
  });
  card.addEventListener('click',()=>openPanel(s));
  return card;
}

function toggleKnown(sym){
  const wasKnown=KNOWN.has(sym);
  if(wasKnown)KNOWN.delete(sym); else KNOWN.add(sym);
  saveKnown();

  if(state.mode==='flashcards' && state.hideKnown && !wasKnown){
    const idx=state.flashOrder.indexOf(sym);
    if(idx!==-1){
      state.flashOrder.splice(idx,1);
      if(state.flashIndex>=state.flashOrder.length){
        state.flashIndex=Math.max(0,state.flashOrder.length-1);
      }
      state.flashFlipped=false;
    }
  }

  renderFilters();
  render();
}

/* ── Browse view ── */
function buildSection(catKey, items){
  const meta=CATS[catKey];
  const section=document.createElement('section');
  section.className='section surface';
  section.style.setProperty('--cat-color',meta.color);
  section.innerHTML=`
    <div class="section-head">
      <span class="section-dot"></span>
      <h2 class="section-title">${meta.label}</h2>
      <span class="section-count">${items.length}</span>
    </div>
    <div class="grid"></div>
  `;
  const grid=section.querySelector('.grid');
  items.forEach(s=>grid.appendChild(buildCard(s)));
  return section;
}

function renderBrowse(root){
  root.className='view sections';
  const shown=SERVICES.filter(visible);

  setCount(
    shown.length+' service'+(shown.length===1?'':'s')+
    (state.filter==='all'?'':' · '+CATS[state.filter].label)+
    (state.search?' · "'+state.search+'"':'')+
    (state.hideKnown?' · hiding '+KNOWN.size+' known':'')
  );

  if(shown.length===0){
    root.innerHTML='';
    const empty=document.createElement('div');
    empty.className='empty surface';
    empty.textContent='No services match your search.';
    root.appendChild(empty);
    return;
  }

  if(state.filter==='all'){
    Object.keys(CATS).forEach(catKey=>{
      const items=shown.filter(s=>s.cat===catKey);
      if(items.length===0)return;
      root.appendChild(buildSection(catKey,items));
    });
  }else{
    root.appendChild(buildSection(state.filter, shown));
  }
}

/* ── Flashcards view ── */
function rebuildFlashDeck(){
  const deck=SERVICES.filter(visible).map(s=>s.sym);
  if(state.flashShuffle){
    for(let i=deck.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [deck[i],deck[j]]=[deck[j],deck[i]];
    }
  }else{
    const now=Date.now();
    deck.sort((a,b)=>{
      const ar=SRS[a], br=SRS[b];
      const an=ar ? (ar.nextReviewAt || ar.nextDue || 0) : 0;
      const bn=br ? (br.nextReviewAt || br.nextDue || 0) : 0;
      const ad=!ar || an<=now;
      const bd=!br || bn<=now;
      if(ad!==bd)return ad?-1:1;
      return an-bn;
    });
  }
  state.flashOrder=deck;
  state.flashIndex=0;
  state.flashFlipped=false;
}

function getFlashService(){
  if(state.flashOrder.length===0)return null;
  const sym=state.flashOrder[state.flashIndex];
  return SERVICES.find(s=>s.sym===sym);
}

function renderFlashcards(root){
  root.className='view flash-wrap';
  const total=state.flashOrder.length;

  setCount(
    'Flashcards · '+total+' card'+(total===1?'':'s')+
    (state.filter==='all'?'':' · '+CATS[state.filter].label)+
    (state.hideKnown?' · hiding '+KNOWN.size+' known':'')
  );

  if(total===0){
    const empty=document.createElement('div');
    empty.className='empty surface';
    empty.textContent='No cards in this deck. Adjust filters or unmark known.';
    root.appendChild(empty);
    return;
  }

  const s=getFlashService();
  const meta=CATS[s.cat];
  const isKnown=KNOWN.has(s.sym);

  const tools=document.createElement('div');
  tools.className='flash-toolbar';
  tools.innerHTML=`
    <div class="flash-progress">${state.flashIndex+1} / ${total}</div>
    <div class="flash-actions">
      <button class="flash-icon-btn${state.flashShuffle?' active':''}" id="flash-shuffle" title="${state.flashShuffle?'Shuffle on':'Shuffle off'}" aria-label="Toggle shuffle">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M16 3h5v5"/><path d="M21 3l-7 7"/><path d="M16 21h5v-5"/><path d="M21 21l-7-7"/><path d="M3 3l5 5"/><path d="M3 21l5-5"/></svg>
      </button>
      <button class="flash-icon-btn" id="flash-restart" title="Restart deck" aria-label="Restart">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12a9 9 0 1 0 3-6.7"/><path d="M3 4v5h5"/></svg>
      </button>
    </div>
  `;
  root.appendChild(tools);

  const stage=document.createElement('div');
  stage.className='flash-stage';
  stage.style.setProperty('--c',meta.color);

  const card=document.createElement('div');
  card.className='flash-card'+(state.flashFlipped?' flipped':'');
  card.setAttribute('role','button');
  card.setAttribute('tabindex','0');
  card.setAttribute('aria-label','Flip card');

  const tipsHtml=s.tips.map(t=>'<li>'+escapeHtml(t)+'</li>').join('');

  card.innerHTML=`
    <div class="flash-face front">
      <span class="flash-cat"><span class="dot"></span>${meta.label}</span>
      <div class="flash-front-body">
        <div class="flash-sym">${escapeHtml(s.sym)}</div>
        <div class="flash-fullname">${escapeHtml(s.name)}</div>
      </div>
      <div class="flash-hint">Tap to reveal · ${escapeHtml(s.tags[0])}</div>
    </div>
    <div class="flash-face back">
      <div class="flash-back-scroll">
        <div class="flash-back-title">${meta.label}</div>
        <div class="flash-back-sym">${escapeHtml(s.sym)} · ${escapeHtml(s.name)}</div>
        <div class="flash-what">${escapeHtml(s.what)}</div>
        <ul class="flash-tips">${tipsHtml}</ul>
        <div class="flash-srs" aria-label="Rate this card">
          <button class="flash-srs-btn" data-rating="again">Again</button>
          <button class="flash-srs-btn" data-rating="good">Good</button>
          <button class="flash-srs-btn" data-rating="easy">Easy</button>
        </div>
      </div>
    </div>
  `;
  card.addEventListener('click', flipFlash);
  card.addEventListener('keydown', e=>{
    if(e.key===' '||e.key==='Enter'){e.preventDefault();flipFlash();}
  });
  stage.appendChild(card);
  root.appendChild(stage);

  const nav=document.createElement('div');
  nav.className='flash-nav';
  nav.innerHTML=`
    <button class="flash-btn" id="flash-prev" ${state.flashIndex===0?'disabled':''} aria-label="Previous">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 18l-6-6 6-6"/></svg>
      Prev
    </button>
    <button class="flash-btn ${isKnown?'':'known'}" id="flash-known">
      <svg viewBox="0 0 24 24" fill="${isKnown?'none':'currentColor'}" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M12 2l2.9 6.9L22 10l-5.5 4.7L18.2 22 12 18.3 5.8 22l1.7-7.3L2 10l7.1-1.1z"/>
      </svg>
      ${isKnown?'Unmark':'I know this'}
    </button>
    <button class="flash-btn primary" id="flash-next" ${state.flashIndex===total-1?'disabled':''} aria-label="Next">
      Next
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
    </button>
  `;
  root.appendChild(nav);

  const info=document.createElement('div');
  info.className='flash-deck-info';
  info.textContent=KNOWN.size>0
    ? KNOWN.size+' marked known overall · ← / → to navigate · space to flip'
    : '← / → to navigate · space to flip';
  root.appendChild(info);

  // Wire up handlers
  document.getElementById('flash-shuffle').addEventListener('click',()=>{
    state.flashShuffle=!state.flashShuffle;
    rebuildFlashDeck();
    render();
  });
  document.getElementById('flash-restart').addEventListener('click',()=>{
    rebuildFlashDeck();
    render();
  });
  document.getElementById('flash-prev').addEventListener('click',()=>flashStep(-1));
  document.getElementById('flash-next').addEventListener('click',()=>flashStep(1));
  document.getElementById('flash-known').addEventListener('click',()=>{
    toggleKnown(s.sym);
  });
  card.querySelectorAll('.flash-srs-btn').forEach(btn=>{
    btn.addEventListener('click',e=>{
      e.stopPropagation();
      rateCard(s.sym,btn.dataset.rating);
    });
  });
}

function flipFlash(){
  state.flashFlipped=!state.flashFlipped;
  const card=document.querySelector('.flash-card');
  if(card)card.classList.toggle('flipped',state.flashFlipped);
}

function flashStep(delta){
  const total=state.flashOrder.length;
  if(total===0)return;
  const next=state.flashIndex+delta;
  if(next<0||next>=total)return;
  state.flashIndex=next;
  state.flashFlipped=false;
  render();
}

function rateCard(sym,rating){
  const prev=SRS[sym] || {interval:0,nextDue:0,reps:0,last:null};
  let interval;
  if(rating==='again')interval=1;
  else if(rating==='easy')interval=prev.interval ? Math.max(4,Math.ceil(prev.interval*2.8)) : 4;
  else interval=prev.interval ? Math.max(2,Math.ceil(prev.interval*2)) : 2;
  const nextReviewAt=Date.now()+interval*86400000;
  SRS[sym]={
    interval,
    nextDue:nextReviewAt,
    nextReviewAt,
    reps:(prev.reps||0)+1,
    last:rating,
  };
  saveSrs();
  recordAction();
  if(state.flashIndex<state.flashOrder.length-1)flashStep(1);
  else render();
}

/* ── Compare view ── */
function renderCompare(root){
  root.className='view compare-wrap';
  setCount(COMPARISONS.length+' curated comparisons');

  const intro=document.createElement('div');
  intro.className='compare-intro';
  intro.textContent='The trickiest "which one fits?" pairings on the CCP exam.';
  root.appendChild(intro);

  COMPARISONS.forEach(c=>{
    const card=document.createElement('div');
    card.className='compare-card surface';
    card.innerHTML=`
      <div class="compare-head">
        <h3 class="compare-title">${escapeHtml(c.title)}</h3>
        <span class="compare-subtitle">${escapeHtml(c.subtitle)}</span>
      </div>
      <div class="compare-cols"></div>
      <div class="compare-takeaway"><strong>Bottom line</strong>${escapeHtml(c.takeaway)}</div>
    `;
    const cols=card.querySelector('.compare-cols');
    c.items.forEach(item=>{
      const meta=CATS[item.cat];
      const col=document.createElement('div');
      col.className='compare-col cat-'+item.cat;
      col.style.setProperty('--c',meta.color);
      const points=item.points.map(p=>'<li>'+escapeHtml(p)+'</li>').join('');
      col.innerHTML=`
        <div class="compare-col-head">
          <span class="compare-col-dot"></span>
          <span class="compare-col-sym">${escapeHtml(item.sym)}</span>
          <span class="compare-col-cat">${meta.label}</span>
        </div>
        <ul class="compare-points">${points}</ul>
      `;
      const svc=SERVICES.find(s=>s.sym===item.sym);
      if(svc){
        col.style.cursor='pointer';
        col.addEventListener('click',()=>openPanel(svc));
      }
      cols.appendChild(col);
    });
    root.appendChild(card);
  });
}

/* ── AI Study Buddy ── */
function renderAI(root){
  root.className='view ai-wrap';
  setCount('Study Buddy · chat session');

  const head=document.createElement('div');
  head.className='ai-head surface';
  head.innerHTML=`
    <div>
      <div class="ai-title">Study Buddy</div>
      <div class="ai-disclaimer">AI can be wrong. Verify against AWS docs.</div>
    </div>
    <div class="ai-head-actions">
      <button class="quiz-btn" id="ai-new-chat">New chat</button>
    </div>
  `;
  root.appendChild(head);

  const chat=document.createElement('div');
  chat.className='ai-chat surface';
  chat.id='ai-chat';
  if(state.ai.messages.length===0){
    const empty=document.createElement('div');
    empty.className='ai-empty';
    empty.textContent='Ask for a quick explanation, a comparison, or practice questions for the AWS CCP exam.';
    chat.appendChild(empty);
  }else{
    state.ai.messages.forEach((m,i)=>{
      const bubble=document.createElement('div');
      bubble.className='ai-msg '+m.role+(m.error?' error':'');
      if(m.loading){
        bubble.innerHTML='<span class="ai-dots"><span></span><span></span><span></span></span>';
      }else{
        bubble.innerHTML=renderMiniMarkdown(m.content);
      }
      if(m.error && m.retry){
        const retry=document.createElement('button');
        retry.className='quiz-btn ai-retry';
        retry.textContent='Retry';
        retry.addEventListener('click',()=>retryAiMessage(i));
        bubble.appendChild(retry);
      }
      chat.appendChild(bubble);
    });
  }
  root.appendChild(chat);

  const composer=document.createElement('div');
  composer.className='ai-composer glass';
  composer.innerHTML=`
    <textarea class="ai-input" id="ai-input" placeholder="Ask about AWS CCP topics" rows="1" ${state.ai.streaming?'disabled':''}></textarea>
    <button class="header-icon-btn ai-send" id="ai-send" aria-label="Send message" ${state.ai.streaming?'disabled':''}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M22 2 11 13"/><path d="m22 2-7 20-4-9-9-4 20-7z"/></svg>
    </button>
  `;
  root.appendChild(composer);

  document.getElementById('ai-new-chat').addEventListener('click',newAiChat);
  const input=document.getElementById('ai-input');
  const send=document.getElementById('ai-send');
  input.addEventListener('input',autoSizeAiInput);
  input.addEventListener('keydown',e=>{
    if(e.key==='Enter' && !e.shiftKey){
      e.preventDefault();
      sendAiMessage();
    }
  });
  send.addEventListener('click',sendAiMessage);
  requestAnimationFrame(()=>{
    autoSizeAiInput();
    chat.scrollTop=chat.scrollHeight;
    if(!state.ai.streaming)input.focus();
  });
}

function renderMiniMarkdown(text){
  let out=escapeHtml(text || '');
  out=out.replace(/```([\s\S]*?)```/g,(m,code)=>'<pre><code>'+code.trim()+'</code></pre>');
  out=out.replace(/`([^`]+)`/g,'<code>$1</code>');
  out=out.replace(/\*\*([^*]+)\*\*/g,'<strong>$1</strong>');
  return out.split(/\n{2,}/).map(p=>'<p>'+p.replace(/\n/g,'<br>')+'</p>').join('');
}

function autoSizeAiInput(){
  const input=document.getElementById('ai-input');
  if(!input)return;
  input.style.height='auto';
  input.style.height=Math.min(input.scrollHeight,140)+'px';
}

function newAiChat(){
  if(state.ai.streaming)return;
  state.ai.messages=[];
  render();
}

function sendAiMessage(text){
  if(state.ai.streaming)return;
  const input=document.getElementById('ai-input');
  const raw=(typeof text==='string'?text:(input?input.value:'')).trim();
  if(!raw)return;
  state.ai.messages.push({role:'user',content:raw});
  render();
  requestAssistantResponse();
}

function retryAiMessage(index){
  if(state.ai.streaming)return;
  if(state.ai.messages[index] && state.ai.messages[index].error){
    state.ai.messages.splice(index,1);
  }
  render();
  requestAssistantResponse();
}

async function requestAssistantResponse(){
  if(NVIDIA_API_KEY==='PASTE_KEY_HERE'){
    state.ai.messages.push({
      role:'assistant',
      content:'Add your Nvidia API key in the source by replacing NVIDIA_API_KEY before using Study Buddy.',
      error:true,
    });
    render();
    return;
  }

  const assistant={role:'assistant',content:'',loading:true};
  state.ai.messages.push(assistant);
  state.ai.streaming=true;
  render();

  try{
    const outbound=[
      {role:'system',content:AI_SYSTEM_PROMPT},
      ...state.ai.messages
        .filter(m=>!m.error && !m.loading && m.content)
        .map(m=>({role:m.role,content:m.content})),
    ];
    const res=await fetch('https://integrate.api.nvidia.com/v1/chat/completions',{
      method:'POST',
      headers:{
        'Authorization':'Bearer '+NVIDIA_API_KEY,
        'Content-Type':'application/json',
      },
      body:JSON.stringify({
        model:NVIDIA_MODEL,
        messages:outbound,
        temperature:0.6,
        top_p:0.9,
        max_tokens:2048,
        stream:true,
      }),
    });
    if(!res.ok){
      const body=await res.text().catch(()=>'');
      throw new Error('Nvidia API error '+res.status+(body?': '+body.slice(0,180):''));
    }
    if(!res.body)throw new Error('Streaming is not available in this browser.');

    const reader=res.body.getReader();
    const decoder=new TextDecoder();
    let buffer='';
    let started=false;
    while(true){
      const {value,done}=await reader.read();
      if(done)break;
      buffer+=decoder.decode(value,{stream:true});
      const lines=buffer.split('\n');
      buffer=lines.pop();
      for(const line of lines){
        const trimmed=line.trim();
        if(!trimmed || !trimmed.startsWith('data:'))continue;
        const data=trimmed.slice(5).trim();
        if(data==='[DONE]')continue;
        let chunk;
        try{chunk=JSON.parse(data);}catch(e){continue;}
        const delta=chunk.choices && chunk.choices[0] && chunk.choices[0].delta && chunk.choices[0].delta.content;
        if(delta){
          if(!started){
            assistant.loading=false;
            started=true;
          }
          assistant.content+=delta;
          render();
        }
      }
    }
    assistant.loading=false;
    if(!assistant.content)assistant.content='No response was returned.';
  }catch(err){
    const lastUser=[...state.ai.messages].reverse().find(m=>m.role==='user');
    assistant.loading=false;
    assistant.error=true;
    assistant.retry=lastUser ? lastUser.content : '';
    assistant.content=(err && err.name==='AbortError')
      ? 'The request was cancelled.'
      : 'Study Buddy could not connect. '+(err && err.message ? err.message : 'Check the API key, network, or browser CORS restrictions.');
  }finally{
    state.ai.streaming=false;
    render();
  }
}

/* ── Render dispatcher ── */
function setCount(text){
  document.getElementById('count').textContent=text;
}

function render(){
  const root=document.getElementById('view');
  root.innerHTML='';
  if(state.mode==='browse')return renderBrowse(root);
  if(state.mode==='flashcards')return renderFlashcards(root);
  if(state.mode==='compare')return renderCompare(root);
  if(state.mode==='quiz')return renderQuiz(root);
  if(state.mode==='ai')return renderAI(root);
}

/* ─────────────────────────────────────────
   Quiz mode
   ───────────────────────────────────────── */

function shuffleArr(arr){
  const a=arr.slice();
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}

// Auto-generate "which service is described as X?" questions from SERVICES.
// Distractors are 3 services from the same category (harder, more realistic).
function generateAutoQuestions(catFilter){
  const out=[];
  const pool = catFilter==='all'
    ? SERVICES
    : SERVICES.filter(s=>s.cat===catFilter);

  pool.forEach(s=>{
    const desc = s.what.split('. ')[0].trim();
    if(desc.length < 30) return; // skip very short descriptions

    // Same-category distractors (excluding self)
    const sameCat = SERVICES.filter(o=>o.cat===s.cat && o.sym!==s.sym);
    let distractors = shuffleArr(sameCat).slice(0,3);

    // Top up from any other category if not enough
    if(distractors.length < 3){
      const others = SERVICES.filter(o=>
        o.sym!==s.sym && !distractors.find(d=>d.sym===o.sym));
      distractors = distractors.concat(shuffleArr(others).slice(0, 3-distractors.length));
    }

    const correctLabel = s.name;
    const opts = shuffleArr([correctLabel, ...distractors.map(d=>d.name)]);
    out.push({
      q: `Which AWS service matches this description: "${desc}."?`,
      options: opts,
      correct: correctLabel,
      why: `${s.sym} (${s.name}) — ${desc}.`,
      cat: s.cat,
      sym: s.sym,
    });
  });

  return out;
}

function getQuestionWeakScore(q){
  const qStats=STATS.byQuestion[q.q] || {seen:0,missed:0};
  const catStats=STATS.byCategory[q.cat || 'general'] || {seen:0,missed:0};
  const sym=inferQuestionServiceSym(q);
  const svcStats=sym ? (STATS.byService[sym] || {seen:0,missed:0}) : {seen:0,missed:0};
  const servicePressure=(svcStats.missed || 0)*5;
  const questionPressure=(qStats.missed || 0)*3;
  const catPressure=(catStats.missed || 0);
  const accuracyPenalty=(qStats.seen && qStats.missed) ? Math.round((qStats.missed/qStats.seen)*4) : 0;
  return servicePressure+questionPressure+catPressure+accuracyPenalty;
}

function weightedSampleQuestions(pool,count){
  const available=pool.slice();
  const picked=[];
  while(available.length && picked.length<count){
    const weights=available.map(q=>1+getQuestionWeakScore(q));
    const total=weights.reduce((sum,w)=>sum+w,0);
    let r=Math.random()*total;
    let idx=0;
    for(;idx<weights.length;idx++){
      r-=weights[idx];
      if(r<=0)break;
    }
    picked.push(available.splice(Math.min(idx,available.length-1),1)[0]);
  }
  return picked;
}

function buildQuizQuestions(count){
  // Hand-curated scenarios that match filter
  const scenarioPool = SCENARIOS.filter(q=>{
    if(state.filter==='all') return true;
    if(q.cat===null) return true; // general questions OK in any category
    return q.cat===state.filter;
  });

  // Auto-generated description-match questions
  const autoPool = generateAutoQuestions(state.filter);

  if(state.quiz.weakSpots){
    const seen = new Set();
    const pool=scenarioPool.concat(autoPool).filter(q=>{
      if(seen.has(q.q))return false;
      seen.add(q.q);
      return true;
    });
    const weak=weightedSampleQuestions(pool,count);
    if(weak.length>=count)return weak;
    return weak.concat(shuffleArr(pool.filter(q=>!weak.find(w=>w.q===q.q))).slice(0,count-weak.length));
  }

  // Prefer hand-curated first; only top up with auto if needed.
  // But we want VARIETY too — so mix a bit.
  const handShuffled = shuffleArr(scenarioPool);
  const autoShuffled = shuffleArr(autoPool);

  // Take up to ~70% from hand-curated, rest from auto, clamp to count.
  const handTake = Math.min(handShuffled.length, Math.ceil(count*0.7));
  const remain = count - handTake;
  const autoTake = Math.min(autoShuffled.length, remain);

  let combined = handShuffled.slice(0,handTake).concat(autoShuffled.slice(0,autoTake));

  // If still short (small category), top up with whatever's left
  if(combined.length < count){
    const seen = new Set(combined.map(q=>q.q));
    const leftover = handShuffled.concat(autoShuffled).filter(q=>!seen.has(q.q));
    combined = combined.concat(leftover.slice(0, count-combined.length));
  }

  return shuffleArr(combined).slice(0,count);
}

function startQuiz(count){
  stopQuizTimer();
  const questions = buildQuizQuestions(count);
  if(questions.length===0){
    alert('No questions available for this category. Try "All".');
    return;
  }
  state.quiz.count = count;
  state.quiz.questions = questions;
  state.quiz.idx = 0;
  state.quiz.picked = null;
  state.quiz.answers = [];
  state.quiz.timedOut = false;
  state.quiz.resultRecorded = false;
  state.quiz.timeRemaining = state.quiz.timer ? count*83 : 0;
  state.quiz.phase = 'active';
  if(state.quiz.timer)startQuizTimer();
  render();
}

function pickQuizAnswer(opt){
  if(state.quiz.picked!==null) return; // already answered this question
  state.quiz.picked = opt;
  const cur = state.quiz.questions[state.quiz.idx];
  const isCorrect = opt===cur.correct;
  state.quiz.answers[state.quiz.idx] = {
    picked: opt,
    correct: isCorrect,
  };
  recordQuizStat(cur,isCorrect);
  recordAction();
  render();
}

function nextQuiz(){
  if(state.quiz.idx < state.quiz.questions.length-1){
    state.quiz.idx++;
    state.quiz.picked = null;
    render();
  }else{
    stopQuizTimer();
    recordQuizResultHistory();
    state.quiz.phase = 'results';
    render();
  }
}

function exitQuiz(){
  stopQuizTimer();
  state.quiz.phase = 'setup';
  state.quiz.questions = [];
  state.quiz.idx = 0;
  state.quiz.picked = null;
  state.quiz.answers = [];
  state.quiz.timedOut = false;
  state.quiz.timeRemaining = 0;
  state.quiz.resultRecorded = false;
  render();
}

function startQuizTimer(){
  stopQuizTimer();
  state.quiz.timerHandle=setInterval(()=>{
    if(state.quiz.phase!=='active'){
      stopQuizTimer();
      return;
    }
    state.quiz.timeRemaining=Math.max(0,state.quiz.timeRemaining-1);
    updateTimerChip();
    if(state.quiz.timeRemaining<=0){
      stopQuizTimer();
      state.quiz.timedOut=true;
      recordQuizResultHistory();
      state.quiz.phase='results';
      render();
    }
  },1000);
}

function stopQuizTimer(){
  if(state.quiz && state.quiz.timerHandle){
    clearInterval(state.quiz.timerHandle);
    state.quiz.timerHandle=null;
  }
}

function formatQuizTime(seconds){
  const s=Math.max(0,seconds||0);
  const m=Math.floor(s/60);
  const rem=s%60;
  return String(m)+':'+String(rem).padStart(2,'0');
}

function updateTimerChip(){
  const chip=document.getElementById('quiz-timer-chip');
  if(!chip)return;
  chip.textContent=formatQuizTime(state.quiz.timeRemaining);
  chip.classList.toggle('warn',state.quiz.timeRemaining<=60);
}

function setQuizPref(key,value){
  state.quiz[key]=value;
  if(key==='timer')PREFS.timer=value;
  if(key==='weakSpots')PREFS.weakSpots=value;
  savePrefs();
  render();
}

function recordQuizResultHistory(){
  if(state.quiz.resultRecorded)return;
  const total=state.quiz.questions.length;
  if(total===0)return;
  const score=state.quiz.answers.filter(a=>a&&a.correct).length;
  const categories={};
  getQuizCategoryBreakdown().forEach(r=>{
    categories[r.key]={seen:r.seen,correct:r.correct};
  });
  STATS.history=STATS.history || [];
  STATS.history.push({
    at:Date.now(),
    count:total,
    score,
    pct:Math.round((score/total)*100),
    weakSpots:!!state.quiz.weakSpots,
    timer:!!state.quiz.timer,
    timedOut:!!state.quiz.timedOut,
    categories,
  });
  if(STATS.history.length>50)STATS.history=STATS.history.slice(-50);
  state.quiz.resultRecorded=true;
  saveStats();
}

function renderQuiz(root){
  root.className = 'view quiz-wrap';
  if(state.quiz.phase==='setup') return renderQuizSetup(root);
  if(state.quiz.phase==='active') return renderQuizActive(root);
  if(state.quiz.phase==='results') return renderQuizResults(root);
}

function renderQuizSetup(root){
  // Estimate available pool size for current filter
  const handCount = SCENARIOS.filter(q=>{
    if(state.filter==='all') return true;
    if(q.cat===null) return true;
    return q.cat===state.filter;
  }).length;
  const autoCount = (state.filter==='all'?SERVICES.length:SERVICES.filter(s=>s.cat===state.filter).length);
  const totalPool = handCount + autoCount;

  setCount('Quiz · '+(state.filter==='all'?'all categories':CATS[state.filter].label));

  const setup=document.createElement('div');
  setup.className='quiz-setup surface';
  setup.innerHTML=`
    <div class="quiz-setup-title">Practice quiz</div>
    <div class="quiz-setup-sub">Multiple choice with instant feedback. Pick how many questions${state.filter==='all'?'':' (filtered to '+escapeHtml(CATS[state.filter].label)+')'}.</div>
    <div class="quiz-toggle-row">
      <button class="quiz-toggle-pill${state.quiz.weakSpots?' active':''}" id="quiz-weak-toggle" aria-pressed="${state.quiz.weakSpots?'true':'false'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h5l2-7 4 14 2-7h5"/></svg>
        Weak Spots
      </button>
      <button class="quiz-toggle-pill${state.quiz.timer?' active':''}" id="quiz-timer-toggle" aria-pressed="${state.quiz.timer?'true':'false'}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2.5 2.5"/><path d="M9 2h6"/></svg>
        Exam Pace Timer
      </button>
    </div>
    <div class="quiz-count-row">
      ${[5,10,15,20].map(n=>`
        <button class="quiz-count-btn" data-count="${n}">${n}<span class="qcb-label">questions</span></button>
      `).join('')}
    </div>
    <div class="quiz-pool-info">${totalPool} questions in pool · scenarios + service-description matching${state.quiz.weakSpots?' · weighted toward misses':''}${state.quiz.timer?' · 83 sec/question':''}</div>
  `;
  setup.querySelector('#quiz-weak-toggle').addEventListener('click',()=>{
    setQuizPref('weakSpots',!state.quiz.weakSpots);
  });
  setup.querySelector('#quiz-timer-toggle').addEventListener('click',()=>{
    setQuizPref('timer',!state.quiz.timer);
  });
  setup.querySelectorAll('.quiz-count-btn').forEach(btn=>{
    btn.addEventListener('click',()=>{
      const n=parseInt(btn.dataset.count,10);
      startQuiz(n);
    });
  });
  root.appendChild(setup);
}

function renderQuizActive(root){
  const total = state.quiz.questions.length;
  const idx = state.quiz.idx;
  const q = state.quiz.questions[idx];
  const picked = state.quiz.picked;
  const answered = picked!==null;

  setCount('Quiz · question '+(idx+1)+' of '+total);

  // Use the question's category color (or default)
  const catKey = q.cat || 'mgmt'; // fallback for null = neutral
  const meta = CATS[q.cat] || null;
  const accentColor = meta ? meta.color : 'var(--text-1)';
  const catLabel = meta ? meta.label : 'Cloud Concepts';

  const card=document.createElement('div');
  card.className='quiz-card surface';
  card.style.setProperty('--c', accentColor);

  const pct = ((idx + (answered?1:0))/total)*100;

  const optionsHtml = q.options.map((opt,i)=>{
    const letter = String.fromCharCode(65+i); // A,B,C,D
    let cls='quiz-option';
    let mark='';
    if(answered){
      if(opt===q.correct){cls+=' correct';mark='<span class="quiz-option-mark">✓ correct</span>';}
      else if(opt===picked){cls+=' wrong';mark='<span class="quiz-option-mark">✗ your pick</span>';}
      else{cls+=' dim';}
    }
    return `<button class="${cls}" data-opt="${escapeHtml(opt)}" ${answered?'disabled':''}>
      <span class="quiz-option-letter">${letter}</span>${escapeHtml(opt)}${mark}
    </button>`;
  }).join('');

  card.innerHTML=`
    <div class="quiz-progress-row">
      <div class="quiz-progress-bar"><div class="quiz-progress-fill" style="width:${pct}%"></div></div>
      <div class="quiz-progress-text">${idx+1} / ${total}</div>
      ${state.quiz.timer?`<div class="quiz-timer-chip${state.quiz.timeRemaining<=60?' warn':''}" id="quiz-timer-chip">${formatQuizTime(state.quiz.timeRemaining)}</div>`:''}
    </div>
    <span class="quiz-cat"><span class="dot"></span>${escapeHtml(catLabel)}</span>
    <div class="quiz-question">${escapeHtml(q.q)}</div>
    <div class="quiz-options">${optionsHtml}</div>
    ${answered ? `
      <div class="quiz-explanation">
        <strong>${state.quiz.answers[idx].correct?'Correct':'Not quite'}</strong>
        ${escapeHtml(q.why)}
      </div>
      <div class="quiz-actions">
        <button class="quiz-btn" id="quiz-exit">Exit</button>
        <button class="quiz-btn primary" id="quiz-next">
          ${idx===total-1?'See results':'Next question'}
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        </button>
      </div>
    ` : `
      <div class="quiz-actions">
        <button class="quiz-btn" id="quiz-exit">Exit quiz</button>
      </div>
    `}
  `;

  card.querySelectorAll('.quiz-option').forEach(b=>{
    b.addEventListener('click',()=>pickQuizAnswer(b.dataset.opt));
  });
  const exitBtn=card.querySelector('#quiz-exit');
  if(exitBtn)exitBtn.addEventListener('click',exitQuiz);
  const nextBtn=card.querySelector('#quiz-next');
  if(nextBtn)nextBtn.addEventListener('click',nextQuiz);

  root.appendChild(card);
}

function getQuizCategoryBreakdown(){
  const byCat={};
  state.quiz.questions.forEach((q,i)=>{
    const key=q.cat || 'general';
    if(!byCat[key])byCat[key]={key,seen:0,correct:0};
    byCat[key].seen++;
    if(state.quiz.answers[i] && state.quiz.answers[i].correct)byCat[key].correct++;
  });
  return Object.values(byCat).sort((a,b)=>{
    const ap=a.seen ? a.correct/a.seen : 0;
    const bp=b.seen ? b.correct/b.seen : 0;
    if(ap!==bp)return ap-bp;
    return b.seen-a.seen;
  });
}

function renderQuizBreakdown(){
  const rows=getQuizCategoryBreakdown();
  if(rows.length===0)return '';
  return `
    <div class="quiz-breakdown">
      <div class="quiz-breakdown-title">Category breakdown</div>
      ${rows.map(r=>{
        const meta=CATS[r.key] || {label:'Cloud Concepts',color:'var(--text-1)'};
        const pct=r.seen ? Math.round((r.correct/r.seen)*100) : 0;
        const mark=r.correct===r.seen ? '✓' : '✗';
        return `
          <div class="quiz-cat-row" style="--c:${meta.color}">
            <div class="quiz-cat-name">${escapeHtml(meta.label)}</div>
            <div class="quiz-cat-bar"><div class="quiz-cat-fill" style="width:${pct}%"></div></div>
            <div class="quiz-cat-score">${r.correct}/${r.seen} ${mark}</div>
          </div>
        `;
      }).join('')}
    </div>
  `;
}

function renderQuizResults(root){
  const total = state.quiz.questions.length;
  const score = state.quiz.answers.filter(a=>a&&a.correct).length;
  const pct = Math.round((score/total)*100);

  setCount('Quiz · results');

  let msg, sub, color;
  if(pct>=90){msg='Crushing it.';sub='You\'re in great shape for the exam.';color='#30d158';}
  else if(pct>=75){msg='Solid work.';sub='Strong knowledge, polish the misses below.';color='#30d158';}
  else if(pct>=60){msg='Getting there.';sub='Review the misses, take it again.';color='#ffd60a';}
  else{msg='Worth another pass.';sub='Read the explanations, then try again.';color='#ff453a';}

  // Score ring math
  const radius=58;
  const circ=2*Math.PI*radius;
  const offset = circ*(1 - score/total);

  const wrong = state.quiz.answers
    .concat(Array(Math.max(0,total-state.quiz.answers.length)).fill(null))
    .slice(0,total)
    .map((a,i)=>({a,q:state.quiz.questions[i],i}))
    .filter(x=>!x.a || !x.a.correct);

  const reviewHtml = wrong.length===0
    ? '<div class="empty surface" style="padding:18px;">Nothing to review — perfect score.</div>'
    : wrong.map(({q,a})=>`
        <div class="quiz-review-item">
          <div class="quiz-review-q">${escapeHtml(q.q)}</div>
          <div class="quiz-review-row">Your answer: <span class="ans-wrong">${escapeHtml(a ? a.picked : 'No answer')}</span></div>
          <div class="quiz-review-row">Correct: <span class="ans-correct">${escapeHtml(q.correct)}</span></div>
          <div class="quiz-review-why">${escapeHtml(q.why)}</div>
        </div>
      `).join('');

  const wrap=document.createElement('div');
  wrap.className='quiz-results surface';
  wrap.style.setProperty('--score-color',color);
  wrap.innerHTML=`
    <div class="quiz-score-ring">
      <svg viewBox="0 0 140 140" aria-hidden="true">
        <circle class="ring-bg" cx="70" cy="70" r="${radius}"></circle>
        <circle class="ring-fg" cx="70" cy="70" r="${radius}"
          stroke-dasharray="${circ}" stroke-dashoffset="${offset}"></circle>
      </svg>
      <div class="quiz-score-text">
        <div class="quiz-score-num">${score}<span style="opacity:0.4">/${total}</span></div>
        <div class="quiz-score-out">${pct}%</div>
      </div>
    </div>
    <div class="quiz-score-msg">${msg}</div>
    <div class="quiz-score-sub">${state.quiz.timedOut?'Time expired. ':''}${sub}</div>
    <div class="quiz-results-actions">
      <button class="quiz-btn" id="quiz-new">New quiz</button>
      <button class="quiz-btn primary" id="quiz-again">Try ${total} more</button>
    </div>
    ${renderQuizBreakdown()}
    ${wrong.length>0 ? `<div class="quiz-review">
      <div class="quiz-review-title">Review — ${wrong.length} missed</div>
      ${reviewHtml}
    </div>` : ''}
  `;
  wrap.querySelector('#quiz-new').addEventListener('click',exitQuiz);
  wrap.querySelector('#quiz-again').addEventListener('click',()=>startQuiz(total));
  root.appendChild(wrap);

  // Animate ring fill on next frame
  requestAnimationFrame(()=>{
    const ring = wrap.querySelector('.ring-fg');
    if(ring){
      ring.style.strokeDashoffset = circ;
      requestAnimationFrame(()=>{
        ring.style.strokeDashoffset = offset;
      });
    }
  });
}

function openPanel(s){
  const meta=CATS[s.cat];
  const panel=document.getElementById('panel');
  const content=document.getElementById('panel-content');
  panel.style.setProperty('--c',meta.color);

  const tips=s.tips.map(t=>'<li>'+escapeHtml(t)+'</li>').join('');
  const tags=s.tags.map(t=>'<span class="ptag">'+escapeHtml(t)+'</span>').join('');

  content.innerHTML=`
    <span class="panel-cat" style="--c:${meta.color}"><span class="dot"></span>${meta.label}</span>
    <div class="panel-sym">${escapeHtml(s.sym)}</div>
    <div class="panel-fullname" style="--c:${meta.color}">${escapeHtml(s.name)}</div>
    <div class="panel-what">${escapeHtml(s.what)}</div>
    <hr class="divider">
    <div class="panel-section-title">Exam notes</div>
    <ul class="tip-list" style="--c:${meta.color}">${tips}</ul>
    <div class="panel-tags">${tags}</div>
  `;
  panel.style.setProperty('--c',meta.color);
  panel.classList.add('open');
  document.getElementById('overlay').classList.add('open');
  panel.scrollTop=0;
  setBodyModalLock();
}

function closePanel(){
  document.getElementById('panel').classList.remove('open');
  document.getElementById('overlay').classList.remove('open');
  setBodyModalLock();
}

function setBodyModalLock(){
  const serviceOpen=document.getElementById('panel').classList.contains('open');
  const settingsOpen=document.getElementById('settings-panel').classList.contains('open');
  document.body.style.overflow=(serviceOpen||settingsOpen)?'hidden':'';
}

function openSettingsPanel(){
  renderSettingsPanel();
  const panel=document.getElementById('settings-panel');
  panel.classList.add('open');
  document.getElementById('settings-overlay').classList.add('open');
  panel.scrollTop=0;
  setBodyModalLock();
}

function closeSettingsPanel(){
  document.getElementById('settings-panel').classList.remove('open');
  document.getElementById('settings-overlay').classList.remove('open');
  setBodyModalLock();
}

function getSettingsStats(){
  const quiz=getQuizStatsSummary();
  const streak=typeof getStreakSummary==='function'
    ? getStreakSummary()
    : {currentStreak:0,longestStreak:0,dailyGoal:10,todayActions:0};
  return {
    quiz,
    streak,
    starred:KNOWN.size,
    rated:getSrsRatedCount(),
  };
}

function renderSettingsPanel(){
  const content=document.getElementById('settings-content');
  const s=getSettingsStats();
  const theme=document.documentElement.getAttribute('data-theme') || 'dark';
  content.innerHTML=`
    <div class="settings-title" id="settings-title">Settings</div>
    <div class="settings-sub">Study progress, local preferences, and reset controls for this browser.</div>

    <div class="settings-section">
      <div class="settings-section-head">
        <div class="settings-section-title">Profile / Stats</div>
      </div>
      <div class="settings-grid">
        <div class="settings-stat">
          <div class="settings-stat-num">${s.quiz.pct}%</div>
          <div class="settings-stat-label">Lifetime quiz score</div>
        </div>
        <div class="settings-stat">
          <div class="settings-stat-num">${s.quiz.seen}</div>
          <div class="settings-stat-label">Questions answered</div>
        </div>
        <div class="settings-stat">
          <div class="settings-stat-num">${s.quiz.quizzes}</div>
          <div class="settings-stat-label">Quizzes completed</div>
        </div>
        <div class="settings-stat">
          <div class="settings-stat-num">${s.quiz.best?s.quiz.best.pct+'%':'--'}</div>
          <div class="settings-stat-label">Best quiz score</div>
        </div>
        <div class="settings-stat">
          <div class="settings-stat-num">${s.quiz.last?s.quiz.last.pct+'%':'--'}</div>
          <div class="settings-stat-label">Last quiz score</div>
        </div>
        <div class="settings-stat">
          <div class="settings-stat-num">${s.streak.currentStreak}</div>
          <div class="settings-stat-label">Current streak</div>
        </div>
        <div class="settings-stat">
          <div class="settings-stat-num">${s.streak.longestStreak}</div>
          <div class="settings-stat-label">Longest streak</div>
        </div>
        <div class="settings-stat">
          <div class="settings-stat-num">${s.starred}</div>
          <div class="settings-stat-label">Starred known</div>
        </div>
        <div class="settings-stat">
          <div class="settings-stat-num">${s.rated}</div>
          <div class="settings-stat-label">Cards rated</div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="settings-section-head">
        <div class="settings-section-title">Daily goal</div>
      </div>
      <div class="settings-row">
        ${[5,10,15,20].map(n=>`
          <button class="filter-btn${s.streak.dailyGoal===n?' active':''}" data-goal="${n}">${n}</button>
        `).join('')}
      </div>
      <div class="settings-note">${s.streak.todayActions} / ${s.streak.dailyGoal} actions logged today.</div>
    </div>

    <div class="settings-section">
      <div class="settings-section-head">
        <div class="settings-section-title">Theme</div>
      </div>
      <button class="quiz-btn" id="settings-theme-toggle">Switch to ${theme==='dark'?'light':'dark'} mode</button>
    </div>

    <div class="settings-section">
      <div class="settings-section-head">
        <div class="settings-section-title">Reset</div>
      </div>
      <div class="settings-reset-grid">
        <button class="quiz-btn" data-reset="known">Reset starred / known cards</button>
        <button class="quiz-btn" data-reset="srs">Reset spaced-repetition progress</button>
        <button class="quiz-btn" data-reset="stats">Reset quiz stats</button>
        <button class="quiz-btn" data-reset="streak">Reset streak history</button>
        <button class="quiz-btn danger primary" data-reset="all">Clear all data</button>
      </div>
    </div>
  `;

  content.querySelector('#settings-theme-toggle').addEventListener('click',()=>{
    toggleTheme();
    renderSettingsPanel();
  });
  content.querySelectorAll('[data-goal]').forEach(btn=>{
    btn.addEventListener('click',()=>{
      if(typeof setDailyGoal==='function')setDailyGoal(parseInt(btn.dataset.goal,10));
      renderSettingsPanel();
    });
  });
  content.querySelectorAll('[data-reset]').forEach(btn=>{
    btn.addEventListener('click',()=>handleSettingsReset(btn.dataset.reset));
  });
}

function handleSettingsReset(kind){
  if(kind==='known'){
    if(!confirm('Reset starred / known cards?'))return;
    KNOWN.clear();
    saveKnown();
  }else if(kind==='srs'){
    if(!confirm('Reset spaced-repetition progress?'))return;
    resetSrs();
  }else if(kind==='stats'){
    if(!confirm('Reset quiz stats?'))return;
    resetStats();
  }else if(kind==='streak'){
    if(!confirm('Reset streak history?'))return;
    if(typeof resetStreak==='function')resetStreak();
  }else if(kind==='all'){
    if(!confirm('Clear all local AWS CCP study data? This cannot be undone.'))return;
    try{
      Object.keys(localStorage).forEach(k=>{
        if(k.indexOf('aws-ccp-')===0)localStorage.removeItem(k);
      });
    }catch(e){}
    location.reload();
    return;
  }
  renderFilters();
  render();
  renderSettingsPanel();
}

function escapeHtml(str){
  return str.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

document.addEventListener('keydown',e=>{
  if(e.key==='Escape'){closePanel();closeSettingsPanel();return;}
  if(state.mode==='flashcards' && !document.getElementById('panel').classList.contains('open') && !document.getElementById('settings-panel').classList.contains('open')){
    if(e.target && (e.target.id==='search'))return;
    if(e.key==='ArrowRight'){flashStep(1);}
    else if(e.key==='ArrowLeft'){flashStep(-1);}
    else if(e.key===' '){e.preventDefault();flipFlash();}
  }
});

document.addEventListener('click',e=>{
  const pop=document.getElementById('streak-popover');
  if(!pop || !pop.classList.contains('open'))return;
  if(e.target && e.target.closest && e.target.closest('.streak-wrap'))return;
  pop.classList.remove('open');
});

function toggleTheme(){
  const root=document.documentElement;
  root.classList.add('theme-transitioning');
  const cur=root.getAttribute('data-theme')||'dark';
  const next=cur==='dark'?'light':'dark';
  root.setAttribute('data-theme',next);
  try{localStorage.setItem('aws-ccp-theme',next);}catch(e){}
  setTimeout(()=>root.classList.remove('theme-transitioning'),400);
}

(function initTheme(){
  let saved=null;
  try{saved=localStorage.getItem('aws-ccp-theme');}catch(e){}
  if(saved==='light'||saved==='dark'){
    document.documentElement.setAttribute('data-theme',saved);
  }else{
    document.documentElement.setAttribute('data-theme','dark');
  }
})();

renderFilters();
renderStreakChip();
render();

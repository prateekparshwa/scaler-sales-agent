// Curated Scaler facts. Sourced directly from scaler.com pages (Nov 2025 scrape).
// Each chunk is paired with the source URL so PDF generation can cite or refuse.
// IMPORTANT: do not add fabricated stats here. If scaler.com doesn't say it, it doesn't go in.

export interface ScalerChunk {
  id: string;
  source: string;
  heading: string;
  text: string;
}

export const SCALER_CORPUS: ScalerChunk[] = [
  {
    id: "academy-overview",
    source: "https://www.scaler.com/academy/",
    heading: "Scaler Academy — Modern Software & AI Engineering Program",
    text: "12-month structured curriculum with three tracks: Beginner (12 months, no prior coding), Intermediate (12 months, some experience), Advanced (10 months, DSA background). Next cohort starts May 2026. Total fee ₹3,99,000 (~₹9,791/month with no-cost EMI), ₹20,000 upfront commitment. Lifetime access to curriculum updates and recorded content.",
  },
  {
    id: "academy-curriculum-core",
    source: "https://www.scaler.com/academy/",
    heading: "Scaler Academy — Core curriculum modules",
    text: "Programming fundamentals (2 months, 27 sessions). Intermediate DSA with AI-assisted problem solving (1 month, 12 sessions). Advanced DSA covering arrays, recursion, hashing, sorting, bit manipulation (4 months, 59 sessions). Dynamic programming, heaps, graphs, greedy algorithms (4 months, 18 sessions). The program tagline is 'AI built into every module, not bolted on after'.",
  },
  {
    id: "academy-ai-agents-module",
    source: "https://www.scaler.com/academy/",
    heading: "Scaler Academy — AI & Agents module (RAG, multi-agent, LLM apps)",
    text: "Dedicated module 'AI & Agents: From Talking to AI to Building One' (1 month, 11 sessions). Covers prompt engineering, RAG (Retrieval-Augmented Generation), multi-agent orchestration, and AI-powered app development. System design and backend architecture are taught alongside AI integration, not separately.",
  },
  {
    id: "academy-projects",
    source: "https://www.scaler.com/academy/",
    heading: "Scaler Academy — Portfolio projects students build",
    text: "Students build portfolio-ready projects: LinkForge AI (resume-to-portfolio converter using HTML/CSS/AI), SkyAI Advisor (weather app with AI-powered personalised recommendations), Kanban Board with AI prioritisation, and ShowKart (full MERN capstone mimicking BookMyShow with AI recommendations).",
  },
  {
    id: "academy-target-audience",
    source: "https://www.scaler.com/academy/",
    heading: "Scaler Academy — Who it's for, by years of experience",
    text: "1-4 YoE: SDEs, QA engineers, frontend developers seeking stronger fundamentals and AI-assisted development workflows for advancement beyond execution-only roles. 2-6 YoE: fullstack and backend engineers developing product-oriented engineering skills. 3-8 YoE: senior engineers and tech leads building AI-first architectural expertise. 5-10+ YoE: solution architects and product builders creating AI-integrated systems.",
  },
  {
    id: "academy-instructors",
    source: "https://www.scaler.com/academy/",
    heading: "Scaler Academy — Instructor credentials",
    text: "All instructors are active industry professionals. Anshuman Singh (Co-Founder, Scaler) — 15+ years, two-time ACM ICPC World Finalist, built Facebook Messenger; rated 4.9/5. Shivank Agarwal (SVP Engineering) — 14+ years, decade at Microsoft and Oracle; 4.7/5. Naman Bhalla (Co-Founder Scaler AI Labs) — 6+ years, Google Kickstart rank 135; 4.8/5. Anurag Khanna (Principal SWE, Cadence) — ex-Microsoft, ex-Amazon; 4.8/5. Utkarsh Gupta (VP Academic, Scaler) — Codeforces Master, 750+ live sessions; 4.9/5. Umang Agrawal (SDE-II Amazon, ex-Microsoft) — 750+ sessions, 4.87/5.",
  },
  {
    id: "academy-mentor-support",
    source: "https://www.scaler.com/academy/",
    heading: "Scaler Academy — 1:1 mentor support model",
    text: "Industry professionals currently employed at top companies provide real-time code review and unblocking. The model emphasises 'currently employed, currently hiring' — not lecturers, but practitioners in the role students are trying to reach.",
  },
  {
    id: "academy-mock-interviews",
    source: "https://www.scaler.com/academy/",
    heading: "Scaler Academy — Mock interview prep with AI avatars",
    text: "AI-trained avatars simulate real SWE interview formats across DSA, low-level design, and system design. Designed to give students reps in interview conditions before live interviews.",
  },
  {
    id: "academy-community",
    source: "https://www.scaler.com/academy/",
    heading: "Scaler Academy — Community and alumni network",
    text: "37,000+ active tech professionals in the alumni network. 1,00,000+ total Scaler alumni across all programs. Lifetime access continues after program completion — curriculum updates, live sessions, and recorded content.",
  },
  {
    id: "academy-ai-learning-model",
    source: "https://www.scaler.com/academy/",
    heading: "Scaler Academy — The AI-first learning model",
    text: "The pedagogy is 'You don't just learn from AI. You teach it. Correcting a naive AI's wrong approaches builds conceptual clarity.' AI is used throughout the curriculum as a learning peer the student debugs, not as a content delivery channel.",
  },
  {
    id: "academy-job-market-stats",
    source: "https://www.scaler.com/academy/",
    heading: "Scaler Academy — Market growth statistics cited",
    text: "Statistics cited on the page: 163% growth in AI-related job postings between 2024 and 2025 (LinkedIn, 365 Data Science, 2025). 'AI Engineer' ranked fastest-growing job title on LinkedIn's 2026 Jobs Report. 78% of all IT job postings now demand AI expertise (IntuitionLabs, 2025). Average AI engineer salary in 2025 is $206K, a $50,000 jump in a single year (MRJ Recruitment, 2026).",
  },
  {
    id: "academy-alumni-transitions",
    source: "https://www.scaler.com/academy/",
    heading: "Scaler Academy — Documented alumni transitions",
    text: "Shivam Prakash: Backend Engineer at Ericsson → Computer Scientist at Adobe (received 3 offers). Divyanshu Tanter: Data Scientist at Wipro → AI Researcher at Dassault Systems (4 offers). Sayyam Bhandari: Senior BI Analyst → Data Engineer at Amazon (2 offers). Note: specific salary deltas and percentage placement rates are not disclosed on the public page — leads asking for those numbers should be told 'we'll share specifics with you on the next call'.",
  },
  {
    id: "ds-overview",
    source: "https://www.scaler.com/data-science-course/",
    heading: "Scaler Data Science & ML — program overview",
    text: "Modern Data Science and ML with Specialisation in AI. 12 months. Fee ₹3,99,000 total (~₹9,791/month with EMI). Targets 0-4 YoE (SDEs, QA, analysts, non-tech graduates), 1-4 YoE (SWEs transitioning to AI/ML), 2-6 YoE (self-learners future-proofing against AI), 4-10+ YoE (mid-level seeking growth).",
  },
  {
    id: "ds-curriculum",
    source: "https://www.scaler.com/data-science-course/",
    heading: "Scaler Data Science & ML — curriculum modules",
    text: "Advanced SQL & AI for Data Professionals (2 months, 25 sessions). Excel & Dashboarding with AI Storytelling (1 month, 12 sessions). Python Foundations + AI Coding Assistants (1 month, 12 sessions). Data to Decisions: Product Analytics with AI (1 month, 12 sessions). Generative AI for Data Analytics & Automation (1 month, 12 sessions). Additional modules: Cloud/AWS pipelines, Supervised ML, NLP & Transformers, Experimentation frameworks. Tagline: 'AI built into every module, not bolted on after'.",
  },
  {
    id: "ds-genai",
    source: "https://www.scaler.com/data-science-course/",
    heading: "Scaler Data Science & ML — GenAI/LLM coverage",
    text: "Workflow taught throughout: Generate → Validate → Improve. AI-assisted query generation and debugging, LLM-powered insight summarisation, report automation, AI mock interviews with live avatars, RAG pipelines, deployed AI systems. 50+ projects on real business cases (Swiggy, Zepto, Meesho, Myntra, Amazon).",
  },
  {
    id: "ds-instructors",
    source: "https://www.scaler.com/data-science-course/",
    heading: "Scaler Data Science & ML — instructor highlights",
    text: "Anshuman Singh (Co-Founder) — ACM ICPC World Finalist, built Facebook Messenger, 15+ YoE, 4.9★. Saurabh Kango — ex-LinkedIn, ex-Airbnb Data Scientist, 10+ YoE, 4.8★. Thanish Batcha — built end-to-end ML at Amazon using BERT/RoBERTa, 8+ YoE, 4.7★. All described as 'currently employed, currently hiring' in target industry roles.",
  },
  {
    id: "devops-overview",
    source: "https://www.scaler.com/devops-course/",
    heading: "Scaler DevOps, Cloud & AI Platform Engineering",
    text: "Program: DevOps, Cloud & AI Platform Engineering. 12 months. Fee ₹3,99,000 total (~₹9,791/month no-cost EMI; ₹20,000 upfront). Targets: 0-3 YoE (graduates, junior devs, QA), 3-7 YoE (SWEs and DevOps engineers), 7-12 YoE (SREs, security engineers, data engineers), 12+ YoE (cloud architects, engineering leaders).",
  },
  {
    id: "devops-curriculum",
    source: "https://www.scaler.com/devops-course/",
    heading: "Scaler DevOps — curriculum modules",
    text: "Linux Essentials (3 weeks). Shell Scripting & Git for DevOps (4 weeks). Docker, Kubernetes & Observability (3 months). CI/CD, GitOps & Configuration Management (2 months). AWS Cloud Foundations (1.5 months). Specialised modules in MLOps and Cybersecurity. Emerging roles highlighted: AI-Enabled SRE, AIOps Systems Architect, Agentic Workflow Designer.",
  },
  {
    id: "about-founders",
    source: "https://www.scaler.com/about/",
    heading: "Scaler — founders and company milestones",
    text: "Scaler Academy was established by IIIT Hyderabad alumni Anshuman Singh and Abhimanyu Saxena. Anshuman was previously a Technical Team Lead at Facebook USA (Messenger, data ingestion automation). Abhimanyu led design on Fab.com's frontend and founded Daksh Home Automation System. The company raised $76.5M, achieved operational profitability, and is backed by Sequoia and Tiger Global.",
  },
  {
    id: "about-network",
    source: "https://www.scaler.com/about/",
    heading: "Scaler — hiring partners and instructor network",
    text: "600+ organisations trust Scaler for tech talent recruitment. 4,000+ graduates upskilled and placed at major tech firms. Instructor network of 1,000+ experts from Meta, Amazon, Google, Directi, and Microsoft. Specific hiring partner lists and learner-to-instructor ratios are not publicly disclosed — leads asking for these should be told 'we'll share details on the next call'.",
  },
  {
    id: "policy-no-guarantees",
    source: "internal-policy",
    heading: "Internal policy — Job/placement guarantees",
    text: "Scaler does NOT guarantee jobs or specific salary outcomes. The public site never makes a placement-guarantee claim. If a lead asks 'can you guarantee a job', the correct response is: highlight the alumni network (37k active professionals), the 600+ hiring partner organisations, the documented alumni transitions, the 1:1 mentor model — but explicitly clarify there is no contractual guarantee, and acceptance into a role depends on the learner's effort and interview performance. Anything stronger than this is dishonest.",
  },
  {
    id: "policy-entrance-test",
    source: "internal-policy",
    heading: "Internal policy — Entrance test framing",
    text: "The Scaler entrance test is a calibration tool, not an exclusion gate. Its purpose is to place the learner in the right track (Beginner / Intermediate / Advanced for Academy; analogous for DS and DevOps). A lead nervous about the test should be reassured: not clearing the test at the highest level just means starting in a different track, not rejection from the program. They get one re-attempt typically. Specific re-attempt policy: 'we'll confirm the current policy on the next call'.",
  },
  {
    id: "policy-financing",
    source: "internal-policy",
    heading: "Internal policy — Financing and EMI options",
    text: "Scaler offers no-cost EMI on the ₹3,99,000 fee, working out to ~₹9,791/month. Upfront commitment is ₹20,000. The site emphasises 'no-cost EMI' but doesn't disclose the lender, term lengths, or eligibility criteria publicly. For specific affordability questions from leads (loan eligibility, family income thresholds, scholarship programs), the BDA should share the financing brochure separately rather than improvise numbers.",
  },
  {
    id: "policy-vs-free-content",
    source: "internal-policy",
    heading: "Internal policy — 'Why pay vs free content (Coursera, YouTube, Andrew Ng)'",
    text: "When a lead asks why they should pay ₹3.5L+ when free content exists (Andrew Ng, Coursera, YouTube), the honest framing is: the curriculum content is not the moat. What you're paying for is (1) 1:1 mentor unblocking from currently-employed industry practitioners, (2) the structured 12-month commitment device that overcomes the well-documented dropout rate of self-paced learning, (3) the 37k-active-alumni network for referrals when you start applying, (4) project review and code review feedback you cannot get from a video. Free content + self-study works for a small minority of disciplined learners. The honest answer is not 'our content is better' — it's 'the wrapper around the content is what changes outcomes'.",
  },
  {
    id: "policy-cohort-quality",
    source: "internal-policy",
    heading: "Internal policy — Cohort seniority and peer quality",
    text: "Cohorts include the full YoE range listed for each program. A senior engineer (7+ YoE) coming in will find peers at their level, but not exclusively. Honest answer if a senior lead asks 'will I be tutoring everyone?': cohorts have streams/tracks; senior learners are clustered with senior peers in advanced track sessions and mentor pairings. Cross-level interaction happens in community channels, which most senior learners report as adding to network value rather than diluting learning value.",
  },
];

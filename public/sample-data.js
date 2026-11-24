/* Sample data for Moonshot Inc. (fictional Wave 3 Portfolio Hub GCC) and an anonymised
   peer benchmark pool for interactive demo / preview mode. Also used by the admin
   "Load Moonshot Inc. sample" action to seed a complete end-to-end workspace. */
(function (global) {
  'use strict';

  // Moonshot Inc. — Cohort 1: Engineering & AI (Q1 2026 Baseline Snapshot: 2026-04-10)
  const MOONSHOT_ENG_Q1 = {
    _x: {
      au: 'Sebastian Chandy, Zinnov EB Practice',
      ad: '2026-04-10',
      iw: 'Ananya Rao (VP Engineering & Site Lead), Vikram Mehta (Head of Talent Acquisition), Meera Nair (People Partner), plus 6 senior engineers interviewed across Bengaluru and Hyderabad.',
      sum: 'Moonshot Inc. has grown into a genuine Portfolio Hub owning core AI platform and payments orchestration roadmaps out of India, yet its external employer brand still reads like a Satellite delivery centre. Candidates know the US parent but cannot articulate what the India centre owns, and referral hiring has slipped to 9%. Immediate priorities: establish unaided awareness in Bengaluru AI/backend circles, fix candidate feedback in the assessment funnel, and rebuild the referral engine.'
    },
    '1.1': {
      in: true, sc: 2, vd: 'b', pr: 'n',
      ev: 'Reviewed careers.moonshot-inc.example/india and LinkedIn Life tab on 2026-04-08. Page was updated once in August 2025 with generic parent-company copy; no India engineering charter listed.',
      iv: 'Last updated 238 days ago; 65% profile completeness', ivd: '2026-04-08',
      nt: 'Recruiting team owns LinkedIn updates ad hoc; careers microsite requires HQ web team tickets.',
      lk: [{ t: 'Moonshot India Careers Page', u: 'https://careers.moonshot-inc.example/india', d: '2026-04-08' }]
    },
    '1.2': {
      in: true, sc: 1, vd: 'b', pr: 'f',
      ev: 'Baseline talent perception pulse (n=140 senior backend & ML engineers in Bengaluru, March 2026): only 7% named Moonshot India unaided.',
      iv: '7% unaided awareness among Bengaluru senior ML/backend talent', ivd: '2026-03-22',
      nt: 'Strong recall of the US parent product among fintech engineers, but almost zero awareness that core platform engineering sits in India.',
      lk: [{ t: 'Q1 Talent Perception Pulse Summary', u: 'https://intranet.moonshot-inc.example/eb/q1-pulse', d: '2026-04-02' }]
    },
    '1.4': {
      in: true, sc: 2, vd: 'b', pr: 'n',
      ev: 'Reviewed 2025 EVP deck shared by HR on 2026-04-06. Three pillars stated ("Build at scale, Own the outcome, Grow globally") but no comparative proof points against rival Bengaluru GCCs.',
      iv: '3 EVP attributes stated, 0 benchmarked externally', ivd: '2026-04-06',
      nt: 'EVP language is indistinguishable from four competing fintech GCCs in Outer Ring Road.',
      lk: []
    },
    '1.7': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Parent FY25 Annual Report (p. 24) names Moonshot India as the global Centre of Excellence for Risk & AI Engineering.',
      iv: 'Named as CoE in FY25 Annual Report; 2 earnings call mentions', ivd: '2026-02-18',
      nt: 'HQ leadership already views the centre strategically; the gap is translating that internal credibility into local market reputation.',
      lk: [{ t: 'Moonshot FY25 Annual Report', u: 'https://investors.moonshot-inc.example/fy25-report', d: '2026-04-04' }]
    },
    '2.1': {
      in: true, sc: 2, vd: 'b', pr: 'n',
      ev: 'Greenhouse ATS export (Q1 2026, 42 engineering requisitions): average 9 qualified applications per open role, heavy reliance on agencies (38% of hires).',
      iv: '9 qualified applications per open engineering role', ivd: '2026-03-31',
      nt: 'High raw applicant volume from job boards, but low signal-to-noise on Staff+ and ML roles.',
      lk: [{ t: 'Greenhouse Q1 Funnel Report', u: 'https://ats.moonshot-inc.example/reports/q1-2026', d: '2026-04-05' }]
    },
    '2.3': {
      in: true, sc: 2, vd: 'b', pr: 'f',
      ev: 'Post-interview candidate survey (Q1 2026, n=88 responses): cNPS measured only at final stage (+14 overall, -18 among rejected finalists).',
      iv: 'Candidate NPS +14 overall (end-of-process only)', ivd: '2026-03-28',
      nt: 'Candidates cited 12-day silence between system design round and final debrief as top frustration.',
      lk: []
    },
    '2.5': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Greenhouse offer tracker (Q1 2026): 76% offer acceptance rate vs. 72% Bengaluru fintech GCC median; compensation bands explained verbally by recruiters.',
      iv: '76% offer acceptance rate', ivd: '2026-03-31',
      nt: 'Competitive equity refreshers help close senior offers once candidates meet the engineering directors.',
      lk: []
    },
    '3.3': {
      in: true, sc: 1, vd: 'b', pr: 'n',
      ev: 'Manager enablement audit (April 2026): no manager brand-carrier briefing exists; never measured in manager surveys.',
      iv: 'Not measured; no manager narrative toolkit', ivd: '2026-04-09',
      nt: 'Engineering managers pitch their individual squads well but cannot articulate the wider Moonshot India mandate.',
      lk: []
    },
    '3.8': {
      in: true, sc: 2, vd: 'b', pr: 'n',
      ev: '',
      iv: 'Values published on intranet; example recall not yet surveyed', ivd: '2026-04-08',
      nt: 'HR reports values are visible in townhalls, but no survey artefact was provided to verify employee recall.',
      lk: []
    },
    '4.1': {
      in: true, sc: 2, vd: 'b', pr: 'f',
      ev: 'Greenhouse source-of-hire export (Q1 2026): referrals accounted for 9% of engineering hires (down from 14% in FY25).',
      iv: '9% referral share of engineering hires', ivd: '2026-03-31',
      nt: 'Employees cited slow status updates on referred friends as the main reason they stopped referring.',
      lk: []
    },
    '4.3': {
      in: true, sc: 2, vd: 'b', pr: 'n',
      ev: 'Glassdoor & AmbitionBox audit on 2026-04-07: Glassdoor 3.6 (wide spread: 31% 5-star, 24% 1-2 star), AmbitionBox 3.7, 14% employer response rate.',
      iv: 'Glassdoor 3.6 (std dev 1.2), 14% response rate', ivd: '2026-04-07',
      nt: 'Recent negative reviews cluster around mid-level promotion clarity and hybrid-work communication.',
      lk: [{ t: 'Glassdoor Profile Snapshot', u: 'https://glassdoor.example/moonshot-india', d: '2026-04-07' }]
    },
    '5.1': {
      in: true, sc: 2, vd: 'b', pr: 'n',
      ev: 'Content audit (April 2026): 2 engineering blog posts published in the past 12 months, no editorial calendar or conference speaking tracker.',
      iv: '0.5 published technical pieces per quarter; 0 third-party citations', ivd: '2026-04-07',
      nt: 'Principal engineers have strong stories on real-time fraud ML models but lack editorial and legal sign-off support.',
      lk: []
    }
  };

  // Moonshot Inc. — Cohort 1: Engineering & AI (Current / Q3 2026 Review: 2026-10-15)
  const MOONSHOT_ENG_Q3 = {
    _x: {
      au: 'Sebastian Chandy, Zinnov EB Practice',
      ad: '2026-10-15',
      iw: 'Ananya Rao (VP Engineering & Site Lead), Vikram Mehta (Head of Talent Acquisition), Meera Nair (People Partner), Rohan Kulkarni (Principal Architect), plus 8 engineers interviewed across Bengaluru and Hyderabad.',
      sum: 'Six months into its employer brand programme, Moonshot Inc. has closed its foundational hygiene gaps: the India engineering careers hub is now refreshed quarterly, qualified inbound applications have risen from 9 to 18 per role, and offer acceptance reached 83% with published level-band logic. However, the centre remains a Portfolio Hub operating with Consistency-stage awareness and advocacy. Unaided awareness (14%), referral share (13%), and Glassdoor spread (3.8, wide variance) are the three levers that will unlock organic senior talent demand in FY27.'
    },
    '1.1': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Reviewed careers.moonshot-inc.example/india and LinkedIn Life tab on 2026-10-12. Both refreshed on a quarterly content plan owned by EB Lead; live architecture case studies and team charters published.',
      iv: 'Updated 18 days ago (quarterly cadence); 94% profile completeness', ivd: '2026-10-12',
      nt: 'Major improvement since April. Moving the microsite to a dedicated India CMS removed the HQ bottleneck.',
      lk: [
        { t: 'Moonshot India Engineering Hub', u: 'https://careers.moonshot-inc.example/india', d: '2026-10-12' },
        { t: 'LinkedIn Life — Bengaluru & Hyderabad', u: 'https://linkedin.example/company/moonshot-inc/life', d: '2026-10-12' }
      ]
    },
    '1.2': {
      in: true, sc: 2, vd: 'b', pr: 'f',
      ev: 'LinkedIn Talent Insights & Q3 Bengaluru talent perception survey (n=185 senior backend & ML engineers, Sept 2026): 14% named Moonshot India unaided (up from 7% in Q1), still below the 25% Portfolio Hub threshold.',
      iv: '14% unaided awareness among target Bengaluru ML/backend engineers', ivd: '2026-09-25',
      nt: 'Doubled in six months via targeted tech meetups, but recognition outside Bengaluru (Hyderabad, Pune) remains under 8%.',
      lk: [{ t: 'Q3 Talent Perception Survey Deck', u: 'https://intranet.moonshot-inc.example/eb/q3-awareness-survey', d: '2026-10-03' }]
    },
    '1.4': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Reviewed Q3 EVP Proof Book & competitive benchmark against 5 peer fintech GCCs (2026-10-04). Three attributes ("Global Product Ownership", "Real-Time AI Scale", "Transparent Staff Track") backed by internal metrics.',
      iv: '3 attributes evidenced and benchmarked against 5 peer GCCs', ivd: '2026-10-04',
      nt: 'Recruiters now use the side-by-side proof sheet during closing calls.',
      lk: [{ t: 'Moonshot India EVP Proof Book v2', u: 'https://intranet.moonshot-inc.example/eb/evp-proof-v2', d: '2026-10-04' }]
    },
    '1.7': {
      in: true, sc: 4, vd: 'a', pr: 'n',
      ev: 'Parent Q2 FY26 earnings call transcript and Investor Day deck (Sept 2026) explicitly cite Moonshot India as the primary engine behind the new Agentic Risk Platform.',
      iv: 'Featured in CEO Investor Day strategy narrative & 2 global keynotes', ivd: '2026-09-18',
      nt: 'Clear strength to lead with in sponsor conversations. HQ sponsorship is already at Authority level.',
      lk: [{ t: 'FY26 Investor Day Strategy Deck (p. 18)', u: 'https://investors.moonshot-inc.example/investor-day-2026', d: '2026-10-05' }]
    },
    '2.1': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Greenhouse ATS export (Q3 2026, 51 engineering requisitions): 18 qualified applications per open role with structured rubric screening; agency dependency cut from 38% to 21%.',
      iv: '18 qualified applications per open role; 21% agency share', ivd: '2026-10-01',
      nt: 'Role-specific engineering problem statements in job ads significantly lifted applicant quality.',
      lk: [{ t: 'Greenhouse Q3 Funnel Dashboard', u: 'https://ats.moonshot-inc.example/reports/q3-2026', d: '2026-10-06' }]
    },
    '2.3': {
      in: true, sc: 2, vd: 'b', pr: 'f',
      ev: 'Candidate NPS survey (Q3 2026, n=112): overall cNPS rose to +26, but measurement still happens only at process end — stage-level ownership and SLAs for the technical debrief round are not yet tracked.',
      iv: 'Candidate NPS +26 overall (end-of-process only; no stage breakdown)', ivd: '2026-10-02',
      nt: 'Interviewers still average 7 business days to submit scorecards; TA Head wants stage-level SLA dashboards next quarter.',
      lk: [{ t: 'Q3 Candidate Experience Summary', u: 'https://ats.moonshot-inc.example/reports/cnps-q3', d: '2026-10-08' }]
    },
    '2.5': {
      in: true, sc: 4, vd: 'a', pr: 'n',
      ev: 'Greenhouse offer analytics (Q3 2026) + published Total Rewards Philosophy one-pager shared with finalists: 83% offer acceptance rate (sector median 73%), counteroffer loss down to 6%.',
      iv: '83% offer acceptance rate; pay logic published to finalists', ivd: '2026-10-01',
      nt: 'Publishing equity vesting and level-band logic upfront eliminated most late-stage negotiation friction.',
      lk: [{ t: 'Total Rewards & Leveling Guide', u: 'https://careers.moonshot-inc.example/rewards-guide', d: '2026-10-10' }]
    },
    '3.3': {
      in: true, sc: 2, vd: 'b', pr: 'n',
      ev: 'Manager enablement workshop deck delivered to 34 engineering managers in August 2026; unprompted narrative recall has not yet been surveyed.',
      iv: '34 of 48 managers briefed; recall not yet measured', ivd: '2026-08-29',
      nt: 'Good start with the workshop, but without a pulse check we cannot verify whether managers actually use the ownership narrative in 1:1s.',
      lk: []
    },
    '3.8': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: '',
      iv: '56% of employees cited a concrete values example in Q3 pulse (verbal report)', ivd: '2026-09-30',
      nt: 'People Partner shared the 56% figure verbally during interview; still awaiting the raw Q3 pulse survey export to mark this score as evidenced.',
      lk: []
    },
    '4.1': {
      in: true, sc: 2, vd: 'b', pr: 'f',
      ev: 'Greenhouse source-of-hire export (Q3 2026): referral share rose from 9% to 13%, still below the 15-30% Portfolio Hub expectation.',
      iv: '13% referral share of engineering hires', ivd: '2026-10-01',
      nt: 'Automated Slack status notifications for referrers launched in September — expect stronger conversion in Q4 if paired with targeted squad referral sprints.',
      lk: [{ t: 'Referral Funnel Q3 Export', u: 'https://ats.moonshot-inc.example/reports/referrals-q3', d: '2026-10-06' }]
    },
    '4.3': {
      in: true, sc: 2, vd: 'b', pr: 'n',
      ev: 'Glassdoor & AmbitionBox audit on 2026-10-11: Glassdoor 3.8 (spread still wide: 35% 5-star, 19% 1-2 star), AmbitionBox 3.9; employer response rate improved to 62%, but spread is not formally tracked.',
      iv: 'Glassdoor 3.8 (std dev 1.05), 62% response rate', ivd: '2026-10-11',
      nt: 'Responding thoughtfully to critical reviews helped lift the headline score, but bimodal spread signals uneven manager quality across teams.',
      lk: [{ t: 'Q3 Review-Site Health Audit', u: 'https://intranet.moonshot-inc.example/eb/review-audit-q3', d: '2026-10-11' }]
    },
    '5.1': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Moonshot Engineering Blog & conference log (Q3 2026): 5 deep-dive technical articles published in Q3 on a monthly cadence, plus 2 talks at Fifth Elephant & KubeCon India.',
      iv: '5 technical pieces/quarter; 2 tier-1 conference talks; 1 external citation', ivd: '2026-10-10',
      nt: 'Fastest-improving capability. Establishing a lightweight legal review SLA unlocked principal engineers to publish.',
      lk: [{ t: 'Moonshot Tech Blog', u: 'https://engineering.moonshot-inc.example', d: '2026-10-10' }]
    },
    '1.8': { in: false, na: true, nar: 'Lateral-only senior AI & backend hiring model for FY26; campus hiring sits under Product & Design.' },
    '2.9': { in: false, na: true, nar: 'No campus or intern intake in Engineering & AI this fiscal year by strategic choice.' },
    '3.10': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'LMS & AI Academy tracker (Q3 2026): 54% of engineers completed the internal Applied GenAI certification track; quarterly internal gig rotations launched.',
      iv: '54% certified upskilling completion; 18 internal rotations in Q3', ivd: '2026-10-08',
      nt: 'Strong proof point in candidate closing conversations — engineers cite the GenAI academy as a retention anchor.',
      lk: []
    },
    '3.11': {
      in: true, sc: 2, vd: 'b', pr: 'n',
      ev: 'Q3 Pulse Survey (n=210): annual reviews run on schedule, but only 48% agree promotion criteria across L4–L6 are transparent.',
      iv: '48% perceived promotion fairness', ivd: '2026-09-30',
      nt: 'Correlates directly with the bimodal Glassdoor reviews; publishing clear level rubrics is a quick FY27 win.',
      lk: []
    },
    '3.14': {
      in: true, sc: 2, vd: 'b', pr: 'n',
      ev: 'Careers page & Q3 onboarding survey (Sept 2026): careers copy promises "flexible, balanced work-life" while 44% of new joiners report surprise at 9pm+ US-West Coast calls 3+ nights/week.',
      iv: '56% say-do alignment on work-style & timezone reality', ivd: '2026-09-30',
      nt: 'The brand gap is the promise-reality mismatch — either position the high-pace US-overlap reality candidly during hiring or establish protected async norms.',
      lk: []
    },
    '4.9': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'GitHub & community log (Q3 2026): hosted 2 Bengaluru ML meetups (180 attendees) and open-sourced 1 internal feature-store utility.',
      iv: '2 meetups hosted, 1 open-source release in Q3', ivd: '2026-10-10',
      nt: 'Practitioner-led meetups are outperforming paid job-board ads on senior ML applicant quality.',
      lk: []
    },
    '5.9': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'FY26 EB Charter reviewed on 2026-10-04: named EB Lead appointed in May 2026 with ring-fenced annual budget and monthly TA–HR–Comms sync.',
      iv: 'Named EB owner + ring-fenced FY26 budget + monthly governance sync', ivd: '2026-10-04',
      nt: 'Governance foundation is now in place; next step is elevating to a quarterly executive EB council with CFO-linked KPIs.',
      lk: []
    }
  };

  // Moonshot Inc. — Cohort 2: Product & Design (Q3 2026: 2026-10-15)
  const MOONSHOT_PROD_Q3 = {
    _x: {
      au: 'Sebastian Chandy, Zinnov EB Practice',
      ad: '2026-10-15',
      iw: 'Kavita Deshmukh (VP Product), Arjun Menon (Head of Design), Vikram Mehta (Head of TA).',
      sum: 'Product & Design at Moonshot Inc. punches above its weight on differentiation and thought leadership, driven by visible design leaders and a crisp portfolio story. Its bottlenecks are operational: no dedicated talent pools for staff product managers and high drop-off (29%) during the take-home product case study.'
    },
    '1.1': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Reviewed moonshot-inc.example/design portfolio showcase on 2026-10-12. Updated quarterly with shipped global features and design system case studies.',
      iv: 'Updated quarterly; 92% profile completeness', ivd: '2026-10-12',
      nt: 'Design team maintains a high visual bar that outperforms the main careers site.',
      lk: [{ t: 'Moonshot Design Showcase', u: 'https://design.moonshot-inc.example', d: '2026-10-12' }]
    },
    '1.4': {
      in: true, sc: 4, vd: 'a', pr: 'n',
      ev: 'Annual competitive perception audit among Bengaluru product leaders (Sept 2026, n=64): Moonshot ranked #1 among fintech GCCs on "True 0-to-1 Product Autonomy".',
      iv: 'Ranked #1 of 6 peer GCCs on product autonomy attribute', ivd: '2026-09-20',
      nt: 'Rare genuine differentiator for an India GCC — protect and amplify it.',
      lk: []
    },
    '2.1': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Greenhouse ATS export (Q3 2026, 14 PM & Design roles): 21 qualified applications per role with portfolio review filter.',
      iv: '21 qualified applications per open role', ivd: '2026-10-01',
      nt: 'Healthy top-of-funnel for mid-level designers; tighter for Group PM roles.',
      lk: []
    },
    '2.4': {
      in: true, sc: 2, vd: 'b', pr: 'f',
      ev: 'Greenhouse stage conversion report (Q3 2026): 29% candidate drop-off at the take-home product case study stage; written feedback sent to only 15% of rejected candidates.',
      iv: '29% assessment drop-off; 15% feedback rate', ivd: '2026-10-01',
      nt: 'Senior PM candidates push back on the 6-hour uncompensated case study. Switching to a live 60-minute collaborative critique would cut drop-off sharply.',
      lk: [{ t: 'PM Assessment Drop-off Analysis', u: 'https://ats.moonshot-inc.example/reports/pm-assessment', d: '2026-10-08' }]
    },
    '2.7': {
      in: true, sc: 2, vd: 'b', pr: 'f',
      ev: 'CRM audit (Oct 2026): one generic "Product & Design" talent pool of 180 contacts, not segmented by critical specialty or refreshed regularly.',
      iv: '1 generic pool (180 contacts); <2% annual conversion', ivd: '2026-10-09',
      nt: 'Need dedicated warm communities for Payments PMs and Design Systems leads.',
      lk: []
    },
    '3.4': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Q3 Pulse Survey (Product & Design cut, n=52): 61% of employees can name a concrete career progression path open to them within the India hub.',
      iv: '61% can name an internal progression path', ivd: '2026-09-30',
      nt: 'Published dual-track IC/Manager ladder for PMs and Designers in Q2.',
      lk: []
    },
    '3.7': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Social analytics log (Q3 2026): 4 employee-authored Medium/LinkedIn product teardown posts per month, generating 38k organic impressions and 19 tracked applications.',
      iv: '4 employee posts/month; 38k reach; 19 tracked applications', ivd: '2026-10-05',
      nt: 'Organic storytelling works well here — great template to replicate in Engineering.',
      lk: []
    },
    '4.1': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Greenhouse source-of-hire export (Q3 2026): 22% of Product & Design hires came through employee referrals.',
      iv: '22% referral share of hires', ivd: '2026-10-01',
      nt: 'Tight-knit Bengaluru design community drives strong warm referrals.',
      lk: []
    },
    '4.6': {
      in: true, sc: 4, vd: 'a', pr: 'n',
      ev: 'Media & event tracker (Q3 2026): VP Product and Head of Design featured on 3 podcasts, 2 design summits, and quoted in Mint on AI product leadership.',
      iv: '6 leader appearances/quotes in Q3; cited domain voices', ivd: '2026-10-10',
      nt: 'Strongest leadership advocacy bench in the company.',
      lk: []
    },
    '5.1': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Published quarterly "State of Fintech UX in India" whitepaper (Q2 & Q3 2026) with 1,400+ downloads.',
      iv: '2 quarterly whitepapers published; 1,400+ downloads', ivd: '2026-10-09',
      nt: 'Building real authority in fintech product design.',
      lk: [{ t: 'State of Fintech UX Q3 Report', u: 'https://design.moonshot-inc.example/fintech-ux-q3', d: '2026-10-09' }]
    },
    '1.8': {
      in: true, sc: 3, vd: 'm', pr: 'n',
      ev: 'Campus calendar tracker (Q3 2026): ran annual Product Designathon across NID, IIT Bombay & IIT Guwahati with 620 student submissions.',
      iv: 'Year-round calendar on 5 design/product campuses; 620 hackathon entries', ivd: '2026-09-25',
      nt: 'Strong early-career pull among product design graduates.',
      lk: []
    },
    '2.9': {
      in: true, sc: 4, vd: 'a', pr: 'n',
      ev: 'Summer 2026 Design & APM Internship Report: 78% internship-to-PPO conversion rate and +54 campus candidate NPS.',
      iv: '78% PPO conversion; +54 campus NPS', ivd: '2026-08-30',
      nt: 'Structured mentorship and live product launches make the internship programme a benchmark.',
      lk: []
    }
  };

  // 10 diverse peer GCC cohorts across Waves 1-4 (used in Demo Mode and by the admin "Load 10 sample peers" seeder)
  const PEER_COHORTS = [
    {
      client_id: 'peer-1', cohort_id: 'peer-1-h1', client: 'Aether Cloud India', cohort: 'Platform & AI', wave: 4, taken_on: '2026-10-02',
      subs: { '1.1': 5, '1.2': 4, '1.4': 4, '1.7': 5, '1.8': 4, '2.1': 4, '2.3': 4, '2.4': 4, '2.5': 4, '2.7': 4, '2.9': 4, '3.3': 4, '3.4': 4, '3.7': 4, '3.8': 4, '3.10': 5, '3.11': 4, '3.14': 4, '4.1': 4, '4.3': 4, '4.6': 4, '4.9': 5, '5.1': 4, '5.9': 4 }
    },
    {
      client_id: 'peer-2', cohort_id: 'peer-2-h1', client: 'Vertex Semiconductor GCC', cohort: 'Silicon & Firmware', wave: 4, taken_on: '2026-09-21',
      subs: { '1.1': 4, '1.2': 4, '1.4': 4, '1.7': 4, '1.8': 5, '2.1': 4, '2.3': 3, '2.4': 4, '2.5': 4, '2.7': 4, '2.9': 5, '3.3': 3, '3.4': 4, '3.7': 3, '3.8': 4, '3.10': 4, '3.11': 4, '3.14': 4, '4.1': 4, '4.3': 4, '4.6': 4, '4.9': 4, '5.1': 5, '5.9': 4 }
    },
    {
      client_id: 'peer-3', cohort_id: 'peer-3-h1', client: 'Meridian FinTech GCC', cohort: 'Core Engineering', wave: 3, taken_on: '2026-09-18',
      subs: { '1.1': 4, '1.2': 3, '1.4': 3, '1.7': 4, '1.8': 3, '2.1': 4, '2.3': 3, '2.4': 3, '2.5': 4, '2.7': 3, '2.9': 3, '3.3': 3, '3.4': 4, '3.7': 3, '3.8': 3, '3.10': 3, '3.11': 3, '3.14': 3, '4.1': 4, '4.3': 3, '4.6': 3, '4.9': 3, '5.1': 3, '5.9': 3 }
    },
    {
      client_id: 'peer-4', cohort_id: 'peer-4-h1', client: 'Kestrel Cyber India', cohort: 'Security Research', wave: 3, taken_on: '2026-10-08',
      // Lateral-only specialist peer: intentionally omits Campus (1.8, 2.9)
      subs: { '1.1': 3, '1.2': 3, '1.4': 4, '1.7': 3, '2.1': 3, '2.3': 3, '2.4': 3, '2.5': 3, '2.7': 3, '3.3': 3, '3.4': 3, '3.7': 4, '3.8': 3, '3.10': 4, '3.11': 3, '3.14': 4, '4.1': 4, '4.3': 3, '4.6': 4, '4.9': 4, '5.1': 4, '5.9': 3 }
    },
    {
      client_id: 'peer-5', cohort_id: 'peer-5-h1', client: 'Solstice BioPharma Hub', cohort: 'Clinical Data & AI', wave: 3, taken_on: '2026-09-12',
      subs: { '1.1': 3, '1.2': 3, '1.4': 3, '1.7': 3, '1.8': 3, '2.1': 3, '2.3': 3, '2.4': 3, '2.5': 3, '2.7': 2, '2.9': 3, '3.3': 3, '3.4': 3, '3.7': 2, '3.8': 3, '3.10': 3, '3.11': 3, '3.14': 3, '4.1': 3, '4.3': 3, '4.6': 3, '4.9': 2, '5.1': 3, '5.9': 3 }
    },
    {
      client_id: 'peer-6', cohort_id: 'peer-6-h1', client: 'Vanguard Mobility Hub', cohort: 'Software & Autonomy', wave: 3, taken_on: '2026-09-05',
      subs: { '1.1': 3, '1.2': 2, '1.4': 3, '1.7': 3, '1.8': 2, '2.1': 3, '2.3': 2, '2.4': 2, '2.5': 3, '2.7': 2, '2.9': 2, '3.3': 2, '3.4': 3, '3.7': 2, '3.8': 3, '3.10': 3, '3.11': 2, '3.14': 3, '4.1': 3, '4.3': 2, '4.6': 3, '4.9': 3, '5.1': 2, '5.9': 2 }
    },
    {
      client_id: 'peer-7', cohort_id: 'peer-7-h1', client: 'Cascadia Enterprise SaaS', cohort: 'Cloud Delivery', wave: 2, taken_on: '2026-09-27',
      subs: { '1.1': 3, '1.2': 2, '1.4': 2, '1.7': 3, '1.8': 2, '2.1': 3, '2.3': 3, '2.4': 2, '2.5': 3, '2.7': 2, '2.9': 2, '3.3': 2, '3.4': 3, '3.7': 2, '3.8': 3, '3.10': 2, '3.11': 2, '3.14': 3, '4.1': 3, '4.3': 3, '4.6': 2, '4.9': 2, '5.1': 2, '5.9': 2 }
    },
    {
      client_id: 'peer-8', cohort_id: 'peer-8-h1', client: 'Northstar Retail Centre', cohort: 'Digital & Data', wave: 3, taken_on: '2026-09-29',
      subs: { '1.1': 2, '1.2': 1, '1.4': 2, '1.7': 3, '2.1': 2, '2.3': 1, '2.4': 3, '2.5': 2, '2.7': 1, '3.3': 2, '3.4': 2, '3.7': 2, '3.8': 2, '3.10': 2, '3.11': 2, '3.14': 2, '4.1': 2, '4.3': 3, '4.6': 2, '4.9': 1, '5.1': 2, '5.9': 2 }
    },
    {
      client_id: 'peer-9', cohort_id: 'peer-9-h1', client: 'Helios Health Tech', cohort: 'Whole centre', wave: 2, taken_on: '2026-08-24',
      subs: { '1.1': 2, '1.2': 2, '1.4': 2, '1.7': 2, '2.1': 2, '2.3': 2, '2.4': 2, '2.5': 3, '2.7': 1, '3.3': 1, '3.4': 2, '3.7': 1, '3.8': 2, '3.10': 2, '3.11': 2, '3.14': 2, '4.1': 2, '4.3': 2, '4.6': 1, '5.1': 1, '5.9': 1 }
    },
    {
      client_id: 'peer-10', cohort_id: 'peer-10-h1', client: 'Boreal Logistics Outpost', cohort: 'Operations & QA', wave: 1, taken_on: '2026-08-15',
      subs: { '1.1': 2, '1.2': 1, '1.7': 1, '2.1': 2, '2.5': 2, '3.2': 2, '3.8': 1, '3.10': 1, '3.14': 2, '4.1': 1, '4.3': 2, '4.7': 1, '5.9': 1 }
    }
  ];

  function peerToAnswers(p) {
    const out = {
      _x: {
        au: 'Zinnov EB Benchmark Seed',
        ad: p.taken_on,
        iw: 'Anonymised benchmark peer dataset',
        sum: `Sample benchmark peer (${p.client}, Wave ${p.wave}) seeded to populate peer quartiles, radar overlays, and league tables.`
      }
    };
    Object.entries(p.subs).forEach(([id, sc]) => {
      const vd = sc < p.wave ? 'b' : sc > p.wave ? 'a' : 'm';
      out[id] = {
        in: true,
        sc,
        vd,
        pr: 'n',
        ev: `Verified benchmark artefact for ${p.client} (${p.cohort}) reviewed on ${p.taken_on}.`,
        iv: '',
        ivd: p.taken_on,
        nt: '',
        lk: []
      };
    });
    return out;
  }

  global.EBMI_SAMPLE = {
    client: {
      name: 'Moonshot Inc.',
      wave: 3
    },
    cohorts: [
      {
        name: 'Engineering & AI',
        answers: MOONSHOT_ENG_Q3,
        snapshots: [
          { taken_on: '2026-04-10', wave: 3, answers: MOONSHOT_ENG_Q1 },
          { taken_on: '2026-10-15', wave: 3, answers: MOONSHOT_ENG_Q3 }
        ]
      },
      {
        name: 'Product & Design',
        answers: MOONSHOT_PROD_Q3,
        snapshots: [
          { taken_on: '2026-10-15', wave: 3, answers: MOONSHOT_PROD_Q3 }
        ]
      }
    ],
    peers: PEER_COHORTS,
    peerToAnswers
  };
})(window);

/**
 * LinguaEcon AI — kasbiy keys-stadilar (seed).
 * 7-bosqich: integrativ-kasbiy faoliyat (loyiha ishi, guruhda keys yechish).
 * Har bir keysda 9 ta topshiriq: read -> analyze_chart -> select_vocab -> use_grammar ->
 * explain_problem -> group_discuss -> propose_solution -> write_report -> presentation.
 * Kompaniyalar va raqamlar o'quv maqsadida to'qilgan, lekin real ko'rsatkichlarga taqlid qiladi.
 * Imlo: Britaniya inglizchasi (analyse, organisation, utilisation, per cent).
 */

import type { CaseStudyDoc } from '@/types'

/** Seed keys — `createdAt` seed skriptida qo'shiladi. */
export type SeedCaseStudy = Omit<CaseStudyDoc, 'createdAt'> & { id: string }

export const SEED_CASE_STUDIES: SeedCaseStudy[] = [
  /* ================================================================ */
  /* 1. FINANCE — daromadning pasayishi va tiklanish rejasi            */
  /* ================================================================ */
  {
    id: 'cs-finance',
    title: 'Revenue Decline at Silk Road Textiles: Finding the Real Cause',
    domain: 'finance',
    cefr: 'B1',
    published: true,
    scenario:
      "Silk Road Textiles JSC is a medium-sized yarn and fabric manufacturer in Namangan with 640 employees. Until the end of 2024 the company was comfortably profitable: in the fourth quarter of 2024 it recorded revenue of 6.0 million USD against operating costs of 4.6 million USD. Twelve months later the picture has changed completely. In the fourth quarter of 2025 revenue was 4.8 million USD — a fall of 20 per cent — while operating costs had risen to 5.1 million USD, so the company reported an operating loss for the first time in nine years.\n\nThe management accounts show three things. First, the volume of fabric sold fell by only 6 per cent; most of the decline came from lower average prices, because two large garment customers renegotiated their contracts in March 2025 and a third moved to a competitor. Second, the cost of imported dyes and spare parts rose after the som weakened, and the company kept buying them on short-term contracts at spot prices. Third, the plant continued to run at full capacity, so finished goods sitting in the warehouse have grown from 0.9 to 2.4 million USD and cash flow has become tight.\n\nThe CFO, Dilnoza Karimova, has asked your consulting team for a short diagnosis and a realistic recovery plan before the board meets on 20 February 2026. The board has already ruled out redundancies. Your recommendations must therefore work through pricing, working capital, procurement and product mix — and they must be delivered in English.",
    chartType: 'line',
    chartCaption:
      'Quarterly revenue and operating costs, million USD (Silk Road Textiles management accounts, Q1 2024 - Q4 2025).',
    chartData: [
      { period: 'Q1 2024', revenue: 5.6, costs: 4.3 },
      { period: 'Q2 2024', revenue: 5.8, costs: 4.4 },
      { period: 'Q3 2024', revenue: 5.9, costs: 4.5 },
      { period: 'Q4 2024', revenue: 6.0, costs: 4.6 },
      { period: 'Q1 2025', revenue: 5.7, costs: 4.7 },
      { period: 'Q2 2025', revenue: 5.4, costs: 4.85 },
      { period: 'Q3 2025', revenue: 5.1, costs: 5.0 },
      { period: 'Q4 2025', revenue: 4.8, costs: 5.1 },
    ],
    tasks: [
      {
        id: 'cs-finance-t1',
        order: 1,
        kind: 'read',
        title: 'Read the CFO brief and mark the evidence',
        instruction:
          "Read the brief on Silk Road Textiles twice: once for the overall situation, and once with a highlighter, marking every figure, date and stated cause. List in English the three facts that you believe matter most for the diagnosis, and one important question that the brief does not answer. Post your list in the project workspace before the group session so that your team can compare readings.",
      },
      {
        id: 'cs-finance-t2',
        order: 2,
        kind: 'analyze_chart',
        title: 'Interpret the revenue and cost curves',
        instruction:
          'Study the chart of quarterly revenue and operating costs from Q1 2024 to Q4 2025. Calculate the percentage change in revenue and in operating costs between Q4 2024 and Q4 2025, and identify the quarter in which the two lines cross. Then describe the trend in five to seven English sentences, using the language of trends (fall sharply, decline steadily, level off, narrow, widen) rather than simply repeating the numbers. Submit your description in the chart task box for automatic language feedback.',
        minWords: 70,
      },
      {
        id: 'cs-finance-t3',
        order: 3,
        kind: 'select_vocab',
        title: 'Build the team glossary of financial terms',
        instruction:
          "From the required vocabulary list, select ten terms that you will actually need to explain this case, and write a one-line definition of each in your own English words. For at least four terms, add a collocation taken from the brief, for example \"operating costs rose\" or \"cash flow has become tight\". Save the glossary in the shared project document so that every member of the team uses the same terminology.",
      },
      {
        id: 'cs-finance-t4',
        order: 4,
        kind: 'use_grammar',
        title: 'Report performance in Present Perfect and Passive Voice',
        instruction:
          'Write eight sentences about Silk Road Textiles: four in the Present Perfect for results that reach the present ("Revenue has fallen by 20 per cent since the end of 2024"), and four in the Passive Voice as it is used in financial reporting ("Two supply contracts were renegotiated in March 2025"). Use a comparative structure in at least two of the sentences. Submit the eight sentences for AI and teacher grammar feedback, then correct and resubmit them.',
      },
      {
        id: 'cs-finance-t5',
        order: 5,
        kind: 'explain_problem',
        title: 'Explain the real driver of the loss to the CFO',
        instruction:
          'Record a short spoken explanation for the CFO in which you separate the symptom (lower revenue) from the underlying cause. Refer to at least two figures from the chart and use at least five terms from your team glossary. Speak for at least one minute, keeping the register formal, and upload the recording to the case task for pronunciation and content feedback.',
        minWords: 80,
        minSeconds: 60,
      },
      {
        id: 'cs-finance-t6',
        order: 6,
        kind: 'group_discuss',
        title: 'Team discussion: pricing, procurement or product mix?',
        instruction:
          'Hold a recorded team discussion in English in which each member argues for one lever of recovery: price recovery, procurement contracts, inventory and working capital, or product mix. Chair the meeting properly — agree an agenda, give every member the floor, and close with an agreed priority order. Use the language of agreeing, disagreeing politely and building on an idea, and upload the recording plus a five-line minute of the decision.',
        minSeconds: 600,
      },
      {
        id: 'cs-finance-t7',
        order: 7,
        kind: 'propose_solution',
        title: 'Draft the recovery plan for the board',
        instruction:
          'Write a recovery plan with three measures that can be implemented within two quarters and that do not involve redundancies, since the board has excluded them. For each measure, state the expected effect on revenue, operating costs or working capital in figures, and name one risk. Use modal verbs of recommendation (should, could, ought to) and first conditional sentences to describe outcomes, and submit the plan to the shared document.',
        minWords: 120,
      },
      {
        id: 'cs-finance-t8',
        order: 8,
        kind: 'write_report',
        title: 'Write the consulting report for the board meeting',
        instruction:
          'Write a formal report for the board meeting of 20 February 2026 with four sections: situation, analysis of causes, recommendations and expected results. Integrate at least eight terms from the team glossary and at least three linking devices (however, as a result, in contrast). Submit the first draft for AI feedback, revise it, and submit the final version through the writing task so that both drafts are stored for assessment.',
        minWords: 250,
      },
      {
        id: 'cs-finance-t9',
        order: 9,
        kind: 'presentation',
        title: 'Present the diagnosis and plan to the board',
        instruction:
          'Give a three-minute team presentation to the "board" (your teacher and one peer group) with a maximum of five slides, including the revenue and cost chart. Each member must speak, signpost their part clearly (I will begin with..., turning to..., to sum up) and answer at least one question from the audience. Upload the slides and the recording; peer reviewers will score you with the project rubric.',
        minSeconds: 180,
      },
    ],
    requiredVocab: [
      'revenue',
      'operating costs',
      'gross margin',
      'profit margin',
      'cash flow',
      'working capital',
      'break-even point',
      'fixed costs',
      'variable costs',
      'cost-cutting',
      'inventory',
      'operating loss',
      'unit price',
      'capacity utilisation',
    ],
    requiredGrammar: ['present_perfect', 'past_simple', 'passive_voice', 'modal_verbs', 'comparatives'],
    rubric: [
      'Content analysis (0-5): identifies the real driver of the loss — falling prices plus rising input costs and unsold stock — rather than repeating the symptom of lower revenue.',
      'Professional vocabulary (0-5): uses at least eight financial terms from the glossary accurately, including margin, working capital and inventory, with correct collocations.',
      'Grammar accuracy (0-5): reports results in the Present Perfect, past events in the Past Simple and financial actions in the Passive Voice with very few errors.',
      'Communication (0-5): the report and the board presentation are clearly structured, correctly signposted and pitched at a senior finance audience.',
      'Critical thinking (0-5): quantifies the recovery measures, weighs pricing against procurement and inventory, and states the risk of each recommendation.',
      'Teamwork (0-5): every member contributes a distinct analytical role, the discussion is chaired, and the shared document shows balanced contributions.',
    ],
  },

  /* ================================================================ */
  /* 2. BANKING — muammoli kreditlar va kredit siyosati                */
  /* ================================================================ */
  {
    id: 'cs-banking',
    title: 'Non-Performing Loans at Amudaryo Commercial Bank: Rewriting the Credit Policy',
    domain: 'banking',
    cefr: 'B2',
    published: true,
    scenario:
      "Amudaryo Commercial Bank is a mid-sized commercial bank in Tashkent with a gross loan portfolio of 1.4 billion USD equivalent and 42 branches. Its lending has grown quickly since 2023, driven by two products: foreign-currency working-capital loans to importers and unsecured consumer loans sold through partner retailers. At the end of 2024 the non-performing loan ratio stood at a comfortable 4.1 per cent of gross loans.\n\nIn February 2025 the som lost roughly 20 per cent of its value against the US dollar. Around 46 per cent of the corporate book was denominated in foreign currency, but only a quarter of those borrowers earned foreign-currency revenue. Their debt-service costs rose immediately, while their income did not. By the end of 2025 the non-performing loan ratio had reached 8.2 per cent — exactly double the pre-devaluation level — and provisioning expense had cut the bank's return on equity from 14 per cent to 5 per cent. Consumer loans deteriorated more slowly, but the retail default rate has also doubled.\n\nThe credit committee meets on 12 March 2026. The National Bank's supervisors have asked for a written explanation of the deterioration and for a revised credit policy. Two positions are already forming: the commercial directorate wants to keep lending volumes and restructure the weakest exposures, while the risk directorate wants to stop unhedged foreign-currency lending altogether. Your team advises the committee, and all documents must be in English.",
    chartType: 'line',
    chartCaption:
      'Non-performing loan ratio (per cent of gross loans) against the average UZS/USD rate in thousands of som per dollar (bank risk-management reporting, Q1 2024 - Q4 2025).',
    chartData: [
      { period: 'Q1 2024', nplRatio: 3.8, fxRate: 12.6 },
      { period: 'Q2 2024', nplRatio: 3.9, fxRate: 12.7 },
      { period: 'Q3 2024', nplRatio: 4.0, fxRate: 12.75 },
      { period: 'Q4 2024', nplRatio: 4.1, fxRate: 12.8 },
      { period: 'Q1 2025', nplRatio: 5.2, fxRate: 15.4 },
      { period: 'Q2 2025', nplRatio: 6.4, fxRate: 15.6 },
      { period: 'Q3 2025', nplRatio: 7.5, fxRate: 15.75 },
      { period: 'Q4 2025', nplRatio: 8.2, fxRate: 15.9 },
    ],
    tasks: [
      {
        id: 'cs-banking-t1',
        order: 1,
        kind: 'read',
        title: 'Read the supervisory brief on the loan book',
        instruction:
          "Read the case on Amudaryo Commercial Bank and separate facts from opinions: the ratios and dates are facts, whereas the positions of the commercial and risk directorates are arguments. Write down the two loan products at the centre of the problem and the share of the corporate book that carried unhedged currency risk. Bring your notes in English to the first team meeting.",
      },
      {
        id: 'cs-banking-t2',
        order: 2,
        kind: 'analyze_chart',
        title: 'Link the exchange rate to the NPL ratio',
        instruction:
          'Compare the two series in the chart and establish how many quarters passed between the devaluation and the sharpest rise in the non-performing loan ratio. Calculate the increase in the NPL ratio in percentage points and in relative terms, and state clearly why a correlation of this kind is not by itself proof of causation. Write your analysis in six to eight sentences using cautious academic language (suggests, appears to, is likely to reflect).',
        minWords: 80,
      },
      {
        id: 'cs-banking-t3',
        order: 3,
        kind: 'select_vocab',
        title: 'Assemble the credit-risk glossary',
        instruction:
          'Choose ten terms from the required vocabulary list and define each one in a single English sentence that a second-year student could understand. Mark which of the terms describe a risk, which describe a buffer against risk, and which describe a remedy once a loan has gone bad. Upload the classified glossary to the shared document and use it consistently in every later task.',
      },
      {
        id: 'cs-banking-t4',
        order: 4,
        kind: 'use_grammar',
        title: 'Argue the policy options with conditionals and modals',
        instruction:
          'Write ten sentences on the credit-policy decision: four second conditionals about hypothetical policy choices ("If the bank stopped unhedged lending, corporate volumes would fall by about a fifth"), three third conditionals about the missed hedging opportunity in 2024, and three sentences with modal verbs of obligation and recommendation (must, should, ought to). Submit the set for grammar feedback and correct any tense or modal errors before the group discussion.',
      },
      {
        id: 'cs-banking-t5',
        order: 5,
        kind: 'explain_problem',
        title: 'Brief the credit committee on what went wrong',
        instruction:
          'Record a spoken briefing of at least one minute for the credit committee explaining the mechanism by which a currency devaluation turned performing loans into non-performing ones. Name the group of borrowers most affected and quantify the effect on provisioning and return on equity. Keep the register formal and neutral, avoid blaming individuals, and upload the recording to the case task.',
        minWords: 80,
        minSeconds: 60,
      },
      {
        id: 'cs-banking-t6',
        order: 6,
        kind: 'group_discuss',
        title: 'Credit committee simulation',
        instruction:
          'Run the credit committee meeting in English with assigned roles: chair, head of the commercial directorate, chief risk officer and supervisory representative. Each role must open with a one-minute position statement, then respond to at least two challenges from the others, using the language of hedging and concession (I take your point, but...; that may be true in the short term). Record the meeting and submit agreed minutes containing the decision and the votes.',
        minSeconds: 600,
      },
      {
        id: 'cs-banking-t7',
        order: 7,
        kind: 'propose_solution',
        title: 'Propose the revised credit policy',
        instruction:
          'Draft four rules for the revised credit policy, at least one of which addresses currency matching between borrower revenue and loan currency, and one of which sets a limit on unsecured consumer lending. For each rule, state the expected effect on the NPL ratio and on lending volumes, and say how compliance will be monitored. Use reported speech at least twice to reflect the positions expressed in the committee meeting.',
        minWords: 120,
      },
      {
        id: 'cs-banking-t8',
        order: 8,
        kind: 'write_report',
        title: 'Write the explanatory note to the supervisor',
        instruction:
          'Write a formal explanatory note to the banking supervisor covering the causes of the deterioration, the measures already taken, the revised credit policy and the expected NPL trajectory for 2026. Use the Passive Voice appropriately for regulatory prose ("provisions were increased in the third quarter") and integrate at least eight glossary terms. Submit a first draft for AI feedback and then a revised final version through the writing task.',
        minWords: 250,
      },
      {
        id: 'cs-banking-t9',
        order: 9,
        kind: 'presentation',
        title: 'Present the credit policy to the supervisory panel',
        instruction:
          'Deliver a three-minute team presentation of the revised credit policy to a supervisory panel, using the NPL and exchange-rate chart on one of your maximum five slides. Every member presents one section, and the team must handle at least two challenging questions, one of which will ask what happens if the som weakens again. Upload the slides and the recording for teacher and peer assessment.',
        minSeconds: 180,
      },
    ],
    requiredVocab: [
      'non-performing loan',
      'loan portfolio',
      'credit risk',
      'default rate',
      'collateral',
      'loan-loss provisioning',
      'capital adequacy',
      'net interest margin',
      'currency devaluation',
      'foreign currency exposure',
      'creditworthiness',
      'debt restructuring',
      'liquidity',
      'risk appetite',
    ],
    requiredGrammar: ['conditionals', 'passive_voice', 'reported_speech', 'modal_verbs', 'present_perfect'],
    rubric: [
      'Content analysis (0-5): explains the transmission from devaluation to unhedged borrowers to defaults, and quantifies the doubling of the NPL ratio from the chart.',
      'Professional vocabulary (0-5): uses banking terminology such as provisioning, collateral, capital adequacy and foreign currency exposure precisely and in the right collocations.',
      'Grammar accuracy (0-5): second and third conditionals, modal verbs of obligation and reported speech from the committee meeting are formed correctly.',
      'Communication (0-5): the explanatory note meets supervisory register, and the panel presentation answers challenging questions without losing structure.',
      'Critical thinking (0-5): weighs commercial volume against risk reduction, acknowledges that correlation is not causation, and stress-tests the policy against a further devaluation.',
      'Teamwork (0-5): committee roles are genuinely played, minutes reflect all positions, and no single member dominates the decision.',
    ],
  },

  /* ================================================================ */
  /* 3. MARKETING — bozor ulushining yo'qolishi                        */
  /* ================================================================ */
  {
    id: 'cs-marketing',
    title: 'Losing the Shelf: Zamin Dairy and the Arrival of a New Competitor',
    domain: 'marketing',
    cefr: 'B2',
    published: true,
    scenario:
      "Zamin Dairy is one of the best-known packaged yoghurt brands in Uzbekistan. For six years it held between 30 and 32 per cent of the modern-retail yoghurt market, supported by strong brand awareness among families and a wide distribution network of 3,400 outlets. In January 2025 its market share was 31.4 per cent.\n\nIn March 2025 a regional competitor, Oq Buloq, launched a high-protein drinking yoghurt in resealable bottles at a price 12 per cent below Zamin Dairy's comparable line. The new product was aimed at working adults aged 20 to 35, was listed in all three national supermarket chains within eight weeks, and was supported by an influencer campaign on Telegram and Instagram. By September 2025 Oq Buloq held 16.8 per cent of the market and Zamin Dairy had fallen to 22.9 per cent.\n\nZamin Dairy responded in April with a national television and billboard campaign costing 405,000 USD over three months. The campaign used the brand's traditional \"family tradition\" message and did not mention the new product format. Awareness measured after the campaign was unchanged at 87 per cent, but purchase intention among consumers under 35 fell from 24 to 17 per cent, and the share loss continued.\n\nThe marketing director, Aziz Rahimov, has asked your team to explain why a well-funded campaign failed to protect market share, and to propose a repositioning plan for the first half of 2026 with a budget of 300,000 USD.",
    chartType: 'bar',
    chartCaption:
      'Monthly market share of Zamin Dairy and Oq Buloq in per cent of modern-retail yoghurt sales, with Zamin Dairy advertising spend in thousand USD (retail audit panel, January - September 2025).',
    chartData: [
      { month: 'Jan 2025', brandShare: 31.4, competitorShare: 0, adSpend: 40 },
      { month: 'Feb 2025', brandShare: 31.2, competitorShare: 0, adSpend: 40 },
      { month: 'Mar 2025', brandShare: 30.6, competitorShare: 3.1, adSpend: 45 },
      { month: 'Apr 2025', brandShare: 29.1, competitorShare: 6.4, adSpend: 120 },
      { month: 'May 2025', brandShare: 27.5, competitorShare: 9.2, adSpend: 150 },
      { month: 'Jun 2025', brandShare: 26.0, competitorShare: 11.8, adSpend: 135 },
      { month: 'Jul 2025', brandShare: 24.8, competitorShare: 13.9, adSpend: 90 },
      { month: 'Aug 2025', brandShare: 23.6, competitorShare: 15.6, adSpend: 60 },
      { month: 'Sep 2025', brandShare: 22.9, competitorShare: 16.8, adSpend: 55 },
    ],
    tasks: [
      {
        id: 'cs-marketing-t1',
        order: 1,
        kind: 'read',
        title: 'Read the brief and profile the competitor',
        instruction:
          "Read the Zamin Dairy brief and build a short profile of Oq Buloq covering its product format, price position, target segment and communication channels. Then note in English what Zamin Dairy's April campaign said and to whom it spoke. Post the profile and the campaign note in the project workspace before the team meeting.",
      },
      {
        id: 'cs-marketing-t2',
        order: 2,
        kind: 'analyze_chart',
        title: 'Read the share and spending bars together',
        instruction:
          'Using the chart, calculate how many percentage points of share Zamin Dairy lost between January and September 2025 and how much of that loss Oq Buloq captured. Identify the months of heaviest advertising spend and state what happened to the share line during and after them. Write six to eight sentences that explicitly connect the spending bars to the share bars, using comparative structures such as "despite" and "even though".',
        minWords: 80,
      },
      {
        id: 'cs-marketing-t3',
        order: 3,
        kind: 'select_vocab',
        title: 'Create the marketing glossary for the case',
        instruction:
          'Select ten terms from the required vocabulary list and write a one-line English definition of each as you would use it in a client meeting. Group the ten terms under three headings: market position, communication and commercial results. Save the grouped glossary in the shared document and use the same wording in the report and the pitch.',
      },
      {
        id: 'cs-marketing-t4',
        order: 4,
        kind: 'use_grammar',
        title: 'Compare the two brands in writing',
        instruction:
          'Write eight sentences comparing Zamin Dairy and Oq Buloq using comparatives and superlatives ("Oq Buloq is priced 12 per cent lower than the comparable Zamin line"), and add four sentences with linking devices of contrast and result (however, whereas, consequently, as a result). At least three sentences must contain a figure taken from the chart. Submit the twelve sentences for grammar feedback and revise them before the discussion.',
      },
      {
        id: 'cs-marketing-t5',
        order: 5,
        kind: 'explain_problem',
        title: 'Explain why the campaign failed',
        instruction:
          'Record a spoken explanation of at least one minute for the marketing director setting out why a campaign with 87 per cent awareness still lost share. Distinguish clearly between an awareness problem, a relevance problem and a product-format problem, and support your view with the purchase-intention figure for consumers under 35. Upload the recording to the case task for pronunciation and content feedback.',
        minWords: 80,
        minSeconds: 60,
      },
      {
        id: 'cs-marketing-t6',
        order: 6,
        kind: 'group_discuss',
        title: 'Team debate: cut the price or reposition the brand?',
        instruction:
          'Debate two options in English as a team: matching the competitor on price, or repositioning the brand with a new product format for younger consumers. Half of the team argues for each option, then the whole team must reach one recommendation and justify it against the 300,000 USD budget. Record the debate, use the language of persuasion and concession, and upload agreed minutes that state the final recommendation.',
        minSeconds: 600,
      },
      {
        id: 'cs-marketing-t7',
        order: 7,
        kind: 'propose_solution',
        title: 'Design the repositioning plan for 2026',
        instruction:
          'Propose a repositioning plan for the first half of 2026 that fits a budget of 300,000 USD, naming the target segment, the value proposition, the product or packaging change and the media mix. Allocate the budget across the activities in figures and set one measurable objective, such as recovering three percentage points of share by June 2026. Use modal verbs of recommendation and first conditionals for the expected outcomes.',
        minWords: 120,
      },
      {
        id: 'cs-marketing-t8',
        order: 8,
        kind: 'write_report',
        title: 'Write the marketing report for the director',
        instruction:
          'Write a formal marketing report for Aziz Rahimov with four sections: what happened, why the April campaign underperformed, the repositioning proposal and the measurement plan. Integrate at least eight glossary terms and refer to the chart at least twice by name and figure. Submit a first draft for AI feedback, revise it, then submit the final version through the writing task.',
        minWords: 250,
      },
      {
        id: 'cs-marketing-t9',
        order: 9,
        kind: 'presentation',
        title: 'Pitch the repositioning to the board',
        instruction:
          'Pitch the repositioning plan in a three-minute team presentation with at most five slides, one of which must show the share and spending chart. Every member presents one section, the budget allocation must appear on screen, and the team must answer at least one question about the risk of a price war. Upload the slides and the recording for peer scoring against the project rubric.',
        minSeconds: 180,
      },
    ],
    requiredVocab: [
      'market share',
      'brand awareness',
      'target segment',
      'positioning',
      'value proposition',
      'distribution channel',
      'shelf space',
      'price sensitivity',
      'advertising spend',
      'purchase intention',
      'customer retention',
      'competitive advantage',
      'product launch',
      'return on investment',
    ],
    requiredGrammar: ['comparatives', 'linking_devices', 'past_simple', 'conditionals', 'modal_verbs'],
    rubric: [
      'Content analysis (0-5): shows from the chart that share continued to fall during the heaviest advertising months, and identifies relevance and product format rather than awareness as the failure.',
      'Professional vocabulary (0-5): uses marketing terms such as positioning, value proposition, target segment and price sensitivity accurately and without confusing them.',
      'Grammar accuracy (0-5): comparative and superlative forms and linking devices of contrast and result are used correctly throughout the report and the pitch.',
      'Communication (0-5): the pitch is persuasive, fits three minutes, keeps to five slides and presents the budget allocation clearly on screen.',
      'Critical thinking (0-5): tests the price-cut option against the repositioning option, recognises the risk of a price war, and sets a measurable share objective.',
      'Teamwork (0-5): both sides of the debate are genuinely argued, the team converges on one recommendation, and the workspace shows even contribution.',
    ],
  },

  /* ================================================================ */
  /* 4. MANAGEMENT — kadrlar qo'nimsizligi va yetkazib berish          */
  /* ================================================================ */
  {
    id: 'cs-management',
    title: 'After the Restructuring: Staff Turnover and Late Deliveries at Turon Logistics',
    domain: 'management',
    cefr: 'B2',
    published: true,
    scenario:
      "Turon Logistics operates road freight and warehousing across Uzbekistan, with 1,150 employees, four regional depots and a contract base that includes three large retail chains. Until the middle of 2024 it was known for reliability: on-time delivery ran at 95 to 96 per cent and annualised staff turnover was around 11 per cent, which is low for the sector.\n\nIn September 2024 a new chief executive introduced a restructuring designed to cut overheads by 15 per cent. Four regional dispatch offices were merged into a single national control centre in Tashkent, two management layers were removed, and the number of drivers reporting to each line manager rose from 12 to 34. The changes were announced three weeks before they took effect, and no additional training was given to the line managers who inherited the larger teams.\n\nBy the fourth quarter of 2025 annualised staff turnover had reached 34 per cent, with experienced drivers and warehouse supervisors leaving first. On-time delivery had fallen to 79 per cent, two retail contracts carried penalty clauses that were triggered in October, and the cost of recruiting and training replacements was estimated at 620,000 USD for the year. Exit interviews mention unclear instructions, no route feedback and managers who are unreachable.\n\nThe chief executive still supports the flatter structure. Your team has been asked to diagnose the problem and to propose measures that keep the cost savings but restore delivery performance, reporting on 5 March 2026 in English.",
    chartType: 'bar',
    chartCaption:
      'Annualised staff turnover and on-time delivery rate, per cent (Turon Logistics HR and operations reporting, Q1 2024 - Q4 2025; restructuring implemented in September 2024).',
    chartData: [
      { period: 'Q1 2024', turnoverRate: 11, onTimeDelivery: 96 },
      { period: 'Q2 2024', turnoverRate: 12, onTimeDelivery: 95 },
      { period: 'Q3 2024', turnoverRate: 14, onTimeDelivery: 94 },
      { period: 'Q4 2024', turnoverRate: 19, onTimeDelivery: 91 },
      { period: 'Q1 2025', turnoverRate: 25, onTimeDelivery: 88 },
      { period: 'Q2 2025', turnoverRate: 29, onTimeDelivery: 85 },
      { period: 'Q3 2025', turnoverRate: 32, onTimeDelivery: 82 },
      { period: 'Q4 2025', turnoverRate: 34, onTimeDelivery: 79 },
    ],
    tasks: [
      {
        id: 'cs-management-t1',
        order: 1,
        kind: 'read',
        title: 'Read the case and map what the restructuring changed',
        instruction:
          'Read the Turon Logistics case and list in English exactly what the September 2024 restructuring changed: structure, reporting lines, span of control, communication and training. Next to each change, note the group of employees it affected most. Bring the list to the first team meeting and be ready to defend which change you consider the most damaging.',
      },
      {
        id: 'cs-management-t2',
        order: 2,
        kind: 'analyze_chart',
        title: 'Trace turnover against on-time delivery',
        instruction:
          'Read the two bar series and identify the quarter in which both indicators begin to move, then describe how far each has moved by the fourth quarter of 2025 in percentage points. Explain in six to eight English sentences why rising turnover and falling on-time delivery are likely to reinforce each other. Use the language of cause and effect (leads to, results in, is driven by) and submit the analysis in the chart task box.',
        minWords: 80,
      },
      {
        id: 'cs-management-t3',
        order: 3,
        kind: 'select_vocab',
        title: 'Build the human-resources and operations glossary',
        instruction:
          'Choose ten terms from the required vocabulary list and define each in one English sentence, making clear which belong to human-resource management and which to operations. For four of the terms, write a sentence about Turon Logistics that uses the term with a figure from the case. Store the glossary in the shared document for the whole team.',
      },
      {
        id: 'cs-management-t4',
        order: 4,
        kind: 'use_grammar',
        title: 'Report the exit interviews in reported speech',
        instruction:
          'Turn eight statements that leavers might have made in their exit interviews into reported speech ("One supervisor said that she had never received route feedback"), keeping the backshift of tenses correct. Add four Passive Voice sentences describing the restructuring itself ("Two management layers were removed in September 2024"). Submit the twelve sentences for grammar feedback and correct them before writing the report.',
      },
      {
        id: 'cs-management-t5',
        order: 5,
        kind: 'explain_problem',
        title: 'Explain the management failure to the chief executive',
        instruction:
          'Record a spoken explanation of at least one minute for the chief executive that identifies the management failure behind the numbers, not merely the numbers themselves. Refer to the span of control of 34 drivers per line manager, the absence of training and the three-week notice period, and connect them to the exit-interview themes. Keep the tone diplomatic, since the chief executive still supports the new structure, and upload the recording.',
        minWords: 80,
        minSeconds: 60,
      },
      {
        id: 'cs-management-t6',
        order: 6,
        kind: 'group_discuss',
        title: 'Management meeting: retention, structure or process?',
        instruction:
          'Hold a recorded management meeting in English with four roles: operations director, HR director, a regional depot manager and a driver representative. Each role states one priority, and the team must agree which two measures come first given that the cost savings must be preserved. Use polite disagreement, clarification questions and summarising language, and submit minutes listing the agreed priorities and their owners.',
        minSeconds: 600,
      },
      {
        id: 'cs-management-t7',
        order: 7,
        kind: 'propose_solution',
        title: 'Propose measures that keep the savings',
        instruction:
          'Propose four measures that restore on-time delivery without abandoning the flatter structure, for example team leaders within the driver pool, a training programme for line managers, a weekly route-feedback routine and a retention scheme for experienced staff. For each measure, give the cost, the owner and the key performance indicator that will show whether it works. Use modal verbs of recommendation and at least two first conditional sentences.',
        minWords: 120,
      },
      {
        id: 'cs-management-t8',
        order: 8,
        kind: 'write_report',
        title: 'Write the management report for 5 March 2026',
        instruction:
          'Write a formal management report with four sections: the current position, the causes, the proposed measures and the implementation timetable to the end of 2026. Include a short cost comparison between the 620,000 USD spent on replacing staff and the cost of your retention measures, and integrate at least eight glossary terms. Submit a first draft for AI feedback, revise it, and upload the final version through the writing task.',
        minWords: 250,
      },
      {
        id: 'cs-management-t9',
        order: 9,
        kind: 'presentation',
        title: 'Present the turnaround plan to the executive team',
        instruction:
          'Deliver a three-minute team presentation of the turnaround plan to the executive team, using no more than five slides, one of which shows the turnover and on-time delivery chart. Each member presents one measure with its cost and indicator, and the team must answer a question about how the savings target will still be met. Upload the slides and recording for teacher and peer assessment against the project rubric.',
        minSeconds: 180,
      },
    ],
    requiredVocab: [
      'staff turnover',
      'employee retention',
      'restructuring',
      'span of control',
      'line manager',
      'key performance indicator',
      'on-time delivery',
      'workload',
      'employee engagement',
      'recruitment',
      'onboarding',
      'productivity',
      'chain of command',
      'exit interview',
    ],
    requiredGrammar: ['reported_speech', 'passive_voice', 'past_simple', 'modal_verbs', 'linking_devices'],
    rubric: [
      'Content analysis (0-5): links the September 2024 restructuring to both indicators, and names the span of control and the lack of manager training as the mechanism behind the numbers.',
      'Professional vocabulary (0-5): uses management terminology such as span of control, retention, engagement and key performance indicator accurately and in the right register.',
      'Grammar accuracy (0-5): reported speech from the exit interviews is backshifted correctly and the Passive Voice is used appropriately for organisational actions.',
      'Communication (0-5): the report is diplomatic towards a chief executive who defends the structure, and the presentation delivers four measures clearly within three minutes.',
      'Critical thinking (0-5): keeps the cost savings while solving the delivery problem, and compares the 620,000 USD replacement cost with the cost of the proposed measures.',
      'Teamwork (0-5): the four management roles are played convincingly, priorities are agreed with named owners, and the minutes show genuine negotiation.',
    ],
  },
]

/**
 * AI role-play stsenariylari uchun seed kontent (PLAN 8.6).
 * Har bir persona uchun 2 ta stsenariy: bittasi soddaroq, bittasi murakkabroq.
 * 6-bosqich (produktiv-kommunikativ) uchun ishlatiladi.
 */

import type { ScenarioDoc } from '@/types'

export type SeedScenario = ScenarioDoc & { id: string }

export const SEED_SCENARIOS: SeedScenario[] = [
  /* ---------------------------------------------------------------- */
  /* CLIENT                                                            */
  /* ---------------------------------------------------------------- */
  {
    id: 'sc-client-1',
    persona: 'client',
    title: 'Handling a client complaint about late deliveries',
    context:
      "You are a junior account manager at Sifat Logistics, a Tashkent-based freight forwarder. Your client, Aylin Kadyrova, runs a chain of household goods stores, and her last three shipments from Istanbul arrived between four and nine days late. She has called you directly instead of writing, and she is threatening to move the contract to a competitor at the end of the quarter. The real cause was a customs software failure at the border, but your company has not yet issued an official statement about it. Your task is to keep the client, stay professional, and avoid promising anything the company cannot deliver.",
    goals: [
      'Apologise sincerely for the disruption without accepting legal liability for the delay',
      'Explain the cause of the delay using the passive voice and neutral, factual language',
      'Propose two concrete remedies and agree one next step with a clear deadline',
      'Check that the client is satisfied with the plan before ending the call',
    ],
    cefr: 'B1',
    successCriteria: [
      "Opened with an apology that named the client's specific losses",
      'Used at least four passive structures to describe the cause impersonally',
      'Maintained a formal, calm register even when the client became emotional',
      'Closed with a time-bound commitment and repeated it back for confirmation',
    ],
    scaffoldLevel: 'simple',
    domain: 'business_communication',
    openingLine:
      "Good morning. I'll be honest with you - this is the third late shipment this quarter, and today I need to hear a plan, not another apology.",
    published: true,
  },
  {
    id: 'sc-client-2',
    persona: 'client',
    title: 'Defending your price in a contract renewal negotiation',
    context:
      'You work in the client services team of Bright Digital, a marketing agency in Tashkent that manages social media and paid advertising for mid-sized retailers. Your largest client, Timur Rashidov, is renewing a twelve-month contract worth 480 million soum and has opened by demanding a 20% discount, arguing that a competing agency has quoted far less. Your director has authorised a maximum concession of 8%, and only in exchange for a longer term or a wider scope of work. The client is experienced, direct, and will test any weak justification immediately. You must protect the margin without damaging a relationship that accounts for a fifth of agency revenue.',
    goals: [
      "Establish the client's real priorities before responding to the discount demand",
      'Justify your pricing with evidence of results rather than with general claims',
      'Trade every concession for a condition, using conditional structures',
      'Close with a specific proposal and a date for the signed contract',
    ],
    cefr: 'C1',
    successCriteria: [
      'Asked at least two open questions before making any concession',
      'Used first and second conditionals correctly to link concessions to conditions',
      'Referred to at least three measurable results from the previous contract period',
      'Never conceded more than 8% and never apologised for the price itself',
      'Summarised the agreed terms accurately at the end of the call',
    ],
    scaffoldLevel: 'independent',
    domain: 'marketing',
    openingLine:
      "Let me save us both some time. Your competitor has quoted me twenty per cent less for the same scope, so unless you can match that, I don't really see why we should renew.",
    published: true,
  },

  /* ---------------------------------------------------------------- */
  /* MANAGER                                                           */
  /* ---------------------------------------------------------------- */
  {
    id: 'sc-manager-1',
    persona: 'manager',
    title: 'Presenting quarterly results in a one-to-one',
    context:
      'You are a financial analyst at Anhor Capital, an asset management firm. Your line manager, Dilnoza Yusupova, holds a thirty-minute one-to-one at the end of every quarter. Revenue in your division came in 6% below target, mainly because two client mandates were delayed, but operating costs were 4% under budget and the pipeline for next quarter is the strongest for two years. She reads the numbers before the meeting and expects you to interpret them, not repeat them. Be ready to explain each variance and to say what you will do differently.',
    goals: [
      'Summarise the quarter in under two minutes, leading with the headline figures',
      'Explain the revenue variance using cause-and-effect linking devices',
      'Compare this quarter with the previous one using accurate comparative forms',
      'Commit to two specific corrective actions for the coming quarter',
    ],
    cefr: 'B2',
    successCriteria: [
      'Delivered a structured summary with a clear opening, body and conclusion',
      'Used at least five linking devices of contrast and result',
      'Reported percentages and time periods with the correct prepositions',
      'Answered follow-up questions with evidence and without defensive language',
    ],
    scaffoldLevel: 'guided',
    domain: 'finance',
    openingLine:
      "Right, I have the dashboard in front of me. Revenue is six per cent behind plan - talk me through what happened and what you're doing about it.",
    published: true,
  },
  {
    id: 'sc-manager-2',
    persona: 'manager',
    title: 'Requesting budget approval for a small project',
    context:
      'You are a junior specialist in the operations department of Zamin Foods, a food processing company with about 300 employees. You want approval for a small project: a shared online dashboard that would replace the weekly spreadsheets your team currently sends by email. The project needs 45 million soum and roughly six weeks of one developer. Your manager, Bekzod Aliyev, is supportive in principle but protects his budget carefully and always asks what happens if a project is not approved. You have ten minutes at the end of a team meeting to make your case.',
    goals: [
      'State clearly what you need and what it costs in the first thirty seconds',
      'Describe the current problem with two concrete examples',
      'Explain the expected benefit in hours or money saved',
      'Respond politely to one objection and agree a next step',
    ],
    cefr: 'B1',
    successCriteria: [
      'Named the exact amount and timescale without having to be asked',
      'Used modal verbs (could, would, should) to keep the request polite',
      'Gave at least two measurable benefits with figures',
      'Ended by agreeing who does what before the next meeting',
    ],
    scaffoldLevel: 'simple',
    domain: 'management',
    openingLine:
      "You've got ten minutes. Tell me what you need, what it costs, and what happens if I say no.",
    published: true,
  },

  /* ---------------------------------------------------------------- */
  /* INTERVIEWER                                                       */
  /* ---------------------------------------------------------------- */
  {
    id: 'sc-interviewer-1',
    persona: 'interviewer',
    title: 'Graduate interview for a financial analyst position',
    context:
      'You are a final-year economics student interviewing for a graduate financial analyst role at Orient Bank. The interviewer, Nodira Karimova, leads the corporate credit team and speaks to around forty graduates every spring. She has your CV in front of her and will ask about your degree, one technical question about financial statements, and one question about why you chose this bank. She is friendly but takes notes and expects specific examples rather than general statements. The interview lasts fifteen minutes and ends with questions from you.',
    goals: [
      'Introduce yourself in ninety seconds, linking your studies directly to the role',
      'Describe one achievement using the Present Perfect and Past Simple correctly',
      'Answer a technical question about the three main financial statements',
      'Ask two informed questions about the team and the training programme',
    ],
    cefr: 'B2',
    successCriteria: [
      'Gave a structured self-introduction without reading from notes',
      'Used at least six finance collocations correctly, such as cash flow, balance sheet and working capital',
      'Supported every claim with a specific example, number or result',
      'Maintained a formal register and closed with at least two relevant questions',
    ],
    scaffoldLevel: 'guided',
    domain: 'finance',
    openingLine:
      "Thanks for coming in. I've read your CV, so let's start with something it doesn't tell me: why financial analysis, and why this bank?",
    published: true,
  },
  {
    id: 'sc-interviewer-2',
    persona: 'interviewer',
    title: 'Competency interview: teamwork under pressure',
    context:
      'You have reached the second round of a graduate scheme at a regional consultancy. This stage is a competency interview run by Sardor Nazarov, a senior consultant who works strictly with the STAR method: situation, task, action, result. He will ask you to describe a time when a team you belonged to missed a deadline, and he will probe hard, asking what you personally did, what you would do differently, and how you handled the disagreement inside the team. He is neutral in tone and comfortable with silence, so vague answers will simply be met with another question. Only concrete, honest detail will score.',
    goals: [
      'Structure a full answer using situation, task, action and result',
      'Separate clearly what the team did from what you personally did',
      'Describe the mistake and its lesson using the third conditional',
      'Handle a probing follow-up question without contradicting yourself',
    ],
    cefr: 'C1',
    successCriteria: [
      'Answered in a clear STAR structure with a quantified result',
      'Used I and we accurately to distinguish personal from collective responsibility',
      'Produced at least one correct third conditional when reflecting on the mistake',
      'Kept an appropriate professional register under pressure, with no defensive or dismissive language',
      "Reported colleagues' words accurately in reported speech",
    ],
    scaffoldLevel: 'independent',
    domain: 'business_communication',
    openingLine:
      "Tell me about a time your team missed an important deadline. I'm less interested in whose fault it was than in what you personally did about it.",
    published: true,
  },

  /* ---------------------------------------------------------------- */
  /* BUSINESS PARTNER                                                  */
  /* ---------------------------------------------------------------- */
  {
    id: 'sc-business_partner-1',
    persona: 'business_partner',
    title: 'Negotiating the terms of a joint venture',
    context:
      'You represent Silk Route Textiles, an Uzbek manufacturer that wants to enter the Kazakh market. Your potential partner, Yerlan Dosmukhambetov, runs a distribution company in Almaty with sixty staff and established retail relationships. You have agreed in principle to form a joint venture, and this call is about the terms: the equity split, who appoints the general director, how profits are reinvested in the first three years, and what happens if either side wants to exit. He is pushing for 60/40 in his favour because he brings the customer base, while you argue that you bring the product, the factory and most of the capital. Nothing has been signed, and either side can still walk away.',
    goals: [
      'Set out your opening position on equity and control with clear commercial reasoning',
      'Test the position of the partner with hypothetical proposals in the second conditional',
      'Signal flexibility on one point in exchange for firmness on another',
      'Agree the three points that will go into the term sheet and who drafts it',
    ],
    cefr: 'C1',
    successCriteria: [
      'Stated a clear position and supported it with at least three commercial arguments',
      'Used diplomatic and hypothetical language (would, could, suppose, provided that) instead of blunt refusals',
      'Kept a cooperative register while disagreeing at least twice',
      'Summarised both the agreed and the unresolved points accurately at the end',
    ],
    scaffoldLevel: 'independent',
    domain: 'management',
    openingLine:
      "Good to speak again. Before we go into detail, let me be clear about one thing: without my distribution network you have no route to the Kazakh consumer, and that has to be reflected in the split.",
    published: true,
  },
  {
    id: 'sc-business_partner-2',
    persona: 'business_partner',
    title: 'Renegotiating payment terms after a currency shock',
    context:
      'You are the commercial director of a company that imports components from a supplier in Turkey. Over the last two months the som has depreciated by about 14%, and your contract requires payment in US dollars within thirty days of shipment. At the current exchange rate the gross margin on this product line has fallen close to zero. Your counterpart, Emre Yilmaz, values the relationship but has bank covenants of his own to meet. You want ninety-day terms or a partial switch to a letter of credit; he wants his money on time.',
    goals: [
      'Explain the impact of the exchange rate movement with clear figures',
      'Propose two alternative payment structures and compare them',
      'Acknowledge the constraints of the partner before pressing your own case',
      'Agree a trial arrangement for the next two shipments',
    ],
    cefr: 'B2',
    successCriteria: [
      'Presented the currency impact with accurate numbers and correct prepositions of change',
      'Used at least four trade finance terms correctly, such as letter of credit, deferred payment and exchange rate exposure',
      'Made every concession conditional rather than unconditional',
      'Ended with a commitment to confirm the arrangement in writing by a stated date',
    ],
    scaffoldLevel: 'guided',
    domain: 'banking',
    openingLine:
      "I understand the som has moved against you, but my bank doesn't adjust my covenants when your currency falls. So tell me precisely what you're asking me for.",
    published: true,
  },

  /* ---------------------------------------------------------------- */
  /* ECONOMIST                                                         */
  /* ---------------------------------------------------------------- */
  {
    id: 'sc-economist-1',
    persona: 'economist',
    title: 'Discussing the causes of rising inflation',
    context:
      'You are taking part in a research seminar at your university. Your discussion partner is Dr Kamola Ergasheva, an applied economist who advises a policy think tank and who enjoys challenging student assumptions. Headline inflation has risen from 8.5% to 11.2% over four quarters, while food inflation has reached 15%. She wants you to distinguish demand-pull from cost-push pressures, to say which of them dominates, and to defend that view with evidence. She will disagree at least once, in order to see whether you can hold your position politely.',
    goals: [
      'Define demand-pull and cost-push inflation in your own words',
      'Argue which factor dominates and support it with at least two pieces of evidence',
      'Concede one point to your partner without abandoning your argument',
      'Suggest one policy response and state its main risk',
    ],
    cefr: 'B2',
    successCriteria: [
      'Used at least six macroeconomic terms accurately, such as aggregate demand, pass-through and monetary tightening',
      'Signposted the argument with linking devices of contrast and result',
      'Disagreed politely using hedging language rather than direct contradiction',
      'Distinguished correlation from causation at least once',
    ],
    scaffoldLevel: 'guided',
    domain: 'economics',
    openingLine:
      "Everyone keeps telling me our inflation is imported, and I'm not convinced. Before we go any further: what makes you think this is a cost problem rather than a demand problem?",
    published: true,
  },
  {
    id: 'sc-economist-2',
    persona: 'economist',
    title: 'Interpreting an unemployment chart with a colleague',
    context:
      'You work in the analysis unit of a regional employment agency. Your colleague, Aziz Toshmatov, has sent you a line chart showing youth unemployment falling from 17% to 13% over five years, while unemployment among workers over 45 has stayed flat at around 6%. He needs a short spoken summary before a meeting in twenty minutes and asks you to talk him through what the chart shows. He is not an economist and will ask you to explain any term you use. Keep the language simple, accurate and free of jargon.',
    goals: [
      'Describe the overall trend for each group in two or three sentences',
      'Compare the two groups using accurate comparative structures',
      'Point out one thing the chart does not tell us',
      'Suggest one likely explanation and mark it clearly as a hypothesis',
    ],
    cefr: 'B1',
    successCriteria: [
      'Used accurate verbs and adverbs of change, such as fell steadily, remained flat and rose slightly',
      'Made at least three correct comparisons, each with a named benchmark',
      'Separated fact from interpretation with clear signalling language',
      'Explained every technical term in plain English when asked',
    ],
    scaffoldLevel: 'simple',
    domain: 'economics',
    openingLine:
      "I've got the chart open, but all I can see is two lines going in different directions. Can you talk me through it in plain language before I walk into this meeting?",
    published: true,
  },

  /* ---------------------------------------------------------------- */
  /* INVESTOR                                                          */
  /* ---------------------------------------------------------------- */
  {
    id: 'sc-investor-1',
    persona: 'investor',
    title: 'Pitching a startup for seed funding',
    context:
      'You are the co-founder of Hisob, a small software company that automates bookkeeping for Uzbek micro-businesses. You are pitching to Laylo Abdullaeva, an angel investor who has backed eleven early-stage companies and who takes about one meeting in twenty to a second conversation. You are asking for 250,000 US dollars in exchange for 12% of the company, at a point when you have 400 paying users and monthly revenue of 9,000 dollars growing at 11% a month. She will interrupt, ask about unit economics and competitors, and will not accept vague market-size claims. You have eight minutes.',
    goals: [
      'Deliver a two-minute pitch covering the problem, the solution, traction and the ask',
      'Present three key metrics precisely and explain what each one means',
      'Answer a challenge about competition without dismissing the competitor',
      'State the use of funds and the milestone that the money will reach',
    ],
    cefr: 'B2',
    successCriteria: [
      'Stated the amount, the equity offered and the use of funds explicitly',
      'Used at least five investment terms correctly, such as traction, churn, runway and unit economics',
      'Supported every growth claim with a number and its source',
      'Handled interruptions without losing the structure of the pitch',
    ],
    scaffoldLevel: 'guided',
    domain: 'finance',
    openingLine:
      "You've got eight minutes, and I've already heard four bookkeeping pitches this month. Start with the one number that should make me stay in this room.",
    published: true,
  },
  {
    id: 'sc-investor-2',
    persona: 'investor',
    title: 'Defending portfolio performance to a sceptical investor',
    context:
      'You are a portfolio manager at a small asset management firm. One of your largest clients, Rustam Sharipov, has invested the equivalent of two million dollars in your balanced fund, which returned 4.1% last year against a benchmark of 7.3%. Two sector positions account for most of that gap, although the drawdown of your fund during the March correction was less than half that of the benchmark. He has asked for this call because he is considering withdrawing half of his money. He is financially literate, calm, and will notice immediately if you hide behind jargon.',
    goals: [
      'Report the performance figures honestly before offering any explanation',
      'Attribute the underperformance to specific positions and decisions',
      'Reframe the result in terms of risk-adjusted return without dismissing the concern',
      'Propose one concrete change and agree how it will be reviewed',
    ],
    cefr: 'C1',
    successCriteria: [
      'Led with the actual numbers, including the size of the gap to the benchmark',
      'Used portfolio terminology precisely, including attribution, drawdown and risk-adjusted return',
      'Acknowledged the concern of the client explicitly before defending the strategy',
      'Avoided blaming the market as the only explanation',
      'Ended with a specific, time-bound review commitment',
    ],
    scaffoldLevel: 'independent',
    domain: 'finance',
    openingLine:
      "I've read the statement three times. Four per cent against a benchmark of seven - so before you explain the market to me, I'd like to hear what you got wrong.",
    published: true,
  },
]

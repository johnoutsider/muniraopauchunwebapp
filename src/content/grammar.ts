/**
 * Grammatika darslari uchun seed kontent (PLAN 8.2).
 * GRAMMAR_TOPICS ro'yxatidagi 8 ta mavzu — har biri iqtisodiy kontekstda.
 * Bu fayl `LessonBlock` (kind: 'grammar') bloklarini va grammatika bo'limini to'ldiradi.
 */

import type { CefrLevel, Domain, ErrorTag, GrammarTopicId } from '@/config/constants'

export interface GrammarCommonError {
  /** Talaba yozadigan noto'g'ri variant */
  wrong: string
  /** To'g'rilangan variant */
  right: string
  tag: ErrorTag
  /** Nima uchun xato — qisqa izoh (ingliz tilida) */
  why: string
}

export interface GrammarLessonSeed {
  id: string
  topicId: GrammarTopicId
  title: string
  cefr: CefrLevel
  domain: Domain
  /** Mavzuning iqtisodiy konteksti (GRAMMAR_TOPICS.context bilan mos) */
  context: string
  /** Bir jumlalik maqsad */
  objective: string
  /** To'liq tushuntirish — oddiy matn, 150-250 so'z */
  explanation: string
  /** LessonBlock kind:'grammar' uchun HTML (p, ul, li, strong, code teglari) */
  explanationHtml: string
  /** Asosiy shakllar / formula qatorlari */
  keyForms: string[]
  /** 4-6 ta iqtisodiy kontekstdagi misol gap */
  examples: string[]
  commonErrors: GrammarCommonError[]
  /** Kasbiy ahamiyati — 2-3 jumla */
  whyItMatters: string
  /** 6-bosqich kommunikativ topshiriq */
  communicativeTask: string
  order: number
}

export const SEED_GRAMMAR_LESSONS: GrammarLessonSeed[] = [
  /* ---------------------------------------------------------------- */
  /* 1. Present Perfect — company performance                          */
  /* ---------------------------------------------------------------- */
  {
    id: 'gl-present_perfect',
    topicId: 'present_perfect',
    title: 'Present Perfect: reporting company performance',
    cefr: 'B1',
    domain: 'management',
    context: 'company performance',
    objective:
      'Report what a company has achieved in a period that is still open, and choose correctly between the Present Perfect and the Past Simple.',
    explanation:
      "The Present Perfect connects the past with now. You form it with have or has plus the past participle: the company has opened three new branches. Use it when the exact time is not important, or when the result still matters today. In business English it is the normal tense for reporting company performance: results since the start of the year, achievements so far, and changes that are still true. Words such as since, for, already, yet, so far, this year and over the last five years are strong signals. Compare it with the Past Simple. The Past Simple describes a finished period: profit rose by 8% in 2023. The Present Perfect describes a period that is still open: profit has risen by 8% this year. If you name a finished time (last quarter, in 2019, two years ago), you must use the Past Simple. If you say since 2019 or in the last six months, use the Present Perfect. Remember that since is followed by a starting point, such as since March, and for by a length of time, such as for six months. In negatives and questions, have and has carry the grammar: sales have not recovered yet; has the board approved the budget? Keep the participle form stable: risen, fallen, grown, become, taken.",
    explanationHtml:
      '<p>The <strong>Present Perfect</strong> connects the past with now. You form it with <code>have/has + past participle</code>: <em>the company has opened three new branches</em>. Use it when the exact time is not important, or when the result still matters today.</p><p>In business English it is the normal tense for reporting <strong>company performance</strong>: results since the start of the year, achievements so far, and changes that are still true. Signal words include:</p><ul><li><code>since</code>, <code>for</code>, <code>so far</code>, <code>already</code>, <code>yet</code></li><li><code>this year</code>, <code>over the last five years</code></li></ul><p><strong>Present Perfect or Past Simple?</strong> The Past Simple describes a finished period (<em>profit rose by 8% in 2023</em>); the Present Perfect describes a period that is still open (<em>profit has risen by 8% this year</em>).</p><ul><li>Finished time (<code>last quarter</code>, <code>in 2019</code>, <code>two years ago</code>) &rarr; Past Simple.</li><li>Unfinished time (<code>since 2019</code>, <code>in the last six months</code>) &rarr; Present Perfect.</li><li><code>since</code> + starting point; <code>for</code> + length of time.</li></ul><p>In negatives and questions, <code>have/has</code> carries the grammar: <em>sales have not recovered yet</em>; <em>has the board approved the budget?</em> Keep the participles stable: <code>risen</code>, <code>fallen</code>, <code>grown</code>, <code>become</code>, <code>taken</code>.</p>',
    keyForms: [
      'have/has + past participle (regular: -ed; irregular: risen, fallen, grown)',
      'have/has not + past participle (negative)',
      'Have/Has + subject + past participle? (question)',
      'since + starting point (since March) / for + length of time (for six months)',
      'Present Perfect = unfinished time; Past Simple = finished time',
    ],
    examples: [
      'Revenue has grown by 12% since the new pricing strategy was introduced.',
      'The Central Bank has raised the policy rate three times this year.',
      'Our marketing team has already launched two campaigns in the regional market.',
      'We have not yet received the audited financial statements for the fourth quarter.',
      'Unemployment has fallen steadily since the government reformed the tax system.',
      'Has the board approved the capital expenditure budget for next year?',
    ],
    commonErrors: [
      {
        wrong: 'Last year the company has increased its exports by 20%.',
        right: 'Last year the company increased its exports by 20%.',
        tag: 'tense',
        why: 'A finished time expression such as last year requires the Past Simple, not the Present Perfect.',
      },
      {
        wrong: 'We work with this bank since 2018.',
        right: 'We have worked with this bank since 2018.',
        tag: 'tense',
        why: 'An action that started in the past and still continues takes the Present Perfect, not the Present Simple.',
      },
      {
        wrong: 'Profits have grown since three years.',
        right: 'Profits have grown for three years.',
        tag: 'prepositions',
        why: 'Since introduces a starting point, while for introduces a length of time.',
      },
      {
        wrong: 'The auditors has finished the report.',
        right: 'The auditors have finished the report.',
        tag: 'agreement',
        why: 'A plural subject such as the auditors takes have, not has.',
      },
    ],
    whyItMatters:
      'Annual reports, investor updates and the achievement bullets on a CV are written largely in the Present Perfect, because they present results that are still relevant today. If you use the Past Simple there, your reader hears that the achievement is finished and no longer counts. In a job interview, "I have managed a portfolio of 40 clients" sounds current, while "I managed" sounds closed.',
    communicativeTask:
      'Record 45 seconds describing what your chosen company has achieved this year. Use the Present Perfect at least four times, and include one since phrase and one for phrase.',
    order: 1,
  },

  /* ---------------------------------------------------------------- */
  /* 2. Past Simple — business history                                 */
  /* ---------------------------------------------------------------- */
  {
    id: 'gl-past_simple',
    topicId: 'past_simple',
    title: 'Past Simple: telling the history of a business',
    cefr: 'A2',
    domain: 'business_communication',
    context: 'business history',
    objective:
      'Tell the finished story of a company or a market event accurately, using regular and irregular past forms.',
    explanation:
      "The Past Simple tells the story of finished actions at a finished time. Regular verbs add -ed: opened, launched, merged, expanded. Many key business verbs are irregular: rise-rose, fall-fell, grow-grew, buy-bought, sell-sold, become-became. Questions and negatives use did plus the base verb: did the company make a profit? It did not make a profit. Never add -ed after did. Use the Past Simple whenever you name the time: in 1991, last quarter, three years ago, after the 2008 crisis, when the market collapsed. This is the tense of business history, that is, the story of how a company was founded, how it expanded, and what happened to it. Compare it with the Present Perfect. The Past Simple closes the door on the time period; the Present Perfect keeps it open. The firm entered the Kazakh market in 2015 is history; the firm has entered three new markets is a current achievement. With was and were you do not need did: the results were disappointing. Finally, keep the tense consistent. Once you start a company history in the Past Simple, stay in it, and only switch to the Present Perfect when you move from the story to today's position.",
    explanationHtml:
      '<p>The <strong>Past Simple</strong> tells the story of finished actions at a finished time. Regular verbs add <code>-ed</code>: <em>opened, launched, merged, expanded</em>. Many key business verbs are irregular:</p><ul><li><code>rise &rarr; rose</code>, <code>fall &rarr; fell</code>, <code>grow &rarr; grew</code></li><li><code>buy &rarr; bought</code>, <code>sell &rarr; sold</code>, <code>become &rarr; became</code></li></ul><p>Questions and negatives use <code>did + base verb</code>: <em>did the company make a profit?</em> / <em>it did not make a profit</em>. Never add <code>-ed</code> after <code>did</code>. With <code>was</code> and <code>were</code> you do not need <code>did</code>: <em>the results were disappointing</em>.</p><p>Use the Past Simple whenever you <strong>name the time</strong>: <code>in 1991</code>, <code>last quarter</code>, <code>three years ago</code>, <code>after the 2008 crisis</code>. This is the tense of <strong>business history</strong>: how a company was founded, how it expanded, and what happened to it.</p><p><strong>Past Simple or Present Perfect?</strong> The Past Simple closes the time period; the Present Perfect keeps it open. <em>The firm entered the Kazakh market in 2015</em> is history. <em>The firm has entered three new markets</em> is a current achievement.</p><p>Keep the tense consistent: once a company history starts in the Past Simple, stay in it, and switch tense only when you move from the story to the position today.</p>',
    keyForms: [
      'regular verb + -ed (launched, merged, expanded)',
      'irregular forms: rise/rose, fall/fell, grow/grew, buy/bought, sell/sold',
      'did + base verb (question) / did not + base verb (negative)',
      'was / were (no did in questions and negatives)',
      'time markers: in 2015, last year, two years ago, after the crisis',
    ],
    examples: [
      'Uzbekistan liberalised its foreign exchange market in 2017.',
      'The bank opened its first regional branch in Samarkand in 1994 and became profitable four years later.',
      'Sales fell sharply after the company raised its prices in March.',
      'The founders sold a 30% stake to a private equity fund and used the money to expand.',
      'Did the merger create the cost savings that management promised?',
      'The audit did not reveal any material weaknesses in the reporting system.',
    ],
    commonErrors: [
      {
        wrong: 'The company did not increased its capital in 2020.',
        right: 'The company did not increase its capital in 2020.',
        tag: 'tense',
        why: 'After did the main verb stays in its base form, because did already carries the past meaning.',
      },
      {
        wrong: 'In 2019 the bank has opened twelve new branches.',
        right: 'In 2019 the bank opened twelve new branches.',
        tag: 'tense',
        why: 'A stated past year is a finished time, so the Past Simple is required.',
      },
      {
        wrong: 'The production costs was higher than expected.',
        right: 'The production costs were higher than expected.',
        tag: 'agreement',
        why: 'A plural subject takes were, not was.',
      },
      {
        wrong: 'The firm entered market in 2015 and lost money for two years.',
        right: 'The firm entered the market in 2015 and lost money for two years.',
        tag: 'articles',
        why: 'A specific market that both writer and reader can identify takes the definite article the.',
      },
    ],
    whyItMatters:
      'Company profiles, the background section of a case study and the experience section of a CV are all written in the Past Simple. In an interview you will be asked what you did, what problem you solved and what the result was, and every answer needs accurate past forms. Irregular verbs such as rose, fell and bought appear in almost every market commentary you will ever read.',
    communicativeTask:
      'Write a 120-word history of a company from your region: when it was founded, what it first sold, how it grew, and what went wrong at least once. Use at least six different Past Simple verbs, three of them irregular.',
    order: 2,
  },

  /* ---------------------------------------------------------------- */
  /* 3. Passive Voice — economic reports                               */
  /* ---------------------------------------------------------------- */
  {
    id: 'gl-passive_voice',
    topicId: 'passive_voice',
    title: 'Passive Voice: the language of economic reports',
    cefr: 'B1',
    domain: 'economics',
    context: 'economic reports',
    objective:
      'Write impersonal, objective report sentences by moving the important information to the front and the agent to the end.',
    explanation:
      'The passive moves the important information to the front of the sentence and pushes the doer to the end, or removes the doer completely. You form it with the verb be in the required tense plus the past participle: the report is prepared, the data were collected, the rate has been cut, the budget will be approved. Use by only when the doer really matters: the subsidy was approved by the Ministry of Finance. In economic reports and academic writing the passive is normal for three reasons. First, the process matters more than the person: interest rates were raised twice last year. Second, the doer is obvious or unknown: taxes are collected quarterly. Third, it keeps the tone impersonal and objective, which is exactly what an official report requires. Compare this with the active voice, which is shorter and clearer when a responsible agent is the point: our team prepared the forecast. Do not overuse the passive, because a paragraph of nothing but passive sentences is heavy to read. Remember also that only verbs which take an object can be made passive. You cannot say the price was risen, because rise has no object. Say the price was raised by the company, or use the active verb: the price rose.',
    explanationHtml:
      '<p>The <strong>passive</strong> moves the important information to the front of the sentence and pushes the doer to the end, or removes the doer completely. Form it with <code>be (in the required tense) + past participle</code>:</p><ul><li>present: <em>the report is prepared</em></li><li>past: <em>the data were collected</em></li><li>present perfect: <em>the rate has been cut</em></li><li>future / modal: <em>the budget will be approved</em>, <em>the fee must be paid</em></li></ul><p>Use <code>by</code> only when the agent really matters: <em>the subsidy was approved by the Ministry of Finance</em>.</p><p>In <strong>economic reports</strong> the passive is normal for three reasons:</p><ul><li>the process matters more than the person &mdash; <em>interest rates were raised twice last year</em>;</li><li>the doer is obvious or unknown &mdash; <em>taxes are collected quarterly</em>;</li><li>it keeps the tone impersonal and objective.</li></ul><p><strong>Passive or active?</strong> The active is shorter and clearer when a responsible agent is the point: <em>our team prepared the forecast</em>. Do not overuse the passive &mdash; a paragraph of nothing but passives is heavy to read.</p><p>Only <strong>transitive</strong> verbs can be passive. <em>The price was risen</em> is impossible, because <code>rise</code> takes no object; write <em>the price was raised</em> or <em>the price rose</em>.</p>',
    keyForms: [
      'be (in the required tense) + past participle',
      'present: is/are prepared; past: was/were collected; present perfect: has/have been cut',
      'modal passive: must be approved, can be measured, will be published',
      'by + agent (only when the agent is important)',
      'only transitive verbs have a passive: raise -> was raised; rise has no passive',
    ],
    examples: [
      'Inflation is measured by the State Statistics Committee using a basket of around 300 goods and services.',
      'The quarterly accounts were audited by an international firm before publication.',
      'The refinancing rate has been held at 13.5% for three consecutive meetings.',
      'All customer complaints must be logged in the CRM system within 24 hours.',
      'The new packaging was tested on a sample of 500 consumers in Tashkent.',
      'A detailed cost breakdown will be attached to the final version of the report.',
    ],
    commonErrors: [
      {
        wrong: 'The prices were risen by 5% last month.',
        right: 'Prices were raised by 5% last month.',
        tag: 'passive_voice',
        why: 'Rise takes no object and therefore has no passive form; the transitive verb raise does.',
      },
      {
        wrong: 'The report was wrote by the senior analyst.',
        right: 'The report was written by the senior analyst.',
        tag: 'passive_voice',
        why: 'The passive needs the past participle written, not the past simple form wrote.',
      },
      {
        wrong: 'The data is collect every quarter.',
        right: 'The data is collected every quarter.',
        tag: 'passive_voice',
        why: 'After the verb be the passive requires the past participle, so collect becomes collected.',
      },
      {
        wrong: 'The decision was taken from the supervisory board.',
        right: 'The decision was taken by the supervisory board.',
        tag: 'prepositions',
        why: 'The agent of a passive sentence is introduced by by, never by from.',
      },
    ],
    whyItMatters:
      'Statistical bulletins, audit reports, methodology sections and central bank statements are written largely in the passive, because they describe procedures rather than people. Being able to switch between active and passive also lets you control responsibility in professional writing: "an error was made in the invoice" is far more diplomatic than "you made an error".',
    communicativeTask:
      'Take a short news item about the Uzbek economy and rewrite five of its active sentences in the passive for a formal report. Then explain in two sentences why the passive suits a report better in at least three of those cases.',
    order: 3,
  },

  /* ---------------------------------------------------------------- */
  /* 4. Conditionals — business decisions                              */
  /* ---------------------------------------------------------------- */
  {
    id: 'gl-conditionals',
    topicId: 'conditionals',
    title: 'Conditionals: modelling business decisions',
    cefr: 'B2',
    domain: 'finance',
    context: 'business decisions',
    objective:
      'Express real, hypothetical and past-regret consequences accurately when analysing a business decision.',
    explanation:
      "Conditionals let you talk about consequences, which is the heart of every business decision. The zero conditional states a rule that is always true: if demand rises, prices go up. The first conditional describes a real, possible future: if we cut the price by 10%, we will lose about four percentage points of margin. Use it for plans, forecasts, offers and warnings in negotiations. The second conditional describes an imaginary or unlikely present or future situation: if we had a second warehouse, we would deliver within 24 hours. Use it for hypothetical modelling and for polite proposals. The third conditional looks back at the past and imagines a different result: if we had hedged the currency risk, we would not have lost so much money. Use it for lessons learned and post-project reviews. Two rules cause most mistakes. First, never put will in the if-clause of a first conditional, because the future meaning is carried by the main clause. Second, keep the pairs consistent: present plus will, past plus would, past perfect plus would have. Note also that unless means if not, so a second negative reverses your meaning. In formal writing you can replace if with provided that or with should: should the exchange rate fall further, we will revise the forecast. When the if-clause comes first, separate the clauses with a comma.",
    explanationHtml:
      '<p><strong>Conditionals</strong> let you talk about consequences, which is the heart of every business decision.</p><ul><li><strong>Zero</strong> &mdash; a rule that is always true: <em>if demand rises, prices go up</em>.</li><li><strong>First</strong> &mdash; a real, possible future: <em>if we cut the price by 10%, we will lose about four percentage points of margin</em>. Use it for plans, forecasts, offers and warnings.</li><li><strong>Second</strong> &mdash; an imaginary or unlikely situation: <em>if we had a second warehouse, we would deliver within 24 hours</em>. Use it for hypothetical modelling and polite proposals.</li><li><strong>Third</strong> &mdash; a different past: <em>if we had hedged the currency risk, we would not have lost so much money</em>. Use it for lessons learned.</li></ul><p><strong>Two rules that cause most mistakes:</strong></p><ul><li>Never put <code>will</code> in the <code>if</code>-clause of a first conditional; the main clause carries the future meaning.</li><li>Keep the pairs consistent: <code>present + will</code>, <code>past + would</code>, <code>past perfect + would have</code>.</li></ul><p><code>unless</code> already means <em>if not</em>, so a second negative reverses your meaning. In formal writing, <code>provided that</code> and <code>should</code> replace <code>if</code>: <em>should the exchange rate fall further, we will revise the forecast</em>. When the <code>if</code>-clause comes first, use a comma between the clauses.</p>',
    keyForms: [
      'Zero: If + present simple, present simple (general economic rule)',
      'First: If + present simple, will + infinitive (real future condition)',
      'Second: If + past simple, would + infinitive (hypothetical situation)',
      'Third: If + past perfect, would have + past participle (past regret)',
      'unless = if not; provided that / should = formal alternatives to if',
    ],
    examples: [
      'If inflation stays above 10%, the Central Bank will keep the policy rate unchanged.',
      'If we outsourced the logistics function, we would cut fixed costs by roughly 15%.',
      'If the company had diversified its export markets, it would not have lost half its revenue in a single year.',
      'Unless the client settles the outstanding invoice by Friday, we will suspend the service.',
      'If a currency depreciates, imported goods become more expensive for domestic consumers.',
      'Provided that the due diligence is clean, the fund will transfer the first tranche in March.',
    ],
    commonErrors: [
      {
        wrong: 'If the market will grow, we will open a new branch.',
        right: 'If the market grows, we will open a new branch.',
        tag: 'conditionals',
        why: 'The if-clause of a first conditional uses the present simple; will belongs only in the main clause.',
      },
      {
        wrong: 'If we would have more capital, we would expand faster.',
        right: 'If we had more capital, we would expand faster.',
        tag: 'conditionals',
        why: 'The second conditional needs the past simple in the if-clause, not would.',
      },
      {
        wrong: 'If they had cut costs earlier, they would not lose the contract.',
        right: 'If they had cut costs earlier, they would not have lost the contract.',
        tag: 'conditionals',
        why: 'A third conditional must pair the past perfect with would have plus a past participle.',
      },
      {
        wrong: 'Unless the price does not fall, we will not sign the contract.',
        right: 'Unless the price falls, we will not sign the contract.',
        tag: 'conditionals',
        why: 'Unless already means if not, so adding a second negative reverses the intended meaning.',
      },
    ],
    whyItMatters:
      'Feasibility studies, the risk section of a business plan and credit memos are built on conditional sentences, because they weigh outcomes that have not happened yet. In negotiation, the first and second conditionals are the polite way to make and test an offer: "if you increased the volume, we could review the discount" keeps the door open without committing you.',
    communicativeTask:
      'Prepare a 90-second oral risk briefing on a real investment decision. Use one first conditional for the likely outcome, one second conditional for a what-if scenario, and one third conditional for a lesson from a past mistake.',
    order: 4,
  },

  /* ---------------------------------------------------------------- */
  /* 5. Modal Verbs — recommendations                                  */
  /* ---------------------------------------------------------------- */
  {
    id: 'gl-modal_verbs',
    topicId: 'modal_verbs',
    title: 'Modal verbs: grading recommendations and obligations',
    cefr: 'B1',
    domain: 'banking',
    context: 'recommendations',
    objective:
      'Choose the modal verb that matches the strength of your advice, obligation or prediction in a professional recommendation.',
    explanation:
      'Modal verbs are small words that carry a great deal of professional meaning, because they show how strong, how certain and how polite you are. The form is simple: a modal plus the base verb, with no to and no third-person -s. Write the company must reduce costs, not must to reduce, and the board should consider, not should considers. For recommendations, English gives you a clear scale. Should and ought to give normal advice: the firm should renegotiate its supplier contracts. Must and have to express obligation, usually legal or internal: banks must report suspicious transactions. Need to is a softer obligation, and had better warns of a bad consequence. For possibility, use may, might and could: costs may rise if fuel prices keep climbing. Can expresses ability and general possibility, while could and would make requests and suggestions polite: could you send the figures by Thursday? Two contrasts matter in reports. Must not means that something is forbidden, whereas do not have to means that it is not necessary; these are opposites, not synonyms. And when you are only partly sure, use may or might rather than will, because will makes a forecast sound like a promise you have to keep.',
    explanationHtml:
      '<p><strong>Modal verbs</strong> are small words that carry a great deal of professional meaning: they show how strong, how certain and how polite you are.</p><p><strong>Form:</strong> <code>modal + base verb</code> &mdash; no <code>to</code>, no third-person <code>-s</code>. Write <em>the company must reduce costs</em> (not <em>must to reduce</em>) and <em>the board should consider</em> (not <em>should considers</em>).</p><p><strong>The recommendation scale:</strong></p><ul><li><code>should</code> / <code>ought to</code> &mdash; normal advice: <em>the firm should renegotiate its supplier contracts</em>;</li><li><code>must</code> / <code>have to</code> &mdash; obligation, usually legal or internal: <em>banks must report suspicious transactions</em>;</li><li><code>need to</code> &mdash; a softer obligation; <code>had better</code> &mdash; a warning.</li></ul><p><strong>Possibility and politeness:</strong> <code>may</code>, <code>might</code> and <code>could</code> express possibility (<em>costs may rise</em>); <code>could you</code> and <code>would you</code> make requests polite (<em>could you send the figures by Thursday?</em>).</p><p><strong>Two contrasts to remember:</strong></p><ul><li><code>must not</code> = it is forbidden; <code>do not have to</code> = it is not necessary. These are opposites.</li><li>When you are only partly sure, use <code>may</code> or <code>might</code>, not <code>will</code> &mdash; <code>will</code> makes a forecast sound like a promise.</li></ul>',
    keyForms: [
      'modal + base verb (no to, no -s): must review, should consider',
      'advice: should / ought to; obligation: must / have to; softer: need to',
      'possibility: may / might / could + base verb',
      'must not (forbidden) vs do not have to (not necessary)',
      'polite requests: could you / would you / may I',
    ],
    examples: [
      'Under the current regulation, the bank must hold capital equal to at least 13% of its risk-weighted assets.',
      'Management should review the pricing policy before the start of the new season.',
      'Fuel costs may rise further, so the logistics budget might need an additional 5%.',
      'Employees must not disclose client data to third parties under any circumstances.',
      'Could you send me the updated cash flow forecast before the Thursday meeting?',
      'A smaller regional competitor could enter the segment within two years.',
    ],
    commonErrors: [
      {
        wrong: 'The company must to cut its short-term debt.',
        right: 'The company must cut its short-term debt.',
        tag: 'modal_verbs',
        why: 'Modal verbs are followed by the base form of the verb without to.',
      },
      {
        wrong: 'The board should considers the offer at its next meeting.',
        right: 'The board should consider the offer at its next meeting.',
        tag: 'modal_verbs',
        why: 'A verb after a modal never takes the third-person -s ending.',
      },
      {
        wrong: 'You must not attend the training, because it is optional.',
        right: 'You do not have to attend the training, because it is optional.',
        tag: 'modal_verbs',
        why: 'Must not means that something is forbidden, while do not have to means that it is simply not necessary.',
      },
      {
        wrong: 'Send me the revised contract today.',
        right: 'Could you send me the revised contract today?',
        tag: 'register',
        why: 'A bare imperative sounds abrupt to a client, whereas a modal question keeps the request appropriately polite.',
      },
    ],
    whyItMatters:
      'The recommendations section of any consultancy report, audit letter or policy brief is written almost entirely with modal verbs, and the wrong modal changes the strength of your advice. In emails and meetings, modals are also the main politeness tool in English: "could you confirm the figures" and "you must confirm the figures" produce very different reactions from a client.',
    communicativeTask:
      'Write a five-bullet recommendations section for a company that is losing market share. Use should, must, could and may at least once each, and be ready to justify the strength you chose for every bullet.',
    order: 5,
  },

  /* ---------------------------------------------------------------- */
  /* 6. Reported Speech — meetings and negotiations                    */
  /* ---------------------------------------------------------------- */
  {
    id: 'gl-reported_speech',
    topicId: 'reported_speech',
    title: 'Reported speech: minutes of meetings and negotiations',
    cefr: 'B2',
    domain: 'management',
    context: 'meetings and negotiations',
    objective:
      'Report accurately what colleagues, clients and partners said, asked and agreed during a meeting or a negotiation.',
    explanation:
      'Reported speech is how you tell someone what was said in a meeting or on a call. When the reporting verb is in the past, such as he said, she explained or they confirmed, the verb in the reported clause usually moves one step back: present becomes past, past becomes past perfect, will becomes would, can becomes could, and must becomes had to. Pronouns and time words shift as well, so we will send it tomorrow becomes they said they would send it the following day. There are no quotation marks and no question word order: write he asked how much we had budgeted, not he asked how much had we budgeted. For yes or no questions, use if or whether: she asked whether the terms were final. Say takes no person object, as in he said that the deal was closed, while tell needs one, as in he told the client that the deal was closed. You do not always have to shift the tense. If the information is still true, present forms are acceptable and often preferred in minutes: the CFO said that the company operates on thin margins. Finally, choose the reporting verb carefully, because it interprets the speaker. Agreed, insisted, warned, denied, admitted and proposed all carry different meanings, and in negotiation minutes that choice becomes part of the official record.',
    explanationHtml:
      '<p><strong>Reported speech</strong> is how you tell someone what was said in a meeting or on a call. When the reporting verb is in the past (<em>he said</em>, <em>she explained</em>, <em>they confirmed</em>), the reported verb usually moves one step back:</p><ul><li>present &rarr; past; past &rarr; past perfect</li><li><code>will &rarr; would</code>, <code>can &rarr; could</code>, <code>must &rarr; had to</code></li><li>time words shift: <code>tomorrow &rarr; the following day</code></li></ul><p><strong>Reported questions</strong> keep statement word order and take no question mark: <em>he asked how much we had budgeted</em> (not <em>how much had we budgeted</em>). For yes/no questions use <code>if</code> or <code>whether</code>: <em>she asked whether the terms were final</em>.</p><p><strong>say</strong> vs <strong>tell</strong>: <code>say</code> takes no person object (<em>he said that the deal was closed</em>); <code>tell</code> requires one (<em>he told the client that the deal was closed</em>).</p><p>You do not always have to backshift. If the information is still true, present forms are acceptable and often preferred in minutes: <em>the CFO said that the company operates on thin margins</em>.</p><p>Choose the <strong>reporting verb</strong> carefully, because it interprets the speaker: <code>agreed</code>, <code>insisted</code>, <code>warned</code>, <code>denied</code>, <code>admitted</code>, <code>proposed</code>. In negotiation minutes, that choice becomes part of the official record.</p>',
    keyForms: [
      'said (that) + clause / told + person + (that) + clause',
      'backshift: present -> past, past -> past perfect, will -> would, can -> could',
      'reported questions: asked + question word + subject + verb (no inversion, no question mark)',
      'yes/no questions: asked if / whether + clause',
      'reporting verbs: agreed, insisted, warned, denied, proposed, confirmed',
    ],
    examples: [
      'The CFO said that the company had exceeded its revenue target for the third quarter.',
      'Our partner told us that they would not accept payment in instalments.',
      'The client asked whether the discount applied to the whole order or only to new items.',
      'The risk manager warned that the loan portfolio was too concentrated in one sector.',
      'She asked how long the credit approval process usually took.',
      'The economist explained that inflation remains the main constraint on real wage growth.',
    ],
    commonErrors: [
      {
        wrong: 'He said me that the contract was ready for signature.',
        right: 'He told me that the contract was ready for signature.',
        tag: 'reported_speech',
        why: 'Say does not take a person object, so you must use tell someone or say to someone.',
      },
      {
        wrong: 'She asked what was the deadline for the tender.',
        right: 'She asked what the deadline for the tender was.',
        tag: 'word_order',
        why: 'A reported question keeps normal statement word order, without inversion of subject and verb.',
      },
      {
        wrong: 'They said they will send the invoice next week.',
        right: 'They said they would send the invoice the following week.',
        tag: 'reported_speech',
        why: 'After a past reporting verb, will becomes would and next week becomes the following week.',
      },
      {
        wrong: 'The manager told that the results were disappointing.',
        right: 'The manager said that the results were disappointing.',
        tag: 'reported_speech',
        why: 'Tell requires an object, so with no listener named you must use say.',
      },
    ],
    whyItMatters:
      'Meeting minutes, negotiation summaries and internal handover emails consist almost entirely of reported speech, and an inaccurate report can turn into a commercial dispute. Choosing an honest reporting verb, such as "the supplier admitted" rather than "the supplier explained", is a professional judgement that your colleagues will act on.',
    communicativeTask:
      'Listen to a three-minute business news interview, then write eight sentences of minutes reporting what each speaker said, asked and agreed. Use at least five different reporting verbs and no direct quotations.',
    order: 6,
  },

  /* ---------------------------------------------------------------- */
  /* 7. Comparatives — market comparison                               */
  /* ---------------------------------------------------------------- */
  {
    id: 'gl-comparatives',
    topicId: 'comparatives',
    title: 'Comparatives and superlatives: comparing markets and competitors',
    cefr: 'A2',
    domain: 'marketing',
    context: 'market comparison',
    objective:
      'Compare companies, regions and periods precisely, always naming the benchmark you are comparing against.',
    explanation:
      'Comparatives and superlatives let you compare markets, competitors and periods, which is most of what an economist does with numbers. Short adjectives add -er and -est: cheap, cheaper, the cheapest; big, bigger, the biggest; easy, easier, the easiest. Longer adjectives use more and the most: profitable, more profitable, the most profitable. A few forms are irregular: good, better, the best; bad, worse, the worst; far, further. After a comparative use than, and before a superlative use the. To say that two things are equal, use as plus adjective plus as: our margin is as high as the industry average. The negative is not as high as. To make a difference bigger or smaller, add an adverb: significantly higher, slightly lower, twice as large, 30% cheaper. To describe a trend, English repeats the comparative: the market is becoming more and more competitive. Two habits to avoid. Never combine the two forms, because more cheaper is wrong. And always finish the comparison, since sales are higher immediately invites the question higher than what. In a market report, name the benchmark every time: higher than last year, higher than our nearest competitor, higher than the sector average.',
    explanationHtml:
      '<p><strong>Comparatives and superlatives</strong> let you compare markets, competitors and periods &mdash; most of what an economist does with numbers.</p><ul><li>Short adjectives: <code>cheap &rarr; cheaper &rarr; the cheapest</code>, <code>big &rarr; bigger &rarr; the biggest</code>.</li><li>Longer adjectives: <code>profitable &rarr; more profitable &rarr; the most profitable</code>.</li><li>Irregular: <code>good/better/best</code>, <code>bad/worse/worst</code>, <code>far/further</code>.</li></ul><p>After a comparative use <code>than</code>; before a superlative use <code>the</code>. For equality use <code>as ... as</code>: <em>our margin is as high as the industry average</em>; the negative is <code>not as ... as</code>.</p><p><strong>Making the difference precise:</strong> <code>significantly higher</code>, <code>slightly lower</code>, <code>twice as large</code>, <code>30% cheaper</code>. For a trend, repeat the comparative: <em>the market is becoming more and more competitive</em>.</p><p><strong>Two habits to avoid:</strong></p><ul><li>Never combine both forms &mdash; <em>more cheaper</em> is wrong.</li><li>Always finish the comparison. <em>Sales are higher</em> invites the question <em>higher than what?</em> In a market report, name the benchmark every time.</li></ul>',
    keyForms: [
      'short adjective + -er + than (cheaper than, higher than)',
      'more + long adjective + than (more profitable than)',
      'the + superlative (the largest market, the most competitive segment)',
      'irregular: good/better/the best, bad/worse/the worst, far/further',
      '(not) as + adjective + as; slightly / significantly / twice as ... as',
    ],
    examples: [
      'Consumer lending grew faster in 2024 than in any of the three previous years.',
      'Our unit costs are significantly lower than those of our nearest competitor.',
      'The Fergana Valley is the most densely populated region in the country, which makes it the most attractive market for fast-moving consumer goods.',
      'Government bonds are safer but less profitable than corporate bonds of the same maturity.',
      'Labour productivity in the service sector is not as high as in manufacturing.',
      'Digital advertising is becoming more and more expensive for small retailers.',
    ],
    commonErrors: [
      {
        wrong: 'This segment is more bigger than the corporate one.',
        right: 'This segment is bigger than the corporate one.',
        tag: 'comparatives',
        why: 'Never use more together with an -er form; one comparative marker is enough.',
      },
      {
        wrong: 'Our operating margin is higher that last year.',
        right: 'Our operating margin is higher than last year.',
        tag: 'comparatives',
        why: 'Comparisons are made with than; that is a different word with a different function.',
      },
      {
        wrong: 'It is the more profitable branch in the whole network.',
        right: 'It is the most profitable branch in the whole network.',
        tag: 'comparatives',
        why: 'When you compare more than two items you need the superlative the most, not the comparative.',
      },
      {
        wrong: 'Inflation in Uzbekistan is higher than Kazakhstan.',
        right: 'Inflation in Uzbekistan is higher than in Kazakhstan.',
        tag: 'prepositions',
        why: 'The two sides of a comparison must be parallel, so the preposition in has to be repeated.',
      },
    ],
    whyItMatters:
      'Market analyses, competitor benchmarking slides and any commentary on a chart depend on precise comparison. A vague comparative such as "our costs are lower", with no benchmark, is treated as an unsupported claim in a professional report, and an incorrect superlative can seriously misstate a market position.',
    communicativeTask:
      'Choose two competing companies or two regions and give a 60-second spoken comparison of four indicators. Use at least four comparatives, one superlative and one as ... as structure, and name the benchmark every time.',
    order: 7,
  },

  /* ---------------------------------------------------------------- */
  /* 8. Linking Devices — reports and presentations                    */
  /* ---------------------------------------------------------------- */
  {
    id: 'gl-linking_devices',
    topicId: 'linking_devices',
    title: 'Linking devices: building a coherent report or presentation',
    cefr: 'B2',
    domain: 'academic',
    context: 'reports and presentations',
    objective:
      'Signal addition, contrast, cause and conclusion correctly so that a report reads as an argument rather than a list of facts.',
    explanation:
      'Linking devices are the signposts that tell your reader how one idea relates to the next, and they are what turns a list of facts into an argument. It helps to group them by function. To add: moreover, in addition, furthermore. To contrast: however, nevertheless, on the other hand, whereas. To show cause and result: therefore, consequently, as a result, because of, due to. To sequence: first, then, finally. To give an example or restate: for instance, in other words. To conclude: overall, to sum up. Watch the grammar, because it differs from group to group. However, therefore and moreover are adverbs, so they join two separate sentences and normally follow a full stop or a semicolon, with a comma after them. Although, while, because and whereas are conjunctions and join two clauses inside one sentence. Because of and due to are prepositions, so they must be followed by a noun phrase and not by a clause: write due to the fall in demand, not due to demand fell. Two warnings. Do not begin a sentence in a formal report with and, but or so. And do not overload your text, because a linker in every sentence sounds mechanical and readers stop trusting the connections.',
    explanationHtml:
      '<p><strong>Linking devices</strong> are the signposts that tell your reader how one idea relates to the next. They turn a list of facts into an argument. Group them by function:</p><ul><li><strong>Addition:</strong> <code>moreover</code>, <code>in addition</code>, <code>furthermore</code></li><li><strong>Contrast:</strong> <code>however</code>, <code>nevertheless</code>, <code>on the other hand</code>, <code>whereas</code></li><li><strong>Cause and result:</strong> <code>therefore</code>, <code>consequently</code>, <code>as a result</code>, <code>because of</code>, <code>due to</code></li><li><strong>Sequence and example:</strong> <code>first</code>, <code>then</code>, <code>finally</code>, <code>for instance</code>, <code>in other words</code></li><li><strong>Conclusion:</strong> <code>overall</code>, <code>to sum up</code></li></ul><p><strong>The grammar differs by type:</strong></p><ul><li><code>however</code>, <code>therefore</code>, <code>moreover</code> are <strong>adverbs</strong>: they join two sentences after a full stop or a semicolon, with a comma after them.</li><li><code>although</code>, <code>while</code>, <code>because</code>, <code>whereas</code> are <strong>conjunctions</strong>: they join two clauses inside one sentence.</li><li><code>because of</code>, <code>due to</code>, <code>despite</code> are <strong>prepositions</strong>: they take a noun phrase &mdash; <em>due to the fall in demand</em>, not <em>due to demand fell</em>.</li></ul><p><strong>Two warnings:</strong> do not begin a sentence in a formal report with <code>and</code>, <code>but</code> or <code>so</code>; and do not overload the text, because a linker in every sentence sounds mechanical.</p>',
    keyForms: [
      'adverbs joining sentences: However, / Therefore, / Moreover, / Consequently,',
      'conjunctions inside one sentence: although, whereas, while, because, so that',
      'prepositions + noun phrase: because of, due to, despite, in spite of',
      'sequence and example: first, then, finally, for instance, in other words',
      'summary: overall, to sum up, in conclusion',
    ],
    examples: [
      'Exports rose by 9% in the first half of the year; however, the trade deficit widened.',
      'Due to the depreciation of the som, the cost of imported components increased by 14%.',
      'The campaign reached its awareness target, whereas conversion remained well below plan.',
      'Staff turnover has fallen sharply; consequently, recruitment costs are 20% lower than last year.',
      'Although the loan portfolio grew by a quarter, the share of non-performing loans stayed under 3%.',
      'Overall, the evidence supports the decision to enter the regional market next year.',
    ],
    commonErrors: [
      {
        wrong: 'Due to the demand fell, we reduced production.',
        right: 'Due to the fall in demand, we reduced production.',
        tag: 'linking_devices',
        why: 'Due to is a preposition and must be followed by a noun phrase, never by a clause.',
      },
      {
        wrong: 'However the market grew, our market share fell.',
        right: 'Although the market grew, our market share fell.',
        tag: 'linking_devices',
        why: 'However cannot join two clauses, so a contrast inside one sentence needs the conjunction although.',
      },
      {
        wrong: 'The costs increased, therefore we postponed the project.',
        right: 'The costs increased; therefore, we postponed the project.',
        tag: 'punctuation',
        why: 'Therefore is an adverb rather than a conjunction, so the two clauses need a semicolon or a full stop between them.',
      },
      {
        wrong: 'In the other hand, the risk of the second option is lower.',
        right: 'On the other hand, the risk of the second option is lower.',
        tag: 'prepositions',
        why: 'The fixed phrase is on the other hand, with the preposition on.',
      },
    ],
    whyItMatters:
      'Examiners and managers judge written reports largely on coherence, and linking devices are the visible evidence of it. In a presentation the same signposts, such as "turning to the second driver" or "as a result", are what keeps an audience following your argument when they cannot re-read the slide.',
    communicativeTask:
      'Write a 200-word summary of a chart from a recent economic report. Use at least six different linking devices from three different functional groups, and highlight each one so that your partner can check the logic.',
    order: 8,
  },
]

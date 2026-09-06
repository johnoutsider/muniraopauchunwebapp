/**
 * "Prompt Practice Lab" uchun seed kontent (PLAN 8.15, metodikaning 3-bosqichi).
 * Talaba AI dan ingliz tili mashqlarini so'rashni bosqichma-bosqich o'rganadi:
 * simple (tayyor promptni tanlash) -> guided (shablonni to'ldirish) -> independent (mustaqil yozish).
 */

import type { PromptExerciseDoc } from '@/types'

export type SeedPromptExercise = PromptExerciseDoc & { id: string }

export const SEED_PROMPT_EXERCISES: SeedPromptExercise[] = [
  /* ---------------------------------------------------------------- */
  /* LEVEL 1 — SIMPLE: choose or lightly edit a ready-made prompt       */
  /* ---------------------------------------------------------------- */
  {
    id: 'pe-simple-1',
    level: 'simple',
    task: 'Two prompts below ask an AI for grammar practice. Read both, choose the one that will give you material you can actually use, and write two sentences explaining what makes it better. Then send your chosen prompt to the AI tutor and check whether the answer really contains everything you asked for.',
    badPromptExample: 'Give me English exercises',
    goodPromptExample:
      'Create five B1-B2 grammar exercises about inflation for economics students, using the Present Perfect, with an answer key and a short explanation for each answer.',
    rubric: [
      'Specificity: the prompt names the exact topic and the exact grammar point',
      'Level: a CEFR level or an equivalent difficulty is stated',
      'Quantity: the number of items required is fixed',
      'Format: the required output, including the answer key, is described',
      'Verifiability: you can check whether the AI followed every instruction',
    ],
    hints: [
      'Ask yourself: could two completely different answers both satisfy this prompt?',
      'A usable prompt names the topic, the level and the number of items.',
      'Without an answer key you cannot check your own work.',
    ],
    order: 1,
  },
  {
    id: 'pe-simple-2',
    level: 'simple',
    task: 'You want to build banking vocabulary before a seminar on credit risk. Choose the stronger of the two prompts below, then edit it: replace the level with your own CEFR level and the sub-topic with the one your seminar covers. Send the edited prompt and save the answer in your vocabulary notes.',
    badPromptExample: 'Teach me banking words.',
    goodPromptExample:
      'I am a B1 economics student preparing for a seminar on credit risk. Give me 12 banking collocations connected with lending, each with a definition in simple English, one example sentence in the style of a bank report, and a translation into Uzbek. Present them as a table.',
    rubric: [
      'Context: the prompt says who the learner is and what the material is for',
      'Specificity: a narrow sub-topic is chosen instead of a whole field',
      'Quantity: the number of items is fixed',
      'Level: the CEFR level is stated',
      'Format: a table or list is requested, so the answer can be reused for revision',
    ],
    hints: [
      'Narrow the field: banking is a subject, credit risk vocabulary is a topic.',
      'Always say what you will use the material for.',
      'A table is much easier to revise from than a paragraph.',
    ],
    order: 2,
  },
  {
    id: 'pe-simple-3',
    level: 'simple',
    task: 'Choose the prompt that will produce a reading text you can genuinely work with, then edit it so that the word count and the topic match your own course. In one sentence, explain why the weaker prompt would waste your time.',
    badPromptExample: 'Write a text about the economy.',
    goodPromptExample:
      'Write a 250-word article in B2 English explaining how the depreciation of a national currency affects importers, followed by five comprehension questions and a glossary of eight key terms with short definitions.',
    rubric: [
      'Specificity: a precise economic topic is named rather than a whole field',
      'Quantity: a word count and a number of questions are given',
      'Level: the CEFR level is stated',
      'Format: the structure of the output (text, questions, glossary) is defined',
      'Verifiability: the comprehension questions can be checked against the text itself',
    ],
    hints: [
      'Give a word count, or you may receive three lines or three pages.',
      'Ask for comprehension questions in the same prompt and save yourself a second request.',
      'A glossary turns a reading text into vocabulary practice.',
    ],
    order: 3,
  },
  {
    id: 'pe-simple-4',
    level: 'simple',
    task: 'You have ten minutes before your speaking class and want to rehearse a difficult phone call. Choose the stronger prompt below, add your own industry, and use it to start the role-play. Stop after five exchanges and note down one phrase the AI used that you did not know.',
    badPromptExample: 'Let us practise speaking.',
    goodPromptExample:
      'Act as an impatient client of a logistics company whose shipment is four days late. Speak only in B1-level business English, keep your turns short, stay in role, and after ten exchanges give me feedback on my politeness, my tenses and any collocation errors.',
    rubric: [
      'Context: the role, the situation and the relationship between the speakers are defined',
      'Level: the language level of the AI turns is controlled',
      'Format: turn length and the number of exchanges are specified',
      'Specificity: the prompt says exactly what feedback is required at the end',
      'Verifiability: the feedback criteria are agreed before the role-play starts',
    ],
    hints: [
      'Tell the AI who it is, not only who you are.',
      'Limit the length of the AI turns, or it will speak more than you do.',
      'Always ask for feedback at the end of a role-play.',
    ],
    order: 4,
  },
  {
    id: 'pe-simple-5',
    level: 'simple',
    task: "Take a paragraph you have already written for this course. Choose the better of the two prompts below, paste your paragraph under it, and then compare the AI feedback with your teacher's comments on the same text. Write one sentence about anything the AI missed.",
    badPromptExample: 'Correct my text.',
    goodPromptExample:
      'Here is a 120-word paragraph from my report on youth unemployment. Mark every error, name the error type (tense, article, preposition, collocation, register), explain each correction in one sentence, and do not rewrite the paragraph for me.',
    rubric: [
      'Specificity: the prompt asks for error types, not only for corrections',
      'Format: the structure of the feedback is defined in advance',
      'Academic honesty: the AI is asked to explain, not to rewrite your work',
      'Context: the genre and the length of the text are given',
      'Verifiability: every correction comes with a reason you can check in a grammar reference',
    ],
    hints: [
      '"Correct my text" usually returns a new text, not feedback you can learn from.',
      'Ask for the error type so that you can track your own error profile over time.',
      'Tell the AI explicitly what it must not do.',
    ],
    order: 5,
  },

  /* ---------------------------------------------------------------- */
  /* LEVEL 2 — GUIDED: fill in a template                              */
  /* ---------------------------------------------------------------- */
  {
    id: 'pe-guided-1',
    level: 'guided',
    task: 'Fill in every slot in the template below with a real value from your own course, then send it. No square brackets may remain in the prompt you send.\n\nTemplate: Create [NUMBER] [CEFR LEVEL] exercises on [GRAMMAR TOPIC] for economics students working in [DOMAIN]. Use [ITEM TYPE] items. Give an answer key and a one-sentence explanation for each answer. Format: [FORMAT].',
    badPromptExample: 'Make some exercises on the passive voice.',
    goodPromptExample:
      'Create eight B1 exercises on the passive voice for economics students working in banking. Use gap-fill items. Give an answer key and a one-sentence explanation for each answer. Format: a numbered list with all the answers at the end.',
    rubric: [
      'Specificity: every slot is filled with a concrete, realistic value',
      'Level: the chosen CEFR level matches the learner and the topic',
      'Quantity: the number of items suits one practice session',
      'Format: the output format is defined precisely enough to be reused',
      'Verifiability: an answer key with explanations is required',
    ],
    hints: [
      'Choose a domain you actually study, not business in general.',
      'Eight to twelve items is usually the right size for one session.',
      'Name the item type: gap-fill, transformation or error correction.',
    ],
    order: 6,
  },
  {
    id: 'pe-guided-2',
    level: 'guided',
    task: 'Complete the template below to build a professional vocabulary list, then verify at least three of the collocations in the corpus tool before you learn them.\n\nTemplate: Act as [ROLE] and give me [NUMBER] professional collocations with the word [KEYWORD] as it is used in [DOMAIN]. For each one give a definition in [CEFR LEVEL] English, one example sentence in the style of [GENRE], and a note on whether it is formal or neutral. Finally, list any collocation you are not fully confident about, so that I can check it in a corpus.',
    badPromptExample: 'Words with market.',
    goodPromptExample:
      'Act as a business English lexicographer and give me ten professional collocations with the word market as it is used in marketing. For each one give a definition in B2 English, one example sentence in the style of a market research report, and a note on whether it is formal or neutral. Finally, list any collocation you are not fully confident about, so that I can check it in a corpus.',
    rubric: [
      'Specificity: one keyword and one domain are chosen, not a whole subject area',
      'Quantity: the number of collocations is fixed',
      'Level: the CEFR level of the definitions is stated',
      'Format: every entry has the same parts, so the list is usable for revision',
      'Verifiability: the AI must flag the items you need to confirm in a corpus',
    ],
    hints: [
      'Choose a keyword that appears in your reading, not a random word.',
      'A formality note tells you whether a phrase belongs in a report or in a chat message.',
      'Whatever the AI is unsure about is exactly what you should check in the corpus tool.',
    ],
    order: 7,
  },
  {
    id: 'pe-guided-3',
    level: 'guided',
    task: 'Use the template below to ask for feedback on a text you have already written. Take the three criteria from the course rubric, not from your imagination.\n\nTemplate: I am a [YEAR] economics student at [CEFR LEVEL]. Below is my [GENRE] of about [WORD COUNT] words, written for [PURPOSE]. Assess it against these three criteria: [CRITERION 1], [CRITERION 2], [CRITERION 3]. For each criterion give a score out of 5, two specific strengths and two specific improvements, quoting my own sentences. Do not rewrite my text.',
    badPromptExample: 'Is my essay good?',
    goodPromptExample:
      'I am a third-year economics student at B2. Below is my email to a supplier of about 180 words, written to request a two-month extension of payment terms. Assess it against these three criteria: register, task achievement and grammatical accuracy. For each criterion give a score out of 5, two specific strengths and two specific improvements, quoting my own sentences. Do not rewrite my text.',
    rubric: [
      'Context: the learner, the genre and the purpose of the text are all stated',
      'Specificity: named assessment criteria replace a general judgement',
      'Format: scores, strengths and improvements are structured and supported by quotations',
      'Academic honesty: the AI is explicitly forbidden to rewrite the work',
      'Level: the CEFR level is given, so the feedback is calibrated correctly',
    ],
    hints: [
      'Take the criteria from the course rubric so that the feedback matches your grading.',
      'Asking the AI to quote your own sentences makes vague praise impossible.',
      '"Do not rewrite my text" is the most important line in this prompt.',
    ],
    order: 8,
  },
  {
    id: 'pe-guided-4',
    level: 'guided',
    task: 'Fill in the role-play template below and use it to run a fifteen-minute speaking session. Every slot must contain a decision you have made deliberately, especially the two objectives.\n\nTemplate: Act as [PERSONA] in this situation: [SITUATION IN TWO SENTENCES]. Your objective is [AI OBJECTIVE]; my objective is [MY OBJECTIVE]. Speak at [CEFR LEVEL], keep every turn under [NUMBER] words, and stay in role until I write STOP. Then give me feedback on [FEEDBACK FOCUS 1] and [FEEDBACK FOCUS 2].',
    badPromptExample: 'Pretend you are an investor and talk to me.',
    goodPromptExample:
      'Act as a sceptical angel investor in this situation: I am pitching a bookkeeping app for micro-businesses and I have 400 paying users. Your objective is to find the weakest number in my pitch; my objective is to secure a second meeting. Speak at B2, keep every turn under 40 words, and stay in role until I write STOP. Then give me feedback on my use of investment terminology and on the clarity of my structure.',
    rubric: [
      'Context: both roles, the situation and the two conflicting objectives are defined',
      'Level: the language level and the turn length of the AI are controlled',
      'Format: a clear stop signal and a separate feedback stage are built into the prompt',
      'Specificity: the feedback focus is agreed before the role-play begins',
      'Verifiability: the feedback can be compared directly with the course speaking rubric',
    ],
    hints: [
      'Give the AI an objective that conflicts with yours, or the conversation will be too easy.',
      'Short AI turns leave more speaking time for you.',
      'Decide the feedback focus before you start, not afterwards.',
    ],
    order: 9,
  },
  {
    id: 'pe-guided-5',
    level: 'guided',
    task: 'Complete the template below to generate revision test items, then check the answer key yourself before you use the items with anyone else.\n\nTemplate: Create [NUMBER] multiple-choice questions at [CEFR LEVEL] on [TOPIC IN A PROFESSIONAL CONTEXT] for economics students. Each question must have four options, exactly one correct answer, and three plausible distractors based on typical errors made by [L1] speakers. After the questions, give the key and explain in one sentence why each distractor is wrong.',
    badPromptExample: 'Write a grammar test.',
    goodPromptExample:
      'Create ten multiple-choice questions at B1 on the difference between the Present Perfect and the Past Simple in company performance reports for economics students. Each question must have four options, exactly one correct answer, and three plausible distractors based on typical errors made by Uzbek speakers. After the questions, give the key and explain in one sentence why each distractor is wrong.',
    rubric: [
      'Quantity: the number of questions and the number of options are fixed',
      'Specificity: the topic is narrowed to a professional context, not just a tense name',
      'Level: the CEFR level is stated and matches the learner',
      'Verifiability: the key and the distractor explanations let you audit every item',
      'Format: the item structure is defined precisely enough to be reused next term',
    ],
    hints: [
      'Distractors built on real Uzbek-speaker errors are far more useful than random options.',
      'Always check the key yourself: AI-generated items sometimes have two correct answers.',
      'Ten items is enough for one revision session.',
    ],
    order: 10,
  },

  /* ---------------------------------------------------------------- */
  /* LEVEL 3 — INDEPENDENT: write the whole prompt yourself            */
  /* ---------------------------------------------------------------- */
  {
    id: 'pe-independent-1',
    level: 'independent',
    task: 'Open your error profile on the platform and choose the error tag you produce most often. Without using any template, write a complete prompt that will give you one week of targeted practice on that single error. It must state who you are, your level, your professional domain, the number and type of items, the output format and how you will check the answers. Run it, then improve the prompt once, on the basis of whatever the first answer got wrong.',
    badPromptExample: 'Help me with my grammar mistakes.',
    goodPromptExample:
      'I am a second-year economics student at B1 who repeatedly confuses the Present Perfect and the Past Simple in written company reports. Create a five-day practice plan. For each day give six sentences about company performance in which I must choose the correct tense, plus two transformation items. Add one rule reminder of no more than two lines per day, and put the whole answer key at the very end.',
    rubric: [
      'Specificity: the prompt names one exact error, not a general skill',
      'Context: the learner profile and the professional domain are described',
      'Quantity: the volume of practice per session is fixed',
      'Format: the answer key is separated, so genuine self-testing is possible',
      'Verifiability: every answer can be checked without asking the AI again',
    ],
    hints: [
      'Start from data: use your error profile, not your impression of your weaknesses.',
      'Ask for the key at the end, so that you are not tempted to read it first.',
      'Improve the prompt after the first answer instead of accepting a weak result.',
    ],
    order: 11,
  },
  {
    id: 'pe-independent-2',
    level: 'independent',
    task: 'This exercise is about spotting AI hallucination. Write your own prompt asking for five statistics on the Uzbek economy in the last three years, each with an exact source and year, and with an explicit statement of how confident the model is in each figure. Run it, then verify every number against an official source such as the State Statistics Committee or the Central Bank. Report which figures were correct, which were wrong and which could not be verified at all, and then rewrite your prompt so that the model is forced to admit uncertainty instead of guessing.',
    badPromptExample: 'Tell me the main economic statistics of Uzbekistan.',
    goodPromptExample:
      'List five statistics on Uzbek GDP growth, inflation and unemployment for the period 2022-2024. For each figure give the exact source organisation, the year of publication and the official name of the indicator. If you are not certain that a figure is correct, write UNVERIFIED instead of a number. Do not estimate and do not round silently.',
    rubric: [
      'Verifiability: the prompt demands a checkable source for every single claim',
      'Specificity: the indicators, the years and the country are named exactly',
      'Format: the required output makes unverified items immediately visible',
      'Academic honesty: the model is instructed not to invent data',
      'Context: the purpose of the data is stated, so the right sources are used',
    ],
    hints: [
      'An AI can produce a completely wrong number in perfectly confident language.',
      'Always require the source and the year, then check at least two figures yourself.',
      'Give the model a way to say nothing: UNVERIFIED is far better than an invented figure.',
    ],
    order: 12,
  },
  {
    id: 'pe-independent-3',
    level: 'independent',
    task: 'This exercise is about academic honesty. You must submit a 300-word report on the labour market next week. Without a template, write a prompt that asks the AI to help you learn rather than to write the text for you: it must request feedback, critical questions or a revision checklist, and it must explicitly forbid the AI from producing the report itself. Then write two sentences explaining to your teacher exactly what the AI did and what you did.',
    badPromptExample:
      'Write a 300-word report about the labour market in Uzbekistan for my assignment.',
    goodPromptExample:
      'I have drafted a 300-word report on the Uzbek labour market, which I will paste below. Do not write or rewrite any part of it. Instead, ask me five critical questions that a teacher would ask about my argument and my evidence, and then give me a checklist of eight points to revise against, ordered by importance.',
    rubric: [
      'Academic honesty: the AI is used for feedback and never as the author of the work',
      'Specificity: the type of help required is defined precisely',
      'Format: the output is a set of questions or a checklist the student can act on',
      'Context: the genre, the length and the purpose of the assignment are given',
      'Verifiability: the student can show what changed in the draft and why',
    ],
    hints: [
      'Submitting AI text as your own is plagiarism; using AI to question your draft is studying.',
      'Ask for questions and checklists, never for paragraphs.',
      'Keep the prompt and the answer, so that you can show your working process.',
    ],
    order: 13,
  },
  {
    id: 'pe-independent-4',
    level: 'independent',
    task: 'Choose a real professional situation you will face within the next year: a job interview, a question after a conference presentation, a client call or an internship briefing. Write a complete prompt, with no template and no help, that turns the AI into a demanding practice partner for exactly that situation. It must define the role of the AI, its objective, the difficulty of its questions, the length of its turns and the precise feedback criteria you want. Run the role-play for at least twelve exchanges and save the feedback in your portfolio.',
    badPromptExample: 'Practise a job interview with me.',
    goodPromptExample:
      'Act as the head of the corporate credit team at a commercial bank, interviewing me for a graduate analyst position. Ask eight questions in total: three about my degree, three competency questions using the STAR method, and two technical questions about financial statements. Keep every turn under 40 words, do not help me unless I ask, and at the end score my answers out of 5 for structure, terminology, grammatical accuracy and register, giving one example of each problem you found.',
    rubric: [
      'Context: the role, the organisation and the purpose of the conversation are defined',
      'Specificity: the number and the type of questions are set in advance',
      'Level: the difficulty and the turn length are controlled deliberately',
      'Format: the feedback stage has named criteria and requires concrete examples',
      'Verifiability: the feedback can be stored and compared with a later attempt',
    ],
    hints: [
      'Tell the AI not to help you during the role-play; that is what makes it realistic.',
      'Ask for one example of every problem, or the feedback will stay abstract.',
      'Repeat the same role-play two weeks later and compare the two sets of scores.',
    ],
    order: 14,
  },
  {
    id: 'pe-independent-5',
    level: 'independent',
    task: "Write your own reusable prompt for one recurring task in your professional English study, for example weekly vocabulary revision, feedback on emails, or preparation for seminar discussions. Then swap prompts with a partner, run each other's prompt, and rewrite your own once using what you learned. Submit both versions together with a three-sentence explanation of what you changed and why.",
    badPromptExample: 'Give me a good prompt for studying English.',
    goodPromptExample:
      'Every Friday I revise the twenty finance terms I met during the week, which I will paste below. Act as my revision partner: ask me ten questions that mix definitions, collocations and gap-fill, one question at a time, and wait for my answer before continuing. Correct me briefly after each answer, and at the end list the terms I should study again and explain why. Use B2 English throughout.',
    rubric: [
      'Specificity: the recurring task and how often it happens are both defined',
      'Format: the interaction pattern, one question at a time, is specified',
      'Context: the learner level and the professional domain are stated',
      'Verifiability: the prompt ends with a checkable list of weak items',
      'Academic honesty: the prompt supports revision instead of replacing the work',
    ],
    hints: [
      'A reusable prompt should work every week without being rewritten.',
      'Tell the AI to wait for your answer, otherwise it will ask and answer its own questions.',
      'Test a prompt twice before you add it to your personal prompt library.',
    ],
    order: 15,
  },
]

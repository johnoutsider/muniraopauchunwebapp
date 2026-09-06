/**
 * Har bir AI xizmati uchun vazifa promptlari (PLAN 7.2).
 * Promptlar shu yerda konstant sifatida saqlanadi — servis funksiyalari ichida
 * satr yozilmaydi, shunda promptni versiyalash va tekshirish oson bo'ladi.
 */

import { ERROR_TAGS, ITEM_TYPES } from '@/config/constants'

const ERROR_TAG_LIST = ERROR_TAGS.join(', ')
const ITEM_TYPE_LIST = ITEM_TYPES.join(', ')

/** Barcha strukturaviy chiqishlarga qo'shiladigan umumiy qoida. */
export const STRUCTURED_OUTPUT_RULE = `Fill every field of the requested schema. Never leave a required field empty, never write "N/A" and never repeat the same sentence in two fields.
Allowed errorTags (use only these): ${ERROR_TAG_LIST}.`

/* ------------------------------------------------------------------ */
/* Mashq generatsiya (PLAN 8.2, 7.2)                                    */
/* ------------------------------------------------------------------ */

export const EXERCISE_GENERATION_PROMPT = `TASK: generate exercise items for the item bank of a professional-English-for-economics course.

HARD REQUIREMENTS
- Every item must live in an economic, financial or business context. No general-ESL content.
- "stem" is the text the learner sees. For gap_fill mark the gap with exactly three underscores: ___ . Never put the answer in the stem.
- "instruction" is one short imperative line telling the learner what to do.
- "options" are only for mcq, matching (as the pool) and classification; each option needs a stable id ("a", "b", "c", "d") and text. Exactly one mcq option is correct and the distractors must be plausible errors a learner really makes, not nonsense.
- "answerKey" holds: for mcq the correct option id; for gap_fill / transformation / word_order / expansion every acceptable answer string (include realistic variants such as contractions); for matching the "left::right" pairs; for classification the "item::category" pairs.
- "pairs" is required for matching, "categories" for classification.
- "explanation" always has three distinct parts: why (the rule or lexical fact behind the correct answer), how (how the learner fixes the typical wrong answer, showing the change), whereElse (one or two other professional contexts where the same rule applies).
- "errorTags" name the errors this item targets, taken from the allowed list.
- "tags" are free-form keywords (topic, grammar structure, lexical set).
- Difficulty follows the requested value: 1 ~ A2, 2-3 ~ B1, 4 ~ B2, 5 ~ C1. Vary the surface form, not just the numbers.
- Items must be independent of each other; no item may give away another item's answer.
- Vary the economic sub-topic across the set (revenue, inflation, market share, budgeting, lending, staffing, pricing).

Allowed item types: ${ITEM_TYPE_LIST}.
${STRUCTURED_OUTPUT_RULE}`

/* ------------------------------------------------------------------ */
/* Ochiq javobni baholash (PLAN 6, 8.2)                                 */
/* ------------------------------------------------------------------ */

export const OPEN_GRADING_PROMPT = `TASK: grade one open learner answer that automatic string matching could not resolve (gap-fill, transformation or sentence expansion).

RULES
- Judge meaning and grammar, not spelling of the surrounding words. Accept a genuinely correct alternative that the answer key simply did not list, and say so in "why".
- Accept contractions, British and American spelling, and equivalent word order when the target structure is still demonstrated.
- Reject an answer that avoids the target structure even if it is otherwise correct English; explain that the exercise practises that structure.
- "score" is 0 to 1: 1 fully correct, 0.5 the target structure is right but there is another error, 0 the target structure is wrong or missing.
- "isCorrect" is true only when score is at least 0.75.
- "errorTags" list what actually went wrong (empty array when correct).
- "why", "how", "whereElse" follow the feedback rule and must be written for the learner, at their CEFR level. When the answer is correct, "why" says what makes it right and "whereElse" extends the pattern.
- "modelAnswer" is the best short correct answer.
${STRUCTURED_OUTPUT_RULE}`

/* ------------------------------------------------------------------ */
/* Writing feedback (PLAN 8.5)                                          */
/* ------------------------------------------------------------------ */

export const WRITING_REVIEW_PROMPT = `TASK: give formative feedback on a learner's draft in a professional economics genre.

ABSOLUTE RULE — DO NOT REWRITE THE TEXT. You never return a corrected full version, a "improved text", or more than a single-sentence model. The learner revises the text themselves; your "summary" tells them how.

HOW TO WORK
1. Read the draft against the task prompt and the rubric.
2. Select at most eight errors, ranked by how much they damage professional communication. Prefer recurring patterns over one-off slips. Ignore trivial typos unless they change meaning or are repeated.
3. For each error record: "span" — the exact substring copied verbatim from the learner's text so the interface can highlight it (copy it character for character, do not paraphrase, do not add quotation marks); "type" — one allowed error tag; "why" — the rule or lexical fact; "fix" — the corrected span only (not the whole sentence); "whereElse" — one further professional context where the same rule applies.
4. Score every rubric criterion 0-5 using the descriptors given.
5. "strengths": two or three specific things the learner did well, referring to their actual text.
6. "areasToImprove": two or three priorities, phrased as actions.
7. "summary": four to six sentences addressed to the learner, telling them what to change in the next draft and in which order. It must be a revision plan, not a rewritten text.
${STRUCTURED_OUTPUT_RULE}`

/* ------------------------------------------------------------------ */
/* Speaking / talaffuz feedback (PLAN 8.3)                              */
/* ------------------------------------------------------------------ */

export const SPEAKING_ANALYSIS_PROMPT = `TASK: turn raw Azure Pronunciation Assessment output into pedagogical pronunciation coaching.

YOU RECEIVE machine scores (accuracy, fluency, completeness, prosody, per-word and per-phoneme scores). These are numbers, not teaching. Your job is to explain what they mean and what to do next.

RULES
- Never simply restate the scores. Name the pattern behind them ("the low scores are all on words with /θ/, not on the vowels").
- "wordStress": which words carried wrong stress, and where the stress belongs — write it as ECOnomy, ecoNOMic. If stress was fine, say what the learner is already doing right.
- "sentenceStress": which content words should have been prominent for the message to land, based on the reference text.
- "intonation": rise and fall for the sentence type in this professional situation (statement of results, checking question, listing figures).
- "fluency": pace, pausing and hesitation, judged against the fluency score and the transcript; give a concrete target (pause at commas, not mid-phrase).
- "problematicSounds": group low-scoring phonemes into at most four sounds; for each give the sound in IPA, the words from THIS recording where it failed, and one concrete drill or minimal pair using economic vocabulary (thin/tin, vest/west, cost/cast).
- "strengths": at least two, specific, based on the actual scores.
- "issues": at most three, ranked by impact on intelligibility.
- "nextSteps": two or three concrete actions for the next recording attempt.
- "overallComment": three to four encouraging sentences at the learner's CEFR level, naming the single most important thing to change.
- If the transcript differs from the reference text, treat missing words as omissions and say so.
${STRUCTURED_OUTPUT_RULE}`

/* ------------------------------------------------------------------ */
/* Lug'at kartasi va semantik tarmoq (PLAN 8.1)                         */
/* ------------------------------------------------------------------ */

export const VOCAB_CARD_PROMPT = `TASK: build a six-step vocabulary card for one professional term, exactly following the methodology sequence: word -> meaning -> collocation -> context -> professional situation -> communicative use.

RULES
- "ipa": British English (RP) transcription in IPA with the primary stress mark, e.g. /ɪnˈfleɪʃn/.
- "definitions": one to three senses, each with a plain-English definition at or just below the learner's CEFR level, an optional Uzbek gloss, and the domain the sense belongs to. Order by frequency in economic texts.
- "collocations": four to eight combinations that a real economist, banker or manager actually uses; note the pattern (verb + noun, adjective + noun). If a plausible-looking combination is NOT used in English, include it in "notUsed" with the correct alternative.
- "synonyms" / "antonyms": professional near-equivalents only; note any difference in register or precision.
- "wordFamily": the derived forms with their part of speech and stress shift where it happens.
- "examples": two or three sentences that could appear in a report, an article or a meeting; economic content, not classroom filler.
- "professionalContext": three to five sentences describing a concrete workplace situation where this word is needed and who says it to whom.
- "communicativeTask": one short production task asking the learner to write or say ONE sentence using the word in their own professional situation.
${STRUCTURED_OUTPUT_RULE}`

export const SEMANTIC_NETWORK_PROMPT = `TASK: build a semantic network graph around a seed economic term (PLAN 8.1).

EXAMPLE OF THE INTENDED SHAPE: inflation -> prices -> purchasing power -> consumer spending -> monetary policy -> interest rate.

RULES
- The seed word is node id "seed" is NOT used: give the seed the id derived from the word itself, and include it in "nodes".
- Node ids are lowercase snake_case of the label; labels are the real English terms.
- "group" clusters nodes into a small number of conceptual families (causes, effects, measures, actors, instruments).
- "definition" is one short clause at the learner's level.
- Edges must state a real semantic relation in "relation": causes, is_caused_by, measures, is_measured_by, part_of, opposite_of, leads_to, regulated_by, collocates_with, hypernym_of, hyponym_of.
- The graph must be connected: every node reachable from the seed. Avoid duplicate edges and self-loops.
- All terms must be genuine economic or business vocabulary used in professional texts.
${STRUCTURED_OUTPUT_RULE}`

/* ------------------------------------------------------------------ */
/* Xatolar tahlili va feedback hisoboti (PLAN 5 — 8-bosqich)            */
/* ------------------------------------------------------------------ */

export const ERROR_ANALYSIS_PROMPT = `TASK: analyse a learner's accumulated error profile and turn counts into a diagnosis.

RULES
- "summary" is written in UZBEK (Latin script), three to five sentences, addressed to the learner: what the pattern in their errors actually is, in plain language. English terms and example forms stay in English inside the Uzbek text.
- "patterns": three to five entries, each on one error tag from the allowed list, with "cause" (the likely underlying reason — L1 interference from Uzbek or Russian, an overgeneralised rule, a gap in professional lexis) and "recommendation" (one concrete practice action naming a topic or exercise type). "cause" and "recommendation" are also in Uzbek.
- Rank patterns by frequency multiplied by how much they block professional communication, not by raw count alone.
- "priorityTopics": two to four topic ids or names the learning path should schedule next.
- Do not invent errors that are not supported by the counts or examples you were given.
${STRUCTURED_OUTPUT_RULE}`

export const FEEDBACK_REPORT_PROMPT = `TASK: write the stage-8 "AI Feedback Report" for one learner (PLAN section 5, stage 8).

RULES
- Base every statement on the data you are given. If a skill has no data, say so instead of guessing.
- "strengths": two to four items, each naming a skill and the evidence for it.
- "areasToImprove": two to four items, each an action the learner can take this week, not a label.
- "skillNotes": one short note per skill that has data, referencing the score, the trend and the most common error in that skill.
- "nextSteps": three concrete, ordered steps for the coming two weeks.
- "encouragement": two or three sentences in Uzbek, honest and specific — no empty praise.
- Write the report in English except where a field is specified as Uzbek; keep it at the learner's CEFR level.
${STRUCTURED_OUTPUT_RULE}`

export const PROGRESS_NARRATIVE_PROMPT = `TASK: write a short note for the TEACHER about one learner's progress (PLAN section 6, progress prediction).

RULES
- Three to four sentences, in Uzbek, factual and neutral.
- Name the trend per skill where it is clear, the activity level, and the single risk that most needs the teacher's attention.
- Example of the intended register: "3 hafta faol emas, grammar ko'rsatkichi pasaymoqda."
- Do not address the learner and do not give the learner advice; this text is for the teacher.
- Do not speculate beyond the data.`

/* ------------------------------------------------------------------ */
/* Prompt Lab (PLAN 8.15)                                               */
/* ------------------------------------------------------------------ */

export const PROMPT_EVAL_PROMPT = `TASK: evaluate a prompt written by a learner in the Prompt Practice Lab, and teach them to write a better one.

SCAFFOLDING LEVELS
- simple: the learner chose a ready-made prompt. Judge whether the choice fits the task and explain what makes it fit.
- guided: the learner filled in a template. Judge how well the slots were filled.
- independent: the learner wrote the prompt from scratch. Judge it in full.

RULES
- Score each of specificity, context, level, format and honesty from 0 to 5 with the rubric supplied.
- "totalScore" is the sum (0-25). Compute it correctly.
- "feedback" is written in UZBEK, three to five sentences: what works, what is missing, and why it matters for the answer they would get. Name at least one thing they did well.
- "improvedPrompt" is the learner's own prompt rewritten in ENGLISH so that it would score 5 on every criterion — same intent, same task, better formulation. It must remain something the learner would honestly ask (guidance, not ghost-writing); if their prompt asked for a finished assignment, the improved version must ask for scaffolding instead, and "feedback" must explain that change.
- "nextLevel": recommend "simple" if totalScore < 10, "guided" if 10-17, "independent" if 18 or more; never recommend a level below the one the learner is already on unless the score is under 8.
${STRUCTURED_OUTPUT_RULE}`

/* ------------------------------------------------------------------ */
/* Corpus verification (PLAN 8.16)                                      */
/* ------------------------------------------------------------------ */

export const CORPUS_VERIFY_PROMPT = `TASK: judge whether an English phrase is a real professional collocation, using the corpus statistics supplied by the caller.

RULES
- The corpus counts are evidence, not the whole truth: the mini-corpus is only 1-2 million words, so a genuine but low-frequency phrase can be "rare" rather than "not_attested". Say when you are relying on your own knowledge of English rather than on the counts.
- "verdict": "attested" (the phrase is normal professional English and the corpus supports it), "rare" (grammatical and possible but unusual, or a low count with a much more common alternative), "not_attested" (English speakers do not say this).
- "explanation": three to five sentences for the learner. State the verdict, the corpus evidence, and the reason behind it — for example that "profit" takes the delexical verb "make", not "do", and that "do" goes with activities (do business, do research) while "make" goes with created results (make a profit, make a payment, make a decision).
- "betterAlternatives": for "rare" and "not_attested" give two to four natural alternatives with a short note on when each is used; for "attested" give the closest near-synonyms so the learner can vary their writing.
- "exampleSentences": two or three sentences in an economic or business context using the recommended form. If the corpus supplied real example sentences, prefer and lightly adapt those.
${STRUCTURED_OUTPUT_RULE}`

/* ------------------------------------------------------------------ */
/* Learning path izohlari (PLAN 6.7)                                    */
/* ------------------------------------------------------------------ */

export const PATH_REASONS_PROMPT = `TASK: write the reason line for each step of a learner's individual learning path.

IMPORTANT: the rules engine has already chosen the steps and their order. You do NOT change, add, remove or reorder steps. You only write the "reason" text for each step you are given, keeping the same ids and the same order.

RULES
- Each reason is ONE sentence in UZBEK (Latin script), maximum 18 words, addressed to the learner.
- It must connect the step to the learner's own profile: the diagnostic score, the weak skill or the recurring error — for example "Artikllar bo'yicha 12 ta xato — shu dars ularni iqtisodiy matnlarda mustahkamlaydi."
- English grammar-topic names and terms stay in English inside the Uzbek sentence.
- No generic filler ("bu foydali dars"). If the profile gives no clear reason for a step, say what the step builds towards instead.
- Return exactly one reason per given step, matched by step id.`

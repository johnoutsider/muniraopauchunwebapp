/**
 * Lug'at kartasi (6 bosqichli ketma-ketlik) va semantik tarmoq (PLAN 8.1).
 * `LexiconDoc` va `SemanticNetworkDoc` tiplariga mos.
 */

import { z } from 'zod'

import { CefrSchema, DomainSchema, Text } from './common'

export const VocabDefinitionSchema = z.object({
  text: Text(500).describe("Plain-English definition at or just below the learner's CEFR level"),
  textUz: Text(300).optional().describe('Short Uzbek gloss'),
  domain: DomainSchema.optional(),
})

export const VocabCollocationSchema = z.object({
  text: Text(120).describe('e.g. "make a profit"'),
  pattern: Text(80).optional().describe('e.g. "verb + noun"'),
  note: Text(300).optional().describe('When it is used'),
})

export const VocabExampleSchema = z.object({
  sentence: Text(500).describe('A sentence that could appear in a report, article or meeting'),
  translationUz: Text(500).optional(),
})

export const WordFamilyEntrySchema = z.object({
  form: Text(60),
  pos: Text(30).describe('noun, verb, adjective, adverb'),
  ipa: Text(80).optional().describe('Transcription, marking any stress shift'),
})

export const VocabCardSchema = z.object({
  word: Text(80),
  lemma: Text(80).optional(),
  pos: Text(30),
  ipa: Text(80).describe('British English IPA with the primary stress mark, e.g. /ɪnˈfleɪʃn/'),
  cefr: CefrSchema,
  domains: z.array(DomainSchema).min(1).max(4),
  definitions: z.array(VocabDefinitionSchema).min(1).max(3),
  collocations: z.array(VocabCollocationSchema).min(2).max(8),
  notUsed: z
    .array(z.object({ wrong: Text(120), instead: Text(120) }))
    .max(4)
    .default([])
    .describe('Plausible-looking combinations that English does NOT use'),
  synonyms: z.array(Text(80)).max(6).default([]),
  antonyms: z.array(Text(80)).max(6).default([]),
  wordFamily: z.array(WordFamilyEntrySchema).max(8).default([]),
  examples: z.array(VocabExampleSchema).min(2).max(3),
  professionalContext: Text(1200).describe(
    'A concrete workplace situation and who says it to whom'
  ),
  communicativeTask: Text(500).describe('One short production task for the learner'),
})
export type VocabCard = z.infer<typeof VocabCardSchema>

/* ------------------------------------------------------------------ */
/* Semantik tarmoq                                                      */
/* ------------------------------------------------------------------ */

export const SEMANTIC_RELATIONS = [
  'causes',
  'is_caused_by',
  'measures',
  'is_measured_by',
  'part_of',
  'opposite_of',
  'leads_to',
  'regulated_by',
  'collocates_with',
  'hypernym_of',
  'hyponym_of',
] as const
export type SemanticRelation = (typeof SEMANTIC_RELATIONS)[number]

export const SemanticNodeSchema = z.object({
  id: Text(60).describe('lowercase snake_case of the label'),
  label: Text(80),
  group: Text(40).describe('Conceptual family: causes, effects, measures, actors, instruments'),
  definition: Text(300).describe("One short clause at the learner's level"),
})

export const SemanticEdgeSchema = z.object({
  source: Text(60),
  target: Text(60),
  relation: z.enum(SEMANTIC_RELATIONS),
})

export const SemanticNetworkSchema = z.object({
  nodes: z.array(SemanticNodeSchema).min(3).max(24),
  edges: z.array(SemanticEdgeSchema).min(2).max(48),
})
export type SemanticNetwork = z.infer<typeof SemanticNetworkSchema>

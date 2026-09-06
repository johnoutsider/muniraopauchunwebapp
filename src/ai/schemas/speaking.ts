/**
 * Talaffuz / speaking feedback sxemasi (PLAN 8.3).
 * `SpeakingAiFeedback` tipiga mos — Azure xom ballari pedagogik maslahatga aylanadi.
 */

import { z } from 'zod'

import { Text } from './common'

export const ProblematicSoundSchema = z.object({
  sound: Text(20).describe('The sound in IPA, e.g. /θ/'),
  words: z.array(Text(60)).min(1).max(8).describe('Words from THIS recording where it failed'),
  tip: Text(600).describe('One concrete drill or minimal pair using economic vocabulary'),
})
export type AiProblematicSound = z.infer<typeof ProblematicSoundSchema>

export const SpeakingFeedbackSchema = z.object({
  strengths: z.array(Text(400)).min(1).max(4),
  issues: z.array(Text(400)).max(3).default([]),
  wordStress: Text(800).describe('Which words carried wrong stress and where it belongs'),
  sentenceStress: Text(800).describe('Which content words should have been prominent'),
  intonation: Text(800).describe('Rise and fall for this sentence type in this situation'),
  fluency: Text(800).describe('Pace, pausing and hesitation, with a concrete target'),
  problematicSounds: z.array(ProblematicSoundSchema).max(4).default([]),
  nextSteps: z.array(Text(400)).min(1).max(3),
  overallComment: Text(1200),
})
export type SpeakingFeedback = z.infer<typeof SpeakingFeedbackSchema>

import { sectionStepCount } from './runner-content'
import type { RunnerTest } from './types'

/**
 * Testning taxminiy davomiyligi (daqiqa) — kirish ekranida ko'rsatiladi.
 *
 * Hisob mantiqi:
 *   • vaqt cheklovi belgilangan bo'lim → aynan shu cheklov;
 *   • qolgan bo'limlar → yopiq topshiriq ≈ 1 daqiqa,
 *     ochiq topshiriq (yozish/gapirish) ≈ 8 daqiqa.
 * Natija 5 daqiqagacha yaxlitlanadi — "taxminiy" ekani ko'rinib tursin.
 */
const MIN_PER_ITEM = 1
const MIN_PER_OPEN_TASK = 8

export function estimatedMinutes(test: RunnerTest): number {
  const total = test.sections.reduce((sum, section) => {
    if (section.timeLimitMin) return sum + section.timeLimitMin
    const items = sectionStepCount(section) - (section.openTask ? 1 : 0)
    return sum + items * MIN_PER_ITEM + (section.openTask ? MIN_PER_OPEN_TASK : 0)
  }, 0)
  return Math.max(5, Math.round(total / 5) * 5)
}

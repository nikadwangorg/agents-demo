import { KeyResult } from '@prisma/client';

export class ProgressService {
  /**
   * Calculate progress percentage for a single key result
   * Capped at 100%
   */
  calculateKeyResultProgress(kr: KeyResult): number {
    if (kr.targetValue <= 0) return 0;
    const progress = (kr.currentValue / kr.targetValue) * 100;
    return Math.min(progress, 100);
  }

  /**
   * Calculate average progress across all key results
   * Returns 0 if there are no key results
   */
  calculateObjectiveProgress(keyResults: KeyResult[]): number {
    if (keyResults.length === 0) return 0;

    const totalProgress = keyResults.reduce((sum, kr) => {
      return sum + this.calculateKeyResultProgress(kr);
    }, 0);

    return totalProgress / keyResults.length;
  }
}

export const progressService = new ProgressService();

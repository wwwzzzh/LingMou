/**
 * 画面变化检测器
 *
 * 通过比较相邻两帧的 RGB 像素差异率来判断画面是否有显著变化。
 * 核心逻辑与 DOM 解耦，可独立单元测试。
 */

/** 默认变化阈值（15%） */
export const DEFAULT_MOTION_THRESHOLD = 0.15

/** 采样步长：每 N 个像素采样一次，兼顾性能与精度 */
const SAMPLE_STEP = 4

/**
 * 计算两帧之间的像素变化率
 *
 * @param currPixels - 当前帧像素数据 (Uint8ClampedArray)
 * @param prevPixels - 上一帧像素数据 (Uint8ClampedArray)
 * @returns 变化率 (0~1)
 */
export function calculateChangeRate(
  currPixels: Uint8ClampedArray,
  prevPixels: Uint8ClampedArray,
): number {
  if (currPixels.length !== prevPixels.length) {
    return 1 // 分辨率不同，视为完全变化
  }

  let changedPixels = 0
  let totalSamples = 0

  // 步进采样，跳过 Alpha 通道
  for (let i = 0; i < currPixels.length; i += SAMPLE_STEP * 4) {
    const rDiff = Math.abs(currPixels[i] - prevPixels[i])
    const gDiff = Math.abs(currPixels[i + 1] - prevPixels[i + 1])
    const bDiff = Math.abs(currPixels[i + 2] - prevPixels[i + 2])

    // RGB 任一通道差异超过阈值则视为变化像素
    if (rDiff > 30 || gDiff > 30 || bDiff > 30) {
      changedPixels++
    }
    totalSamples++
  }

  if (totalSamples === 0) return 0
  return changedPixels / totalSamples
}

/**
 * 判断画面是否有显著变化
 *
 * @param currPixels - 当前帧像素数据
 * @param prevPixels - 上一帧像素数据
 * @param threshold - 变化阈值（默认 0.15）
 * @returns 是否超过阈值
 */
export function hasSignificantChange(
  currPixels: Uint8ClampedArray,
  prevPixels: Uint8ClampedArray,
  threshold: number = DEFAULT_MOTION_THRESHOLD,
): boolean {
  return calculateChangeRate(currPixels, prevPixels) > threshold
}

/**
 * 画面变化检测器（状态ful 版本）
 * 维护上一帧状态，提供简化的检测接口
 */
export class MotionDetector {
  private previousPixels: Uint8ClampedArray | null = null
  private threshold: number

  constructor(threshold: number = DEFAULT_MOTION_THRESHOLD) {
    this.threshold = threshold
  }

  /**
   * 检测当前帧相对于上一帧是否有显著变化
   * 同时更新内部状态为当前帧
   */
  detect(currPixels: Uint8ClampedArray): boolean {
    if (!this.previousPixels) {
      this.previousPixels = currPixels
      return true // 首帧总是上传
    }

    const changed = hasSignificantChange(currPixels, this.previousPixels, this.threshold)

    // 仅在有显著变化时才更新参考帧，避免静止画面漂移
    if (changed) {
      this.previousPixels = currPixels
    }

    return changed
  }

  /** 重置检测器状态 */
  reset(): void {
    this.previousPixels = null
  }
}

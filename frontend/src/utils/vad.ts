/**
 * 端侧语音活动检测 (Voice Activity Detection)
 *
 * 基于 Web Audio API AnalyserNode，实时分析音频信号的 RMS 能量。
 * 当音量持续低于阈值超过指定时间，判定为"静音"，触发自动停止录音。
 *
 * 纯算法设计，与 UI 框架解耦，可独立单元测试。
 */

/** VAD 配置参数 */
export const VAD_CONFIG = {
  /** 音量阈值 (RMS 归一化值, 0~1)，低于此值视为静音 */
  VOLUME_THRESHOLD: 0.05,
  /** 持续静音时间 (ms)，超过后触发静音事件 */
  SILENCE_TIMEOUT: 3000,
  /** FFT 采样大小 (2^n)，影响分析精度 */
  FFT_SIZE: 256,
  /** 分析循环间隔 (ms) */
  ANALYZE_INTERVAL: 100,
} as const

/** VAD 状态 */
export type VadState = 'inactive' | 'listening' | 'speaking' | 'silent'

/** VAD 事件回调 */
export interface VadCallbacks {
  /** 用户开始说话 */
  onSpeaking?: () => void
  /** 进入静音 */
  onSilence?: () => void
  /** 持续静音超过阈值 → 建议停止录音 */
  onSilenceTimeout?: () => void
  /** 音量级别变化 */
  onVolumeChange?: (volume: number) => void
  /** 状态变更 */
  onStateChange?: (state: VadState) => void
}

/**
 * 计算 RMS (Root Mean Square) 音量
 *
 * @param frequencyData - AnalyserNode 频域数据 (Uint8Array)
 * @returns 归一化音量值 (0~1)
 */
export function calculateRMSVolume(frequencyData: Uint8Array): number {
  if (frequencyData.length === 0) return 0

  let sumSquares = 0
  for (let i = 0; i < frequencyData.length; i++) {
    const normalized = (frequencyData[i] - 128) / 128
    sumSquares += normalized * normalized
  }
  return Math.sqrt(sumSquares / frequencyData.length)
}

/**
 * 判断当前音量是否超过语音阈值
 */
export function isVoiceActive(
  volume: number,
  threshold: number = VAD_CONFIG.VOLUME_THRESHOLD,
): boolean {
  return volume > threshold
}

/**
 * 语音活动检测器
 *
 * 维护检测状态，追踪连续静音时间。
 * 与 AudioContext/AnalyserNode 生命周期解耦。
 */
export class VoiceActivityDetector {
  private state: VadState = 'inactive'
  private silenceStartTime: number | null = null
  private volumeThreshold: number
  private silenceTimeout: number
  private callbacks: VadCallbacks

  constructor(
    callbacks: VadCallbacks = {},
    threshold: number = VAD_CONFIG.VOLUME_THRESHOLD,
    silenceTimeout: number = VAD_CONFIG.SILENCE_TIMEOUT,
  ) {
    this.callbacks = callbacks
    this.volumeThreshold = threshold
    this.silenceTimeout = silenceTimeout
  }

  /**
   * 输入当前音量值，更新检测状态
   *
   * @param volume - 当前 RMS 音量 (0~1)
   * @param now - 当前时间戳 (ms)
   */
  analyze(volume: number, now: number = Date.now()): VadState {
    const wasSpeaking = this.state === 'speaking'
    const isActive = isVoiceActive(volume, this.volumeThreshold)

    // 通知音量变化
    this.callbacks.onVolumeChange?.(volume)

    if (isActive) {
      this.silenceStartTime = null

      if (this.state !== 'speaking') {
        this.setState('speaking')
        this.callbacks.onSpeaking?.()
      }
    } else {
      // 当前静音
      if (!wasSpeaking && this.state === 'inactive') {
        // 尚未开始监听，忽略
        return this.state
      }

      if (this.silenceStartTime === null) {
        this.silenceStartTime = now
        this.setState('silent')
        this.callbacks.onSilence?.()
      }

      const silenceDuration = now - this.silenceStartTime

      // 检查是否超过静音超时
      if (silenceDuration >= this.silenceTimeout && this.state !== 'inactive') {
        this.setState('inactive')
        this.callbacks.onSilenceTimeout?.()
      }
    }

    return this.state
  }

  /**
   * 启动检测（开始监听后调用）
   */
  start(): void {
    this.setState('listening')
    this.silenceStartTime = null
  }

  /**
   * 停止检测
   */
  stop(): void {
    this.setState('inactive')
    this.silenceStartTime = null
  }

  /** 获取当前连续静音时长 (ms) */
  get silenceDuration(): number {
    if (this.silenceStartTime === null) return 0
    return Date.now() - this.silenceStartTime
  }

  /** 获取当前状态 */
  get currentState(): VadState {
    return this.state
  }

  private setState(newState: VadState): void {
    if (this.state !== newState) {
      this.state = newState
      this.callbacks.onStateChange?.(newState)
    }
  }
}

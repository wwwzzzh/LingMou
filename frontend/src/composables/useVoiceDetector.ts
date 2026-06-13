import { ref, onBeforeUnmount, type Ref } from 'vue'
import {
  VoiceActivityDetector,
  VAD_CONFIG,
  calculateRMSVolume,
  type VadState,
} from '@/utils/vad'

/**
 * 语音检测 Composable
 *
 * 对接 Web Audio API，实时分析麦克风音频流：
 * - 实时音量显示
 * - 说话/静音状态检测
 * - 持续静音 3 秒自动停止录音
 *
 * @param streamRef - 媒体流引用
 */
export function useVoiceDetector(streamRef: Ref<MediaStream | null>) {
  /** 当前音量 (0~1) */
  const volume = ref(0)

  /** VAD 状态 */
  const vadState = ref<VadState>('inactive')

  /** 连续静音时长 (ms) */
  const silenceDuration = ref(0)

  /** 音量阈值（可配置） */
  const volumeThreshold = ref(VAD_CONFIG.VOLUME_THRESHOLD)

  /** 静音超时 (ms)（可配置） */
  const silenceTimeout = ref(VAD_CONFIG.SILENCE_TIMEOUT)

  /** 是否检测到静音超时（触发自动停止） */
  const isSilenceTimedOut = ref(false)

  /** 是否正在监听 */
  const isListening = ref(false)

  let audioContext: AudioContext | null = null
  let analyser: AnalyserNode | null = null
  let source: MediaStreamAudioSourceNode | null = null
  let animationId: number | null = null
  let detector: VoiceActivityDetector | null = null

  /**
   * 初始化 AudioContext 并开始监听
   */
  function start(): void {
    const stream = streamRef.value
    if (!stream) return

    // 获取音频轨道
    const audioTrack = stream.getAudioTracks()[0]
    if (!audioTrack) {
      console.warn('[VAD] 无音频轨道，无法启动语音检测')
      return
    }

    try {
      // 初始化 AudioContext
      audioContext = new AudioContext()
      analyser = audioContext.createAnalyser()
      analyser.fftSize = VAD_CONFIG.FFT_SIZE

      source = audioContext.createMediaStreamSource(stream)
      source.connect(analyser)

      // 初始化检测器
      detector = new VoiceActivityDetector(
        {
          onSpeaking() {
            vadState.value = 'speaking'
            silenceDuration.value = 0
            isSilenceTimedOut.value = false
          },
          onSilence() {
            vadState.value = 'silent'
          },
          onSilenceTimeout() {
            vadState.value = 'inactive'
            isSilenceTimedOut.value = true
            stop()
          },
          onVolumeChange(vol) {
            volume.value = vol
          },
          onStateChange(state) {
            vadState.value = state
          },
        },
        volumeThreshold.value,
        silenceTimeout.value,
      )

      detector.start()
      isListening.value = true
      isSilenceTimedOut.value = false

      // 开始分析循环
      analyzeLoop()
    } catch (err) {
      console.error('[VAD] AudioContext 初始化失败:', err)
    }
  }

  /**
   * 分析循环
   * 使用 requestAnimationFrame 持续读取频域数据
   */
  function analyzeLoop(): void {
    if (!analyser || !detector) return

    const dataArray = new Uint8Array(analyser.frequencyBinCount)

    const tick = (): void => {
      if (!analyser || !detector) return

      analyser.getByteFrequencyData(dataArray)
      const rms = calculateRMSVolume(dataArray)
      detector.analyze(rms)
      silenceDuration.value = detector.silenceDuration

      if (isListening.value) {
        animationId = requestAnimationFrame(tick)
      }
    }

    animationId = requestAnimationFrame(tick)
  }

  /**
   * 停止监听并释放资源
   */
  function stop(): void {
    isListening.value = false

    if (animationId) {
      cancelAnimationFrame(animationId)
      animationId = null
    }

    detector?.stop()
    detector = null

    source?.disconnect()
    source = null

    analyser = null

    if (audioContext && audioContext.state !== 'closed') {
      audioContext.close().catch(console.error)
      audioContext = null
    }

    volume.value = 0
    silenceDuration.value = 0
    vadState.value = 'inactive'
  }

  // 组件卸载时清理
  onBeforeUnmount(() => {
    stop()
  })

  return {
    volume,
    vadState,
    silenceDuration,
    volumeThreshold,
    silenceTimeout,
    isSilenceTimedOut,
    isListening,
    start,
    stop,
  }
}

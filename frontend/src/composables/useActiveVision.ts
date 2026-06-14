import { ref, type Ref } from 'vue'
import visionApi from '@/api/modules/vision'

const REPORT_INTERVAL = 10000 // 每 10 秒报告一次
const MAX_RETRIES = 2

export function useActiveVision(
  videoRef: Ref<HTMLVideoElement | null>,
  cameraEnabled: Ref<boolean>,
) {
  const isWatching = ref(false)
  const watchContext = ref('')
  const lastObservation = ref('')

  let intervalId: ReturnType<typeof setInterval> | null = null
  let onChangeCallback: ((text: string) => void) | null = null
  let pending = false

  function captureFrame(): string {
    const video = videoRef.value
    if (!video || video.videoWidth === 0) return ''
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 640 / Math.max(video.videoWidth, 1))
    canvas.width = video.videoWidth * scale
    canvas.height = video.videoHeight * scale
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
    return canvas.toDataURL('image/jpeg', 0.7)
  }

  async function analyzeChange(frameBase64: string, context: string, lastObs: string): Promise<string> {
    const repeatHint = lastObs
      ? `（上次观察："${lastObs}"，如果没新变化就不要重复）`
      : ''

    const prompt = context
      ? `监控画面。用户关注："${context}"。${repeatHint}\n描述当前画面中用户关注的对象状态，一句话（20字内）。`
      : `监控画面。${repeatHint}\n描述当前画面，一句话（20字内），直接说看到什么。`

    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const res = await visionApi.analyze(frameBase64, prompt)
        if (res.code === 200 && res.data?.reply) {
          return res.data.reply
        }
      } catch { /* retry */ }
      if (attempt < MAX_RETRIES) {
        await new Promise(r => setTimeout(r, 2000))
      }
    }
    return ''
  }

  async function reportLoop(): Promise<void> {
    if (!isWatching.value || !cameraEnabled.value || pending) return

    pending = true
    try {
      const frame = captureFrame()
      if (frame) {
        const result = await analyzeChange(frame, watchContext.value, lastObservation.value)
        if (result && result !== '无明显变化' && !result.includes('无明显变化')) {
          lastObservation.value = result
          onChangeCallback?.(result)
        }
      }
    } finally {
      pending = false
    }
  }

  function startWatching(context: string, onObservation: (text: string) => void): void {
    if (isWatching.value) {
      watchContext.value = context
      onChangeCallback = onObservation
      return
    }
    watchContext.value = context
    onChangeCallback = onObservation
    isWatching.value = true
    lastObservation.value = ''
    pending = false
    if (intervalId) clearInterval(intervalId)
    // 立刻执行第一次检测
    reportLoop()
    intervalId = setInterval(reportLoop, REPORT_INTERVAL)
  }

  function stopWatching(): void {
    isWatching.value = false
    watchContext.value = ''
    lastObservation.value = ''
    if (intervalId) { clearInterval(intervalId); intervalId = null }
  }

  return { isWatching, watchContext, lastObservation, startWatching, stopWatching }
}

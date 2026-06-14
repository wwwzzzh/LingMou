import { ref, type Ref } from 'vue'
import visionApi from '@/api/modules/vision'
import { calculateChangeRate } from '@/utils/motionDetector'

const CHANGE_THRESHOLD = 0.15
const DETECT_INTERVAL = 800
const COOLDOWN_MS = 20000

export function useActiveVision(
  videoRef: Ref<HTMLVideoElement | null>,
  cameraEnabled: Ref<boolean>,
) {
  const isWatching = ref(false)
  const watchContext = ref('')
  const lastObservation = ref('')

  let intervalId: ReturnType<typeof setInterval> | null = null
  let previousPixels: Uint8ClampedArray | null = null
  let onChangeCallback: ((text: string) => void) | null = null
  let lastReportTime = 0
  let pending = false

  function getPixelData(): Uint8ClampedArray | null {
    const video = videoRef.value
    if (!video || video.readyState < 2) return null
    const size = 120
    const canvas = document.createElement('canvas')
    canvas.width = size; canvas.height = size
    const ctx = canvas.getContext('2d')
    if (!ctx) return null
    ctx.drawImage(video, 0, 0, size, size)
    return ctx.getImageData(0, 0, size, size).data
  }

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
      ? `（注意：你上一次观察到"${lastObs}"，如果画面没有新的变化，请不要重复相同的结论）`
      : ''

    const prompt = context
      ? `你在持续监控一个场景。${repeatHint}\n用户之前说："${context}"。\n现在画面可能发生了变化，请用中文简洁描述你注意到的不同之处（1句话即可）。如果画面和之前差不多，请回复"无明显变化"。`
      : `你在持续监控一个场景。${repeatHint}\n如果画面发生了明显变化，请用中文简洁描述（1句话）。如果没有明显变化，请只回复"无明显变化"。`

    try {
      const res = await visionApi.analyze(frameBase64, prompt)
      if (res.code === 200) {
        return res.data.reply || ''
      }
    } catch { /* ignore */ }
    return ''
  }

  async function detectLoop(): Promise<void> {
    if (!isWatching.value || !cameraEnabled.value || pending) return

    const inCooldown = Date.now() - lastReportTime < COOLDOWN_MS

    const pixels = getPixelData()
    if (!pixels) return

    if (previousPixels) {
      const changeRate = calculateChangeRate(pixels, previousPixels)

      if (changeRate > CHANGE_THRESHOLD && !inCooldown) {
        pending = true
        try {
          const frame = captureFrame()
          if (frame) {
            const result = await analyzeChange(frame, watchContext.value, lastObservation.value)
            if (result && result !== '无明显变化' && !result.includes('无明显变化')) {
              lastObservation.value = result
              lastReportTime = Date.now()
              onChangeCallback?.(result)
            }
          }
          previousPixels = pixels
        } finally {
          pending = false
        }
      } else if (changeRate > 0.05) {
        previousPixels = pixels
      }
    } else {
      previousPixels = pixels
    }
  }

  function startWatching(context: string, onObservation: (text: string) => void): void {
    watchContext.value = context
    onChangeCallback = onObservation
    isWatching.value = true
    previousPixels = null
    lastReportTime = 0
    lastObservation.value = ''
    pending = false
    if (intervalId) clearInterval(intervalId)
    detectLoop()
    intervalId = setInterval(detectLoop, DETECT_INTERVAL)
  }

  function stopWatching(): void {
    isWatching.value = false
    watchContext.value = ''
    lastObservation.value = ''
    if (intervalId) { clearInterval(intervalId); intervalId = null }
    previousPixels = null
  }

  return { isWatching, watchContext, lastObservation, startWatching, stopWatching }
}

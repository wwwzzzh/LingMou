import { ref, type Ref } from 'vue'
import { calculateChangeRate } from '@/utils/motionDetector'

const ARK_API_KEY = import.meta.env.VITE_ARK_API_KEY
const ARK_URL = 'https://ark.cn-beijing.volces.com/api/v3/chat/completions'
const MODEL = 'doubao-1-5-vision-pro-32k-250115'

const CHANGE_THRESHOLD = 0.15   // 变化率阈值
const DETECT_INTERVAL = 800     // 检测间隔 0.8s，接近实时
const COOLDOWN_MS = 20000       // 变化稳定后冷却 20s

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
  let pending = false // 防止并发

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
    // 告诉 AI 不要重复上一次的观察
    const repeatHint = lastObs
      ? `（注意：你上一次观察到"${lastObs}"，如果画面没有新的变化，请不要重复相同的结论）`
      : ''

    const prompt = context
      ? `你在持续监控一个场景。${repeatHint}\n用户之前说："${context}"。\n现在画面可能发生了变化，请用中文简洁描述你注意到的不同之处（1句话即可）。如果画面和之前差不多，请回复"无明显变化"。`
      : `你在持续监控一个场景。${repeatHint}\n如果画面发生了明显变化，请用中文简洁描述（1句话）。如果没有明显变化，请只回复"无明显变化"。`

    const contentParts: any[] = [
      { type: 'image_url', image_url: { url: frameBase64 } },
      { type: 'text', text: prompt },
    ]

    try {
      const response = await fetch(ARK_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${ARK_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: MODEL,
          messages: [{ role: 'user', content: contentParts }],
          max_tokens: 200,
        }),
      })
      if (response.ok) {
        const data = await response.json()
        return data.choices?.[0]?.message?.content || ''
      }
    } catch { /* ignore */ }
    return ''
  }

  async function detectLoop(): Promise<void> {
    if (!isWatching.value || !cameraEnabled.value || pending) return

    // 冷却中 → 静默更新参考帧，不触发报告
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
          // 更新参考帧（以当前画面为新的基准）
          previousPixels = pixels
        } finally {
          pending = false
        }
      } else if (changeRate > 0.05) {
        // 有小变化但在阈值以下 → 静默更新参考
        previousPixels = pixels
      }
      // 变化极小 → 不更新（避免噪声漂移）
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
    // 立刻抓取参考帧，然后高频检测
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

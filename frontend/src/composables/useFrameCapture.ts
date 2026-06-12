import { ref, onBeforeUnmount, type Ref } from 'vue'
import { captureAndCompress, extractPixelData, blobToFormData, COMPRESSION_CONFIG } from '@/utils/frameProcessor'
import { MotionDetector, DEFAULT_MOTION_THRESHOLD } from '@/utils/motionDetector'
import visionApi from '@/api/modules/vision'

/**
 * 帧捕获统计信息
 */
export interface FrameStats {
  /** 总捕获帧数 */
  totalCaptured: number
  /** 实际上传帧数（通过变化检测） */
  totalUploaded: number
  /** 跳过的帧数（无显著变化） */
  totalSkipped: number
  /** 节省的上传次数 */
  savingsRate: string
}

/**
 * 帧捕获与上传 Composable
 *
 * 功能：
 * - 每秒从视频流捕获一帧（Canvas 抽帧）
 * - 画面变化检测：变化率 > 15% 才上传
 * - JPEG 压缩：最长边 ≤ 1024px，质量 0.7
 * - 自动上传到 /api/vision/upload
 *
 * @param videoRef - 视频元素 Ref
 */
export function useFrameCapture(videoRef: Ref<HTMLVideoElement | null>) {
  /** 是否正在捕获 */
  const isCapturing = ref(false)

  /** 统计信息 */
  const stats = ref<FrameStats>({
    totalCaptured: 0,
    totalUploaded: 0,
    totalSkipped: 0,
    savingsRate: '0%',
  })

  /** 上次上传的图片 URL */
  const lastUploadedUrl = ref<string | null>(null)

  /** 是否正在进行上传 */
  const isUploading = ref(false)

  /** 日志列表（开发环境） */
  const logs = ref<string[]>([])

  let intervalId: ReturnType<typeof setInterval> | null = null
  const motionDetector = new MotionDetector(DEFAULT_MOTION_THRESHOLD)

  /**
   * 添加日志
   */
  function addLog(message: string): void {
    if (import.meta.env.DEV) {
      const time = new Date().toLocaleTimeString()
      logs.value.unshift(`[${time}] ${message}`)
      // 保留最近 50 条
      if (logs.value.length > 50) {
        logs.value.pop()
      }
    }
  }

  /**
   * 更新节省率
   */
  function updateSavingsRate(): void {
    const s = stats.value
    const total = s.totalUploaded + s.totalSkipped
    if (total === 0) {
      s.savingsRate = '0%'
      return
    }
    s.savingsRate = `${Math.round((s.totalSkipped / total) * 100)}%`
  }

  /**
   * 处理单帧：截取 → 检测 → 压缩 → 上传
   */
  async function processFrame(): Promise<void> {
    const video = videoRef.value
    if (!video || video.readyState < 2) return

    try {
      // 1. 提取像素数据用于变化检测
      const pixels = extractPixelData(video)
      if (!pixels) return

      stats.value.totalCaptured++

      // 2. 画面变化检测
      const hasChanged = motionDetector.detect(pixels)

      if (!hasChanged) {
        stats.value.totalSkipped++
        updateSavingsRate()
        addLog(`⏭️ 跳过 — 画面无显著变化 (已跳过 ${stats.value.totalSkipped} 帧)`)
        return
      }

      // 3. 截取并压缩帧
      const blob = captureAndCompress(video)
      if (!blob) return

      addLog(`📸 捕获帧 — ${(blob.size / 1024).toFixed(1)} KB`)

      // 4. 上传
      isUploading.value = true
      const formData = blobToFormData(blob)
      const result = await visionApi.upload(formData)

      stats.value.totalUploaded++
      updateSavingsRate()

      if (result.data?.url) {
        lastUploadedUrl.value = result.data.url
      }

      addLog(`✅ 上传成功 — 累计 ${stats.value.totalUploaded} 次上传`)
    } catch (err) {
      addLog(`❌ 上传失败: ${(err as Error).message}`)
    } finally {
      isUploading.value = false
    }
  }

  /**
   * 开始帧捕获
   */
  function startCapture(): void {
    if (isCapturing.value) return

    const video = videoRef.value
    if (!video) {
      addLog('⚠️ 视频未就绪，无法开始捕获')
      return
    }

    motionDetector.reset()
    isCapturing.value = true
    addLog('🚀 帧捕获已启动 — 每秒 1 帧')

    // 立即捕获首帧
    processFrame()

    // 定时捕获
    intervalId = setInterval(() => {
      processFrame()
    }, COMPRESSION_CONFIG.CAPTURE_INTERVAL)
  }

  /**
   * 停止帧捕获
   */
  function stopCapture(): void {
    if (!isCapturing.value) return

    if (intervalId) {
      clearInterval(intervalId)
      intervalId = null
    }

    motionDetector.reset()
    isCapturing.value = false
    addLog(`⏹️ 帧捕获已停止 — 共捕获 ${stats.value.totalCaptured} 帧，上传 ${stats.value.totalUploaded} 帧，节省率 ${stats.value.savingsRate}`)
  }

  /**
   * 重置统计
   */
  function resetStats(): void {
    stats.value = {
      totalCaptured: 0,
      totalUploaded: 0,
      totalSkipped: 0,
      savingsRate: '0%',
    }
    lastUploadedUrl.value = null
    logs.value = []
  }

  // 组件卸载时清理
  onBeforeUnmount(() => {
    stopCapture()
  })

  return {
    isCapturing,
    isUploading,
    stats,
    lastUploadedUrl,
    logs,
    startCapture,
    stopCapture,
    resetStats,
  }
}

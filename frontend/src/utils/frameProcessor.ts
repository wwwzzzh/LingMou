/**
 * 帧处理器
 *
 * Canvas 抽帧 + 图片压缩。
 * - 从 video 元素捕获当前帧
 * - 缩放到最长边 ≤ 1024px
 * - 输出 JPEG，质量 0.7
 * - 纯函数设计，可独立单元测试
 */

/** 压缩参数 */
export const COMPRESSION_CONFIG = {
  /** 最长边限制 (px) */
  MAX_LONGEST_SIDE: 1024,
  /** JPEG 质量 (0~1) */
  QUALITY: 0.7,
  /** 输出格式 */
  FORMAT: 'image/jpeg' as const,
  /** 抽帧间隔 (ms) */
  CAPTURE_INTERVAL: 1000,
} as const

/**
 * 计算缩放后的尺寸
 * 保持宽高比，最长边不超过 maxSide
 */
export function calculateResizeSize(
  originalWidth: number,
  originalHeight: number,
  maxSide: number = COMPRESSION_CONFIG.MAX_LONGEST_SIDE,
): { width: number; height: number } {
  if (originalWidth <= maxSide && originalHeight <= maxSide) {
    return { width: originalWidth, height: originalHeight }
  }

  const longestSide = Math.max(originalWidth, originalHeight)
  const ratio = maxSide / longestSide

  return {
    width: Math.round(originalWidth * ratio),
    height: Math.round(originalHeight * ratio),
  }
}

/**
 * 从 video 元素捕获当前帧，返回压缩后的 JPEG Blob
 *
 * @param videoElement - HTMLVideoElement（必须已播放且有画面）
 * @param quality - JPEG 质量 (0~1)，默认 0.7
 * @returns {Blob} 压缩后的 JPEG 图片
 */
export function captureAndCompress(
  videoElement: HTMLVideoElement,
  quality: number = COMPRESSION_CONFIG.QUALITY,
): Blob | null {
  const { videoWidth, videoHeight } = videoElement

  if (videoWidth === 0 || videoHeight === 0) {
    return null // 视频尚未就绪
  }

  const { width, height } = calculateResizeSize(videoWidth, videoHeight)

  // 离屏 Canvas 绘制
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(videoElement, 0, 0, width, height)

  // 输出压缩后的 Blob
  return dataURIToBlob(canvas.toDataURL(COMPRESSION_CONFIG.FORMAT, quality))
}

/**
 * 提取 Canvas 像素数据（供变化检测使用）
 */
export function extractPixelData(videoElement: HTMLVideoElement): Uint8ClampedArray | null {
  const { videoWidth, videoHeight } = videoElement
  if (videoWidth === 0 || videoHeight === 0) return null

  // 使用较小尺寸做像素采样，降低计算开销
  const sampleSize = 160
  const { width, height } = calculateResizeSize(videoWidth, videoHeight, sampleSize)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(videoElement, 0, 0, width, height)
  return ctx.getImageData(0, 0, width, height).data
}

/**
 * Data URL → Blob 转换
 */
function dataURIToBlob(dataURI: string): Blob {
  const parts = dataURI.split(',')
  const mime = parts[0].match(/:(.*?);/)?.[1] || 'image/jpeg'
  const binary = atob(parts[1])
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new Blob([bytes], { type: mime })
}

/**
 * Blob → FormData（供上传使用）
 */
export function blobToFormData(blob: Blob, filename = 'frame.jpg'): FormData {
  const formData = new FormData()
  formData.append('file', blob, filename)
  return formData
}

import request from '@/api/request'
import type { ApiResult } from '@/types'

/**
 * 视觉图片上传响应
 */
export interface VisionUploadResult {
  /** 图片远程 URL */
  url: string
  /** 图片识别场景描述（预留） */
  description?: string
}

/**
 * 视觉图片 API
 */
const visionApi = {
  /**
   * POST /api/vision/upload
   * 上传图片帧进行视觉分析
   */
  upload(data: FormData): Promise<ApiResult<VisionUploadResult>> {
    return request.post('/api/vision/upload', data, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },

  /**
   * POST /api/vision/analyze
   * 分析 base64 图片，返回 AI 回复
   */
  analyze(imageBase64: string, prompt: string): Promise<ApiResult<{ reply: string }>> {
    return request.post('/api/vision/analyze', { imageBase64, prompt })
  },
}

export default visionApi

import { ref, type Ref } from 'vue'
import type { MediaDeviceError, MediaErrorType } from '@/types/media'

/**
 * 媒体设备管理 Composable
 *
 * 封装摄像头与麦克风的：
 * - 设备权限申请
 * - 设备开启 / 关闭
 * - 设备释放
 * - 异常处理（权限拒绝、设备不存在、设备占用）
 */
export function useMediaDevice() {
  /** 媒体流 */
  const stream: Ref<MediaStream | null> = ref(null)

  /** 摄像头是否开启 */
  const cameraEnabled = ref(false)

  /** 麦克风是否开启 */
  const micEnabled = ref(false)

  /** 错误状态 */
  const error: Ref<MediaDeviceError | null> = ref(null)

  /**
   * 解析 getUserMedia 错误类型
   */
  function parseError(err: DOMException): MediaDeviceError {
    const name = err.name
    let type: MediaErrorType = 'UNKNOWN'
    let message = '未知设备错误'

    switch (name) {
      case 'NotAllowedError':
      case 'PermissionDeniedError':
        type = 'PERMISSION_DENIED'
        message = '摄像头/麦克风权限被拒绝，请在浏览器设置中允许访问'
        break
      case 'NotFoundError':
        type = 'DEVICE_NOT_FOUND'
        message = '未检测到摄像头或麦克风设备，请检查设备连接'
        break
      case 'NotReadableError':
      case 'TrackStartError':
        type = 'DEVICE_BUSY'
        message = '设备正被其他应用占用，请关闭其他使用摄像头的程序'
        break
      default:
        message = `设备访问失败: ${err.message}`
    }

    return { type, message }
  }

  /**
   * 开启摄像头与麦克风
   * @param constraints - 可选的自定义媒体约束
   */
  async function startDevice(
    constraints: MediaStreamConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
      audio: true,
    },
  ): Promise<void> {
    // 先释放已有设备
    if (stream.value) {
      stopDevice()
    }

    error.value = null

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints)
      stream.value = mediaStream
      cameraEnabled.value = true
      micEnabled.value = true
    } catch (err) {
      error.value = parseError(err as DOMException)
      cameraEnabled.value = false
      micEnabled.value = false
    }
  }

  /**
   * 切换摄像头开关
   * 通过 enabled 属性暂停/恢复视频轨道（不释放设备）
   */
  function toggleCamera(): void {
    if (!stream.value) {
      // 流不存在则尝试开启
      startDevice()
      return
    }

    const videoTrack = stream.value.getVideoTracks()[0]
    if (!videoTrack) {
      // 无视频轨道，重新开启摄像头
      startDevice()
      return
    }

    videoTrack.enabled = !videoTrack.enabled
    cameraEnabled.value = videoTrack.enabled
  }

  /**
   * 切换麦克风开关
   * 通过 enabled 属性暂停/恢复音频轨道（不释放设备）
   */
  function toggleMic(): void {
    if (!stream.value) {
      startDevice()
      return
    }

    const audioTrack = stream.value.getAudioTracks()[0]
    if (!audioTrack) {
      startDevice()
      return
    }

    audioTrack.enabled = !audioTrack.enabled
    micEnabled.value = audioTrack.enabled
  }

  /**
   * 释放所有设备
   * 停止所有轨道并清空 stream
   */
  function stopDevice(): void {
    if (stream.value) {
      stream.value.getTracks().forEach((track) => {
        track.stop()
      })
      stream.value = null
    }
    cameraEnabled.value = false
    micEnabled.value = false
    error.value = null
  }

  /**
   * 清除错误状态
   */
  function clearError(): void {
    error.value = null
  }

  return {
    stream,
    cameraEnabled,
    micEnabled,
    error,
    startDevice,
    toggleCamera,
    toggleMic,
    stopDevice,
    clearError,
  }
}

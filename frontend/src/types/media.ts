/**
 * 媒体设备相关类型定义
 */

/** 设备错误类型 */
export type MediaErrorType =
  | 'PERMISSION_DENIED'    // 用户拒绝权限
  | 'DEVICE_NOT_FOUND'     // 设备不存在
  | 'DEVICE_BUSY'          // 设备被占用
  | 'UNKNOWN'              // 未知错误

/** 设备错误信息 */
export interface MediaDeviceError {
  type: MediaErrorType
  message: string
}

/** 媒体设备状态 */
export interface MediaDeviceState {
  /** 摄像头是否开启 */
  cameraEnabled: boolean
  /** 麦克风是否开启 */
  micEnabled: boolean
  /** 媒体流 */
  stream: MediaStream | null
  /** 错误信息 */
  error: MediaDeviceError | null
}

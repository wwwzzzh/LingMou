import { ref, onBeforeUnmount } from 'vue'

// Web Speech API 类型声明（TS 尚未内置）
interface SpeechRecognitionEvent extends Event {
  resultIndex: number
  results: SpeechRecognitionResultList
}

/**
 * 浏览器端语音识别（Web Speech API）
 *
 * 端侧免费 ASR，无需后端 API 调用。
 * 支持连续识别，结果实时回调。
 */
export function useSpeechRecognition() {
  const isListening = ref(false)
  const transcript = ref('')
  const isSupported = ref(false)

  let recognition: any = null

  const SpeechRecognitionAPI =
    (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition

  if (SpeechRecognitionAPI) {
    isSupported.value = true
    recognition = new SpeechRecognitionAPI()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'zh-CN'
    recognition.maxAlternatives = 1

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalText = ''
      let interimText = ''
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i]
        if (result.isFinal) {
          finalText += result[0].transcript
        } else {
          interimText += result[0].transcript
        }
      }
      transcript.value = finalText || interimText
    }

    recognition.onerror = (event: any) => {
      console.warn('[ASR] Speech recognition error:', event.error)
      if (event.error === 'no-speech') return
      isListening.value = false
    }

    recognition.onend = () => {
      isListening.value = false
    }
  }

  function start(): void {
    if (!recognition) return
    transcript.value = ''
    isListening.value = true
    try {
      recognition.start()
    } catch {
      // 可能已在运行
    }
  }

  function stop(): string {
    if (!recognition) return ''
    recognition.stop()
    isListening.value = false
    const result = transcript.value
    transcript.value = ''
    return result
  }

  onBeforeUnmount(() => {
    recognition?.abort()
  })

  return { isListening, transcript, isSupported, start, stop }
}

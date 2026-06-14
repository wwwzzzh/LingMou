import { ref, onMounted } from 'vue'

/**
 * 浏览器端语音合成（TTS）
 * 优先选择真人自然语音，语速接近真人。
 */
export function useSpeechSynthesis() {
  const isSpeaking = ref(false)
  const isSupported = ref('speechSynthesis' in window)
  const selectedVoice = ref<SpeechSynthesisVoice | null>(null)

  /** 预加载并选择最佳中文女声 */
  function loadBestVoice(): void {
    if (!isSupported.value) return
    const voices = window.speechSynthesis.getVoices()

    // 优先级：真人语音 > 高质量合成 > 任意中文女声
    const priority = [
      'Tingting', 'tingting',         // macOS 真人
      'Xiaoxiao', 'xiaoxiao',         // Win11 真人
      'Yunxi', 'yunxi',               // 阿里云
      'Xiaoyi', 'xiaoyi',             // 微软
      'Yaoyao', 'yaoyao',             // macOS
    ]

    for (const name of priority) {
      const v = voices.find(v => v.name.includes(name) && v.lang.startsWith('zh'))
      if (v) { selectedVoice.value = v; return }
    }

    // 降级：任意中文女声
    const zhVoice = voices.find(v => v.lang === 'zh-CN' && v.name.toLowerCase().includes('female'))
      || voices.find(v => v.lang === 'zh-CN')
      || voices.find(v => v.lang.startsWith('zh'))
    if (zhVoice) selectedVoice.value = zhVoice
  }

  onMounted(() => {
    loadBestVoice()
    // voices 可能异步加载
    window.speechSynthesis.onvoiceschanged = loadBestVoice
  })

  function speak(text: string, onEnd?: () => void): void {
    if (!isSupported.value) return

    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.lang = 'zh-CN'
    utterance.rate = 0.95    // 接近真人语速
    utterance.pitch = 1.0
    utterance.volume = 1.0
    if (selectedVoice.value) utterance.voice = selectedVoice.value

    utterance.onstart = () => { isSpeaking.value = true }
    utterance.onend = () => { isSpeaking.value = false; onEnd?.() }
    utterance.onerror = () => { isSpeaking.value = false }

    window.speechSynthesis.speak(utterance)
  }

  function stop(): void {
    window.speechSynthesis.cancel()
    isSpeaking.value = false
  }

  return { isSpeaking, isSupported, speak, stop }
}

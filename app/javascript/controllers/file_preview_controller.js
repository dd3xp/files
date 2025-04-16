import { Controller } from "@hotwired/stimulus"

/**
 * 文件预览控制器
 * 处理文件预览弹窗的显示和隐藏
 */
export default class extends Controller {
  static targets = ["modal", "content", "closeBtn"]

  /**
   * 初始化
   * 连接到DOM时自动调用
   */
  connect() {
    this.setupEventListeners()
  }

  /**
   * 设置事件监听
   * 包括预览按钮点击、关闭按钮点击和点击外部关闭
   */
  setupEventListeners() {
    document.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', (event) => this.handlePreview(event))
    })

    this.closeBtnTarget.addEventListener('click', () => this.hideModal())

    window.addEventListener('click', (event) => {
      if (event.target === this.modalTarget) {
        this.hideModal()
      }
    })
  }

  /**
   * 处理预览按钮点击
   * @param {Event} event - 点击事件，包含预览URL
   */
  handlePreview(event) {
    const previewUrl = event.currentTarget.dataset.previewUrlValue
    this.fetchFileContent(previewUrl)
  }

  /**
   * 获取文件内容
   * @param {string} previewUrl - 预览文件的URL地址
   */
  async fetchFileContent(previewUrl) {
    try {
      const response = await fetch(previewUrl, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      })
      const data = await response.json()
      
      if (data.error) {
        alert(data.error)
        return
      }
      
      this.contentTarget.textContent = data.content
      this.showModal()
    } catch (error) {
      console.error('Error:', error)
      alert('预览文件时发生错误')
    }
  }

  /**
   * 显示预览弹窗
   */
  showModal() {
    this.modalTarget.style.display = 'block'
  }

  /**
   * 隐藏预览弹窗
   */
  hideModal() {
    this.modalTarget.style.display = 'none'
  }
} 
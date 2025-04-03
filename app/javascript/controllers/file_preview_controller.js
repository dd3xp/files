import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal", "content", "closeBtn"]

  connect() {
    this.setupEventListeners()
  }

  setupEventListeners() {
    // 为所有预览按钮添加点击事件
    document.querySelectorAll('.preview-btn').forEach(btn => {
      btn.addEventListener('click', (event) => this.handlePreview(event))
    })

    // 关闭按钮事件
    this.closeBtnTarget.addEventListener('click', () => this.hideModal())

    // 点击模态框外部关闭
    window.addEventListener('click', (event) => {
      if (event.target === this.modalTarget) {
        this.hideModal()
      }
    })
  }

  handlePreview(event) {
    const previewUrl = event.currentTarget.dataset.previewUrlValue
    this.fetchFileContent(previewUrl)
  }

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

  showModal() {
    this.modalTarget.style.display = 'block'
  }

  hideModal() {
    this.modalTarget.style.display = 'none'
  }
} 
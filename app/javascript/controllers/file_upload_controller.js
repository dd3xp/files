import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input"]

  connect() {
    this.setupEventListeners()
  }

  triggerFileInput() {
    this.inputTarget.click()
  }

  setupEventListeners() {
    this.inputTarget.addEventListener('change', (event) => this.handleFileSelect(event))
  }

  handleFileSelect(event) {
    const files = event.target.files
    if (!files.length) return

    const formData = new FormData()
    for (let i = 0; i < files.length; i++) {
      formData.append('files[]', files[i])
    }

    // 获取当前路径
    const pathElements = Array.from(document.querySelectorAll('.breadcrumb-path a'))
      .map(a => a.textContent.trim())
      .filter(text => text !== '根目录')
    
    const currentPath = pathElements.length ? '/' + pathElements.join('/') : '/'
    formData.append('path', currentPath)

    this.uploadFiles(formData)
  }

  async uploadFiles(formData) {
    try {
      const response = await fetch('/files/upload', {
        method: 'POST',
        body: formData,
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      })

      const result = await response.json()
      
      if (result.error) {
        alert(result.error)
        return
      }

      // 使用 Turbo 刷新当前页面
      Turbo.visit(window.location.href, { action: "replace" })
    } catch (error) {
      console.error('Error:', error)
      alert('上传文件时发生错误')
    }
  }
} 
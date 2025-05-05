import { Controller } from "@hotwired/stimulus"

/**
 * 文件下载控制器
 * 处理文件下载操作
 */
export default class extends Controller {
  static targets = ["downloadButton"]
  static values = {
    selectedFiles: Array
  }

  /**
   * 初始化控制器
   * 在控制器连接到DOM时调用
   */
  connect() {
    this.setupEventListeners()
    console.log('Download controller connected')
  }

  /**
   * 设置事件监听器
   * 监听文件选择更新事件
   */
  setupEventListeners() {
    document.addEventListener('selectedFilesUpdated', (event) => {
      this.selectedFilesValue = event.detail.files
      console.log('Download controller received files:', this.selectedFilesValue)
    })
  }

  /**
   * 下载文件
   * 处理单个或多个文件的下载
   */
  async download() {
    if (!this.selectedFilesValue || this.selectedFilesValue.length === 0) {
      this.showToast('请先选择要下载的文件', 'error')
      return
    }

    console.log('Selected files for download:', this.selectedFilesValue)

    if (this.selectedFilesValue.length === 1) {
      const file = this.selectedFilesValue[0]
      const path = file.path.replace(/^\/+/, '') // 移除开头的斜杠
      console.log('Downloading single file:', path)
      
      try {
        const response = await fetch(`/files/download?id=${encodeURIComponent(path)}`, {
          method: 'GET',
          headers: {
            'Accept': 'application/octet-stream'
          }
        })

        if (!response.ok) {
          const text = await response.text()
          throw new Error(text || '下载失败')
        }

        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = file.name
        document.body.appendChild(a)
        a.click()
        window.URL.revokeObjectURL(url)
        document.body.removeChild(a)
        this.showToast('文件下载成功', 'success')
      } catch (error) {
        console.error('Download error:', error)
        this.showToast(error.message || '下载失败', 'error')
      }
    } else {
      const form = document.createElement('form')
      form.method = 'POST'
      form.action = '/files/download_multiple'
      
      this.selectedFilesValue.forEach(file => {
        const input = document.createElement('input')
        input.type = 'hidden'
        input.name = 'paths[]'
        input.value = file.path.replace(/^\/+/, '') // 移除开头的斜杠
        form.appendChild(input)
      })
      
      document.body.appendChild(form)
      form.submit()
      document.body.removeChild(form)
    }
  }

  /**
   * 显示提示消息
   * @param {string} message - 要显示的消息内容
   * @param {string} type - 消息类型（info/success/error）
   */
  showToast(message, type = 'info') {
    const toast = document.createElement('div')
    toast.className = `custom-toast ${type}`
    
    const icon = document.createElement('i')
    if (type === 'success') {
      icon.className = 'fas fa-check-circle'
    } else if (type === 'error') {
      icon.className = 'fas fa-exclamation-circle'
    } else {
      icon.className = 'fas fa-info-circle'
    }
    
    const messageSpan = document.createElement('span')
    messageSpan.textContent = message
    
    toast.appendChild(icon)
    toast.appendChild(messageSpan)
    
    document.body.appendChild(toast)
    
    setTimeout(() => {
      toast.classList.add('show')
    }, 10)
    
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => {
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }
} 
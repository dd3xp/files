import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = {
    clipboard: String
  }

  connect() {
    this.setupEventListeners()
  }

  setupEventListeners() {
    // 监听文件选择更新事件
    document.addEventListener('selectedFilesUpdated', (event) => {
      this.selectedFiles = event.detail.files
      console.log('Copy controller received files:', this.selectedFiles)
    })
  }

  copy() {
    console.log('Copy method called, selected files:', this.selectedFiles)
    
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      this.showToast('请先选择要复制的文件', 'error')
      return
    }

    const files = this.selectedFiles.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory,
      path: file.path
    }))

    const clipboardData = {
      files,
      operation: 'copy'
    }

    this.clipboardValue = JSON.stringify(clipboardData)

    // 触发复制事件
    const event = new CustomEvent('fileCopied', {
      detail: clipboardData
    })
    document.dispatchEvent(event)

    this.showToast(`已复制 ${files.length} 个文件`, 'success')
  }

  showToast(message, type = 'info') {
    // 创建toast元素
    const toast = document.createElement('div')
    toast.className = `custom-toast ${type}`
    
    // 添加图标
    const icon = document.createElement('i')
    if (type === 'success') {
      icon.className = 'fas fa-check-circle'
    } else if (type === 'error') {
      icon.className = 'fas fa-exclamation-circle'
    } else {
      icon.className = 'fas fa-info-circle'
    }
    
    // 添加消息文本
    const messageSpan = document.createElement('span')
    messageSpan.textContent = message
    
    // 组装toast
    toast.appendChild(icon)
    toast.appendChild(messageSpan)
    
    // 添加到页面
    document.body.appendChild(toast)
    
    // 显示toast
    setTimeout(() => {
      toast.classList.add('show')
    }, 10)
    
    // 3秒后自动消失
    setTimeout(() => {
      toast.classList.remove('show')
      setTimeout(() => {
        // 检查元素是否仍然存在
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
      }, 300)
    }, 3000)
  }
} 
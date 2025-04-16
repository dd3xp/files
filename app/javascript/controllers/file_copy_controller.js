import { Controller } from "@hotwired/stimulus"

/**
 * 文件复制控制器
 * 处理文件复制操作
 */
export default class extends Controller {
  static values = {
    clipboard: String
  }

  /**
   * 初始化控制器
   * 在控制器连接到DOM时调用
   */
  connect() {
    this.setupEventListeners()
  }

  /**
   * 设置事件监听器
   * 监听文件选择更新事件
   */
  setupEventListeners() {
    document.addEventListener('selectedFilesUpdated', (event) => {
      this.selectedFiles = event.detail.files
      console.log('Copy controller received files:', this.selectedFiles)
    })
  }

  /**
   * 复制文件
   * 将选中的文件复制到剪贴板
   */
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

    const event = new CustomEvent('fileCopied', {
      detail: clipboardData
    })
    document.dispatchEvent(event)

    this.showToast(`已复制 ${files.length} 个文件`, 'success')
  }

  /**
   * 显示提示消息
   * @param {string} message - 要显示的消息内容
   * @param {string} type - 消息类型，可以是'success'、'error'或'info'
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
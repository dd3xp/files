import { Controller } from "@hotwired/stimulus"

/**
 * 文件删除控制器
 * 处理文件删除操作和确认对话框
 */
export default class extends Controller {
  static targets = ["progress"]

  /**
   * 初始化控制器
   * 在控制器连接到 DOM 时自动调用
   * 设置事件监听
   */
  connect() {
    this.setupEventListeners()
  }

  /**
   * 设置事件监听
   * 监听文件选择更新事件
   */
  setupEventListeners() {
    document.addEventListener('selectedFilesUpdated', (event) => {
      this.selectedFiles = event.detail.files
    })
  }

  /**
   * 删除文件
   * 发送删除请求并显示进度
   */
  async delete() {
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      this.showToast('请先选择要删除的文件', 'error')
      return
    }

    const fileList = this.selectedFiles.map(file => `- ${file.name}`).join('\n')
    const confirmed = await this.showDeleteConfirmation(fileList)
    
    if (!confirmed) {
      return
    }

    this.progressTarget.style.display = 'block'
    const progressFiles = this.progressTarget.querySelector('.progress-files')
    progressFiles.innerHTML = ''

    this.selectedFiles.forEach(file => {
      const progressElement = this.createProgressElement(file.name)
      progressFiles.appendChild(progressElement)
    })

    try {
      const response = await fetch('/files/delete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          paths: this.selectedFiles.map(file => file.path)
        })
      })

      const result = await response.json()
      
      if (response.ok) {
        this.updateAllProgressBars('完成', '#2ecc71')
        setTimeout(() => {
          this.progressTarget.style.display = 'none'
          const pathElements = Array.from(document.querySelectorAll('.breadcrumb-path a'))
            .map(a => a.textContent.trim())
            .filter(text => text !== '根目录')
          
          const currentPath = pathElements.length ? '/' + pathElements.join('/') : '/'
          
          const refreshEvent = new CustomEvent('refresh', {
            detail: { path: currentPath }
          })
          document.dispatchEvent(refreshEvent)
        }, 1000)
      } else {
        this.updateAllProgressBars('失败', '#e74c3c')
        this.showToast(result.error || '删除失败', 'error')
      }
    } catch (error) {
      console.error('Error:', error)
      this.updateAllProgressBars('失败', '#e74c3c')
      this.showToast('删除文件时发生错误', 'error')
    }
  }

  /**
   * 显示删除确认对话框
   * @param {string} fileList - 要删除的文件列表
   * @returns {Promise<boolean>} - 用户是否确认删除
   */
  async showDeleteConfirmation(fileList) {
    return new Promise((resolve) => {
      const dialog = document.createElement('div')
      dialog.className = 'choice-dialog'
      
      const template = document.getElementById('duplicate-choice-dialog-template')
      const content = template.content.cloneNode(true)
      
      content.querySelector('h3').textContent = '确认删除'
      content.querySelector('p').textContent = '确定要删除以下文件吗？'
      content.querySelector('#duplicate-files-list').textContent = fileList
      
      const buttons = content.querySelector('.choice-dialog-buttons')
      buttons.innerHTML = `
        <button class="choice-dialog-button" data-value="confirm">确认</button>
        <button class="choice-dialog-button" data-value="cancel">取消</button>
      `
      
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          document.body.removeChild(dialog)
          resolve(false)
        }
      })

      dialog.appendChild(content)
      document.body.appendChild(dialog)

      dialog.querySelectorAll('.choice-dialog-button').forEach(button => {
        button.addEventListener('click', () => {
          const value = button.dataset.value
          document.body.removeChild(dialog)
          resolve(value === 'confirm')
        })
      })
    })
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

  /**
   * 创建进度条元素
   * @param {string} fileName - 文件名
   * @returns {HTMLElement} - 创建的进度条元素
   */
  createProgressElement(fileName) {
    const progressFile = document.createElement('div')
    progressFile.className = 'progress-file'
    
    const template = document.getElementById('progress-element-template')
    const content = template.content.cloneNode(true)
    
    content.querySelector('.progress-file-name').textContent = fileName
    
    progressFile.appendChild(content)
    return progressFile
  }

  /**
   * 更新所有进度条
   * @param {string} status - 状态文本
   * @param {string} color - 进度条颜色
   */
  updateAllProgressBars(status, color) {
    const progressFiles = this.progressTarget.querySelectorAll('.progress-file')
    progressFiles.forEach(file => {
      const progressBar = file.querySelector('.progress-bar-fill')
      const percentage = file.querySelector('.progress-file-percentage')
      progressBar.style.backgroundColor = color
      percentage.textContent = status
    })
  }
} 
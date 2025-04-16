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
      alert('请先选择要删除的文件')
      return
    }

    if (!confirm('确定要删除选中的文件吗？')) {
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
        alert(result.error || '删除失败')
      }
    } catch (error) {
      console.error('Error:', error)
      this.updateAllProgressBars('失败', '#e74c3c')
      alert('删除文件时发生错误')
    }
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
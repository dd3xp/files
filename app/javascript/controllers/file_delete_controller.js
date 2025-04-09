import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["progress"]

  connect() {
    this.setupEventListeners()
  }

  setupEventListeners() {
    // 监听文件选择更新事件
    document.addEventListener('selectedFilesUpdated', (event) => {
      this.selectedFiles = event.detail.files
    })
  }

  async delete() {
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      alert('请先选择要删除的文件')
      return
    }

    if (!confirm('确定要删除选中的文件吗？')) {
      return
    }

    // 显示进度条容器
    this.progressTarget.style.display = 'block'
    const progressFiles = this.progressTarget.querySelector('.progress-files')
    progressFiles.innerHTML = '' // 清空现有进度条

    // 为每个文件创建进度条
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
        // 更新所有进度条为完成状态
        this.updateAllProgressBars('完成', '#2ecc71')
        // 延迟刷新页面
        setTimeout(() => {
          this.progressTarget.style.display = 'none'
          // 获取当前路径
          const pathElements = Array.from(document.querySelectorAll('.breadcrumb-path a'))
            .map(a => a.textContent.trim())
            .filter(text => text !== '根目录')
          
          const currentPath = pathElements.length ? '/' + pathElements.join('/') : '/'
          
          // 触发刷新事件
          const refreshEvent = new CustomEvent('refresh', {
            detail: { path: currentPath }
          })
          document.dispatchEvent(refreshEvent)
        }, 1000)
      } else {
        // 更新所有进度条为失败状态
        this.updateAllProgressBars('失败', '#e74c3c')
        alert(result.error || '删除失败')
      }
    } catch (error) {
      console.error('Error:', error)
      // 更新所有进度条为失败状态
      this.updateAllProgressBars('失败', '#e74c3c')
      alert('删除文件时发生错误')
    }
  }

  createProgressElement(fileName) {
    const progressFile = document.createElement('div')
    progressFile.className = 'progress-file'
    
    // 获取模板
    const template = document.getElementById('progress-element-template')
    const content = template.content.cloneNode(true)
    
    // 设置文件名
    content.querySelector('.progress-file-name').textContent = fileName
    
    progressFile.appendChild(content)
    return progressFile
  }

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
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "progress"]

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

    // 获取当前路径
    const pathElements = Array.from(document.querySelectorAll('.breadcrumb-path a'))
      .map(a => a.textContent.trim())
      .filter(text => text !== '根目录')
    
    const currentPath = pathElements.length ? '/' + pathElements.join('/') : '/'

    // 显示进度条容器
    this.progressTarget.style.display = 'block'
    const progressFiles = this.progressTarget.querySelector('.progress-files')
    progressFiles.innerHTML = '' // 清空现有进度条

    // 为每个文件创建进度条并上传
    Array.from(files).forEach(file => {
      this.uploadSingleFile(file, currentPath, progressFiles)
    })
  }

  createProgressElement(fileName) {
    const progressFile = document.createElement('div')
    progressFile.className = 'progress-file'
    progressFile.innerHTML = `
      <div class="progress-file-info">
        <span class="progress-file-name">${fileName}</span>
        <span class="progress-file-percentage">0%</span>
      </div>
      <div class="progress-bar">
        <div class="progress-bar-fill"></div>
      </div>
    `
    return progressFile
  }

  uploadSingleFile(file, currentPath, progressFiles) {
    // 创建进度条元素
    const progressElement = this.createProgressElement(file.name)
    progressFiles.appendChild(progressElement)
    
    const progressBar = progressElement.querySelector('.progress-bar-fill')
    const percentage = progressElement.querySelector('.progress-file-percentage')

    // 创建表单数据
    const formData = new FormData()
    formData.append('files[]', file)
    formData.append('path', currentPath)

    // 创建 XHR 请求
    const xhr = new XMLHttpRequest()
    
    // 监听上传进度
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        progressBar.style.width = percentComplete + '%'
        percentage.textContent = percentComplete + '%'
      }
    })

    // 监听上传完成
    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        // 上传成功，显示完成状态
        progressBar.style.backgroundColor = '#2ecc71'
        percentage.textContent = '完成'
        
        // 检查是否所有文件都上传完成
        this.checkAllFilesUploaded()
      } else {
        // 上传失败
        const result = JSON.parse(xhr.responseText)
        progressBar.style.backgroundColor = '#e74c3c'
        percentage.textContent = '失败'
        alert(`文件 ${file.name} 上传失败: ${result.error || '未知错误'}`)
      }
    })

    // 监听上传错误
    xhr.addEventListener('error', () => {
      progressBar.style.backgroundColor = '#e74c3c'
      percentage.textContent = '失败'
      alert(`文件 ${file.name} 上传失败`)
    })

    // 发送请求
    xhr.open('POST', '/files/upload')
    xhr.setRequestHeader('X-CSRF-Token', document.querySelector('meta[name="csrf-token"]').content)
    xhr.send(formData)
  }

  checkAllFilesUploaded() {
    // 检查是否所有文件都上传完成
    const progressFiles = this.progressTarget.querySelectorAll('.progress-file')
    const allComplete = Array.from(progressFiles).every(file => 
      file.querySelector('.progress-file-percentage').textContent === '完成'
    )

    if (allComplete) {
      // 获取当前路径
      const pathElements = Array.from(document.querySelectorAll('.breadcrumb-path a'))
        .map(a => a.textContent.trim())
        .filter(text => text !== '根目录')
      
      const currentPath = pathElements.length ? '/' + pathElements.join('/') : '/'

      // 所有文件上传完成，延迟刷新页面，保持在当前目录
      setTimeout(() => {
        this.progressTarget.style.display = 'none'
        window.Turbo.visit(`/files?path=${encodeURIComponent(currentPath)}`, { action: "replace" })
      }, 1000)
    }
  }
} 
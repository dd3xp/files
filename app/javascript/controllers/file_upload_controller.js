import { Controller } from "@hotwired/stimulus"

/**
 * 文件上传控制器
 * 处理文件上传、进度显示和错误处理
 */
export default class extends Controller {
  static targets = ["input", "progress"]

  /**
   * 初始化控制器，设置事件监听
   * 在控制器连接到 DOM 时自动调用
   */
  connect() {
    this.setupEventListeners()
  }

  /**
   * 触发文件选择框点击
   * 当用户点击上传区域时调用
   */
  triggerFileInput() {
    this.inputTarget.click()
  }

  /**
   * 设置文件选择事件监听
   * 监听文件输入框的 change 事件
   */
  setupEventListeners() {
    this.inputTarget.addEventListener('change', (event) => this.handleFileSelect(event))
  }

  /**
   * 处理文件选择事件
   * @param {Event} event - 文件选择事件对象
   * 检查重名文件并开始上传
   */
  async handleFileSelect(event) {
    const files = event.target.files
    if (!files.length) return

    const pathElements = Array.from(document.querySelectorAll('.breadcrumb-path a'))
      .map(a => a.textContent.trim())
      .filter(text => text !== '根目录')
    
    const currentPath = pathElements.length ? '/' + pathElements.join('/') : '/'

    try {
      const checkResponse = await fetch('/files/check_duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          targetPath: currentPath,
          files: Array.from(files).map(file => ({
            path: file.name
          }))
        })
      })

      let fileAction = null
      if (checkResponse.status === 409) {
        const result = await checkResponse.json()
        console.log('Duplicate check result:', result)
        
        if (result.duplicate_files && result.duplicate_files.length > 0) {
          fileAction = await this.showChoiceDialog(result.duplicate_files)
          console.log('Selected action:', fileAction)
          if (fileAction === null) {
            console.log('Upload cancelled by user')
            return
          }
        }
      }

      this.progressTarget.style.display = 'block'
      const progressFiles = this.progressTarget.querySelector('.progress-files')
      progressFiles.innerHTML = ''

      Array.from(files).forEach(file => {
        this.uploadSingleFile(file, currentPath, progressFiles, fileAction)
      })
    } catch (error) {
      console.error('Error checking duplicates:', error)
      alert('检查重名文件失败')
    }
  }

  /**
   * 显示重名文件选择对话框
   * @param {Array} duplicateFiles - 重名文件列表
   * @returns {Promise<string>} - 用户选择的操作方式（replace/skip/rename）
   */
  async showChoiceDialog(duplicateFiles) {
    console.log('Showing duplicate files dialog...')
    const fileList = Array.isArray(duplicateFiles) 
      ? duplicateFiles.map(file => `- ${file}`).join('\n')
      : duplicateFiles

    return new Promise((resolve) => {
      const dialog = document.createElement('div')
      dialog.className = 'choice-dialog'
      
      const template = document.getElementById('upload-duplicate-choice-dialog-template')
      const content = template.content.cloneNode(true)
      
      content.querySelector('#upload-duplicate-files-list').textContent = fileList

      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          document.body.removeChild(dialog)
          resolve(null)
        }
      })

      dialog.appendChild(content)
      document.body.appendChild(dialog)

      dialog.querySelectorAll('.choice-dialog-button').forEach(button => {
        button.addEventListener('click', () => {
          const value = button.dataset.value
          document.body.removeChild(dialog)
          resolve(value === 'cancel' ? null : value)
        })
      })
    })
  }

  /**
   * 创建文件上传进度条元素
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
   * 上传单个文件
   * @param {File} file - 要上传的文件对象
   * @param {string} currentPath - 当前目录路径
   * @param {HTMLElement} progressFiles - 进度条容器元素
   * @param {string} fileAction - 文件操作方式（replace/skip/rename）
   */
  uploadSingleFile(file, currentPath, progressFiles, fileAction = null) {
    const progressElement = this.createProgressElement(file.name)
    progressFiles.appendChild(progressElement)
    
    const progressBar = progressElement.querySelector('.progress-bar-fill')
    const percentage = progressElement.querySelector('.progress-file-percentage')

    const formData = new FormData()
    formData.append('files[]', file)
    formData.append('path', currentPath)
    if (fileAction) {
      formData.append('fileAction', fileAction)
    }

    const xhr = new XMLHttpRequest()
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        const percentComplete = Math.round((event.loaded / event.total) * 100)
        progressBar.style.width = percentComplete + '%'
        percentage.textContent = percentComplete + '%'
      }
    })

    xhr.addEventListener('load', () => {
      if (xhr.status === 200) {
        progressBar.style.backgroundColor = '#2ecc71'
        percentage.textContent = '完成'
        
        this.checkAllFilesUploaded()
      } else {
        const result = JSON.parse(xhr.responseText)
        progressBar.style.backgroundColor = '#e74c3c'
        percentage.textContent = '失败'
        alert(`文件 ${file.name} 上传失败: ${result.error || '未知错误'}`)
      }
    })

    xhr.addEventListener('error', () => {
      progressBar.style.backgroundColor = '#e74c3c'
      percentage.textContent = '失败'
      alert(`文件 ${file.name} 上传失败`)
    })

    xhr.open('POST', '/files/upload')
    xhr.setRequestHeader('X-CSRF-Token', document.querySelector('meta[name="csrf-token"]').content)
    xhr.send(formData)
  }

  /**
   * 检查所有文件是否上传完成
   * 当所有文件上传完成时刷新页面
   */
  checkAllFilesUploaded() {
    const progressFiles = this.progressTarget.querySelectorAll('.progress-file')
    const allComplete = Array.from(progressFiles).every(file => 
      file.querySelector('.progress-file-percentage').textContent === '完成'
    )

    if (allComplete) {
      const pathElements = Array.from(document.querySelectorAll('.breadcrumb-path a'))
        .map(a => a.textContent.trim())
        .filter(text => text !== '根目录')
      
      const currentPath = pathElements.length ? '/' + pathElements.join('/') : '/'

      setTimeout(() => {
        this.progressTarget.style.display = 'none'
        window.Turbo.visit(`/files?path=${encodeURIComponent(currentPath)}`, { action: "replace" })
      }, 1000)
    }
  }
} 
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
      console.log('Cut controller received files:', this.selectedFiles)
    })
  }

  cut() {
    console.log('Cut method called, selected files:', this.selectedFiles)
    
    if (!this.selectedFiles || this.selectedFiles.length === 0) {
      alert('请先选择要剪切的文件')
      return
    }

    const files = this.selectedFiles.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory,
      path: file.path
    }))

    const clipboardData = {
      files,
      operation: 'cut'
    }

    this.clipboardValue = JSON.stringify(clipboardData)

    // 触发剪切事件
    const event = new CustomEvent('fileCut', {
      detail: clipboardData
    })
    document.dispatchEvent(event)

    alert(`已剪切 ${files.length} 个文件`)
  }
} 
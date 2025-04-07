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
      alert('请先选择要复制的文件')
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

    alert(`已复制 ${files.length} 个文件`)
  }
} 
import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.setupEventListeners()
    // 从 localStorage 恢复剪贴板数据
    const savedClipboard = localStorage.getItem('fileClipboard')
    if (savedClipboard) {
      this.clipboard = JSON.parse(savedClipboard)
    }
  }

  setupEventListeners() {
    // 监听复制和剪切事件
    document.addEventListener('fileCopied', (event) => {
      console.log('Paste controller received copy event:', event.detail)
      this.clipboard = event.detail
      // 保存到 localStorage
      localStorage.setItem('fileClipboard', JSON.stringify(event.detail))
    })
    document.addEventListener('fileCut', (event) => {
      console.log('Paste controller received cut event:', event.detail)
      this.clipboard = event.detail
      // 保存到 localStorage
      localStorage.setItem('fileClipboard', JSON.stringify(event.detail))
    })
  }

  async paste() {
    console.log('Paste method called, clipboard:', this.clipboard)
    
    if (!this.clipboard || !this.clipboard.files || this.clipboard.files.length === 0) {
      alert('请先复制或剪切文件')
      return
    }

    const currentPath = this.getCurrentPath()
    console.log('Current path:', currentPath)

    try {
      // 首先检查目标文件夹中是否存在同名文件
      const response = await fetch('/files/check_duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          files: this.clipboard.files,
          targetPath: currentPath
        })
      })

      const result = await response.json()
      console.log('Duplicate check result:', result)

      if (result.duplicate_files && result.duplicate_files.length > 0) {
        // 处理重名文件
        const action = await this.handleDuplicateFiles(result.duplicate_files)
        console.log('Selected action:', action)
        if (action) {
          // 重新发送请求，带上处理方式
          await this.pasteWithAction(action)
        }
        return
      }

      // 如果没有重名文件，继续正常的粘贴操作
      console.log('Sending paste request...')
      const pasteResponse = await fetch('/files/paste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          files: this.clipboard.files,
          targetPath: currentPath,
          operation: this.clipboard.operation
        })
      })

      console.log('Response status:', pasteResponse.status)
      const pasteResult = await pasteResponse.json()
      console.log('Response result:', pasteResult)

      if (pasteResponse.ok) {
        // 如果是剪切操作，清空剪贴板
        if (this.clipboard.operation === 'cut') {
          this.clipboard = null
          localStorage.removeItem('fileClipboard')
        }
        // 在当前文件夹刷新
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.set('path', currentPath)
        window.Turbo.visit(currentUrl.toString(), { action: "replace" })
      } else {
        alert(pasteResult.error || '粘贴失败')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('粘贴文件时发生错误')
    }
  }

  async pasteWithAction(action) {
    const currentPath = this.getCurrentPath()
    console.log('Pasting with action:', action)
    try {
      const response = await fetch('/files/paste', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          files: this.clipboard.files,
          targetPath: currentPath,
          operation: this.clipboard.operation,
          action: action
        })
      })

      console.log('Response status:', response.status)
      const result = await response.json()
      console.log('Response result:', result)

      if (response.ok) {
        // 如果是剪切操作，清空剪贴板
        if (this.clipboard.operation === 'cut') {
          this.clipboard = null
          localStorage.removeItem('fileClipboard')
        }
        // 在当前文件夹刷新
        const currentUrl = new URL(window.location.href)
        currentUrl.searchParams.set('path', currentPath)
        window.Turbo.visit(currentUrl.toString(), { action: "replace" })
      } else {
        alert(result.error || '粘贴失败')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('粘贴文件时发生错误')
    }
  }

  async handleDuplicateFiles(duplicateFiles) {
    console.log('Showing duplicate files dialog...')
    const fileList = duplicateFiles.join('\n')
    const message = `以下文件已存在：\n${fileList}\n\n请选择处理方式：\n1. 替换\n2. 跳过\n3. 同时存在`
    
    const choice = await this.showChoiceDialog(message)
    console.log('User choice:', choice)
    switch (choice) {
      case 1:
        return 'replace'
      case 2:
        return 'skip'
      case 3:
        return 'rename'
      default:
        return null
    }
  }

  showChoiceDialog(message) {
    return new Promise((resolve) => {
      console.log('Creating choice dialog...')
      const dialog = document.createElement('div')
      dialog.className = 'choice-dialog'
      dialog.innerHTML = `
        <div class="choice-dialog-content">
          <div class="choice-dialog-message">${message.replace(/\n/g, '<br>')}</div>
          <div class="choice-dialog-buttons">
            <button class="choice-dialog-button" data-choice="1">替换</button>
            <button class="choice-dialog-button" data-choice="2">跳过</button>
            <button class="choice-dialog-button" data-choice="3">同时存在</button>
          </div>
        </div>
      `

      // 添加样式
      const style = document.createElement('style')
      style.textContent = `
        .choice-dialog {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
        }
        .choice-dialog-content {
          background: white;
          padding: 30px;
          border-radius: 16px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
          max-width: 500px;
          width: 90%;
        }
        .choice-dialog-message {
          margin-bottom: 30px;
          white-space: pre-line;
          font-size: 18px;
          line-height: 1.6;
          color: #333;
        }
        .choice-dialog-buttons {
          display: flex;
          justify-content: center;
          gap: 20px;
        }
        .choice-dialog-button {
          padding: 12px 24px;
          border: none;
          border-radius: 8px;
          cursor: pointer;
          font-size: 16px;
          font-weight: 500;
          transition: all 0.2s ease;
          min-width: 100px;
        }
        .choice-dialog-button[data-choice="1"] {
          background: #dc3545;
          color: white;
        }
        .choice-dialog-button[data-choice="2"] {
          background: #6c757d;
          color: white;
        }
        .choice-dialog-button[data-choice="3"] {
          background: #28a745;
          color: white;
        }
        .choice-dialog-button:hover {
          transform: translateY(-2px);
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        }
        .choice-dialog-button[data-choice="1"]:hover {
          background: #c82333;
        }
        .choice-dialog-button[data-choice="2"]:hover {
          background: #5a6268;
        }
        .choice-dialog-button[data-choice="3"]:hover {
          background: #218838;
        }
      `
      document.head.appendChild(style)

      // 添加事件监听
      dialog.addEventListener('click', (e) => {
        if (e.target.classList.contains('choice-dialog-button')) {
          const choice = parseInt(e.target.dataset.choice)
          console.log('Dialog button clicked:', choice)
          document.body.removeChild(dialog)
          document.head.removeChild(style)
          resolve(choice)
        }
      })

      document.body.appendChild(dialog)
      console.log('Choice dialog added to document')
    })
  }

  getCurrentPath() {
    const pathElements = Array.from(document.querySelectorAll('.breadcrumb-path a'))
      .map(a => a.textContent.trim())
      .filter(text => text !== '根目录')
    
    return pathElements.length ? '/' + pathElements.join('/') : '/'
  }
} 
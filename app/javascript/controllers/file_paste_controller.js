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

  async paste(event) {
    event.preventDefault()
    console.log('Paste method called, clipboard:', this.clipboard)
    
    if (!this.clipboard) {
      this.showToast('请先复制或剪切文件', 'error')
      return
    }

    const currentPath = this.getCurrentPath()
    console.log('Current path:', currentPath)

    try {
      // 先检查是否有重名文件
      const checkResponse = await fetch('/files/check_duplicates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({
          targetPath: currentPath,
          files: this.clipboard.files
        })
      })

      if (checkResponse.status === 409) {
        const result = await checkResponse.json()
        console.log('Duplicate check result:', result)
        
        if (result.duplicate_files && result.duplicate_files.length > 0) {
          const action = await this.handleDuplicateFiles(result.duplicate_files)
          console.log('Selected action:', action)
          if (!action) return // 用户取消了操作

          // 如果用户选择替换，检查源文件和目标文件是否相同
          if (action === 'replace') {
            const sourceFiles = this.clipboard.files
            const isSameLocation = sourceFiles.every(file => {
              const sourcePath = file.path
              const targetPath = currentPath === '/' ? `/${file.name}` : `${currentPath}/${file.name}`
              return sourcePath === targetPath
            })

            if (isSameLocation) {
              this.showToast('源文件和目标位置相同，无需替换', 'info')
              return
            }
          }
          
          // 执行粘贴操作
          const requestBody = {
            targetPath: currentPath,
            files: this.clipboard.files,
            operation: this.clipboard.operation,
            fileAction: action
          }
          console.log('Sending paste request:', requestBody)

          const response = await fetch('/files/paste', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
            },
            body: JSON.stringify(requestBody)
          })

          if (!response.ok) {
            throw new Error('粘贴失败')
          }

          const pasteResult = await response.json()
          console.log('Paste result:', pasteResult)

          // 显示结果消息
          this.showToast(pasteResult.message, pasteResult.pasted.length > 0 ? 'success' : 'info')

          // 如果是剪切操作，清空剪贴板
          if (this.clipboard.operation === 'cut') {
            this.clipboard = null
            localStorage.removeItem('fileClipboard')
          }

          // 触发刷新事件
          const refreshEvent = new CustomEvent('refresh', {
            detail: { path: currentPath }
          })
          document.dispatchEvent(refreshEvent)
        }
      } else {
        // 没有重名文件，直接执行粘贴
        const requestBody = {
          targetPath: currentPath,
          files: this.clipboard.files,
          operation: this.clipboard.operation
        }
        console.log('Sending paste request:', requestBody)

        const response = await fetch('/files/paste', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
          },
          body: JSON.stringify(requestBody)
        })

        if (!response.ok) {
          throw new Error('粘贴失败')
        }

        const result = await response.json()
        console.log('Paste result:', result)

        // 显示结果消息
        this.showToast(result.message, result.pasted.length > 0 ? 'success' : 'info')

        // 如果是剪切操作，清空剪贴板
        if (this.clipboard.operation === 'cut') {
          this.clipboard = null
          localStorage.removeItem('fileClipboard')
        }

        // 触发刷新事件
        const refreshEvent = new CustomEvent('refresh', {
          detail: { path: currentPath }
        })
        document.dispatchEvent(refreshEvent)
      }
    } catch (error) {
      console.error('Paste error:', error)
      this.showToast(error.message, 'error')
    }
  }

  async handleDuplicateFiles(duplicateFiles) {
    console.log('Showing duplicate files dialog...')
    const fileList = Array.isArray(duplicateFiles) 
      ? duplicateFiles.map(file => `- ${file}`).join('\n')
      : duplicateFiles

    const choice = await this.showDuplicateChoiceDialog(fileList)
    console.log('User choice:', choice)
    
    // 根据用户的选择返回对应的action
    switch (choice) {
      case 'replace':
        console.log('Selected action: replace')
        return 'replace'
      case 'skip':
        console.log('Selected action: skip')
        return 'skip'
      case 'rename':
        console.log('Selected action: rename')
        return 'rename'
      default:
        console.log('No valid choice selected, defaulting to skip')
        return 'skip'
    }
  }

  async showDuplicateChoiceDialog(duplicateFiles) {
    console.log('Showing duplicate files dialog...')
    const fileList = Array.isArray(duplicateFiles) 
      ? duplicateFiles.map(file => `- ${file}`).join('\n')
      : duplicateFiles

    return new Promise((resolve) => {
      const dialog = document.createElement('div')
      dialog.className = 'choice-dialog'
      dialog.innerHTML = `
        <div class="choice-dialog-content">
          <h3>发现重名文件</h3>
          <p>以下文件已存在：</p>
          <pre>${fileList}</pre>
          <p>请选择操作：</p>
          <div class="choice-dialog-buttons">
            <button class="choice-dialog-button" data-value="replace">替换</button>
            <button class="choice-dialog-button" data-value="skip">跳过</button>
            <button class="choice-dialog-button" data-value="rename">重命名</button>
          </div>
        </div>
      `

      // 添加点击遮罩层关闭对话框的功能
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          document.body.removeChild(dialog)
          resolve('skip') // 点击遮罩层时默认选择跳过
        }
      })

      document.body.appendChild(dialog)

      // 处理按钮点击
      dialog.querySelectorAll('.choice-dialog-button').forEach(button => {
        button.addEventListener('click', () => {
          const value = button.dataset.value
          document.body.removeChild(dialog)
          resolve(value)
        })
      })
    })
  }

  getCurrentPath() {
    const pathElements = Array.from(document.querySelectorAll('.breadcrumb-path a'))
      .map(a => a.textContent.trim())
      .filter(text => text !== '根目录')
    
    return pathElements.length ? '/' + pathElements.join('/') : '/'
  }

  showToast(message, type = 'info') {
    // 创建toast元素
    const toast = document.createElement('div')
    toast.className = `toast toast-${type}`
    toast.textContent = message

    // 添加样式
    const style = document.createElement('style')
    style.textContent = `
      .toast {
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 24px;
        border-radius: 8px;
        color: white;
        font-size: 14px;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      }
      .toast-success {
        background-color: #28a745;
      }
      .toast-error {
        background-color: #dc3545;
      }
      .toast-info {
        background-color: #17a2b8;
      }
      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }
      @keyframes fadeOut {
        from {
          opacity: 1;
        }
        to {
          opacity: 0;
        }
      }
    `
    document.head.appendChild(style)

    // 添加到页面
    document.body.appendChild(toast)

    // 3秒后自动消失
    setTimeout(() => {
      toast.style.animation = 'fadeOut 0.3s ease-out forwards'
      setTimeout(() => {
        // 检查元素是否仍然存在
        if (document.body.contains(toast)) {
          document.body.removeChild(toast)
        }
        if (document.head.contains(style)) {
          document.head.removeChild(style)
        }
      }, 300)
    }, 3000)
  }
} 
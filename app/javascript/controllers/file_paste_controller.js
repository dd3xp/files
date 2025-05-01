import { Controller } from "@hotwired/stimulus"

/**
 * 文件粘贴控制器
 * 处理文件粘贴操作
 */
export default class extends Controller {
  connect() {
    this.setupEventListeners()
    const savedClipboard = localStorage.getItem('fileClipboard')
    if (savedClipboard) {
      this.clipboard = JSON.parse(savedClipboard)
    }
  }

  /**
   * 设置事件监听器
   * 监听文件复制和剪切事件
   */
  setupEventListeners() {
    document.addEventListener('fileCopied', (event) => {
      console.log('Paste controller received copy event:', event.detail)
      this.clipboard = event.detail
      localStorage.setItem('fileClipboard', JSON.stringify(event.detail))
    })

    document.addEventListener('fileCut', (event) => {
      console.log('Paste controller received cut event:', event.detail)
      this.clipboard = event.detail
      localStorage.setItem('fileClipboard', JSON.stringify(event.detail))
    })
  }

  /**
   * 粘贴文件
   * @param {Event} event - 粘贴事件对象
   */
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
          if (!action) return

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

          this.showToast(pasteResult.message, pasteResult.pasted.length > 0 ? 'success' : 'info')

          if (this.clipboard.operation === 'cut') {
            this.clipboard = null
            localStorage.removeItem('fileClipboard')
          }

          const refreshEvent = new CustomEvent('refresh', {
            detail: { path: currentPath }
          })
          document.dispatchEvent(refreshEvent)
        }
      } else {
        const requestBody = {
          targetPath: currentPath,
          files: this.clipboard.files,
          operation: this.clipboard.operation,
          fileAction: 'replace'
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
          const errorData = await response.json()
          throw new Error(errorData.message || '粘贴失败')
        }

        const result = await response.json()
        console.log('Paste result:', result)

        if (result.failed && result.failed.length > 0) {
          this.showToast(`粘贴失败: ${result.failed.join(', ')}`, 'error')
        } else {
          this.showToast(result.message, result.pasted.length > 0 ? 'success' : 'info')
        }

        if (this.clipboard.operation === 'cut') {
          this.clipboard = null
          localStorage.removeItem('fileClipboard')
        }

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

  /**
   * 处理重名文件
   * @param {Array} duplicateFiles - 重名文件列表
   * @returns {Promise<string>} - 用户选择的操作
   */
  async handleDuplicateFiles(duplicateFiles) {
    console.log('Showing duplicate files dialog...')
    const fileList = Array.isArray(duplicateFiles) 
      ? duplicateFiles.map(file => `- ${file}`).join('\n')
      : duplicateFiles

    const choice = await this.showDuplicateChoiceDialog(fileList)
    console.log('User choice:', choice)
    
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

  /**
   * 显示重名文件选择对话框
   * @param {string} duplicateFiles - 重名文件列表
   * @returns {Promise<string>} - 用户选择的操作
   */
  async showDuplicateChoiceDialog(duplicateFiles) {
    console.log('Showing duplicate files dialog...')
    const fileList = Array.isArray(duplicateFiles) 
      ? duplicateFiles.map(file => `- ${file}`).join('\n')
      : duplicateFiles

    return new Promise((resolve) => {
      const dialog = document.createElement('div')
      dialog.className = 'choice-dialog'
      
      const template = document.getElementById('duplicate-choice-dialog-template')
      const content = template.content.cloneNode(true)
      
      content.querySelector('#duplicate-files-list').textContent = fileList
      
      dialog.addEventListener('click', (e) => {
        if (e.target === dialog) {
          document.body.removeChild(dialog)
          resolve('skip')
        }
      })

      dialog.appendChild(content)
      document.body.appendChild(dialog)

      dialog.querySelectorAll('.choice-dialog-button').forEach(button => {
        button.addEventListener('click', () => {
          const value = button.dataset.value
          document.body.removeChild(dialog)
          resolve(value)
        })
      })
    })
  }

  /**
   * 获取当前路径
   * @returns {string} - 当前路径
   */
  getCurrentPath() {
    const pathElements = Array.from(document.querySelectorAll('.breadcrumb-path a'))
      .map(a => a.textContent.trim())
      .filter(text => text !== '根目录')
    
    return pathElements.length ? '/' + pathElements.join('/') : '/'
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
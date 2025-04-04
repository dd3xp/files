import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["checkbox"]

  connect() {
    // 初始化时检查是否已选中
    this.toggleSelectionClass()
  }

  toggleSelection() {
    this.toggleSelectionClass()
    this.updateSelectedFiles()
  }

  toggleSelectionClass() {
    if (this.checkboxTarget.checked) {
      this.element.classList.add('selected')
    } else {
      this.element.classList.remove('selected')
    }
  }

  updateSelectedFiles() {
    // 获取所有选中的文件
    const selectedFiles = Array.from(document.querySelectorAll('.file-checkbox:checked'))
      .map(checkbox => {
        const fileItem = checkbox.closest('.file-item')
        const fileName = fileItem.querySelector('.file-name').textContent
        const isDirectory = fileItem.querySelector('.fa-folder') !== null
        return {
          name: fileName,
          isDirectory: isDirectory,
          element: fileItem
        }
      })

    // 触发自定义事件，通知其他控制器选中的文件已更新
    const event = new CustomEvent('selectedFilesUpdated', {
      detail: { selectedFiles }
    })
    document.dispatchEvent(event)
  }
} 
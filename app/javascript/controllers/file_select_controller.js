import { Controller } from "@hotwired/stimulus"

/**
 * 文件选择控制器
 * 处理文件的选中状态和多选操作
 */
export default class extends Controller {
  static targets = ["checkbox"]

  /**
   * 初始化
   * 检查文件的选中状态并更新样式
   */
  connect() {
    this.toggleSelectionClass()
  }

  /**
   * 切换选中状态
   * 更新样式并通知其他组件
   */
  toggleSelection() {
    this.toggleSelectionClass()
    this.updateSelectedFiles()
  }

  /**
   * 更新选中状态的样式
   * 根据复选框状态添加或移除选中样式
   */
  toggleSelectionClass() {
    if (this.checkboxTarget.checked) {
      this.element.classList.add('selected')
    } else {
      this.element.classList.remove('selected')
    }
  }

  /**
   * 更新选中的文件列表
   * 收集所有选中文件的信息并发送更新事件
   */
  updateSelectedFiles() {
    const selectedFiles = Array.from(document.querySelectorAll('.file-checkbox:checked'))
      .map(checkbox => {
        const fileItem = checkbox.closest('.file-item')
        const fileName = fileItem.querySelector('.file-text').textContent
        const isDirectory = fileItem.querySelector('.fa-folder') !== null
        const filePath = checkbox.value
        return {
          name: fileName,
          isDirectory: isDirectory,
          path: filePath,
          element: fileItem
        }
      })

    console.log('Selected files:', selectedFiles)

    const event = new CustomEvent('selectedFilesUpdated', {
      detail: { files: selectedFiles }
    })
    document.dispatchEvent(event)
  }
} 
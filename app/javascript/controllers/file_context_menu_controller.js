import { Controller } from "@hotwired/stimulus"

/**
 * 文件右键菜单控制器
 * 处理文件列表中的右键菜单显示和操作
 */
export default class extends Controller {
  static targets = ["menu", "pasteButton"]

  /**
   * 初始化控制器
   * 在控制器连接到DOM时调用
   */
  connect() {
    this.setupEventListeners()
    console.log('Context menu controller connected')
  }

  /**
   * 设置事件监听器
   * 监听文件选择更新和右键点击事件
   */
  setupEventListeners() {
    document.addEventListener('selectedFilesUpdated', (event) => {
      this.selectedFiles = event.detail.files
      console.log('Context menu received files:', this.selectedFiles)
    })

    this.element.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      this.showMenu(event)
    })

    document.addEventListener('click', this.hideMenu.bind(this))
    document.addEventListener('selectedFilesUpdated', this.updateMenuButtons.bind(this))
  }

  /**
   * 显示右键菜单
   * @param {Event} event - 右键点击事件对象
   */
  showMenu(event) {
    event.preventDefault()
    event.stopPropagation()

    const menu = this.menuTarget
    menu.style.display = 'block'
    menu.style.left = `${event.pageX}px`
    menu.style.top = `${event.pageY}px`

    this.updateMenuButtons()
  }

  /**
   * 隐藏右键菜单
   */
  hideMenu() {
    this.menuTarget.style.display = 'none'
  }

  /**
   * 更新菜单项显示状态
   * 根据文件选择状态显示或隐藏菜单项
   */
  updateMenuButtons() {
    console.log('Updating menu buttons')
    const selectedFiles = document.querySelectorAll('.file-checkbox:checked')
    const hasSelectedFiles = selectedFiles.length > 0
    console.log('Selected files:', selectedFiles.length)

    if (this.hasPasteButtonTarget) {
      console.log('Paste button found, updating visibility')
      this.pasteButtonTarget.style.display = hasSelectedFiles ? 'block' : 'none'
    } else {
      console.log('Paste button target not found')
    }
  }

  disconnect() {
    document.removeEventListener('click', this.hideMenu.bind(this))
    document.removeEventListener('selectedFilesUpdated', this.updateMenuButtons.bind(this))
  }
} 
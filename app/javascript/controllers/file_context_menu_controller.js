import { Controller } from "@hotwired/stimulus"

/**
 * 文件右键菜单控制器
 * 处理文件列表中的右键菜单显示和操作
 */
export default class extends Controller {
  static targets = ["menu"]

  /**
   * 初始化控制器
   * 在控制器连接到DOM时调用
   */
  connect() {
    this.setupEventListeners()
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
      this.showContextMenu(event)
    })

    document.addEventListener('click', () => {
      this.hideContextMenu()
    })
  }

  /**
   * 显示右键菜单
   * @param {Event} event - 右键点击事件对象
   */
  showContextMenu(event) {
    const menu = this.menuTarget
    menu.style.display = 'block'
    
    const x = event.clientX
    const y = event.clientY
    const menuWidth = menu.offsetWidth
    const menuHeight = menu.offsetHeight
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    const left = x + menuWidth > windowWidth ? x - menuWidth : x
    const top = y + menuHeight > windowHeight ? y - menuHeight : y

    menu.style.left = `${left}px`
    menu.style.top = `${top}px`

    this.updateMenuItems()
  }

  /**
   * 隐藏右键菜单
   */
  hideContextMenu() {
    this.menuTarget.style.display = 'none'
  }

  /**
   * 更新菜单项显示状态
   * 根据文件选择状态显示或隐藏菜单项
   */
  updateMenuItems() {
    const hasSelection = this.selectedFiles && this.selectedFiles.length > 0
    console.log('Updating menu items, has selection:', hasSelection)

    const copyItem = this.menuTarget.querySelector('[data-action="click->file-copy#copy"]')
    const cutItem = this.menuTarget.querySelector('[data-action="click->file-cut#cut"]')
    const deleteItem = this.menuTarget.querySelector('[data-action="click->file-delete#delete"]')
    const pasteItem = this.menuTarget.querySelector('[data-action="click->file-paste#paste"]')

    if (copyItem) copyItem.style.display = hasSelection ? 'flex' : 'none'
    if (cutItem) cutItem.style.display = hasSelection ? 'flex' : 'none'
    if (deleteItem) deleteItem.style.display = hasSelection ? 'flex' : 'none'
    if (pasteItem) pasteItem.style.display = 'flex'
  }
} 
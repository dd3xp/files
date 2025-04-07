import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["menu"]

  connect() {
    this.setupEventListeners()
  }

  setupEventListeners() {
    // 监听文件选择更新事件
    document.addEventListener('selectedFilesUpdated', (event) => {
      this.selectedFiles = event.detail.files
      console.log('Context menu received files:', this.selectedFiles)
    })

    // 监听右键点击事件
    this.element.addEventListener('contextmenu', (event) => {
      event.preventDefault()
      this.showContextMenu(event)
    })

    // 点击其他地方关闭菜单
    document.addEventListener('click', () => {
      this.hideContextMenu()
    })
  }

  showContextMenu(event) {
    const menu = this.menuTarget
    menu.style.display = 'block'
    
    // 设置菜单位置
    const x = event.clientX
    const y = event.clientY
    const menuWidth = menu.offsetWidth
    const menuHeight = menu.offsetHeight
    const windowWidth = window.innerWidth
    const windowHeight = window.innerHeight

    // 确保菜单不会超出窗口边界
    const left = x + menuWidth > windowWidth ? x - menuWidth : x
    const top = y + menuHeight > windowHeight ? y - menuHeight : y

    menu.style.left = `${left}px`
    menu.style.top = `${top}px`

    // 更新菜单选项
    this.updateMenuItems()
  }

  hideContextMenu() {
    this.menuTarget.style.display = 'none'
  }

  updateMenuItems() {
    const hasSelection = this.selectedFiles && this.selectedFiles.length > 0
    console.log('Updating menu items, has selection:', hasSelection)

    // 更新菜单项的显示状态
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
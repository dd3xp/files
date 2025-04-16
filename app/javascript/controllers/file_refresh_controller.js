import { Controller } from "@hotwired/stimulus"

/**
 * 文件列表刷新控制器
 * 处理文件列表的刷新操作
 */
export default class extends Controller {
  static targets = ["button"]

  /**
   * 初始化
   * 监听其他组件发出的刷新事件
   */
  connect() {
    document.addEventListener('refresh', (event) => {
      this.refreshWithPath(event.detail.path)
    })
  }

  /**
   * 刷新当前目录
   * 添加刷新按钮旋转动画
   */
  refresh() {
    const refreshIcon = document.querySelector('.refresh-btn i')
    refreshIcon.style.transition = 'transform 1s'
    refreshIcon.style.transform = 'rotate(360deg)'

    const pathElements = Array.from(document.querySelectorAll('.breadcrumb-path a'))
      .map(a => a.textContent.trim())
      .filter(text => text !== '根目录')
    
    const currentPath = pathElements.length ? '/' + pathElements.join('/') : '/'

    window.Turbo.visit(`/files?path=${encodeURIComponent(currentPath)}`, { action: "replace" })
    
    setTimeout(() => {
      refreshIcon.style.transform = 'rotate(0deg)'
    }, 1000)
  }

  /**
   * 刷新指定路径
   * @param {string} path - 要刷新的目录路径
   */
  refreshWithPath(path) {
    const refreshIcon = document.querySelector('.refresh-btn i')
    refreshIcon.style.transition = 'transform 1s'
    refreshIcon.style.transform = 'rotate(360deg)'

    window.Turbo.visit(`/files?path=${encodeURIComponent(path)}`, { action: "replace" })
    
    setTimeout(() => {
      refreshIcon.style.transform = 'rotate(0deg)'
    }, 1000)
  }
} 
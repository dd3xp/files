import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  refresh() {
    // 添加旋转动画
    const refreshIcon = document.querySelector('.refresh-btn i')
    refreshIcon.style.transition = 'transform 1s'
    refreshIcon.style.transform = 'rotate(360deg)'

    // 使用全局的 Turbo 刷新当前页面
    window.Turbo.visit(window.location.href, { action: "replace" })

    // 1秒后重置旋转
    setTimeout(() => {
      refreshIcon.style.transform = 'rotate(0deg)'
    }, 1000)
  }
} 
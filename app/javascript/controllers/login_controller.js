import { Controller } from "@hotwired/stimulus"

/**
 * 登录控制器
 * 处理用户登录、表单验证和提示消息
 */
export default class extends Controller {
  static targets = ["form", "toast", "toastMessage"]

  /**
   * 初始化控制器
   * 在控制器连接到 DOM 时自动调用
   * 设置事件监听和检查 URL 参数
   */
  connect() {
    this.setupEventListeners()
    this.checkUrlParams()
  }

  /**
   * 设置表单提交事件监听
   * 监听登录表单的提交事件
   */
  setupEventListeners() {
    this.formTarget.addEventListener('submit', this.handleSubmit.bind(this))
  }

  /**
   * 验证输入字段
   * @param {Event} event - 输入事件对象
   * 检查字段是否为空并显示验证状态
   */
  validateField(event) {
    const field = event.target
    if (field.value.trim() === '') {
      field.classList.add('is-invalid')
    } else {
      field.classList.remove('is-invalid')
    }
  }

  /**
   * 检查 URL 参数
   * 从 URL 中获取错误参数并显示错误消息
   */
  checkUrlParams() {
    const urlParams = new URLSearchParams(window.location.search)
    const error = urlParams.get('error')
    
    if (error) {
      this.showToast('密码错误，请重试', 'error')
    }
  }

  /**
   * 处理表单提交
   * @param {Event} event - 提交事件对象
   * 发送登录请求并处理响应
   */
  async handleSubmit(event) {
    event.preventDefault()
    
    try {
      const response = await fetch(this.formTarget.action, {
        method: 'POST',
        body: new FormData(this.formTarget),
        headers: {
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      })

      if (response.ok) {
        if (response.redirected) {
          this.showToast('登录成功', 'success')
          setTimeout(() => {
            window.location.href = response.url
          }, 1000)
          return
        }
        
        try {
          const data = await response.json()
          if (data && data.success) {
            this.showToast('登录成功', 'success')
            setTimeout(() => {
              window.location.href = data.redirect_url || '/'
            }, 1000)
            return
          }
        } catch (e) {
          this.showToast('登录成功', 'success')
          setTimeout(() => {
            window.location.href = response.url
          }, 1000)
          return
        }
      } else {
        const data = await response.json()
        if (data && data.error) {
          this.showToast(data.error, 'error')
        } else {
          this.showToast('登录失败，请重试', 'error')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      this.showToast('登录失败，请重试', 'error')
    }
  }

  /**
   * 显示提示消息
   * @param {string} message - 提示消息内容
   * @param {string} type - 提示类型（success/error/info）
   * 在页面顶部显示临时提示框
   */
  showToast(message, type) {
    this.toastMessageTarget.textContent = message
    
    const iconElement = this.toastTarget.querySelector('i')
    if (type === 'success') {
      iconElement.className = 'fas fa-check-circle'
    } else if (type === 'error') {
      iconElement.className = 'fas fa-exclamation-circle'
    } else {
      iconElement.className = 'fas fa-info-circle'
    }
    
    this.toastTarget.classList.remove('success', 'error')
    this.toastTarget.classList.add(type, 'show')
    
    setTimeout(() => {
      this.toastTarget.classList.remove('show')
    }, 3000)
  }
} 
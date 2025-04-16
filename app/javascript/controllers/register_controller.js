import { Controller } from "@hotwired/stimulus"

/**
 * 用户注册控制器
 * 处理用户注册表单的提交和验证
 */
export default class extends Controller {
  static targets = ["form", "password", "passwordConfirmation", "toast", "toastMessage"]

  /**
   * 初始化控制器
   * 在控制器连接到DOM时调用
   */
  connect() {
    this.setupEventListeners()
  }

  /**
   * 设置表单提交事件监听
   * 监听表单的submit事件
   */
  setupEventListeners() {
    this.formTarget.addEventListener('submit', this.handleSubmit.bind(this))
  }

  /**
   * 验证输入字段
   * @param {Event} event - 输入事件对象，包含触发事件的输入框信息
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
   * 处理表单提交
   * @param {Event} event - 提交事件对象，包含表单提交的信息
   */
  async handleSubmit(event) {
    event.preventDefault()
    
    const password = this.passwordTarget.value
    const passwordConfirmation = this.passwordConfirmationTarget.value
    
    if (password !== passwordConfirmation) {
      this.showToast('两次输入的密码不匹配', 'error')
      return
    }
    
    if (password.length < 6) {
      this.showToast('密码长度至少需要6个字符', 'error')
      return
    }
    
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
          this.showToast('注册成功', 'success')
          setTimeout(() => {
            window.location.href = response.url
          }, 1000)
          return
        }
        
        try {
          const data = await response.json()
          if (data && data.success) {
            this.showToast('注册成功', 'success')
            setTimeout(() => {
              window.location.href = data.redirect_url || '/'
            }, 1000)
            return
          }
        } catch (e) {
          this.showToast('注册成功', 'success')
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
          this.showToast('注册失败，请重试', 'error')
        }
      }
    } catch (error) {
      console.error('Error:', error)
      this.showToast('注册失败，请重试', 'error')
    }
  }

  /**
   * 显示提示消息
   * @param {string} message - 要显示的消息内容
   * @param {string} type - 消息类型，可以是'success'或'error'
   */
  showToast(message, type) {
    this.toastMessageTarget.textContent = message
    this.toastTarget.classList.remove('success', 'error')
    this.toastTarget.classList.add(type, 'show')
    
    setTimeout(() => {
      this.toastTarget.classList.remove('show')
    }, 3000)
  }
} 
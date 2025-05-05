import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["rootPathInput", "newPassword", "confirmPassword"]

  /*
  * 应用新路径
  */
  async applyNewPath() {
    const newPath = this.rootPathInputTarget.value.trim()
    
    if (!newPath) {
      this.showToast('请输入有效的路径', 'error')
      return
    }

    try {
      // 检查目录访问权限
      const checkResponse = await fetch('/settings/check_directory_access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({ path: newPath })
      })

      const checkResult = await checkResponse.json()
      if (checkResult.success) {
        // 更新根目录
        const updateResponse = await fetch('/settings/update_root_path', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
          },
          body: JSON.stringify({ path: newPath })
        })

        const updateResult = await updateResponse.json()
        if (updateResult.success) {
          this.rootPathInputTarget.value = updateResult.new_path
          this.showToast('根目录已更新', 'success')
          // 刷新页面以确保配置更新生效
          window.location.reload()
        } else {
          this.showToast(updateResult.message, 'error')
        }
      } else {
        this.showToast(checkResult.message, 'error')
      }
    } catch (error) {
      console.error('更新路径失败:', error)
      this.showToast(error.message || '更新路径失败', 'error')
    }
  }

  async restoreDefaultPath() {
    try {
      const response = await fetch('/settings/restore_default_path', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      })

      const result = await response.json()
      if (result.success) {
        this.rootPathInputTarget.value = result.new_path
        this.showToast('已恢复默认根目录', 'success')
        // 刷新页面以确保配置更新生效
        window.location.reload()
      } else {
        this.showToast(result.message || '恢复默认路径失败', 'error')
      }
    } catch (error) {
      console.error('恢复默认路径失败:', error)
      this.showToast(error.message || '恢复默认路径失败', 'error')
    }
  }

  async updatePassword() {
    const newPassword = this.newPasswordTarget.value
    const confirmPassword = this.confirmPasswordTarget.value

    if (!newPassword || !confirmPassword) {
      this.showToast('请输入新密码和确认密码', 'error')
      return
    }

    if (newPassword.length < 6) {
      this.showToast('密码长度至少6位', 'error')
      return
    }

    if (newPassword !== confirmPassword) {
      this.showToast('两次输入的密码不一致', 'error')
      return
    }

    try {
      const response = await fetch('/settings/update_password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({ password: newPassword })
      })

      const result = await response.json()
      if (result.success) {
        this.showToast('密码更新成功', 'success')
        // 清空密码输入框
        this.newPasswordTarget.value = ''
        this.confirmPasswordTarget.value = ''
      } else {
        this.showToast(result.message || '密码更新失败', 'error')
      }
    } catch (error) {
      console.error('更新密码失败:', error)
      this.showToast(error.message || '更新密码失败', 'error')
    }
  }

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

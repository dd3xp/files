import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["rootPath", "selectDirectory"]

  connect() {
    this.setupEventListeners()
  }

  setupEventListeners() {
    // 监听按钮点击事件
  }

  async selectDirectory() {
    try {
      // 使用settings控制器打开文件夹选择对话框
      const response = await fetch('/settings/select_directory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        }
      });

      const result = await response.json();
      
      if (!result.success) {
        if (result.message) {
          console.log('目录选择取消:', result.message);
          return; // 用户取消选择，直接返回
        }
        throw new Error(result.message || '选择目录失败');
      }

      const selectedPath = result.output;
      if (!selectedPath) {
        console.log('未选择目录');
        return;
      }

      // 检查目录权限
      const checkResponse = await fetch('/settings/check_directory_access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
        },
        body: JSON.stringify({ path: selectedPath })
      });

      const checkResult = await checkResponse.json();
      if (checkResult.success) {
        // 直接更新根目录
        const updateResponse = await fetch('/settings/update_root_path', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]').content
          },
          body: JSON.stringify({ path: selectedPath })
        });

        const updateResult = await updateResponse.json();
        if (updateResult.success) {
          this.rootPathTarget.textContent = updateResult.new_path;
          alert('根目录已更新');
          // 刷新页面以确保配置更新生效
          window.location.reload();
        } else {
          alert(updateResult.message);
        }
      } else {
        alert(checkResult.message);
      }
    } catch (error) {
      console.error('选择目录失败:', error);
      alert('选择目录失败: ' + error.message);
    }
  }
}

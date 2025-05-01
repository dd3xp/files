class SettingsModel
  # 获取当前根目录的完整路径
  def self.get_current_root_path
    relative_path = Rails.application.config_for(:file_system)[:root_path]
    File.expand_path(relative_path, Rails.root)
  end

  # 选择目录
  def self.select_directory
    command = 'powershell -command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; $dialog.Description = \'选择根目录\'; if($dialog.ShowDialog() -eq \'OK\') { $dialog.SelectedPath }"'
    output = IO.popen(command, external_encoding: Encoding::UTF_8, internal_encoding: Encoding::UTF_8, &:read)
    
    if output.nil? || output.strip.empty?
      return { success: false, message: "未选择目录" }
    end
    
    { success: true, output: output.strip }
  rescue => e
    { success: false, message: "选择目录失败: #{e.message}" }
  end

  # 检查目录访问权限
  def self.check_directory_access(path)
    return { success: false, message: '目录不存在' } unless Dir.exist?(path)

    begin
      test_file = File.join(path, ".test_#{Time.now.to_i}")
      File.write(test_file, "test")
      File.delete(test_file)
      { success: true, message: '目录可访问且具有读写权限' }
    rescue Errno::EACCES => e
      { success: false, message: "无权限访问该目录，请选择其他目录或以管理员身份运行应用" }
    rescue => e
      { success: false, message: "检查目录权限时出错: #{e.message}" }
    end
  end

  # 更新根目录路径
  def self.update_root_path(new_path)
    return { success: false, message: '目录不存在' } unless Dir.exist?(new_path)

    begin
      config_file = Rails.root.join('config', 'file_system.yml')
      
      # 创建新的配置
      new_config = {
        'default' => {
          'root_path' => new_path
        },
        'development' => {
          'root_path' => new_path
        },
        'test' => {
          'root_path' => new_path
        },
        'production' => {
          'root_path' => new_path
        }
      }
      
      # 保存更新后的配置
      File.write(config_file, new_config.to_yaml)
      
      # 重新加载配置
      Rails.application.config_for(:file_system).clear
      Rails.application.config_for(:file_system).merge!(root_path: new_path)
      
      { success: true, message: '根目录已更新', new_path: new_path }
    rescue => e
      { success: false, message: "更新失败: #{e.message}" }
    end
  end
end

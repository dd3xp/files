require 'fileutils'

class SettingsModel
  # 获取当前根目录的完整路径
  def self.get_current_root_path
    begin
      config = Rails.application.config_for(:file_system)
      relative_path = config[:root_path]
      
      if relative_path.nil? || relative_path.empty?
        # 如果配置文件为空，使用默认的 public/root 目录
        default_path = File.expand_path('public/root', Rails.root)
        # 确保目录存在
        FileUtils.mkdir_p(default_path) unless Dir.exist?(default_path)
        return default_path
      end
      
      File.expand_path(relative_path, Rails.root)
    rescue => e
      # 如果读取配置失败，也使用默认路径
      default_path = File.expand_path('public/root', Rails.root)
      FileUtils.mkdir_p(default_path) unless Dir.exist?(default_path)
      default_path
    end
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

  def self.get_admin_password
    begin
      users_config = YAML.load_file(Rails.root.join('config', 'users.yml'), permitted_classes: [BCrypt::Password], aliases: true)
      return { success: false, message: '配置文件为空' } if users_config.nil?
      return { success: false, message: '配置文件格式错误' } unless users_config.is_a?(Hash)
      
      admin_data = users_config['dd3']
      
      if admin_data && admin_data['password_digest'].present?
        {
          success: true,
          password: admin_data['password_digest']
        }
      else
        {
          success: false,
          message: '未找到管理员账号或密码为空'
        }
      end
    rescue Errno::ENOENT
      {
        success: false,
        message: "找不到用户配置文件"
      }
    rescue Psych::SyntaxError
      {
        success: false,
        message: "用户配置文件格式错误"
      }
    rescue => e
      {
        success: false,
        message: "获取密码失败: #{e.message}"
      }
    end
  end

  def self.update_password(new_password)
    begin
      users_config = YAML.load_file(Rails.root.join('config', 'users.yml'), permitted_classes: [BCrypt::Password], aliases: true)
      return { success: false, message: '配置文件为空' } if users_config.nil?
      return { success: false, message: '配置文件格式错误' } unless users_config.is_a?(Hash)

      # 生成新的密码哈希
      password_digest = BCrypt::Password.create(new_password)

      # 更新配置
      users_config['dd3']['password_digest'] = password_digest

      # 保存更新后的配置
      File.write(Rails.root.join('config', 'users.yml'), users_config.to_yaml)

      {
        success: true,
        message: '密码已更新'
      }
    rescue Errno::ENOENT
      {
        success: false,
        message: "找不到用户配置文件"
      }
    rescue Psych::SyntaxError
      {
        success: false,
        message: "用户配置文件格式错误"
      }
    rescue => e
      {
        success: false,
        message: "更新密码失败: #{e.message}"
      }
    end
  end
end

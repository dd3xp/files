class SettingsController < ApplicationController
  def index
    @title = "设置"
    @message = "设置页面"
    relative_path = Rails.application.config_for(:file_system)[:root_path]
    @current_root_path = File.expand_path(relative_path, Rails.root)
  end

  def select_directory
    begin
      command = 'powershell -command "[Console]::OutputEncoding = [System.Text.Encoding]::UTF8; Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; $dialog.Description = \'选择根目录\'; if($dialog.ShowDialog() -eq \'OK\') { $dialog.SelectedPath }"'
      output = IO.popen(command, external_encoding: Encoding::UTF_8, internal_encoding: Encoding::UTF_8, &:read)
      
      if output.nil? || output.strip.empty?
        render json: { 
          success: false, 
          message: "未选择目录",
          output: nil 
        }, status: :unprocessable_entity
      else
        render json: { 
          success: true, 
          output: output.strip 
        }
      end
    rescue => e
      render json: { 
        success: false, 
        message: "选择目录失败: #{e.message}",
        output: nil 
      }, status: :unprocessable_entity
    end
  end

  def update_root_path
    new_path = params[:path]
    
    begin
      # 检查目录是否存在
      unless Dir.exist?(new_path)
        return render json: { 
          success: false, 
          message: '目录不存在' 
        }, status: :unprocessable_entity
      end

      # 更新配置文件
      config_file = Rails.root.join('config', 'file_system.yml')
      config = YAML.load_file(config_file, aliases: true)
      
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
      
      render json: { 
        success: true, 
        message: '根目录已更新',
        new_path: new_path
      }
    rescue => e
      render json: { 
        success: false, 
        message: "更新失败: #{e.message}" 
      }, status: :unprocessable_entity
    end
  end

  def check_directory_access
    path = params[:path]
    
    begin
      # 检查目录是否存在
      unless Dir.exist?(path)
        return render json: { 
          success: false, 
          message: '目录不存在' 
        }, status: :unprocessable_entity
      end
      
      # 检查读写权限
      begin
        # 尝试在目录中创建一个临时文件
        test_file = File.join(path, ".test_#{Time.now.to_i}")
        File.write(test_file, "test")
        File.delete(test_file)
        
        render json: { 
          success: true, 
          message: '目录可访问且具有读写权限' 
        }
      rescue Errno::EACCES => e
        render json: { 
          success: false, 
          message: "无权限访问该目录，请选择其他目录或以管理员身份运行应用" 
        }, status: :unprocessable_entity
      end
    rescue => e
      render json: { 
        success: false, 
        message: "检查目录权限时出错: #{e.message}" 
      }, status: :unprocessable_entity
    end
  end
end 
class SettingsController < ApplicationController
  def index
    @title = "系统设置"
    @message = "在这里可以修改系统的各项设置"
    @current_root_path = SettingsModel.get_current_root_path
  end

  def select_directory
    result = SettingsModel.select_directory
    if result[:success]
      render json: result
    else
      render json: result, status: :unprocessable_entity
    end
  end

  def update_root_path
    result = SettingsModel.update_root_path(params[:path])
    if result[:success]
      render json: result
    else
      render json: result, status: :unprocessable_entity
    end
  end

  def check_directory_access
    result = SettingsModel.check_directory_access(params[:path])
    if result[:success]
      render json: result
    else
      render json: result, status: :unprocessable_entity
    end
  end

  def restore_default_path
    default_path = Rails.root.join('public', 'root').to_s
    result = SettingsModel.update_root_path(default_path)
    
    if result[:success]
      result[:message] = "已恢复默认根目录"
      render json: result
    else
      render json: result, status: :unprocessable_entity
    end
  end

  def get_admin_password
    result = SettingsModel.get_admin_password
    if result[:success]
      render json: result
    else
      render json: result, status: :unprocessable_entity
    end
  end

  def update_password
    result = SettingsModel.update_password(params[:password])
    if result[:success]
      render json: result
    else
      render json: result, status: :unprocessable_entity
    end
  end
end 
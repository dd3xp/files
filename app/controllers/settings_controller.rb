class SettingsController < ApplicationController
  def index
    @title = "设置"
    @message = "设置页面"
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
end 
class RegisterController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :create]
  layout 'auth'

  def index
    if RegisterModel.need_redirect_to_login?
      redirect_to login_path
    end
  end

  def create
    username = params[:username]
    password = params[:password]
    password_confirmation = params[:password_confirmation]

    unless RegisterModel.validate_password_confirmation(password, password_confirmation)
      render json: { 
        error: '两次输入的密码不一致'
      }, status: :unprocessable_entity
      return
    end

    if RegisterModel.create_user(username, password)
      render json: { 
        success: true, 
        redirect_url: Rails.application.routes.url_helpers.login_path
      }, status: :ok
    else
      render json: { 
        error: '用户名已存在或密码不符合要求'
      }, status: :unprocessable_entity
    end
  end
end 
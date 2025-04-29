class LoginController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :create]
  layout 'auth'

  def index
    if LoginModel.need_redirect_to_register?
      redirect_to register_path
    end
  end

  def create
    username = params[:username]
    password = params[:password]

    if LoginModel.authenticate_user(username, password)
      LoginModel.set_user_session(username, session, cookies)
      render json: { 
        success: true, 
        redirect_url: Rails.application.routes.url_helpers.root_path
      }, status: :ok
    else
      render json: { 
        error: '用户名或密码错误'
      }, status: :unprocessable_entity
    end
  end

  def destroy
    LoginModel.clear_user_session(session, cookies)
    redirect_to Rails.application.routes.url_helpers.root_path
  end
end 
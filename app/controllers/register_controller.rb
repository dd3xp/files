class RegisterController < ApplicationController
  skip_before_action :authenticate_user!, only: [:index, :create]
  layout 'auth', only: [:index, :create]

  def index
    redirect_to login_path unless User.load_users.empty?
  end

  def create
    if User.save_user(params[:username], params[:password])
      session[:user_id] = params[:username]
      cookies.permanent[:user_id] = params[:username]
      render json: { success: true, redirect_url: root_path }
    else
      render json: { error: '创建账号失败' }, status: :unprocessable_entity
    end
  end
end 
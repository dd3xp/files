class DashboardController < ApplicationController
  def index
    @title = "控制面板"
    @message = "欢迎来到 Dashboard 页面"
  end
end
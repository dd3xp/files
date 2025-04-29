Rails.application.routes.draw do
  root 'files#index'
  
  # 认证相关路由
  get 'login', to: 'login#index'
  post 'login', to: 'login#create'
  delete 'logout', to: 'login#destroy'
  
  get 'register', to: 'register#index'
  post 'register', to: 'register#create'

  # 文件管理相关路由
  get 'files', to: 'files#index'
  get 'files/preview', to: 'files#preview'
  post 'files/upload', to: 'files#upload'
  post 'files/delete', to: 'files#delete'
  post 'files/paste', to: 'files#paste'
  post 'files/check_duplicates', to: 'files#check_duplicates'
  get 'files/download', to: 'files#download'
  post 'files/download_multiple', to: 'files#download_multiple'
  resources :files, only: [:index, :show, :create, :destroy]

  # 终端管理相关路由
  get 'terminal', to: 'terminal#index'

  # 仪表盘相关路由
  get 'dashboard', to: 'dashboard#index'
  
  # 设置相关路由
  get 'settings', to: 'settings#index'
end

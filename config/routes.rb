Rails.application.routes.draw do
  root 'files#index'
  
  get 'files', to: 'files#index'
  get 'files/preview', to: 'files#preview'
  post 'files/upload', to: 'files#upload'
  post 'files/delete', to: 'files#delete'
  post 'files/paste', to: 'files#paste'
  post 'files/check_duplicates', to: 'files#check_duplicates'
  
  resources :files, only: [:index, :show, :create, :destroy] do
    collection do
      get 'download/:id', to: 'files#download', as: :download
    end
  end
  get 'terminal', to: 'terminal#index'
  get 'dashboard', to: 'dashboard#index'
  
  # 用户认证相关路由
  get 'login', to: 'sessions#new'
  post 'login', to: 'sessions#create'
  delete 'logout', to: 'sessions#destroy'
  
  resources :users, only: [:new, :create]
end

Rails.application.routes.draw do
  root 'files#index'
  
  get 'files', to: 'files#index'
  get 'files/preview', to: 'files#preview'
  post 'files/upload', to: 'files#upload'
  
  resources :files, only: [:index] do
    member do
      get :preview
    end
  end
  get 'terminal', to: 'terminal#index'
  get 'dashboard', to: 'dashboard#index'
end

Rails.application.routes.draw do
  root 'files#index'
  
  get 'files', to: 'files#index'
  get 'files/preview', to: 'files#preview'
  post 'files/upload', to: 'files#upload'
  post 'files/delete', to: 'files#delete'
  post 'files/paste', to: 'files#paste'
  post 'files/check_duplicates', to: 'files#check_duplicates'
  
  resources :files, only: [:index] do
    collection do
      get :preview
    end
  end
  get 'terminal', to: 'terminal#index'
  get 'dashboard', to: 'dashboard#index'
end

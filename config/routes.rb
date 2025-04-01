Rails.application.routes.draw do
  root 'files#index'
  resources :files, only: [:index] do
    member do
      get :preview
    end
  end
  get 'terminal', to: 'terminal#index'
  get 'dashboard', to: 'dashboard#index'
end

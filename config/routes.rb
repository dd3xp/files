Rails.application.routes.draw do
  root 'files#index'
  resources :files, only: [:index]
  get 'terminal', to: 'terminal#index'
end

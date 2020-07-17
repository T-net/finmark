Rails.application.routes.draw do
  mount Ckeditor::Engine => '/ckeditor'

  devise_for :users, path: '', path_names: { sign_in: 'login', sign_out: 'logout' }
  devise_for :admin_users, ActiveAdmin::Devise.config
  ActiveAdmin.routes(self) rescue ActiveAdmin::DatabaseHitDuringLoad

  #require 'sidekiq/web'
  #Sidekiq::Web.set :session_secret, Rails.application.secrets[:secret_key_base]
  #authenticate :admin_user do
  #  mount Sidekiq::Web => '/sidekiq'
  #end

  root 'homepage#index'

  # User Account Details
  get 'account', to: 'users#edit'
  resources :users, only: %i(update destroy)

  # User Datasets
  resources :datasets, only: %i(index create destroy update) do
    put :publish, on: :member
  end

  # Regions
  get 'region/:iso', to: 'regions#show', as: :regions

  # Data Portal
  get 'data-portal' => 'data_portal#index'
  resources :national_surveys, only: :index
  resources :financial_diaries, only: :index
  resources :geospatial_data, only: :index

  # Data Portal - Financial Diaries
  get 'data-portal/:iso/financial-diaries', to: 'data_portal_financial_diaries#index',
  as: 'data_portal_financial_diaries'

  # Data Portal - FSP maps
  get 'data-portal/:iso/fsp-maps', to: 'data_portal/fsp_maps#show', as: 'fsp_maps'

  # Data Portal - FinScope Data
  get 'data-portal/:iso/:year', to: 'data_portal#show',
  as: 'data_portal_y'
  get 'data-portal/indicator', to: 'data_portal/indicator#show',
  as: 'data_portal_indicator'
  get 'data-portal/indicator-region', to: 'data_portal/indicator#show',
  as: 'data_portal_indicator_region'
  get 'data-portal/indicator-msme', to: 'data_portal/indicator#show',
  as: 'data_portal_indicator_msme'
  get 'data-portal/indicator/embed/:iso/:year', to: 'data_portal/indicator#embed', as: 'data_portal_indicator_embed'
  get 'data-portal/report', to: 'data_portal/report#show',
                            as: 'data_portal_report'

  # Data Portal - FinScope Data for regions
   get 'data-portal/region/:iso/:year', to: 'data_portal#show_by_region',  as: 'data_portal_y_region'

  # Data Portal - MSM Enterprises
  get 'data-portal/msm-enterprises', to: 'data_portal/msm_enterprises#index', as: 'msm_enterprises'
  get 'data-portal/msm-enterprises/:iso/:year', to: 'data_portal/msm_enterprises#show', as: 'msm_enterprises_show'

  # Data Portal - Financial Diaries
  get 'data-portal/:iso' => 'data_portal_financial_diaries#country_preview', to: 'data_portal_financial_diaries#country_preview',
                                                                             as: 'data_portal_country_preview'

  # Data Portal - Financial Diaries - embed
  get 'data-portal/:iso/financial-diaries/embed/:dataset/:chart_type' => 'data_portal_financial_diaries_embed#index', to: 'data_portal_financial_diaries_embed#index',
                                                                                           as: 'data_portal_financial_diaries_embed'

  get 'resources(/:category)', to: 'libraries#index', as: 'libraries'

  get 'about' => 'static_pages#about'
  get 'contacts' => 'static_pages#contacts'
  get 'dfm' => 'static_pages#dfm'
  get 'terms-of-use', to: 'static_pages#terms_of_use', as: 'terms_of_use'
  get 'privacy-policy', to: 'static_pages#privacy_policy', as: 'privacy_policy'

  get 'search' => 'searches#index'

  resource :contacts, only: :create do
    post :batch_download
    post :about_form
    post :ns_download_all
    post :msme_data_request
  end

  scope :format => true, :constraints => { :format => 'json' } do
    post   "/login"       => "sessions#create"
    delete "/logout"      => "sessions#destroy"
  end

  # Insights
  get 'knowledge-hub/:category/:slug', to: 'insights#show', as: 'insights_show'
  get 'knowledge-hub/:category', to: 'insights#categories', as: 'insights_filter_index'
  get 'knowledge-hub', to: 'insights#index', as: 'insights'

  # Initiatives
  get 'our-work/:tag/:slug', to: 'initiatives#show', as: 'initiatives_show'
  get 'our-work/:tag', to: 'initiatives#filter_index', as: 'initiatives_filter_index'
  get 'our-work', to: 'initiatives#index', as: 'initiatives'

  # Tools
  get 'terms-of-reference' => 'tools#index', as: 'tools'

  namespace :fdapi do
    resources :household_transactions, only: [:index, :show]
    resources :household_member_transactions, only: [:index, :show]
    resources :category_usages, only: [:index, :show]
    resources :project_metadata, only: [:index, :show]

    get 'households/project_min_max/:project_name', to: 'project_metadata#project_min_max_households'
    get 'members/project_min_max/:project_name', to: 'project_metadata#project_min_max_members'
    get 'households/project_means/:project_name', to: 'project_metadata#project_means_households'
    get 'members/project_means/:project_name', to: 'project_metadata#project_means_members'
    get 'households/monthly_values/:project_name', to: 'household_transactions#monthly_values'
    get 'members/monthly_values/:project_name', to: 'household_member_transactions#monthly_values'
  end

  namespace :dpapi do
    get 'population/:code', to: 'population#index'
    get 'gdp_by_region/:code', to: 'gdp#by_region'
    get 'gdp_by_country/:iso', to: 'gdp#by_country'
    get 'gdp_by_country_over_time/:iso', to: 'gdp#by_country_over_time'
  end

  namespace :updates do
    get 'news/preview', to: 'news#preview'
    get 'blogs/preview', to: 'blogs#preview'
    get 'events/preview', to: 'events#preview'

    resources :news, only: [:index, :show]
    resources :blogs, only: [:index, :show]
    resources :events, only: [:index, :show]
  end

  scope module: 'updates' do
    resources :news, only: [:index, :show]
  end

  resources :updates, only: :index

  match "/404", :to => "errors#not_found", :via => :all
end

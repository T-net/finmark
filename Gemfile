source 'https://rubygems.org'

git_source(:github) do |repo_name|
  repo_name = "#{repo_name}/#{repo_name}" unless repo_name.include?("/")
  "https://github.com/#{repo_name}.git"
end

ruby '2.5.3'

gem 'active_model_serializers', '~> 0.10.0'
gem 'autoprefixer-rails', '~> 6.7'
gem 'coffee-rails', '~> 4.2'
gem 'friendly_id', '~> 5.1.0'
gem 'gon'
gem 'jbuilder', '~> 2.5'
gem 'jquery-rails'
gem 'pg'
gem 'puma', '~> 4.3'
gem 'rails', '~> 5.2.3'
gem 'rails-backbone', '~> 1.2'
gem 'sass-rails', '~> 5.0'
gem 'sparkpost_rails'
gem 'turbolinks', '~> 5.0', '>= 5.0.1'
gem 'uglifier', '>= 1.3.0'
gem 'activerecord-import', '~> 0.15.0'
gem 'http'
gem 'redis-rails'
# Transpile app-like JavaScript. Read more: https://github.com/rails/webpacker
gem 'webpacker'
gem 'react-rails'
# Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', '>= 1.1.0', require: false
gem 'select2-rails'
gem 'simple_form'
gem 'recaptcha'

# CORS
gem 'rack-cors'

source 'https://rails-assets.org' do
  gem 'rails-assets-d3', '~> 3.5.16'
  gem 'rails-assets-datalib', '1.7.3'
  gem 'rails-assets-fuse'
  gem 'rails-assets-vega', '~> 2.6.5'
  gem 'rails-assets-masonry', '~>4.2.0'
  gem 'rails-assets-jquery.responsive-slides'
end

gem 'dotenv-rails', '~> 2.1'

# Active admin gems

gem 'activeadmin', github: 'activeadmin'
gem 'devise'
gem 'acts_as_list'
gem 'activeadmin-sortable'

# File upload gems
gem 'paperclip'
gem "shrine", "~> 2.0"
gem "image_processing", "~> 1.0"

# WYSIWYG
gem 'ckeditor', '4.2.4'

# SVG
gem 'inline_svg'

gem 'httparty'

gem 'enumerate_it'
gem 'valid_url'
gem 'twitter', '~> 6.2.0'

# Use Redis adapter to run Action Cable in production
# gem 'redis', '~> 3.0'
# Use ActiveModel has_secure_password
gem 'bcrypt', '~> 3.1.7'

group :development, :test do
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
end

group :development do
  gem 'annotate'
  gem 'letter_opener'
  gem 'listen', '>= 3.0.5', '< 3.2'
  gem 'spring'
  gem 'spring-watcher-listen', '~> 2.0.0'
  gem 'web-console', '>= 3.3.0'
  gem 'awesome_print'

# Deploy
  gem 'capistrano', '3.7.1'
  gem 'capistrano-bundler'
  gem 'capistrano-passenger'
  gem 'capistrano-rails'
  gem 'capistrano-rvm'
end

group :production do
  gem 'mini_racer', platforms: :ruby
end

gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
# gem 'activerecord-session_store', github: 'rails/activerecord-session_store'

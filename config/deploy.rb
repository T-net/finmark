# config valid only for current version of Capistrano
lock "3.7.1"

set :application, 'i2i'
set :repo_url, 'https://github.com/T-net/FinMark.git'
set :deploy_to, '/var/www/i2i'
set :use_sudo, true
set :rvm_custom_path, '/usr/share/rvm'

set :deploy_user, 'ubuntu'
set :rvm_ruby_version, '2.5.3'
set :keep_releases, 3
set :use_sudo, true
set :linked_files, %w{.env public/robots.txt}
set :linked_dirs, %w{log tmp/pids tmp/cache tmp/sockets vendor/bundle public/system public/uploads public/ckeditor_assets db/data}

namespace :deploy do
  after :finishing, 'deploy:cleanup'
  after 'deploy:publishing', 'deploy:restart'
end


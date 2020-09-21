server 'staging.finmark.org.za', user: 'ubuntu', roles: %w{web app db}, primary: true
set :ssh_options, {
  forward_agent: true
}

set :branch, 'finmark/develop'

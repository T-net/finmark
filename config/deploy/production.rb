server 'ec2-54-187-128-168.us-west-2.compute.amazonaws.com', user: 'ubuntu', roles: %w{web app db}, primary: true
set :ssh_options, {
  forward_agent: true
}

set :branch, 'finmark/develop'

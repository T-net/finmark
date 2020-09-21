server 'ec2-34-213-43-106.us-west-2.compute.amazonaws.com', user: 'ubuntu', roles: %w{web app db}, primary: true
set :ssh_options, {
  forward_agent: true
}

set :branch, 'finmark/production'

# Insight 2 Impact (i2i)

## Requirements
* `ruby 2.5.3`
* `postgresql 10`
* `nodejs`

## Installation
To install the required `ruby` version is recommended to use a ruby version manager like [RVM](https://rvm.io/) or [rbenv](https://github.com/rbenv/rbenv).

Once `ruby` is installed, run `gem install bundler -v 1.17.1` if you don't have `bundler` already installed and `bundle install` to install the required dependencies.

Finally, install node packages by running `npm install`.

### Configuration :floppy_disk:
Copy the file *.env.sample* as *.env* and change it according to your database configuration

### Database setup
Having `postgresql` already installed, start `postgresql` server. run `rails db:create` if you haven't created the database.

Download last database backup from server (from /home/ubuntu).

Run:

```scp -r ubuntu@staging.i2ifacility.org:/home/ubuntu/filename.dump .```

```pg_restore -C -d postgres filename.dump```

```bundle exec rails db:migrate```

Download assets:

```scp -r ubuntu@staging.i2ifacility.org:/var/www/i2i/current/public/system ./public/```


### Development
Run `rails s` or `bundle exec rails server` to start the server.

Go to [localhost](http://localhost:3000) and have fun :collision: :tada:

### Troubleshooting :interrobang:
If you have `postgresql` installed via [Homebrew](http://brew.sh/) probably the user setted is your account name. `rails db:create` command asks for a `postgres` user.

To check this, enter in a `postgresql` console and type `\du` you will see the list of roles/users. If `postgres` is already there you have nothing to do, otherwise, you will need to create a new `postgres` role running the next command:

	createuser -sPE postgres

Set a password for this role/user. Once you are done, you should be able to create the database with `postgres` role.

### Shareable components

Because we need to be able to share some components outside the project, there is a new Rails environment called `assets_compilation`. This environment is a duplicated of the `production` one with other rules added.

In order to compile those assets, run `RAILS_ENV=assets_compilation SECRET_KEY_BASE=secret rake assets:precompile`. This will place all precompiled asssets in `public` folder. Once done, run `rake non_digested RAILS_ENV=assets_compilation SECRET_KEY_BASE=secret`. This task will create duplicate of current compiled files but removing its hash, making it easier to manage. For example: `exported_componentes#mfnhf21378kjashjads1234.js` would be `exported_componentes.js`

## Using docker for development

Just run next command:

```
docker-compose -f docker-compose-dev.yml up --build
```

It will fail because database has not been creted. So you have to run:

```
docker-compose -f docker-compose-dev.yml run --rm web rake db:create db:migrate
```

To enter in the website container (finmark_web_1) and access to bash, run: 

```
docker exec -it [container-id] bash
```

Once in, run as many task as you need from `lib/tasks` folder:

```
rake db:[task-name]
```

To have countries available you will need to run the `sample` task at least. Run `rake db:sample`.

It's recommended to run all tasks to avoid missing data.

Once done with task running, just run the container:

```
docker-compose -f docker-compose-dev.yml up
```

### Restaring db from dump

Run this command where `{container}` is the db container id, `{db_name}` is the db name (i2i_development), and `{filename}` is the dump file path in your local:

```
docker exec -i {container} pg_restore -C --clean --no-acl --no-owner --dbname={db_name} --username=postgres < ./{filename}.dump
```

NOTE: it could take some minutes depending of the file size.

## Application summary

The application is a rails project including an admin, the front originally built with backbone and react for the latest part (fsp maps).

The site could be divided in two parts, the insights and the datasets.

`Insights` are managed on the admin.

There are three types of dataset:

- National surveys
    - Data is posted and read from [this API](https://github.com/Vizzuality/i2i-api).
    - Display the data through widgets using the backbone views.
- Financial diaries
    - It's stored on the db from a csv import.
    - Displays data using vega and consumes data from the internal `fdapi` endpoints.
- Fsp maps
    - Shows layers on a map using react and redux.

Staging: staging.i2ifacility.org
Production: i2ifacility.org

`i2i` -> Rails app (Docker name: `i2i_web`)
`i2i-api` -> Node api for the national surveys (Docker name: `i2i-api_prod`)

You can access the docker containers by using `docker ps` to get the id and then `docker exec -it ID bash`.

## Adding new national surveys

- Post the data to the node api
- Create the country on the application if the country doesn't exist, it can be created from the admin
- Add the country flag as a `svg` to `public/images/flags/ISO.svg`

## Importing financial diaries data (csv)

The csvs must be properly formatted with the columns containing descriptive data (eg: `category_name`, `subcategory`), these columns will vary depending on the type of data being imported (`houshold_transactions` or `household_member_transactions`). The values must have a date header (eg: `2017-12`) and it's content must be 10 values separated by a colon: `160:40:0:160:null:0:null:null:null:null`.

Values can be `0`, `null`, or a `float`.

The 10 values correspond respectively to:

    total_transaction_value
    avg_value
    min_value
    max_value
    rolling_balance
    business_expenses
    withdrawals
    deposits
    new_borrowing
    repayment

Everything is imported locally using rake tasks, the tasks that read from files read them from `db/data/...` so you just want to replace/rename your file or the path.

Another important thing to change on the tasks is to look for the places accessing the values columns by index (eg: `row[10..74]`), this changes from dataset to dataset so just set the indexes to match the first column with a date to the last one.

The tasks are all in a single filed named `import_financial_diaries`, the commented tasks at the bottom were originally created to address specific problems with the first ever dataset, so it shouldn't be part of the flow, the csv should be properlly populated to begin with.

The import is made locally against a backup of the production database to test if it all works, and then you can restore the whole database or just the financial diaries tables.

##  FSP maps

These are geospatial data layers, they are separated in `Sector` and `Contextual` layers, on the site you can find the contextual under Additional Data.

Sector layers are served from Carto, while Contextual layers come from both Carto and the Resource Watch api.

Be sure to have the `wri-api-components` on version `wri-api-components@2.2.7-alpha.2` because it's the version that has specific configurations for internet explorer. Otherwise the map won't appear.

##### Adding custom descriptions

Follow the instructions on `app/javascript/components/fsp-maps/constants.js`, this will enable an `i` button on the layers list that will trigger a modal with the layer's description and an url.

## Deploy

Deploying requires SSH access to the server. It's highly recommended that you use RSA keys instead of username+password access.

```
ssh-add -K ~/Keys/finmark-website.pem 
```

Push changes to branch (finmark/develop for production, check config/deploy/production).

Deployment is handled by [Capistrano](https://capistranorb.com/), and requires you to have `ruby` configured on your local machine. 

To deploy to a server, use the following command from your local terminal:

```
cap <production|staging> deploy
cap production deploy
```

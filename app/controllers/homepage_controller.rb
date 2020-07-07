class HomepageController < ApplicationController
  include TwitterApi

  def index
    records = []

    entities.each do |klass|
      records << klass.published.featured
    end

    @topics = Tag.all.order(:slug)
    @countries = Country.ordered_by_name
    
    @tweets = TwitterApi.get_tweets
    @insights = records.flatten.sort do |a, b|
      [[a.featured_position ? 0 : 1, a.featured_position ? a.featured_position.position : nil], b[:updated_at]] <=> [[b.featured_position ? 0 : 1, b.featured_position ? b.featured_position.position : nil], a[:updated_at]]
    end[0..5]
  end
end

class DataPortal::IndicatorExploratorySurveyController < ApplicationController
  before_action :allow_iframe_requests

  def show
    @source = params['source']

    render :layout => 'embed_vega5'
  end

  def embed
    render :layout => 'embed_vega5'
  end

  private

  def allow_iframe_requests
    response.headers.delete('X-Frame-Options')
  end
end

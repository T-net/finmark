class GetExploratorySurveyCountriesFromApi
  API_URL = ENV['MOBILE_SURVEYS_API_URL']

  def initialize()
  end

  def perform
    resp = HTTParty.get(api_url, body: {})

    if resp.code != 200
      @message = "Error message"
      false
    else
      @message = "Done!"
      resp
    end
  end

  private

  def api_url
    "#{API_URL}/country?lastyear=true"
  end
end

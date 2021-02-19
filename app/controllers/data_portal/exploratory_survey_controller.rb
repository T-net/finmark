class DataPortal::ExploratorySurveyController < ApplicationController
  
  def index
    exploratory_survey_countries_response = GetExploratorySurveyCountriesFromApi.new.perform
    exploratory_survey_countries = exploratory_survey_countries_response ? JSON.parse(exploratory_survey_countries_response.body) : []

    # MSME countries
    @worldwide_countries = exploratory_survey_countries.each_with_object([]) do |country, acc|
      years_size = country['year'].size
      latest_year = country['year'][years_size -1]['year']
      country_db = Country.find_by(iso: country['iso'])
      acc.push OpenStruct.new(
        name: country_db ? country_db.name : '',
        iso: country["iso"],
        link: exploratory_survey_show_path(country["iso"], latest_year),
        has_dataset: true,
        icon: :msme
      )
    end
  end

  def show
    exploratory_survey_countries_response = GetExploratorySurveyCountriesFromApi.new.perform
    exploratory_survey_countries = exploratory_survey_countries_response ? JSON.parse(exploratory_survey_countries_response.body) : []
    exploratory_survey_countries_iso = exploratory_survey_countries.collect { |m| m['iso'] }

    @countries = Country.where(iso: exploratory_survey_countries_iso)
    @country = Country.find_by(iso: params[:iso])
    @country_latest_year = exploratory_survey_countries.find do |c|
      c['iso'] == @country.iso
    end['year'][0]['year'].to_s

    @countries_for_select = @countries.map do |c|
      {
        name: c.name,
        iso: c.iso,
        latest_year: exploratory_survey_countries.find do |exploratory_survey_c|
          exploratory_survey_c['iso'] == c[:iso]
        end['year'][0]['year'].to_s
      }
    end

    gon.countries = Country.all.ordered_by_name

    render :layout => 'data_portal_exploratory_survey'
  end
end

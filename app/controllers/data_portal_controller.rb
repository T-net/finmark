class DataPortalController < ApplicationController
  def index
    msme_countries_response = GetMsmeCountriesFromApi.new.perform
    msme_countries = msme_countries_response ? JSON.parse(msme_countries_response.body).collect { |c| c['iso'] } : []

    @countries_db = Country.ordered_by_name
    @finscope_countries = Country.finscope_country_list.map { |country_hash| country_hash[:iso] }

    @worldwide_countries = @countries_db.each_with_object([]) do |country, acc|
      has_finscope = @finscope_countries.include?(country.iso)
      has_national_diaries = country.financial_diaries.present?
      has_fsp_maps = country.has_fsp_maps
      has_msme = msme_countries.include?(country.iso)
      has_dataset = has_finscope || has_national_diaries || has_fsp_maps

      if has_dataset
        acc.push OpenStruct.new(
          name: country.name,
          iso: country.iso,
          link: data_portal_country_preview_path(country[:iso]),
          has_dataset: has_dataset,
          has_finscope: @finscope_countries.include?(country.iso),
          has_msme: has_msme,
          has_national_diaries: country.financial_diaries.present?,
          has_fsp_maps: country.has_fsp_maps
        )
      end
    end

    @regional_countries = CountryRegion.joins(:country).includes(:country).each_with_object({}) do |country_region, acc|
      country = country_region.country

      has_finscope = @finscope_countries.include?(country.iso)
      has_national_diaries = country.financial_diaries.present?
      has_fsp_maps = country.has_fsp_maps
      has_dataset = has_finscope || has_national_diaries || has_fsp_maps

      if has_dataset
        if acc.has_key?(country_region.region_id)
          acc[country_region.region_id].push OpenStruct.new(
            name: country.name,
            iso: country.iso,
            link: data_portal_country_preview_path(country[:iso]),
            has_dataset: has_dataset,
            has_finscope: @finscope_countries.include?(country.iso),
            has_national_diaries: country.financial_diaries.present?,
            has_fsp_maps: country.has_fsp_maps
          )
        else
          acc[country_region.region_id] = [OpenStruct.new(
            name: country.name,
            iso: country.iso,
            has_dataset: has_dataset,
            has_finscope: @finscope_countries.include?(country.iso),
            has_national_diaries: country.financial_diaries.present?,
            has_fsp_maps: country.has_fsp_maps
          )]
        end
      end
    end

    @regions_hash = @regional_countries.each { |k, v| @regional_countries[k] = v.sort_by { |country| country.name } }
    @regions = Region.all
  end

  def show
    @countries = Country.all.map(&:finscope).compact
    @country = Country.find_by(iso: params[:iso])
    @country_latest_year = @countries.find do |c|
      c[:iso] == @country.iso
    end[:latest_year].to_s
    gon.countries = Country.all.ordered_by_name
  end

  def show_by_region
    @countries = Region.all.map(&:finscope).compact
    @country = Region.find_by(iso: params[:iso])
    @country_latest_year = @countries.find do |c|
      c[:iso] == @country.iso
    end[:latest_year].to_s
  end
end

class GeospatialDataController < ApplicationController
  def index
    @countries_db = Country.ordered_by_name.where(has_fsp_maps: true)
    @regions = Region.joins(:country_regions).where(country_regions: { country_id: @countries_db.pluck(:id) }).uniq

    @worldwide_countries = @countries_db.each_with_object([]) do |country, acc|
      acc.push OpenStruct.new(
        name: country.name,
        iso: country.iso,
        has_dataset: true,
        icon: :geospatial_data
      )
    end

    # TODO: Improve query
    @regional_countries = CountryRegion.joins(:country).includes(:country).where(countries: { has_fsp_maps: true }).each_with_object({}) do |country_region, acc|
      country = country_region.country
      
      if acc.has_key?(country_region.region_id)
        acc[country_region.region_id].push OpenStruct.new(
          name: country.name,
          iso: country.iso,
          has_dataset: true,
          icon: :geospatial_data
        )
      else
        acc[country_region.region_id] = [OpenStruct.new(
          name: country.name,
          iso: country.iso,
          has_dataset: true,
          icon: :geospatial_data
        )]
      end
    end

    @regions_hash = @regional_countries.each { |k, v| @regional_countries[k] = v.sort_by { |country| country.name } }
  end
end

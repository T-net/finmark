class StaticPagesController < ApplicationController

  def about
    @teamMembers = sort_by_importance(Member.where(role: 1))
    @advisoryMembers = sort_by_importance(Member.where(role: 2))
    @countries = [
      { iso: 'BGD', name: 'Bangladesh' },
      { iso: 'GHA', name: 'Ghana' },
      { iso: 'IND', name: 'India' },
      { iso: 'IDN', name: 'Indonesia' },
      { iso: 'KEN', name: 'Kenya' },
      { iso: 'MOZ', name: 'Mozambique' },
      { iso: 'NGA', name: 'Nigeria' },
      { iso: 'PAK', name: 'Pakistan' },
      { iso: 'RWA', name: 'Rwanda' },
      { iso: 'SEN', name: 'Senegal' },
      { iso: 'TZA', name: 'Tanzania' },
      { iso: 'UGA', name: 'Uganda' },
      { iso: 'ZMB', name: 'Zambia' },
    ]

    gon.team = JSON.parse @teamMembers.to_json(:methods => [:image_url, :blogs])
    gon.advisor = JSON.parse @advisoryMembers.to_json(:methods => [:image_url])
  end


  def contacts
    @contact = Contact.new
  end


  def terms_of_use; end

  def privacy_policy; end

  def dfm; end

  private

  def serialized(model)
    ActiveModelSerializers::SerializableResource.new(model, adapter: :json)
  end

  def sort_by_importance(members)
    members.sort_by { |member| [member.order ? 0 : 1, member.order] }
  end
end

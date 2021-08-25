# == Schema Information
#
# Table name: news
#
#  id                 :integer          not null, primary key
#  created_at         :datetime         not null
#  updated_at         :datetime         not null
#  title              :string
#  summary            :text
#  content            :text
#  image_file_name    :string
#  image_content_type :string
#  image_file_size    :integer
#  image_updated_at   :datetime
#  date               :datetime
#  author             :string
#  issuu_link         :string
#  slug               :string
#  published          :boolean
#  category_id        :integer
#  record_type        :string           default("news")
#  is_featured        :boolean          default(FALSE)
#  position           :integer
#

class News < ApplicationRecord
  extend FriendlyId
  friendly_id :title, use: [:slugged, :finders]
  self.table_name = 'news'

  belongs_to :category, required: true

  has_one :featured_position, as: :positionable, dependent: :destroy
  accepts_nested_attributes_for :featured_position, allow_destroy: true

  has_many :countries_news
  has_many :countries, through: :countries_news

  has_many :news_regions, dependent: :destroy
  has_many :regions, through: :news_regions

  has_many :tagged_items, :as => :taggable, :dependent => :destroy
  has_many :tags, :through => :tagged_items
  accepts_nested_attributes_for :tagged_items, allow_destroy: true

  after_initialize :set_date
  after_save :needs_featured_position

  # Validations for paperclip
  has_attached_file :image, styles: {thumb: '300x300>', medium: '600x600', large: '1280x>800'}
  validates_attachment_content_type :image, content_type: /\Aimage\/.*\z/

  validates_presence_of :title
  validates :title, uniqueness: { case_sensitive: false }
  validates_length_of :title, maximum: 75
  validates_length_of :summary, maximum: 250, allow_blank: true

  scope :published, -> {where(published: true)}
  scope :featured, -> {where(is_featured: true)}

  scope :search_fields, ->(term) do
    where(published: true)
      .left_outer_joins(:category, :countries, :regions)
      .where("lower(news.title) LIKE ? OR lower(summary) LIKE ? OR lower(content) LIKE ? OR lower(categories.name) LIKE ? OR lower(countries.name) LIKE ? OR lower(regions.name) LIKE ?",
             "%#{term.downcase}%", "%#{term.downcase}%", "%#{term.downcase}%", "%#{term.downcase}%", "%#{term.downcase}%", "%#{term.downcase}%")
      .distinct
  end

  scope :search_tags, ->(term) do
    where(published: true)
      .left_outer_joins(:tags, :countries, :regions)
      .where("lower(tags.slug) LIKE ? OR lower(countries.iso) LIKE ? OR lower(regions.iso) LIKE ?", "%#{term.downcase}%", "%#{term.downcase}%", "%#{term.downcase}%")
      .distinct
  end

  def self.search_by_filters(terms = [], categories = [], topics = [], locations = [])
    result = self.where(published: true)
      .left_outer_joins(:tags, :countries, :regions)

    if terms && terms.size > 0
      terms_arr = terms.map { |t| t.downcase }
      terms_st = "%(#{terms_arr.join('|')})%"
      result = result.where("lower(news.title) SIMILAR TO ? OR lower(summary) SIMILAR TO ? OR lower(content) SIMILAR TO ?", terms_st, terms_st, terms_st)
    end

    if categories && categories.size > 0
      result = result.where(category_id: categories)
    end

    if topics && topics.size > 0
      topics_arr = topics.map { |t| t.downcase }
      topics_st = "%(#{topics_arr.join('|')})%"
      result = result.where("lower(tags.slug) SIMILAR TO ?", topics_st)
    end

    if locations && locations.size > 0
      locations_arr = locations.map { |t| t.downcase }
      locations_st = "%(#{locations_arr.join('|')})%"
      result = result.where("lower(countries.iso) SIMILAR TO ? OR lower(regions.iso) SIMILAR TO ?", locations_st, locations_st)
    end

    return result.order(date: :desc).distinct
  end

  def set_date
    self.date ||= DateTime.now
  end

  def should_generate_new_friendly_id?
    title_changed?
  end
end

module Fdapi
  class ProjectMetadataController < ApiController
    # before_action :require_login

    def index
      project_metadata = ProjectMetadatum.filter(params.slice(:project_name))
      project_metadata = project_metadata.page(params[:page]).per(params[:per_page])

      render json: project_metadata, adapter: :json, meta: meta(project_metadata), root: 'data'
    end

    def project_min_max
      project_metadata = ProjectMetadatum.find_by(project_name: params[:project_name])
      categories_filter = JSON.parse(params[:categories])

      household_transactions = categories_filter.map do |category|
        HouseholdTransaction.filter(params.slice(:project_name, :household_name).merge(category))
      end.flatten

      adapter = ActiveRecord::Base.connection

      sql_result = adapter.execute("select household_transactions.category_type,
          min(household_transaction_histories.rolling_balance), min(total_transaction_value),
          max(household_transaction_histories.rolling_balance), max(total_transaction_value)
          from household_transaction_histories inner join household_transactions
          on household_transactions.id = household_transaction_histories.household_transaction_id
          where household_transactions.id in(#{household_transactions.pluck(:id).join(', ')})
          group by household_transactions.category_type")

      data = []
      field_index =
        { category: 0, min_rolling: 1, min_total: 2, max_rolling: 3, max_total: 4}

      sql_result.values.each do |values|
        case values[field_index[:category]]
        when 'credits', 'savings'
          data << json_element('min', values[field_index[:min_rolling]],
                               values[field_index[:category]],
                               project_metadata.start_date.strftime('%Y-%m-%d'))
          data << json_element('max', values[field_index[:max_rolling]],
                               values[field_index[:category]],
                               project_metadata.end_date.strftime('%Y-%m-%d'))
        when 'expense', 'income'
          data << json_element('min', values[field_index[:min_total]],
                               values[field_index[:category]],
                               project_metadata.start_date.strftime('%Y-%m-%d'))
          data << json_element('max', values[field_index[:max_total]],
                               values[field_index[:category]],
                               project_metadata.end_date.strftime('%Y-%m-%d'))
        end
      end


      # min_value = adapter.
      #   execute("select household_transactions.category_type, min(household_transaction_histories.avg_value) from household_transaction_histories inner join household_transactions on household_transactions.id = household_transaction_histories.household_transaction_id where household_transactions.id in(#{household_transactions.pluck(:id).join(', ')}) group by household_transactions.category_type")
      # max_value = adapter.
      #   execute("select household_transactions.category_type, max(household_transaction_histories.avg_value) from household_transaction_histories inner join household_transactions on household_transactions.id = household_transaction_histories.household_transaction_id where household_transactions.id in(#{household_transactions.pluck(:id).join(', ')}) group by household_transactions.category_type")
      #
      # min_value.values.each do |min|
      #   data << {
      #     c: 'min',
      #     date: project_metadata.start_date.strftime('%Y-%m-%d'),
      #     value: min.last,
      #     category: min.first
      #   }
      # end
      # max_value.values.each do |max|
      #   data << {
      #     c: 'max',
      #     date: project_metadata.end_date.strftime('%Y-%m-%d'),
      #     value: max.last,
      #     category: max.first
      #   }
      # end

      render json: { data: data }
    end

    def project_means
      project_metadata = ProjectMetadatum.find_by(project_name: params[:project_name])
      categories_filter = JSON.parse(params[:categories])
      adapter = ActiveRecord::Base.connection
      histories = {}
      result = []

      household_transactions = categories_filter.map do |category|
        { category['category_type'] => HouseholdTransaction.filter(params.slice(:project_name, :household_name).merge(category)) }
      end

      household_transactions.each do |household|
        category_type = household.keys.first

        histories[category_type] = adapter.execute("select * from household_transaction_histories
          where household_transaction_id in (#{household.values.first.pluck(:id).join(', ')})
          and #{default_indicators[category_type]} is not null")
      end

      sorted = {}
      histories.each do |category_type, pg_result|
        scores = {}
        pg_result.to_a.each { |history| (scores[history['year']] ||= {})[history['month']]=[] }
        sorted[category_type] = scores
      end

      histories.each do |category_type, pg_result|
        pg_result.to_a.each { |history| sorted[category_type][history['year']][history['month']] << history }
      end

      sorted.each do |category_type, value|
        value.each do |year, value|
          value.each do |month, histories|
            values = histories.map { |h| h[default_indicators[category_type]] }

            result << {
              category_type: category_type,
              max: values.max,
              min: values.min,
              median: values.sum / values.size.to_f,
              date: "#{year}-#{month.to_s.rjust(2, '0')}-01"
            }
          end
        end
      end

      render json: { data: result.sort_by { |h| h[:date] } }
    end

    def json_element(operation, value, category, date)
      {
        c: operation,
        date: date,
        value: value,
        category: category
      }
    end
  end
end

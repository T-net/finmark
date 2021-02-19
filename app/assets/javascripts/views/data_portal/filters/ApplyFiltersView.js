(function (App) {

  App.View.ApplyFiltersView = Backbone.View.extend({

    template: JST['templates/data_portal/filters/apply-filters'],

    defaults: {
      // ISO of the country
      iso: null,
      // Selected year
      year: null,
      // List of indicators
      indicators: [],
      // List of the filters
      filters: []
    },

    events: {
      'click .js-option': '_onClickOption'
    },

    initialize: function (options) {
      this.options = _.extend({}, this.defaults, options);
      // Filter out the the complex indicators (access or strands) and copy the
      // entire object to avoid mutations of the original one
      this.options.indicators = this.options.indicators
        .filter(function (indicator) {
          return indicator.category !== App.Helper.Indicators.CATEGORIES.ACCESS
            && indicator.category !== App.Helper.Indicators.CATEGORIES.STRANDS
            && indicator.category !== App.Helper.Indicators.CATEGORIES.MSME_STRANDS;
        })
        .map(function (indicator) {
          return {
            name: indicator.name,
            id: indicator.id,
            preferedOrder: indicator.preferedOrder,
            options: indicator.options && Array.prototype.slice.call(indicator.options)
          };
        })
        .sort(function (a, b) {
          if (a.name < b.name) return -1;
          if (a.name > b.name) return 1;
          return 0;
        });

      this._fetchData();
    },

    /**
     * Event handler executed when the user clicks an option
     * @param {Event} e event
     */
    _onClickOption: function (e) {
      if (!e.currentTarget.checked) return;

      var indicator = e.currentTarget.dataset.indicator;
      var option = e.currentTarget.value;
      App.Helper.Analytics.sendEvent('Add filters', indicator, option);
    },

    /**
     * Fetch the data for each indicator and render it
     */
    _fetchData: function () {
      this._showLoader();

      var indicatorsModels = this.options.indicators.map(function (indicator) {
        return new App.Model.IndicatorModel({ },
          {
            id: indicator.id,
            iso: this.options.iso,
            year: this.options.year,
            isRegion: this.options.isRegion,
            isMSME: this.options.isMSME,
            isMobileSurvey: this.options.isMobileSurvey
          }
        );
      }, this);

      $.when.apply($,
        indicatorsModels.map(function (indicatorsModel) {
          return indicatorsModel.fetch();
        })
      ).done(function () {
        // We copy the options in this.options.indicators
        indicatorsModels.forEach(function (indicatorsModel) {
          var indicator = _.findWhere(this.options.indicators, { id: indicatorsModel.options.id });

          if (this.options.isMobileSurvey) {
            var mobileSurveyCategories = [];
            indicatorsModel.get('data').forEach(function (row) {
              if (mobileSurveyCategories.indexOf(row.category) === -1) {
                mobileSurveyCategories.push(row.category);
              }
            })

            if (indicator.preferedOrder) {
              indicator.options = App.Helper.Indicators.groupByPrefered(indicator.preferedOrder, mobileSurveyCategories);
            } else {
              indicator.options = mobileSurveyCategories;
            }

          } else {
            indicator.options = indicatorsModel.get('data')
            .filter(function(i) {
              return i.label && i.label !== '' 
            }, this)
            .map(function (row) {
              return row.label;
            }, this);

          }
        }, this);
      }.bind(this))
      .then(function () {
        this._hideLoader();
        this.render();
      }.bind(this))
      .fail(function () {
        this.renderError();
        this._hideLoader();
      }.bind(this));
    },

    /**
     * Show the spinning loader
     * NOTE: also empties the container
     */
    _showLoader: function () {
      this.el.innerHTML = '';
      this.el.classList.add('c-spinning-loader');
    },

    /**
     * Hide the spinning loader
     */
    _hideLoader: function () {
      this.el.classList.remove('c-spinning-loader');
    },

    _getFilteredIndicators: function () {
      this.options.indicators.forEach(function (indicator) {
        var isFiltered = _.findWhere(this.options.filters, { id: indicator.id });
        indicator.options = indicator.options.map(function (option, index) {
          return {
            name: option,
            filtered: isFiltered && isFiltered.options.indexOf(option) !== -1
          };
        });
      }.bind(this));

      return this.options.indicators;
    },

    getData: function () {
      var options = document.querySelectorAll('.js-option');
      options = Array.prototype.slice.call(options);

      var filtersGroup = _.groupBy(options, function (option) {
        return option.dataset.indicatorId;
      });

      return Object.keys(filtersGroup)
        .map(function(indicatorId) {
          var indicator = _.findWhere(this.options.indicators, { id: indicatorId });
          return {
            id: indicatorId,
            name: indicator.name,
            options: filtersGroup[indicatorId]
              .filter(function (option) { return option.checked; })
              .map(function (option) { return option.value; })
          };
        }, this)
        .filter(function (filter) {
          return filter.options.length;
        });
    },

    render: function () {
      this.$el.html(this.template({
        indicators: this._getFilteredIndicators()
      }));

      return this;
    },

    renderError: function () {
      new App.View.RetryMessageView({
        el: this.el,
        label: 'Unable to load the filters',
        callback: this._fetchData.bind(this)
      });
    }

  });
}.call(this, this.App));

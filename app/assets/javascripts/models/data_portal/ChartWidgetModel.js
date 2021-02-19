(function (App) {
  'use strict';

  App.Model.ChartWidgetModel = Backbone.Model.extend({

    // Check the default values in the initialize method
    // The values can't be placed here because Backbone.Model
    // will interprate them as the default model data
    defaults: {},

    initialize: function (options) {
      this.options = _.extend({}, {
        // Indicator id
        id: null,
        // Country ISO
        iso: null,
        // Year
        year: null,
        // Information about the indicator
        indicator: null,
        // Fetch via post
        body: {},
        // List of filters
        // See _filters in App.Page.DataPortalCountryPage to see their format
        filters: [],
        // Id of the indicator used for the analysis
        // NOTE: can't be modified after instantiation
        analysisIndicatorId: null,
        // List of the indicators used for the comparison
        // Check the property in App.View.ChartWidgetView to see the format
        compareIndicators: null,
        // Whether or not the detailed data must be fetch
        // NOTE: not compatible with the analysis or compare mode
        fspId: null,
        expanded: false,
        isRegion: false,
        isMSME: false,
      }, options);

      this.indicatorModel = new App.Model.IndicatorModel({}, this.options);

      if (this.options.analysisIndicatorId) {
        this.analysisIndicatorModel = new App.Model.IndicatorModel(
          {},
          _.extend({}, this.options, { id: this.options.analysisIndicatorId })
        );
      }

      if (this.options.compareIndicators) {
        this.compareIndicatorsModels = this.options.compareIndicators.map(function (compareIndicator) {
          return new App.Model.IndicatorModel(
            {},
            {
              id: compareIndicator.id,
              iso: compareIndicator.iso,
              year: compareIndicator.year,
              filters: (this.options.filters || [])
                // The partial indicators can't be filtered twice by jurisdiction
                .filter(function (filter) {
                  return filter.id !== 'jurisdiction';
                })
                .concat(compareIndicator.filters),
              expanded: this.options.expanded,
              isMSME: this.options.isMSME,
            }
          )
        }, this);
      }

      if (this.options.fspId) {
        this.fspMapsModel = new App.Model.FSPModel(
          {},
          _.extend({}, this.options, { id: this.options.fspId })
        );
      }

    },

    /**
     * Return the list of the columns of the indicator used for the analysis
     * NOTE: need the analysis indicator to be fetched
     * @returns {string[]} columns
     */
    _getAnalysisColumns: function () {
      var data = this.analysisIndicatorModel.get('data');
      if (!data) return [];

      // Mobile surveys does not need any serialization
      if (this.options.isMobileSurvey) {
        return data;
      }

      return data.map(function (row) { return row.label; });
    },

    /**
     * Fetch the partial indicator models for the analysis
     * A partial indicator in an indicator filtered by one of the column of the
     * indicator used for the analysis.
     * @returns {object} $.Deferred
     */
    _fetchAnalysisPartials: function () {
      var analysisColumns = this._getAnalysisColumns();

      // For each column, we fetch the data of the main indicator, filtering
      // with it
      var partialIndicatorModels = analysisColumns.map(function (columnName) {
        return new App.Model.IndicatorModel(
          {},
          _.extend({}, this.options, {
            filters: (this.options.filters || []).concat(
              [{
                id: this.options.analysisIndicatorId,
                name: this.analysisIndicatorModel.get('title'),
                options: [columnName]
              }]
            )
          })
        );
      }, this);

      // We now fetch the data of each model
      return $.when.apply($,
        partialIndicatorModels.map(function (partialIndicatorModel) {
          // We can't directly return partialIndicatorModel.fetch() here because we need the
          // data to be parsed
          var deferred = $.Deferred();
          partialIndicatorModel.fetch()
            .done(function () { deferred.resolve(partialIndicatorModel.toJSON()); })
            .fail(deferred.reject);
          return deferred;
        })
      );
    },

    /**
     * Join the partial indicators to form the complete dataset
     * Each row will get a "group" attribute with the name of the column used to retrieve the data
     * @returns {object[]}
     */
    _joinAnalysisPartials: function () {
      var analysisColumns = this._getAnalysisColumns();

      // List of all the partial indicators
      var partialIndicators = Array.prototype.slice.call(arguments);

      var res = _.extend({}, partialIndicators[0], { data: [] });

      // Mobile surveys does not need any serialization
      if (this.options.isMobileSurvey) {
        res.data = analysisColumns;
        return res;
      }

      res.data = analysisColumns.map(function (columnName, index) {
        // The method below mutates the original dataset
        return partialIndicators[index].data.map(function (row) {
          row.group = columnName;
          row.groupPercentage = _.findWhere(this.analysisIndicatorModel.get('data'), { label: columnName }).percentage;
          return row;
        },this);
      }, this).reduce(function (res, data) {
        return res.concat(data);
      }, []);

      return res;
    },


    _joinFspPartials: function () {
      // List of all the partial indicators
      var partialIndicators = Array.prototype.slice.call(arguments);
      var res = _.extend({}, partialIndicators[0], { data: [] });

      res.data = this.fspMapsModel.get('data');

      return res;
    },

    /**
     * Return whether the comparison is being made between jurisdictions
     * @return {boolean}
     */
    _isJurisdictionCompare: function () {
      return this.compareIndicatorsModels.reduce(function (res, comparePartialModel) {
        return comparePartialModel.options.filters
          && comparePartialModel.options.filters.length
          && !!_.findWhere(comparePartialModel.options.filters, { id: 'jurisdiction' })
          || res;
      }, false);
    },

    /**
     * Return the name of the jurisdiction
     * @param {object} comparePartialModel Partial compare model
     * @return {string}
     */
    _getJurisdictionName: function (comparePartialModel) {
      var jurisdictionFilter = _.findWhere(comparePartialModel.options.filters, { id: 'jurisdiction' });
      return jurisdictionFilter.options[0];
    },

    /**
     * Return the name of the compare group
     * @param {object} model Model of the partial indicator
     * @returns {string}
     */
    _getCompareGroupName: function (model) {
      if (this._isJurisdictionCompare()) {
        var jurisdictionFilter = _.findWhere(this.options.filters, { id: 'jurisdiction' });

        return model !== this.indicatorModel
          ? this._getJurisdictionName(model)
          : (jurisdictionFilter ? jurisdictionFilter.options[0] : 'All jurisdictions');
      } else {
        return App.Helper.Indicators.COUNTRIES[model.options.iso] + ' ' + model.options.year;
      }
    },

    /**
     * Fetch the partial indicators for the comparison
     * A partial indicator represent the data of an indicator used for the comparison
     * @returns {object} $.Deferred
     */
    _fetchComparePartials: function () {
      return $.when.apply($,
        this.compareIndicatorsModels.map(function (compareIndicatorsModel) {
          // We can't directly return compareIndicatorsModel.fetch() here because we need the
          // data to be parsed
          var deferred = $.Deferred();
          compareIndicatorsModel.fetch()
            .done(function () { deferred.resolve(compareIndicatorsModel.toJSON()); })
            .fail(deferred.reject);
          return deferred;
        })
      );
    },

    /**
     * Join the partial indicators to form the complete dataset
     * Each row will get a "group" attribute with the name of the data represented
     * @returns {object[]}
     */
    _joinComparePartials: function () {
      var res = { title: this.indicatorModel.get('title') };

      var partialModels = [this.indicatorModel].concat(this.compareIndicatorsModels);

      // We sort the partial models if the comparison is not made between jurisdictions
      // The idea is to have the most recent year as the first value
      if (!this._isJurisdictionCompare()) {
        partialModels.sort(function (partialModalA, partialModelB) {
          if (partialModalA.options.year > partialModelB.options.year) return -1;
          if (partialModalA.options.year < partialModelB.options.year) return 1;
          return 0;
        });
      }

      res.data = partialModels
        .map(function (partialModel) {
          return partialModel.get('data').map(function (row) {
            return _.extend({}, row, { group: this._getCompareGroupName(partialModel) });
          }, this);
        }, this)
        .reduce(function (res, data) {
          return res.concat(data);
        }, []);

      return res;
    },

    /**
     * Fetch the model's data
     * @returns {object} $.Deferred
     */
    fetch: function () {
      var deferred = $.Deferred();

      if (this.analysisIndicatorModel) {
        // We first need to fetch the data of the indicator used for the
        // analysis in order to get its columns
        this.analysisIndicatorModel.fetch()
          // We then fetch all the information of the widget by combining the
          // data of the same indicator filtered with each of the columns of the
          // indicator used for the analysis
          .then(this._fetchAnalysisPartials.bind(this))
          // We finally gather all the information into this model
          .then(this._joinAnalysisPartials.bind(this))
          .done(function(data) {
            this.set(data);
            deferred.resolve.apply(this, arguments);
          }.bind(this))
          .fail(deferred.reject);
      } else if (this.compareIndicatorsModels) {
        // We first fetch the data of the indicator
        this.indicatorModel.fetch()
          // We then fetch the data of all the indicators used for the comparison
          .then(this._fetchComparePartials.bind(this))
          // We finally join the data
          .then(this._joinComparePartials.bind(this))
          .done(function (data) {
            this.set(data)
            deferred.resolve.apply(this, arguments);
          }.bind(this))
          .fail(deferred.reject);
      } else if (this.fspMapsModel) {
        this.fspMapsModel.fetch({ data: this.options.body, type: 'POST' })
          .then(this._joinFspPartials.bind(this))
          .done(function (data) {
            this.set(data)
            deferred.resolve.apply(this, arguments);
          }.bind(this))
          .fail(deferred.reject);
      } else {
        this.indicatorModel.fetch()
          .done(function() {
            this.set(this.indicatorModel.toJSON());
            deferred.resolve.apply(this, arguments);
          }.bind(this))
          .fail(deferred.reject);
      }

      return deferred;
    },

  });

}).call(this, this.App);

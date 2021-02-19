(function (App) {
  'use strict';

  App.Model.IndicatorModel = Backbone.Model.extend({

    // Check the default values in the initialize method
    // The values can't be placed here because Backbone.Model
    // will interprate them as the default model data
    defaults: {},

    initialize: function (attributes, options) {
      this.options = _.extend({}, {
        // Indicator id
        id: null,
        // Country ISO
        iso: null,
        // Year
        year: null,
        // Information about the indicator
        // This property is mandatory when fetching the expanded data of an indicator
        indicator: null,
        // List of filters
        // See _filters in App.Page.DataPortalCountryPage to see their format
        filters: [],
        // Whether or not the detailed data must be fetch
        preferedOrder: null,
        expanded: false,
        isRegion: false,
        isMSME: false,
        isMobileSurvey: false
      }, options);
    },

    url: function() {
      var pathname = this.options.isRegion ? 'indicator-region' : 'indicator';
      var apiUrl = this.options.isMSME ? MSME_API_URL : API_URL;

      var apiUrl = API_URL;
      if (this.options.isMSME) {
        apiUrl = MSME_API_URL; 
      } else if (this.options.isMobileSurvey) {
        apiUrl = MOBILE_SURVEYS_API_URL + '/widget/';
      }

      var url =  apiUrl + '/' + pathname + '/' + this.options.id + (this.options.expanded ? '/expanded' : '') + '?' + this.options.iso + '=' + this.options.year;
      if (this.options.isMobileSurvey) {
        // We need to call analyse endpoint
        if (this.options.analysisIndicator) {
          url =  apiUrl + this.options.indicator.id + '?' + this.options.iso + '=' + this.options.year + '&' + 'analyze' + '=' + this.options.analysisIndicator;
        } else if (typeof this.options.compareIndicators !== 'undefined' && this.options.compareIndicators !== null) {
          url =  apiUrl + this.options.indicator.id + '/heatmap' + '?' + this.options.iso + '=' + this.options.year;
        } else {
          url =  apiUrl + this.options.id + '?' + this.options.iso + '=' + this.options.year;
        }

      } 

      if (this.options.filters.length) {
        var filters = this.options.filters.map(function (filter) {
          return {
            indicatorId: filter.id,
            value: filter.options
          };
        }.bind(this))
        url += '&filters=' + JSON.stringify(filters);
      }

      return url;
    },

    _roundValue: function (val) {
      return Math.round((val + Number.EPSILON) * 100) / 100;
    },

    /**
     * Parse the data of an expanded indicator
     * The format return is compatible with App.View.TableView
     * @param {object} data
     * @return {object}
     */
    _parseExpandedData: function (data) {
      var isComplex = this.options.indicator.category === App.Helper.Indicators.CATEGORIES.ACCESS
        || this.options.indicator.category === App.Helper.Indicators.CATEGORIES.STRANDS;
      var parsedData;

      if (isComplex) {
        var rows = _.groupBy(data.data, function (row) { return row.row_id; });
        var rowsKeys = Object.keys(rows);
        var headersCount = rowsKeys[0].length;

        // We retrieve the mapping between the ids and the name of the columns
        var idToName = {};
        for (var i = 0, j = rowsKeys.length; i < j; i++) {
          var row = rows[rowsKeys[i]];
          row.forEach(function (cell) {
            if (cell.value.length && Object.keys(idToName).indexOf(cell.answerId) === -1) {
              idToName[cell.answerId] = cell.value;
            }
          });

          // We break when we have all the names
          if (Object.keys(idToName).length === headersCount) break;
        }

        parsedData = rowsKeys.map(function (key) {
          var row = rows[key];
          return {
            row: row.map(function (cell) {
              return {
                name: idToName[cell.answerId],
                value: cell.value.length ? 'Yes' : 'No',
                sortable: true
              };
            }).concat([{
              name: 'Weight',
              value: row[0].weight,
              sortable: true
            }])
          };
        });
      } else {
        if (this.options.isMobileSurvey) {
          parsedData = data.data[0].map(function (row) {
            return {
              row: [
                { name: 'Key', value: row[this.options.id.toLowerCase()] + ' - ' + row.gender, sortable: true },
                { name: 'Percentage', value: this._roundValue(row.percentage) + '%', sortable: true },
                { name: 'Weight', value: this._roundValue(row.value), sortable: true }
              ]
            };
          }, this);
        } else {
          parsedData = dataField.map(function (row) {
            return {
              row: [
                { name: data.title, value: row.value, sortable: true },
                { name: 'Weight', value: row.weight, sortable: true }
              ]
            };
          });
        }
  
      }

      return { title: data.title, data: parsedData };
    },

    _parseLegendTitle: function (title) {
      var toUpper = title.charAt(0).toUpperCase() + title.slice(1);
      var serialize = title.replace(/_/g, ' ');
      return serialize;
    },

    _parsePreferedOrder: function (data) {
      if (this.options.indicator && this.options.indicator.preferedOrder) {
        // If indicator has a prefered order
        // generate prefered order that will be added as domain
        // if filters are applied, use the prefered order as reference
        // and generate a prefered order without filtered out categories
        var catId = this.options.indicator.id.toLowerCase();
        // Revive all available categories from data
        var parsedCategories = [];
        data.forEach(function (row) {
          if (parsedCategories.indexOf(row[catId]) === -1) {
            parsedCategories.push(row[catId]);
          }
        });

        return App.Helper.Indicators.groupByPrefered(this.options.indicator.preferedOrder, parsedCategories);
      }
      // If no prefered order is present, we will simply ignore it
      // and render the chart with whatever gets returned from the API
      return null;
    },

    parse: function (data) {
      if (this.options.expanded) return this._parseExpandedData(data);
      if (this.options.isMobileSurvey) {
        if (this.options.analysisIndicatorId) {
          var legendTitle = this._parseLegendTitle(this.options.analysisIndicator);
          var position = this.options.analysisIndicatorId;
          return {
            title: data.title,
            legendTitle: legendTitle,
            preferedOrder: this._parsePreferedOrder(data.data[0]),
            data: data.data[0].map(function (answer) {
              return {
                category: answer[this.options.indicator.id.toLowerCase()],
                position: answer[position.toLowerCase()],
                gender: answer.gender,
                iso: answer.iso,
                percentage: answer.percentage,
                value: answer.value,
                year: answer.year,
                count: data.data[1].rowCount
              }
            }, this)
          }
        }

        return {
          title: data.title,
          preferedOrder: this._parsePreferedOrder(data.data[0]),
          data: data.data[0].map(function (answer) {
            return {
              category: answer[this.options.id.toLowerCase()],
              gender: answer.gender,
              iso: answer.iso,
              percentage: answer.percentage,
              value: answer.value,
              year: answer.year,
              count: data.data[1].rowCount
            }
          }, this)
        }
      }
    
      return {
        title: data.title,
        data: data.data.map(function (answer) {
          return {
            id: answer.answerId,
            label: answer.value,
            count: answer.count,
            total: answer.sum,
            percentage: answer.percentage
          };
        })
      };
    }

  });

}).call(this, this.App);

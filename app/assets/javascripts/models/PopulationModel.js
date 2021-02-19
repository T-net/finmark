(function (App) {
  'use strict';

  App.Model.PopulationModel = Backbone.Model.extend({

    initialize: function (iso, year, filters) {
      this.year = year;
      this.iso = iso;
      this.population = null;
      this.filters = filters || null;
    },

    url: function() {
      var apiUrl = MOBILE_SURVEYS_API_URL;
      return apiUrl + '/population?' + this.iso + '=' + this.year + this._serializeFilters();
    },

    _serializeFilters() {
      if (this.filters) {
        var filters = this.filters.map(function (f) {
          return {
            indicatorId: f.id,
            value: f.options
          }
        })
        return '&filters=' + JSON.stringify(filters);
      } 
      return '';
    },

    parse: function (data) {
      if (data.data && data.data.length) {
        var populationResponse = data.data[0];
        var population = populationResponse.map(function (d) {
          return d.value;
        }).reduce(function (a, b) {
          return a + b;
        });

        return {
          population: population
        }
      }
      return {
        population: null
      }
    }
  });

}).call(this, this.App);

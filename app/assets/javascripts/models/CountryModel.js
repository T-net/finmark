(function (App) {
  'use strict';

  App.Model.CountryModel = Backbone.Model.extend({

    initialize: function (iso, year, isMSME, isMobileSurvey) {
      this.year = year;
      this.iso = iso;
      this.isMSME = !!isMSME;
      this.isMobileSurvey = !!isMobileSurvey;
      this.population = null;
    },

    url: function() {
      var apiUrl = API_URL;
      if (this.isMobileSurvey) {
        apiUrl = MOBILE_SURVEYS_API_URL;
      } else if (this.isMSME) {
        apiUrl = MSME_API_URL;
      } 
      return apiUrl + '/country/' + this.iso;
    },

    parse: function (data) {
      var population = null;
      var totalMsme = null;
      if (data && data.length && data[0].years.length) {
        var year = data[0].years.find(function (y) {
          return y.year === this.year;
        }, this);
        population = year && year.total;
        totalMsme = year && year.total_msme;
      }

      return {
        totalMsme: totalMsme,
        population: population,
        url: data && data.length && data[0].mapUrl || null,
        downloadable: !!(year || {}).dataUrl
      };
    }

  });

}).call(this, this.App);

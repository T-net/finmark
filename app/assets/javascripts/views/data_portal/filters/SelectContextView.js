 (function (App) {

  var YearsCollection = Backbone.Collection.extend({

    initialize: function (attributes, options) {
      this.options = _.extend({}, options);
    },

    url: function () {
      if (this.options.isRegion) return API_URL + '/region/';
      if (this.options.isMSME) return MSME_API_URL + '/country/';
      if (this.options.isMobileSurvey) return  MOBILE_SURVEYS_API_URL + '/country/';
      return API_URL + '/country/';
    },

    parse: function (data) {
      return _.findWhere(data, { iso: this.options.iso })
        .year
        .map(function (years) {
          return { value: years.year };
        });
    }

  });

  App.View.SelectContextView = Backbone.View.extend({

    template: JST['templates/data_portal/filters/select-context'],

    defaults: {
      // Current ISO
      iso: null,
      // Current year
      year: null,
      // Current selected jurisdiction
      jurisdiction: null,
      isRegion: false,
      isMSME: false,
      isMobileSurvey: false
    },

    events: {
      'click .js-year': '_onClickYear',
      'click .js-jurisdiction': '_onClickJurisdiction'
    },

    initialize: function (options) {
      this.options = _.extend({}, this.defaults, options);

      this.yearsCollection = new YearsCollection({}, { iso: this.options.iso, isRegion: this.options.isRegion, isMSME: this.options.isMSME, isMobileSurvey: this.options.isMobileSurvey });
      this.jurisdictionsModel = new App.Model.IndicatorModel({}, {
        id: 'jurisdiction',
        iso: this.options.iso,
        year: this.options.year,
        filters: [], // The filters shouldn't be needed to retrieve the juridications
        isRegion: this.options.isRegion,
        isMSME: this.options.isMSME,
      });

      this._fetchData();
    },

    /**
     * Event handler executed when the user selects a year
     * @param {Event} e event
     */
    _onClickYear: function (e) {
      var selectedYear = +e.target.value;

      // We update the year of the jurisdictionsModel
      this.jurisdictionsModel.options.year = selectedYear;

      // We fetch the data again to get the new jurisdiction, and we impose a
      // delay so the user understands some changes have occured
      // NOTE: if the fetch fails and the user clicks the button to try to fetch the
      // data again, the code executed in the done callback won't be executed. This
      // does not break the state of the app because nothing would have been changed
      // in the UI (e.g. the previous year would be still selected)
      this._fetchData(1000)
        .done(function () {
          // We set the year as the user wanted
          this.el.querySelector('.js-year[value="' + selectedYear + '"]').checked = true;

          // We set the "All" option as the selected
          // The reason is that the jurisdictions depend on years, so it might
          // happen that for another year, the jurisdiction doesn't exist anymore
          this.el.querySelector('.js-jurisdiction[value="All"]').checked = true;
        }.bind(this));
    },

    /**
     * Event handler executed when the user selects a jurisdiction
     * @param {Event} e event
     */
    _onClickJurisdiction: function (e) {
      var jurisdiction = e.currentTarget.value;
      App.Helper.Analytics.sendEvent('Customise indicators', 'Select Jurisdiction', jurisdiction);
    },

    /**
     * Fetch the list of years and render the View
     * Return a deferred to know the result (after the changes in the DOM)
     * @param {number} delay Minimum time for the promises to resolve before rendering (ms)
     * @return {object} $.Deferred
     */
    _fetchData: function (delay) {
      this._showLoader();

      var deferreds = [
        this.jurisdictionsModel.fetch(),
        this.yearsCollection.fetch()
      ];

      if (delay) {
        deferreds.push((function () {
          var deferred = $.Deferred();
          setTimeout(deferred.resolve, delay);
          return deferred;
        })());
      }

      var deferred = $.Deferred();

      $.when.apply($, deferreds)
        .done(function () {
          this.render();
          deferred.resolve();
        }.bind(this))
        .fail(function () {
          this.renderError();
          deferred.reject();
        }.bind(this))
        .always(this._hideLoader.bind(this));

      return deferred;
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

    /**
     * Return the data associated with the tab
     * @returns {{ year: number, jurisdiction: string }}
     */
    getData: function () {
      var selectedYearRadio = document.querySelector('.js-year:checked');
      var selectedJurisdictionRadio = document.querySelector('.js-jurisdiction:checked');

      return {
        year: +selectedYearRadio.value,
        jurisdiction: selectedJurisdictionRadio.value
      };
    },

    /**
     * Return the list of years to be rendered
     * @returns {{ value: number, active: boolean }[]}
     */
    _getYears: function () {
      return this.yearsCollection.toJSON()
        .map(function (year) {
          return {
            value: year.value,
            active: year.value === this.options.year
          };
        }, this);
    },

    /**
     * Return the list of jurisdictions to be rendered
     * @returns {{ value: string, active: boolean }[]}
     */
    _getJurisdictions: function () {
      var res = this.jurisdictionsModel.get('data')
        .map(function (jurisdiction) {
          return {
            value: jurisdiction.label,
            active: jurisdiction.label === this.options.jurisdiction
          };
        }, this);

      res.unshift({
        value: 'All',
        active: !this.options.jurisdiction || this.options.jurisdiction === 'All'
      });

      return res;
    },

    render: function () {
      this.el.innerHTML = this.template({
        years: this._getYears(),
        jurisdictions: this._getJurisdictions()
      });

      return this;
    },

    renderError: function () {
      new App.View.RetryMessageView({
        el: this.el,
        label: 'Unable to load the context options',
        callback: this._fetchData.bind(this)
      });
    }

  });
}.call(this, this.App));

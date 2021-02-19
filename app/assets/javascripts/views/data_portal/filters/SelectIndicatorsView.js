(function (App) {

  App.View.SelectIndicatorsView = Backbone.View.extend({

    template: JST['templates/data_portal/filters/select-indicators'],

    defaults: {
      // List of indicators with their associated values
      // See _filters in App.Page.DataPortalCountryPage
      indicators: []
    },

    events: {
      'click .js-indicator': '_onClickIndicator'
    },

    initialize: function (options) {
      this.options = _.extend({}, this.defaults, options);
      this.render();
    },

    /**
     * Event handler executed when the user clicks on an indicator
     * @param {Event} e event
     */
    _onClickIndicator: function (e) {
      if (!e.currentTarget.checked) return;

      var indicator = e.currentTarget.dataset.indicator;
      var group = e.currentTarget.dataset.group;
      App.Helper.Analytics.sendEvent('Customise indicators', 'Select ' + group, indicator);
    },

    /**
     * Return the list of indicators grouped by category and with their description
     * The groups are ordered: Common indicators first, then the Access
     * and finally the Strands ones
     * @returns {{ category: string, indicators: object[]}[]}
     */
    _getGroupedIndicators: function () {
      var categories = _.groupBy(this.options.indicators, function (indicator) {
        return indicator.category;
      });
      return Object.keys(categories)
        .map(function (category) {
          var categorySlug = _.pairs(App.Helper.Indicators.CATEGORIES)
            .filter(function (group) {
              return group[1] === category;
            })[0][0];

          return {
            name: category,
            description: App.Helper.Indicators.CATEGORIES_DESC[categorySlug],
            indicators: categories[category]
          };
        }, this)
        .sort(function (groupA, groupB) {
          // We can sort alphabetically for now because it is the same result as
          // what we want
          if (groupA.name < groupB.name) return -1;
          if (groupA.name > groupB.name) return 1;
          return 0;
        });
    },

    /**
     * Return the list of selected indicators from the DOM
     * @returns {string[]}
     */
    _getSelectedIndicators: function () {
      var indicators = this.el.querySelectorAll('.js-indicator');
      indicators = Array.prototype.slice.call(indicators);
      return indicators.filter(function (indicator) {
        return indicator.checked;
      }).map(function (indicator) {
        return indicator.value;
      });
    },

    /**
     * Return the data associated with the tab
     * @returns {string[]}
     */
    getData: function () {
      return this._getSelectedIndicators();
    },

    render: function () {
      this.el.innerHTML = this.template({
        indicatorsbyCategories: this._getGroupedIndicators()
      });

      return this;
    }

  });
}.call(this, this.App));

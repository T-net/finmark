(function (App) {

  App.View.FilterIndicatorsModal = App.Component.Modal.extend({

    defaults: {
      // See App.Component.Modal for details about this option
      title: 'Customise indicators',
      // See App.Component.Modal for details about this option
      showTitle: true,
      // See App.Component.Modal for details about this option
      footer: '<button class="c-button -white -outline -medium js-cancel">Cancel</button><button class="c-button -white -medium js-done">Done</button>',
      // Callback executed when the user presses the "Done" button
      // The callback gets passed the name of the selected chart
      continueCallback: function () {},
      // ISO of the country
      iso: null,
      // Current year
      year: null,
      // List of all the possible indicators
      indicators: [],
      // List of filters currently applied
      filters: [],
      // Jurisdiction currently used as a filter
      jurisdiction: null,
      // Index of the current tab
      currentTab: 0,
      // List of the tabs
      // This attribute is modified at instantiation time
      _tabs: [],
      // List of the selected indicators in the modal
      _selectedIndicators: null,
      // List of selected filters in the modal
      _selectedFilters: null,
      // Selected year in the modal
      _selectedYear: null,
      // Selected jurisdiction in the modal
      _selectedJurisdiction: null,
      isRegion: false,
      isMSME: false,
      isMobileSurvey: false
    },

    events: function () {
      return _.extend({}, App.Component.Modal.prototype.events, {
        'click .js-cancel': 'onCloseModal',
        'click .js-done': '_onClickDone'
      });
    },

    contentTemplate: JST['templates/data_portal/filters'],

    initialize: function (options) {
      this.constructor.__super__.initialize.call(this, options);

      this.options._tabs = [
        {
          id: 'select-indicators',
          name: 'Select indicators',
          view: App.View.SelectIndicatorsView
        },
        {
          id: 'apply-filters',
          name: 'Apply filters',
          view: App.View.ApplyFiltersView
        }
      ];

      if (!options.isRegion) {
        this.options._tabs.push({
          id: 'select-context',
          name: 'Select context',
          view: App.View.SelectContextView
        });
      }

      this.render();
    },

    _setEventListeners: function () {
      this.constructor.__super__._setEventListeners.apply(this);

      this.listenTo(this.tabView, 'tab:selected', function (tab) {
        this._onTabSelected(tab.id);
      }.bind(this));
    },

    /**
     * Event handler executed when the user closes the modal
     */
    onCloseModal: function () {
      App.Helper.Analytics.sendEvent('Customise indicators', 'User cancels selection', 'click');
      App.Component.Modal.prototype.onCloseModal.apply(this, arguments);
    },

    /**
     * Event handler executed when the user switch from one tab to another
     * @param {string} tabId
     */
    _onTabSelected: function (tabId) {
      if (this.filterView) this._saveCurrentTabData();

      var tabIndex = _.findIndex(this.options._tabs, { id: tabId });
      this.options.currentTab = tabIndex;

      // We merge the list of indicators with the list of selected indicators
      // from the first tab so both of the tab always have the most updated data
      var indicators = this.options.indicators.map(function (indicator) {
        return _.extend({}, indicator, {
          visible: this.options._selectedIndicators
            ? this.options._selectedIndicators.indexOf(indicator.id) !== -1
            : indicator.visible
        });
      }, this);

      var filters = this.options._selectedFilters
        ? this.options._selectedFilters
        : this.options.filters;

      var year = this.options._selectedYear
        ? this.options._selectedYear
        : this.options.year;

      var jurisdiction = this.options._selectedJurisdiction
        ? this.options._selectedJurisdiction
        : this.options.jurisdiction;

      var View = this.options._tabs[tabIndex].view;
      this.filterView = new View({
        el: this.$el.find('.js-filters-container'),
        iso: this.options.iso,
        year: year,
        indicators: indicators,
        filters: filters,
        jurisdiction: jurisdiction,
        isRegion: this.options.isRegion,
        isMSME: this.options.isMSME,
        isMobileSurvey: this.options.isMobileSurvey
      });
    },

    /**
     * Save the data of the current tab
     */
    _saveCurrentTabData: function () {
      var tab = this.options._tabs[this.options.currentTab];
      var data = this.filterView.getData();

      switch (tab.id) {
        case 'apply-filters':
          this.options._selectedFilters = data;
          break;

        case 'select-context':
          this.options._selectedYear = data.year;
          this.options._selectedJurisdiction = data.jurisdiction;
          break;

        default:
          this.options._selectedIndicators = data;
      }
    },

    _onClickDone: function () {
      // We save the data of the current tab
      this._saveCurrentTabData();

      this.options.continueCallback(
        this.options._selectedIndicators,
        this.options._selectedFilters,
        this.options._selectedYear,
        this.options._selectedJurisdiction
      );

      this.onCloseModal();
    },

    render: function () {
      this.options.content = this.contentTemplate();

      this.constructor.__super__.render.apply(this);

      this.tabView = new App.View.TabView({
        el: this.el.querySelector('.js-tabs'),
        tabs: this.options._tabs,
        currentTab: this.options.currentTab
      });

      this._setEventListeners();
      this._onTabSelected(this.options._tabs[this.options.currentTab].id);
    }

  });
}.call(this, this.App));

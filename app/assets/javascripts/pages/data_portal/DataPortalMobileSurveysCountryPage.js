(function (App) {
  'use strict';

  App.Page.DataPortalMobileSurveysCountryPage = Backbone.View.extend({

    el: 'body',

    headerTemplate: JST['templates/data_portal/header'],
    mobileHeaderTemplate: JST['templates/data_portal/mobile-header'],
    widgetsTemplate: JST['templates/data_portal/widgets'],
    footerTemplate: JST['templates/data_portal/footer'],
    widgetsNavigationTemplate: JST['templates/data_portal/widget-navigation'],

    defaults: {
      // ISO of the country
      iso: null,
      // Current year
      year: null,
      // List of active filters
      // The structure is:
      // [
      //   { id: 'my-indicator', name: 'My indicator', options: ['Option 1', 'Option 2'] }
      // ]
      // NOTE: Do not set this property at instantiation time
      _filters: [],
      // Mode of the portal: "graphics" or "table"
      _mode: 'graphics'
    },

    events: {
      'click .js-customize-indicators': '_openFilterModal',
      'click .js-filter-tag': '_openFilterModal',
      'click .js-download-all': '_openDownloadAllModal',
      'click .js-mobile-header-toggle': '_onClickMobileHeaderToggle'
    },

    initialize: function (settings) {
      this.options = _.extend({}, this.defaults, settings);
      this.indicatorsCollection = new App.Collection.ExploratorySurveyIndicatorsCollection();
      this.countryModel = new App.Model.CountryModel(this.options.iso, this.options.year, false, true);
      this.populationModel = new App.Model.PopulationModel(this.options.iso, this.options.year);

      this.headerContainer = this.el.querySelector('.js-header');
      this.mobileHeaderContainer = this.el.querySelector('.js-mobile-header');
      this.widgetsContainer = this.el.querySelector('.js-widgets');
      this.footerContainer = this.el.querySelector('.js-footer');
      this.tabsContainers = this.el.querySelectorAll('.js-tabs');
      this.widgetNavContainer = this.el.querySelector('.js-widget-menu');

      this._setListeners();
      this._onWindowScroll();
      this._fetchData();

      new App.View.ReportFixedBar();
    },

    /**
     * Set the listeners that don't depend on DOM elements
     */
    _setListeners: function () {
      window.addEventListener('scroll', _.debounce(this._onWindowScroll.bind(this), 16));
    },

    /**
     * Event handler executed when the window is scrolled
     */
    _onWindowScroll: function () {
      if (this.headerContainer && this.mobileHeaderContainer) {
        var headerRect = this.headerContainer.getBoundingClientRect();
        this.mobileHeaderContainer.classList.toggle('_is-hidden', headerRect.bottom > 0);

        // We close the menu when it's hidden so when it appears again, it's closed
        if (headerRect.bottom > 0) {
          this.mobileHeaderContainer.classList.remove('-open');
        }
      }
    },

    /**
     * Event listener executed when a widget has successfully fetched its data
     * @param {{ id: string, name: string, data: object[] }} event
     */
    _onWidgetSync: function (event) {
      this._updateWidgetContainer(event.id, event.category);
    },

    /**
     * Event listener executed when the filter are updated
     * @param {string[]} visibleIndicators ids of the visible indicators
     * @param { { name: string, options: string[] }[] } filters
     * @param {number} year
     * @param {string} jurisdiction
     */
    _onFiltersUpdate: function (visibleIndicators, filters, year, jurisdiction) {
      if (visibleIndicators) this._updateVisibleIndicators(visibleIndicators);
      if (filters) this._updateFilters(filters);
      if (year) this._updateYear(year);

      // We need to ensure we remove the filter if we don't need it anymore
      this._updateJurisdiction(jurisdiction);

      this.render();
    },

    /**
     * Event handler executed when the tab is changed
     * @param {'graphics'|'table'} tabName
     */
    _onTabChange: function (tabName) {
      this.options._mode = tabName;

      App.Helper.Analytics.sendEvent('Change data view', 'Choose new view','Choose ' + tabName + ' view');

      if (tabName === 'graphics') {
        // We need to restore the configuration of the widgets
        Object.keys(this.widgetsByCategory).forEach(function (cat) {
          this.widgetsByCategory[cat].forEach(function (widget) {
            var widgetConfig = this.widgetsConfig[cat].find(function (widgetConfig) {
              return widgetConfig.id === widget.options.id;
            });

            if (!widgetConfig) {
              // This case can be triggered if the user adds an indicator while in the
              // table mode
              widget.options = Object.assign({}, widget.options, {
                chart: null,
                mode: this.options._mode
              });
            } else {
              widget.options = Object.assign({}, widget.options, {
                chart: widgetConfig.chart,
                analysisIndicator: widgetConfig.analysisIndicator,
                compareIndicators: widgetConfig.compareIndicators,
                mode: this.options._mode
              });
            }
            widget.reload();
          }, this);
        }, this);

        delete this.widgetsConfig;

      } else {
        // We need to save the current configuration of the widgets
        this.widgetsConfig = {};
        Object.keys(this.widgetsByCategory).map(function (cat) {
          this.widgetsConfig[cat] = this.widgetsByCategory[cat].map(function (widget) {
            return Object.assign({}, widget.options);
          });
        }, this);
      
        // We update all the widgets to the table view
        Object.keys(this.widgetsByCategory).forEach(function (cat) {
          this.widgetsByCategory[cat].forEach(function (widget) {
            widget.options = Object.assign({}, widget.options, {
              chart: 'table',
              showToolbar: true,
              analysisIndicator: null,
              compareIndicators: null,
              mode: this.options._mode
            });
            widget.reload();
          }, this);
        }, this);
      }
    },

    /**
     * Event handler for when the user clicks the toggle button of the mobile header
     */
    _onClickMobileHeaderToggle: function () {
      this.mobileHeaderContainer.classList.toggle('-open');
    },

    /**
     * Replace this.options._filters by the new filters
     * @param { { name: string, options: string[] }[] } activeFiltersOptions
     */
    _updateFilters: function (filters) {
      this.options._filters = filters;
      this.populationModel.filters = this.options._filters;
      this.populationModel.fetch()
      .done(function (){
        this._renderHeader();
        this._renderMobileHeader();
      }.bind(this));
    },

    /**
     * Replace this.options.year, updates the URL and the header
     * @param {number} year
     */
    _updateYear: function (year) {
      if (this.options.year === year) return;

      this.options.year = year;
      this._updateURL();

      // We need to update the header with the population of the country for the selected year
      this.countryModel.year = year;
      this.populationModel.year = year;

      // If the request fails, we just don't update the population
      this.countryModel.fetch()
        .done(function (){
          this._renderHeader();
          this._renderMobileHeader();
        }.bind(this));

      this.populationModel.fetch()
      .done(function (){
        this._renderHeader();
        this._renderMobileHeader();
      }.bind(this));
    },

    /**
     * Add a filter for the jurisdiction
     * @param {string} jurisdiction
     */
    _updateJurisdiction: function (jurisdiction) {
      // We copy the filters to avoid mutations of this.defaults
      this.options._filters = Array.prototype.slice.call(this.options._filters);

      var jurisdictionFilterIndex = _.findIndex(this.options._filters, { id: 'jurisdiction' });

      if (!jurisdiction || jurisdiction === 'All') {
        if (jurisdictionFilterIndex !== -1) {
          this.options._filters.splice(jurisdictionFilterIndex, 1);
        }
      } else {
        if (jurisdictionFilterIndex !== -1) {
          this.options._filters[jurisdictionFilterIndex].options = [jurisdiction];
        } else {
          this.options._filters.push({
            id: 'jurisdiction',
            options: [jurisdiction]
          });
        }
      }
    },

    /**
     * Update the URL according to the state of the application
     */
    _updateURL: function () {
      var url = '/data-portal/' + this.options.iso + '/' + this.options.year;

      // Adding { turbolinks: {} } is mandatory to avoid breaking the browser's back button
      // because Turbolinks doesn't handle well the URL changes
      // Check here: https://github.com/turbolinks/turbolinks/issues/219
      history.replaceState({ turbolinks: {} }, '', url);
    },

    /**
     * Update the visible indicators in this.indicatorsCollection
     * @param {string[]} visibleIndicators ids of the visible indicators
     */
    _updateVisibleIndicators: function(visibleIndicators) {
      this.indicatorsCollection.forEach(function (model) {
        var indicatorId = model.get('id');
        model.set({ visible: visibleIndicators.indexOf(indicatorId) !== -1 });
      });
    },

    /**
     * Fetch the model for the selected country and year
     */
    _fetchData: function () {
      // The first time we render to have the placeholder flags
      this.render();

      $.when.apply($, [
        this.indicatorsCollection.fetch(),
        this.countryModel.fetch(),
        this.populationModel.fetch()
      ])
        .done(function (){
          this._loadingError = false;
        }.bind(this))
        .fail(function () {
          this._loadingError = true;
        }.bind(this))
        .always(this.render.bind(this));
    },

    _openFilterModal: function (e) {
      var isTag = e.target.classList.contains('js-filter-tag');
      var tab = isTag
        ? ['indicator', 'filter', 'context'].indexOf(e.target.dataset.tab)
        : 0;

      new App.View.FilterIndicatorsModal({
        currentTab: tab,
        iso: this.options.iso,
        year: this.options.year,
        indicators: this.indicatorsCollection.toJSON(),
        filters: this.options._filters,
        jurisdiction: !!this._getJurisdictionFilter()
          ? this._getJurisdictionFilter().options[0]
          : null,
        continueCallback: this._onFiltersUpdate.bind(this),
        isMSME: false,
        isMobileSurvey: true
      });
    },

    _openDownloadAllModal: function () {
      new App.Component.ModalDownloadAll({
        iso: this.options.iso,
        year: this.options.year
      });
    },

    /**
     * Return the jurisdiction filter if exists
     * @return {{ id: 'jurisdiction', name?: string, options: string[] }}
     */
    _getJurisdictionFilter: function () {
      return _.findWhere(this.options._filters, { id: 'jurisdiction' });
    },

    /**
     * Return a human readable population number
     * @return {string}
     */
    _getReadablePopulation: function () {
      var population = this.populationModel.get('population');
      var factor, unit;

      if (!population) return 'No data provided';

      if (population / Math.pow(10, 9) >= 1) {
        factor = 9;
        unit = 'billion';
      } else if (population / Math.pow(10, 6) >= 1) {
        factor = 6;
        unit = 'million';
      } else {
        factor = 3;
        unit = 'thousand';
      }

      return (population / Math.pow(10, factor)).toFixed(2) + ' ' + unit;
    },

    render: function () {
      if (this.headerContainer) this._renderHeader();
      if (this.mobileHeaderContainer) this._renderMobileHeader();
      if (this.widgetsContainer) this._renderWidgets();
      if (this.widgetNavContainer) this._renderWidgetNav();
      if (this.footerContainer) this._renderFooter();

      this.setElement(this.el);
    },

    _renderWidgetNav: function () {
      if (this.groupedIndicators) {
        var tabs = Object.keys(this.groupedIndicators).map(function (indicator) {
          return {
            id: 'w-' + indicator.replace(/ /g, '-').toLowerCase(),
            name: indicator
          }
        })
        document.querySelector('.js-widget-menu').innerHTML = this.widgetsNavigationTemplate({
          tabs: tabs
        });
      }
    },

    /**
     * Render the header
     */
    _renderHeader: function () {
      this.headerContainer.innerHTML = this.headerTemplate({
        hasDownload: this.countryModel.get('downloadable'),
        error: this._loadingError,
        indicators: this.indicatorsCollection.getVisibleIndicators(),
        filters: this.options._filters
          .filter(function (filter) { return filter.id !== 'jurisdiction'; }),
        year: this.options.year,
        jurisdiction: this._getJurisdictionFilter()
          ? this._getJurisdictionFilter().options[0]
          : 'All jurisdictions',
        country: App.Helper.Indicators.COUNTRIES[this.options.iso],
        population: this._getReadablePopulation(),
        isFSD: {
          'Zambia': 2015
        }[App.Helper.Indicators.COUNTRIES[this.options.iso]] === this.options.year,
        isUNCDF: {
          'Myanmar': 2018,
          'Cambodia': 2015,
          'Laos': 2014,
          'Nepal': 2014,
          'Togo': 2016,
          'Madagascar': 2016
        }[App.Helper.Indicators.COUNTRIES[this.options.iso]] === this.options.year,
        isAFR: App.Helper.Indicators.COUNTRIES[this.options.iso] === 'Rwanda' &&
          [2008, 2012, 2016].includes(this.options.year),
        isCGAP: {
          'Bangladesh': 2016,
          'Côte d\'Ivoire': 2016,
          'Mozambique': 2015,
          'Nigeria': 2016,
          'Tanzania': 2016,
          'Uganda': 2015
        }[App.Helper.Indicators.COUNTRIES[this.options.iso]] === this.options.year,
        isHaiti: App.Helper.Indicators.COUNTRIES[this.options.iso] === 'Haiti',
        isRegion: false,
        isMSME: false,
        isMobileSurvey: true
      });

      // We instantiate the tab views
      if (!this.tabs) {
        this.tabs = [];
        this.tabs = Array.prototype.slice.call(this.tabsContainers)
          .map(function (container) {
            return new App.View.SwitcherView({
              el: container,
              tabpanel: this.widgetsContainer,
              currentTab: 'graphics',
              onChange: this._onTabChange.bind(this)
            });
          }, this);
      }
    },

    /**
     * Render the mobile header
     */
    _renderMobileHeader: function () {
      this.mobileHeaderContainer.innerHTML = this.mobileHeaderTemplate({
        hasDownload: this.countryModel.get('downloadable'),
        error: this._loadingError,
        indicators: this.indicatorsCollection.getVisibleIndicators(),
        filters: this.options._filters
          .filter(function (filter) { return filter.id !== 'jurisdiction'; }),
        year: this.options.year,
        jurisdiction: this._getJurisdictionFilter()
          ? this._getJurisdictionFilter().options[0]
          : 'All jurisdictions',
        country: App.Helper.Indicators.COUNTRIES[this.options.iso],
      });
    },

    /**
     * Render the footer
     */
    _renderFooter: function () {
      this.footerContainer.innerHTML = this.footerTemplate({
        error: this._loadingError,
        indicators: this.indicatorsCollection.getVisibleIndicators(),
        mapUrl: this.countryModel.get('url'),
        downloadUrl: MSME_API_URL + '/country/' + this.options.iso + '/' + this.options.year + '/download'
      });
    },

    /**
     * Create the widget containers
     * @param {number} count - number of containers to create
     * @returns {DocumentFragment} containers
     */
    _createWidgetsContainer: function (count) {
      var fragment = document.createDocumentFragment();

      for (var i = 0, j = count; i < j; i++) {
        var div = document.createElement('div');
        div.classList.add('grid-s-12', 'grid-l-6');
        var widget = document.createElement('div');
        widget.classList.add('c-widget');
        div.appendChild(widget);
        fragment.appendChild(div);
        
      }

      return fragment;
    },

    // Creates wrapper for each category, then paints widgets inside them
    _createWidgetsCategoryContainer: function (categories) {
      this.widgetsByCategory = {};

      Object.keys(categories).forEach(function (cat) {
        this.widgetsByCategory[cat] = [];
      }, this);

      var fragment = document.createDocumentFragment();

      Object.keys(categories).forEach(function (cat) {
        var div = document.createElement('div');
        var title = document.createElement('h3');

        div.classList.add('widget-category');
        title.id = 'w-' + cat.replace(/ /g, '-').toLowerCase();
        title.classList.add('widget-category-title');
        title.innerHTML = cat;

        div.append(title);

        var widgetList = document.createElement('div');
        widgetList.classList.add('widgets-list')
        
        var widgetsFragment = this._createWidgetsContainer(categories[cat].length);
        widgetList.appendChild(widgetsFragment);
        div.appendChild(widgetList);
        fragment.appendChild(div);

        this._initializeWidget(cat, categories[cat], widgetList);
      }, this);

      return fragment;
    },

    _initializeWidget: function (id, indicators, container) {
      // If the widget instances already exist, we remove the listeners
      // and reset their pointer
      if (this.widgetsByCategory[id].length > 0) {
        this.widgetsByCategory[id].forEach(function (widget) {
          this.stopListening(widget);
        }, this);
        this.widgetsByCategory[id] = [];
      } else {
        this.widgetsByCategory[id] = [];
      }

       // We instantiate the widget views
      indicators.forEach(function (indicator, index) {
        var chartOptions = {
          el: container.children[index].children[0],
          id: indicator.id,
          category: id,
          iso: this.options.iso,
          year: this.options.year,
          filters: this.options._filters,
          mode: this.options._mode,
          vegaVersion: 'V3',
          isMobileSurvey: true,
        };

        // If the portal is in table mode, we force the widgets to display
        // as tables
        if (this.options._mode === 'table') {
          chartOptions.chart = 'table';
        }

        var widget = new App.View.ChartWidgetView(chartOptions);
        this.widgetsByCategory[id].push(widget);

        this.listenTo(widget, 'data:sync', this._onWidgetSync);
      }, this);
    },

    /**
     * Update the size of the widget container depending on
     * if the category of the indicator
     * @param {string} indicatorId
     */
    _updateWidgetContainer: function (indicatorId, category) {      
      var index = _.findIndex(this.widgetsByCategory[category], { id: indicatorId })      
      var indicator = this.groupedIndicators[category][index];
      var isComplex = indicator.category === App.Helper.Indicators.CATEGORIES.ACCESS
        || indicator.category === App.Helper.Indicators.CATEGORIES.STRANDS
        || indicator.category === App.Helper.Indicators.CATEGORIES.ASSET
        || indicator.category === App.Helper.Indicators.CATEGORIES.SDGS
        || indicator.category === App.Helper.Indicators.CATEGORIES.POVERTY;

      var currentWidget = this.widgetsByCategory[category][index];
      var currentGroupNode = this.widgetsContainer.children[Object.keys(this.widgetsByCategory).indexOf(category)];
      var currentWidgetNode = currentGroupNode.children[currentGroupNode.children.length - 1].children[index];

      var isFullWidth = !!indicator.isFullWidth || currentWidget.options.chart === 'heatmap';

      if (isFullWidth || isComplex) {
        currentWidgetNode.classList.remove('grid-l-6');
      } else if (!currentWidgetNode.classList.contains('grid-l-6')) {
        currentWidgetNode.classList.add('grid-l-6');
      }
    },

    /**
     * Render the widgets
     */
    _renderWidgets: function () {
      if (this._loadingError) {
        new App.View.RetryMessageView({
          el: this.widgetsContainer,
          label: 'Unable to load the indicators',
          callback: this._fetchData.bind(this)
        });
        return;
      }

      var visibleIndicators = this.indicatorsCollection.getVisibleIndicators();

      if (!visibleIndicators.length) {
        this.widgetsContainer.innerHTML = '';
        var fragment = this._createWidgetsContainer(4);
        this.widgetsContainer.appendChild(fragment);
        return;
      }

      // We group each widget in its category
      
      var groupByCategory = {};
      visibleIndicators.forEach(function (indicator) {
        if (typeof groupByCategory[indicator.category] === 'undefined') {
          groupByCategory[indicator.category] = [indicator];
        } else {
          groupByCategory[indicator.category].push(indicator);
        }
      })

      this.groupedIndicators = groupByCategory;
      
      // Create container for each category and inside assign widgets
      var f = this._createWidgetsCategoryContainer(groupByCategory);
      this.widgetsContainer.innerHTML = ''; // We ensure it's empty first
      this.widgetsContainer.appendChild(f);
    }

  });
}).call(this, this.App);

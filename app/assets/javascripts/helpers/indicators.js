((function (App) {
  var COUNTRIES = {};
  var countries = _.forEach(gon.countries || [], function(country) {
    COUNTRIES[country.iso] = country.name;
  });

  App.Helper.Indicators = {
    // List of the categories of indicators
    CATEGORIES: {
      COMMON: 'Common indicators',
      ACCESS: 'Financial access',
      STRANDS: 'Strands',
      ASSET: 'Asset',
      SDGS: 'SDGs',
      POVERTY: 'Poverty',
      MSME_STRANDS: 'MSME Indicators',
      // Mobile surveys
      INCOME: 'Income',
      GENDER_NORMS: 'Gender Norms',
      DEMOGRAPHICS: 'Demographics',
      WORK: 'Work',
      OWNERSHIP_AND_CONTROL: 'Ownership & Control',
      AGENCY_AND_DECISION_MAKING: 'Agency & Decision Making',
      FINANCIAL_INC: 'Financial inclusion'
    },

    // Description for the categories
    CATEGORIES_DESC: {
      COMMON: null,
      ACCESS: 'Based on total % of adults who have financial products independent of other products.',
      STRANDS: 'Based on total % of adults who have financial products in a hierarchical priority of formal over informal products.',
      MSME_STRANDS: null,
      ASSET: null,
      SDGS: null,
      POVERTY: null,
      // Mobile surveys
      GENDER_NORMS: null,
      OWNERSHIP_AND_CONTROL: null,
      AGENCY_AND_DECISION_MAKING: null,
      DEMOGRAPHICS: null,
      WORK: null,
      FINANCIAL_INC: null
    },

    // Map for the ISO and country names
    COUNTRIES: Object.assign({
      UGA: 'Uganda',
      TZA: 'Tanzania',
      ZMB: 'Zambia',
      RWA: 'Rwanda',
      GHA: 'Ghana',
      KEN: 'Kenya',
      MOZ: 'Mozambique',
      PAK: 'Pakistan',
      MUS: 'Mauritius',
      SYC: 'Seychelles',
      NAM: 'Namibia',
      MWI: 'Malawi',
      BWA: 'Botswana',
      ZAF: 'South Africa',
      MEX: 'Mexico',
      IND: 'India',
      BGD: 'Bangladesh',
      NGA: 'Nigeria',
      CIV: 'Côte d\'Ivoire',
      MMR: 'Myanmar',
      KHM: 'Cambodia',
      LAO: 'Laos',
      NPL: 'Nepal',
      HTI: 'Haiti',
      TGO: 'Togo',
      MDG: 'Madagascar'
    }, COUNTRIES),

    /**
     * Serialize an indicator
     * @param {{ id: string, iso: string, year: number, chart: string, filters: {}[], analysisIndicator: string, compareIndicators: {}[] }} indicator
     * @return {{ id: string, i: string, y: number, c: string, f: {}[], an: string, cp: {}[] }}
     */
    serialize: function (indicator) {
      return {
        id: indicator.id,
        i: indicator.iso,
        y: indicator.year,
        c: indicator.chart || null,
        f: indicator.filters
          ? indicator.filters.map(function (filter) { return App.Helper.Filters.serialize(filter); })
          : [],
        an: indicator.analysisIndicator || null,
        cp: indicator.compareIndicators
          ? indicator.compareIndicators.map(function (compareIndicator) {
              return {
                id: compareIndicator.id,
                i: compareIndicator.iso,
                y: compareIndicator.year,
                f: compareIndicator.filters
                  ? compareIndicator.filters.map(function (filter) {
                      return App.Helper.Filters.serialize(filter);
                    })
                  : null
              };
            })
          : null
      };
    },

    /**
     * Deserialize an indicator
     * @param {{ id: string, i: string, y: number, c: string, f: {}[], an: string, cp: {}[] }} serializedIndicator
     * @return {{ id: string, iso: string, year: number, chart: string, filters: {}[], analysisIndicator: string, compareIndicators: {}[] }}
     */
    deserialize: function (serializedIndicator) {
      return {
        id: serializedIndicator.id,
        iso: serializedIndicator.i,
        year: serializedIndicator.y,
        chart: serializedIndicator.c || null,
        filters: serializedIndicator.f
          ? serializedIndicator.f.map(function (f) { return App.Helper.Filters.deserialize(f); })
          : [],
        analysisIndicator: serializedIndicator.an || null,
        compareIndicators: serializedIndicator.cp
          ? serializedIndicator.cp.map(function (cp) {
            return {
              id: cp.id,
              iso: cp.i,
              year: cp.y,
              filters: cp.f
                ? cp.f.map(function (f) {
                    return App.Helper.Filters.deserialize(f);
                  })
                : null
            };
          })
          : null
      };
    },

    /**
     * Return the list of saved indicators from the local storage
     * @return {{ id: string, i: string, y: number, c: string, f: {}[], an: string, cp: {}[] }[]}
     */
    getSavedIndicators: function () {
      var indicators = sessionStorage.getItem('indicators');
      try {
        return indicators ? JSON.parse(indicators) : [];
      } catch(e) {
        return [];
      }
    },

    /**
     * Save an indicator in the local storage
     * @param {{ id: string, iso: string, year: number, chart: string, filters: {}[], analysisIndicator: string, compareIndicators: {}[] }} indicator
     */
    saveIndicator: function (indicator) {
      var savedIndicators = this.getSavedIndicators();
      var serializedIndicator = App.Helper.Indicators.serialize(indicator);

      savedIndicators.push(serializedIndicator);
      sessionStorage.setItem('indicators', JSON.stringify(savedIndicators));

      Backbone.Events.trigger('indicator:saved');
    },

    /**
     * Remove an indicator from the local storage
     * @param {{ id: string, iso: string, year: number, chart: string, filters: {}[], analysisIndicator: string, compareIndicators: {}[] }} indicator
     */
    removeIndicator: function (indicator) {
      var savedIndicators = this.getSavedIndicators();
      var serializedIndicator = App.Helper.Indicators.serialize(indicator);

      savedIndicators = savedIndicators.filter(function (ind) {
        return !_.isEqual(ind, serializedIndicator);
      });
      sessionStorage.setItem('indicators', JSON.stringify(savedIndicators));

      Backbone.Events.trigger('indicator:saved');
    },

    /**
     * Return whether an indicator has been saved in the local storage
     * @param {{ id: string, iso: string, year: number, chart: string, filters: {}[], analysisIndicator: string, compareIndicators: {}[] }} indicator
     */
    isIndicatorSaved: function (indicator) {
      var savedIndicators = this.getSavedIndicators();
      var serializedIndicator = App.Helper.Indicators.serialize(indicator);

      if (!savedIndicators.length) return false;

      return !!savedIndicators.find(function (ind) {
        return _.isEqual(ind, serializedIndicator);
      });
    },

    groupByPrefered: function (prefered, categories) {   
      // Generate prefered order with available categories
      var parseOrder = prefered.map(function (prefCat) {
        if (categories.indexOf(prefCat) === -1) {
          return null;
        }
        return prefCat;
      }).filter(Boolean);
      
      return parseOrder;
    }

  };
})(this.App));

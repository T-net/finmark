(function (App) {
  'use strict';

  App.Page.DataPortalFinancialDiariesIndexPage = Backbone.View.extend({

    el: 'body',

    defaults: {
      filters: {
        // can be households or individuals
        type: 'households',
        categories: gon.selectedCategories
      }
    },

    initialize: function(options) {
      this.filters = Object.assign({}, this.defaults.filters, options.filters);
      this.iso = options.iso;
      this.year = options.year;

      if (this.filterView) {
        this.filterView.removeEventListener();
      } else {
        this.filterView = new App.Component.GroupedMenu({
          el: $('.js-filters')
        });
      }

      this._setVars();
      this._removeEventListeners();
      this._setEventListeners();
      this._loadCharts();
    },

    _setVars: function() {
      this.router = App.Router.FinancialDiaries;
      this.categories = document.querySelectorAll('.js-category-child-option') || [];
      this.tabs = document.querySelectorAll('.js-content-tab') || [];
      this.visibilityCheckboxes = document.querySelectorAll('.js-category-visibility') || []

      // bindings
      this.onClickCategoryBinded = function(e) {
        this._onClickCategory(e);
      }.bind(this);

      this.onChangeVisibilityBinded = function(e) {
        this._onChangeVisibility(e);
      }.bind(this);
    },

    _removeEventListeners: function() {
      $(this.categories).off('click');
      $(this.visibilityCheckboxes).off('click');

      this.tabs.forEach(function(tab) {
        $(tab).off('click');
      });
    },

    _setEventListeners: function() {
      $(this.categories).on('click', this.onClickCategoryBinded);
      $(this.visibilityCheckboxes).on('click', this.onChangeVisibilityBinded);

      // allows to keep scroll position after Turbolinks render the new page
      $(document).on('turbolinks:request-start', function() {
        window.prevPageYOffset = window.pageYOffset;
        window.prevPageXOffset = window.pageXOffset;
      });

      $(document).on('turbolinks:load', function() {
        window.scrollTo(window.prevPageXOffset, window.prevPageYOffset);
      });

      this.tabs.forEach(function(tab) {
        tab.addEventListener('click', function(e) {
          this._onClickTab(e);
        }.bind(this));
      }.bind(this));
    },

    _onChangeVisibility: function(e) {
      e.stopPropagation();
      var $checkbox = $(e.currentTarget);
      var categoryType = $checkbox.val();
      var isVisible = $checkbox[0].checked;
      var categories = [].concat(this.filters.categories);
      var index = _.findIndex(categories, { type: categoryType });

      if (index !== -1) {
        categories[index] = Object.assign({}, categories[index], { visible: isVisible });
      } else {
        // if the category is not already selected, it will be selected and displayed by default
        categories.push({
          type: categoryType,
          subcategory: null,
          visible: true
        });
      }

      this._updateFilters({ categories: categories });
    },

    _onClickCategory: function (e) {
      e && e.preventDefault() && e.stopPropagation();

      var categoryOption = e.currentTarget;
      var parentCategory = categoryOption.getAttribute('data-parent');
      var category = categoryOption.getAttribute('data-category');
      var categories = [].concat(this.filters.categories);
      var newCategoryObject = {
        type: parentCategory || null,
        subcategory: category,
        visible: true
      };

      if(!categories.length) {
        categories.push(newCategoryObject);
      } else {
        var categoryTypeExists = categories.find(function(cat) {
          return cat.type === newCategoryObject.type;
        });

        // It doesn't exist any category with this type. We simply add it.
        if (!categoryTypeExists) categories.push(newCategoryObject)

        if (categoryTypeExists) {
          var index = _.findIndex(categories, { type: newCategoryObject.type });

          // the user is clicking on the same category. We remove it.
          if (_.isEqual(categories[index], newCategoryObject)) {
            categories.splice(index, 1);
          } else {
            // this is a new subcategory. We replace the current one.
            categories[index] = Object.assign({}, newCategoryObject);
          }
        }
      }

      this.filterView.closeMenu();
      this._updateFilters({ categories: categories });
    },

    _onClickTab: function(e) {
      var type = e.currentTarget.getAttribute('data-type');
      this._updateFilters({ type: type });
    },

    _updateFilters: function(newFilters) {
      var prevFilters = Object.assign({}, this.filters);
      this.filters = Object.assign({}, this.filters, newFilters);
      var filtersAreEqual = _.isEqual(prevFilters, this.filters);
      if (!filtersAreEqual) this._onUpateURLParams();
    },

    _onUpateURLParams: function() {
      var pathname = Backbone.history.location.pathname;
      var encodedParams = window.btoa(JSON.stringify(this.filters));
      var newURL = pathname + '?p=' + encodedParams;

      Turbolinks.visit(newURL);
    },

    _loadCharts: function() {
      var categories = (this.filters.categories || [])
      .filter(function(cat) { return cat.visible })
      .map(function(category) {

        if (category.subcategory) {
          return {
            category_type: category.type,
            subcategory: category.subcategory || null
          }
        }

        return {
          category_type: category.type,
          category_name: 'ALL'
        };
      });

      var params = {
        project_name: gon.project_name,
        categories: window.encodeURIComponent(JSON.stringify(categories)),
        api: FD_API_URL
      };

      new App.View.MainChartView({
        params: params
      });

      new App.View.GroupedBarView({
        params: params
      });
    }
  });

}).call(this, this.App);

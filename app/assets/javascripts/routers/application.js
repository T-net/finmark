(function (App) {
  'use strict';

var Router = Backbone.Router.extend({

  routes: {
    '': '_homePage',
    'knowledge-hub(/)(:category)': '_insightsPage',
    'about(/)': '_aboutPage',
    'terms-of-use(/)': '_termsOfUsePage'
  },

  // *** PAGES ***
  _homePage: function () {
    // Don't forget to stop the router on each route
    // otherwise you'll break the browser's back button because
    // the router will still be listening to the route and when
    // Turbolinks triggers its load event, the DOM won't be
    // loaded yet
    Backbone.history.stop();

    new App.Page.HomePage();
  },

  _insightsPage: function () {
    // Don't forget to stop the router on each route
    // otherwise you'll break the browser's back button
    Backbone.history.stop();

    new App.Page.InsightsPage();
  },

  _aboutPage: function (p) {
    var params = (p || '')
      .split('&')
      .map(function (param) {
        return {
          name: param.split('=')[0],
          value: param.split('=')[1]
        };
      })
      .reduce(function (res, param) {
        res[param.name] = param.value;
        return res;
      }, {});

    new App.Page.AboutPage({
      memberModal: {
        slug: params.member || null,
        role: params.role || null
      },
      linkTo: params.linkTo
    });
  },

  _termsOfUsePage: function () {
    // Don't forget to stop the router on each route
    // otherwise you'll break the browser's back button
    Backbone.history.stop();
  }

});


var init = function () {
  App.Router.Application = new Router();

  if(document.querySelector('html').classList.contains('_no-scroll')) {
    document.querySelector('html').classList.remove('_no-scroll');
  }

  // Don't touch these two lines without testing if the
  // browser's back and forward buttons aren't broken
  Backbone.history.stop();
  Backbone.history.start({ pushState: true });

  new App.View.MobileMenu();
  new App.View.Search();
  new App.View.Newsletter();
  new App.View.Cards();
  new App.Component.SocialNav();
  new App.Component.FixedNav();

  // Go to previous scroll if turbolinks is enbaled in the same page
  if (window.currentLocation === window.location.pathname) {
    $('html, body').scrollTop(window.prevPageYOffset);
  } else {
    $('html, body').scrollTop(0);
  }
};

var getPreviousScroll = function() {
  window.currentLocation = window.location.pathname;
  window.prevPageYOffset = window.pageYOffset;
  window.prevPageXOffset = window.pageXOffset;
};

document.addEventListener('turbolinks:request-start', getPreviousScroll);
document.addEventListener('turbolinks:load', init);

}).call(this, this.App);

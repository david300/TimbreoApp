// Ionic Starter App

// angular.module is a global place for creating, registering and retrieving Angular modules
// 'starter' is the name of this angular module example (also set in a <body> attribute in index.html)
// the 2nd parameter is an array of 'requires'
// 'starter.controllers' is found in controllers.js
angular.module('starter', ['ionic', 'starter.controllers', 'uiGmapgoogle-maps', 'ngCordova', 'services'])

.run(function($ionicPlatform) {
  $ionicPlatform.ready(function() {
    // Hide the accessory bar by default (remove this to show the accessory bar above the keyboard
    // for form inputs)
    if (window.cordova && window.cordova.plugins.Keyboard) {
      cordova.plugins.Keyboard.hideKeyboardAccessoryBar(true);
      cordova.plugins.Keyboard.disableScroll(true);

    }
    if (window.StatusBar) {
      // org.apache.cordova.statusbar required
      StatusBar.styleDefault();
    }
  });
})

.config(function($stateProvider, $urlRouterProvider) {
  $stateProvider

  /* Autenticación */
  .state('auth', {
      url: "/login",
      cache: false,
      templateUrl: "templates/auth/login.html",
      controller: 'LoginCtrl'
  })

  .state('timbreo.registro', {
    url: "/registro",
    cache: false,
    views: {
      'layoutContent': {
        templateUrl: 'templates/timbreos/registrarTimbreo.html',
        controller: 'RegistrarTimbreoCtrl'
      }
    }
  })

  .state('timbreo.mapa', {
    url: "/mapa",
    cache: false,
    views: {
      'layoutContent': {
        templateUrl: 'templates/timbreos/mapa.html',
        controller: 'MapaTimbreoCtrl'
      }
    }
  })

  .state('timbreo.hojaDeRuta', {
    url: "/hojaDeRuta",
    cache: false,
    views: {
      'layoutContent': {
        templateUrl: 'templates/timbreos/hojaDeRuta.html',
        controller: 'HojaRutaCtrl'
      }
    }
  })

  .state('timbreo', {
    url: '/timbreo',
    abstract: true,
    templateUrl: 'templates/timbreos/layout.html',
    controller: 'TimbreoCtrl'
  });
  // if none of the above states are matched, use this as the fallback
  $urlRouterProvider.otherwise('/login');
});

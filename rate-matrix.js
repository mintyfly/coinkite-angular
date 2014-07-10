// NOTE: This project doesn't need any authentication.
//
var CK_API_HOST = 'https://api.coinkite.com';
var CK_API_HOST = 'http://lh:5001';
var CK_API_KEYS = {};

var app = angular.module('cc-example-module', ['mgcrea.ngStrap', 'restangular' ]);

app.controller('mainController', function($scope, Restangular) {

	// NOTE: This endpoint is public and does not require any API key to read.
    $scope.rates = {};
    $scope.reload_rates = function() {
      // clear old values
      $scope.rates = {};

      Restangular.oneUrl('public/rates').get().then(function(d) {

          $scope.rates = d.rates;
          $scope.info = d.currencies;
          $scope.all_codes = _.keys(d.currencies);
          $scope.crypto_codes = _.sortBy(_.keys(d.rates),
                                    function(k) { return d.currencies[k].rank;});
          $scope.fiat_codes = _.sortBy(_.difference($scope.all_codes, $scope.crypto_codes, ['XTN']),
                                    function(k) { return d.currencies[k].rank;});
                                                    
      });
    }
    $scope.reload_rates();
});

app.factory('myInterceptor', ['$log', function($log) {

    var myInterceptor = {
       'request': function(config) {
            $log.debug("HTTP Request: ", config);

            return config;
        },

        'response': function(response) {
            $log.debug("HTTP Response: ", response);
            return response;
        },

        'responseError': function(response) {
            // This allows my carefully constructed JSON error
            // responses to show through!
            $log.debug("HTTP Response (Error): ", response);
			if(!response.data) {
				response.data = '{"error":"HTTP Error ' + response.status + '"}';
			}
            return response;
        }
    };

    return myInterceptor;
}]);

app.config(['$httpProvider', function($httpProvider) {
    $httpProvider.interceptors.push('myInterceptor');
}]);


app.config(function(RestangularProvider) {

    RestangularProvider.setBaseUrl(CK_API_HOST);

    RestangularProvider.setFullRequestInterceptor(function(element, operation, route, url, headers, params, httpConfig) {
        console.log("Full req: ", headers, url, route);

        _.extend(headers, get_auth_headers(route));

      return {
        element: element,
        params: params,
        headers: headers,
        httpConfig: httpConfig
      };
    });

    RestangularProvider.addResponseInterceptor(function(data, operation, what, url, response, deferred) {
      //$scope.last_json = data;
        if(response.status != 200) {
            console.error("CK Request failed: " + response.status);
            console.error("JSON contents: ", data);
        }
        //console.log("respon interceptro: data=", data, " response=", response);

      return data;
    });


});

// CK Authorization stuff
//
function get_auth_headers(endpoint) {
    if(!CK_API_KEYS.api_secret || !CK_API_KEYS.api_key) {
        console.warn("No API key/secret defined but continuing w/o authorization headers.")
        return {};
    }

    // make the tricky parts of the auth headers
    return CK_API.auth_headers(CK_API_KEYS.api_key, CK_API_KEYS.api_secret, endpoint);
}

// EOF

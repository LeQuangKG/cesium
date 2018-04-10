define([
    './Check',
    './defaultValue',
    './defined',
    './defineProperties',
    './Ion',
    './PeliasGeocoder',
    './Rectangle',
    './Resource'
], function (
    Check,
    defaultValue,
    defined,
    defineProperties,
    Ion,
    PeliasGeocoder,
    Rectangle,
    Resource) {
        'use strict';

    /**
     * Provides geocoding through Bing Maps.
     * @alias IonGeocoder
     * @constructor
     *
     * @param {Object} options Object with the following properties:
     * @param {String} [options.accessToken=Ion.defaultAccessToken] The access token to use.
     * @param {String|Resource} [options.server=Ion.defaultServer] The resource to the Cesium ion API server.
     */
    function IonGeocoder(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var accessToken = defaultValue(options.accessToken, Ion.defaultAccessToken);
        var server = Resource.createIfNeeded(defaultValue(options.server, Ion.defaultServer));
        server.appendForwardSlash();

        var searchEndpoint = server.getDerivedResource({
            url: 'v0/geocode/search'
        });

        if (defined(accessToken)) {
            searchEndpoint.appendQueryParameters({ access_token: accessToken });
        }

        this._accessToken = accessToken;
        this._server = server;
        this._geocoder = new PeliasGeocoder(searchEndpoint);
    }

    defineProperties(IonGeocoder.prototype, {
        /**
         * The URL endpoint for the Bing geocoder service
         * @type {String}
         * @memberof {BingMapsGeocoderService.prototype}
         * @readonly
         */
        url: {
            get: function () {
                return this._accessToken;
            }
        },
        server: {
            get: function () {
                return this._server;
            }
        }
    });

    /**
     * @function
     *
     * @param {String} query The query to be sent to the geocoder service
     * @returns {Promise<GeocoderResult[]>}
     */
    IonGeocoder.prototype.geocode = function (query, geocodeType) {
        return this._geocoder.geocode(query, geocodeType);
    };

    return IonGeocoder;
});

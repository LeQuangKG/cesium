define([
    './Check',
    './defined',
    './defineProperties',
    './GeocodeType',
    './Rectangle',
    './Resource'
], function (
    Check,
    defined,
    defineProperties,
    GeocodeType,
    Rectangle,
    Resource) {
        'use strict';

    /**
     * Provides geocoding through Bing Maps.
     * @alias BingMapsGeocoderService
     * @constructor
     *
     * @param {Object} options Object with the following properties:
     * @param {Scene} options.scene The scene
     * @param {String} [options.key] A key to use with the Bing Maps geocoding service
     */
    function PeliasGeocoder(url) {
        this._url = Resource.createIfNeeded(url);
    }

    defineProperties(PeliasGeocoder.prototype, {
        /**
         * The URL endpoint for the Bing geocoder service
         * @type {String}
         * @memberof {BingMapsGeocoderService.prototype}
         * @readonly
         */
        url: {
            get: function () {
                return this._url;
            }
        }
    });

    /**
     * @function
     *
     * @param {String} query The query to be sent to the geocoder service
     * @returns {Promise<GeocoderResult[]>}
     */
    PeliasGeocoder.prototype.geocode = function(query, geocodeType) {
        //>>includeStart('debug', pragmas.debug);
        Check.typeOf.string('query', query);
        //>>includeEnd('debug');

        var resource = this._url.getDerivedResource({
            url: geocodeType === GeocodeType.SEARCH ? 'search' : 'autocomplete',
            queryParameters: {
                text: query
            }
        });

        return resource.fetchJson()
            .then(function (results) {
                return results.features.map(function (resultObject) {
                    var bboxDegrees = resultObject.bbox;
                    if (!defined(bboxDegrees)) {
                        bboxDegrees = [resultObject.geometry.coordinates[0] - 0.0001,
                        resultObject.geometry.coordinates[1] - 0.0001,
                        resultObject.geometry.coordinates[0] + 0.0001,
                        resultObject.geometry.coordinates[1] + 0.0001];
                    }
                    return {
                        displayName: resultObject.properties.label,
                        destination: Rectangle.fromDegrees(bboxDegrees[0], bboxDegrees[1], bboxDegrees[2], bboxDegrees[3])
                    };
                });
            });
    };

    return PeliasGeocoder;
});

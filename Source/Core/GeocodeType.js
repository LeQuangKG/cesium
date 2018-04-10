define([
    '../Core/freezeObject'
], function(
    freezeObject) {
'use strict';

/**
 * The horizontal location of an origin relative to an object, e.g., a {@link Billboard}
 * or {@link Label}.  For example, setting the horizontal origin to <code>LEFT</code>
 * or <code>RIGHT</code> will display a billboard to the left or right (in screen space)
 * of the anchor position.
 * <br /><br />
 * <div align='center'>
 * <img src='Images/Billboard.setHorizontalOrigin.png' width='648' height='196' /><br />
 * </div>
 *
 * @exports GeocodeType
 *
 * @see Geocoder
 */
var GeocodeType = {
    /**
     * The origin is at the horizontal center of the object.
     *
     * @type {Number}
     * @constant
     */
    SEARCH : 0,

    /**
     * The origin is on the left side of the object.
     *
     * @type {Number}
     * @constant
     */
    AUTOCOMPLETE : 1
};

return freezeObject(GeocodeType);
});

var popularItemsDataSource = popularItemsDataSource || {};
var channelsDataSource = channelsDataSource || {};

(function () {
    // Definition of the data adapter
    var popularItemsDataAdapter = WinJS.Class.define(
        //constructor
        function () {
            
        },

        // Data Adapter interface methods
        // These define the contract between the virtualized datasource and the data adapter.
        // These methods will be called by virtualized datasource to fetch items, count etc.
        {

            //TODO:implement
            getCount: function () {
                var that = this;
                return 10;
            },

            // Called by the virtualized datasource to fetch items
            // It will request a specific item and hints for a number of items either side of it
            // The implementation should return the specific item, and can choose how many either side
            // to also send back. It can be more or less than those requested.
            //
            // Must return back an object containing fields:
            //   items: The array of items of the form items=[{ key: key1, data : { field1: value, field2: value, ... }}, { key: key2, data : {...}}, ...];
            //   offset: The offset into the array for the requested item
            //   totalCount: (optional) update the value of the count
            itemsFromIndex: function (requestIndex, countBefore, countAfter) {
                var that = this;

                return WPJS.Consumer.apiXhr("/restapi/Product/Browse", "GET").then(
                    //success
                    function (result) {
                        WPJS.Debug("Received results from popular products.");
                        var results = that._parseResultJson(result);
                        return {
                            items: results, // The array of items
                            offset: requestIndex, //requestIndex - fetchIndex, // The offset into the array for the requested item
                            totalCount: 1000, //Math.min(count, that._maxCount), // Total count of records, bing will only return 1000 so we cap the value
                        };
                    },
                    //fail
                    function (result) {
                        WPJS.Debug("Error from popular products: " + result.status);
                        return WinJS.UI.FetchError.noResponse;
                    }
                );
            },
        
            // Data adapter results needs an array of items of the shape:
            // items =[{ key: key1, data : { field1: value, field2: value, ... }}, { key: key2, data : {...}}, ...];
            // Form the array of results objects
            _parseResultJson: function (result) {
                console.log(result);
                var results = $.parseJSON(result.response);
                var list = [];
 
                $.each(results.Results, function (i, prod) {
                    var p = {};
                    p.categoryId = prod.CategoryId;

                    if (prod.ProductPicture == null) {
                        //don't allow picture-less items
                        return true;
                    }else{
                        p.picture = (prod.ProductPicture.CalculatedUrl1 == null) ? prod.ProductPicture.CalculatedUrl0 : prod.ProductPicture.CalculatedUrl1;
                        p.largePic = (prod.ProductPicture.CalculatedUrl2 == null) ? p.pic : prod.ProductPicture.CalculatedUrl2;
                    }

                    p.id = prod.Id;
                    p.brand = prod.Brand;
                    p.title = prod.Title;
                    p.key = prod.Id;
                    p.description = prod.Description;
                    p.url = prod.RedirectUrl;
                    var tp = prod.DisplayPrice;
                    var tp = isNaN(tp) || tp === '' || tp === null ? 0.00 : tp;
                    p.price = parseFloat(tp).toFixed(2);

                    list.push({
                        key: p.id.toString(),
                        data: p
                    });
                });

                return list;
            }
        }       
    
    );


    var channelsDataAdapter = WinJS.Class.define(
        //constructor
        function () {

        },

        // Data Adapter interface methods
        // These define the contract between the virtualized datasource and the data adapter.
        // These methods will be called by virtualized datasource to fetch items, count etc.
        {

            //TODO:implement
            getCount: function () {
                var that = this;
                return 10;
            },

            // Called by the virtualized datasource to fetch items
            // It will request a specific item and hints for a number of items either side of it
            // The implementation should return the specific item, and can choose how many either side
            // to also send back. It can be more or less than those requested.
            //
            // Must return back an object containing fields:
            //   items: The array of items of the form items=[{ key: key1, data : { field1: value, field2: value, ... }}, { key: key2, data : {...}}, ...];
            //   offset: The offset into the array for the requested item
            //   totalCount: (optional) update the value of the count
            itemsFromIndex: function (requestIndex, countBefore, countAfter) {
                var that = this;

                return WPJS.Consumer.apiXhr("/restapi/Channel", "GET").then(
                    //success
                    function (result) {
                        WPJS.Debug("Received results from channels.");
                        var results = that._parseResultJson(result);
                        return {
                            items: results, // The array of items
                            offset: requestIndex, //requestIndex - fetchIndex, // The offset into the array for the requested item
                            totalCount: results.length, //Math.min(count, that._maxCount), // Total count of records, bing will only return 1000 so we cap the value
                        };
                    },
                    //fail
                    function (result) {
                        WPJS.Debug("Error from channels: " + result.status);
                        return WinJS.UI.FetchError.noResponse;
                    }
                );
            },

            // Data adapter results needs an array of items of the shape:
            // items =[{ key: key1, data : { field1: value, field2: value, ... }}, { key: key2, data : {...}}, ...];
            // Form the array of results objects
            _parseResultJson: function (result) {
                console.log(result);
                var results = $.parseJSON(result.response);
                var list = [];

                $.each(results.Channels, function (i, cat) {
                    var c = {};
                    c.channelType = cat.ChannelType;
                    c.name = cat.Name;

                    list.push({
                        key: c.channelType.toString(),
                        data: c
                    });
                });

                return list;
            }
        }

    );


    //Export the data sources
    popularItemsDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {
        this._baseDataSourceConstructor(new popularItemsDataAdapter());
    });

    channelsDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {
        this._baseDataSourceConstructor(new channelsDataAdapter());
    });

})();

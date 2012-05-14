//var popularItemsDataSource = popularItemsDataSource || {};
//var channelsDataSource = channelsDataSource || {};
//var expertsDataSource = expertsDataSource || {};

(function () {

    function parsePhotoJson(json) {
        var p = {};
        p.url = [];

        if (null == json)
            return p;

        var maxImageIndex = 2;
        p.url[0] = json.CalculatedUrl0;
        p.url[1] = json.CalculatedUrl1;
        p.url[2] = json.CalculatedUrl2;

        for (var i = maxImageIndex; i >= 0; i--) {
            if (p.url[i] != null) {
                p.largeImg = p.url[i];
                break;
            }
        }
        p.tilePicture = (p.url[1] == null) ? p.url[0] : p.url[1];

        return p;
    }

    function parseProduct(prod) {
        var p = {};
        p.categoryId = prod.CategoryId;
        p.picture = parsePhotoJson(prod.ProductPicture);

        p.id = prod.Id;
        p.brand = prod.Brand;
        p.title = prod.Title;
        p.key = prod.Id;
        p.description = prod.Description;
        p.url = prod.RedirectUrl;
        var tp = prod.DisplayPrice;
        var tp = isNaN(tp) || tp === '' || tp === null ? 0.00 : tp;
        p.price = parseFloat(tp).toFixed(2);
        return p;
    }


    // Definition of the data adapter
    var popularItemsDataAdapter = WinJS.Class.define(

        /*
            Constructor: All fields optional, but will scope the ultimate databinding
        */
        function (channel) {
            _channel = channel;
        },

        // Data Adapter interface methods
        // These define the contract between the virtualized datasource and the data adapter.
        // These methods will be called by virtualized datasource to fetch items, count etc.
        {
            _channel: null,
            _pageSize: 25, //this matches the default on the server

            //TODO:implement
            getCount: function () {
                var that = this;
                return that.itemsFromIndex(0, 0, 0).then(function (r) {
                    return r.totalCount
                });
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

                var params = [];
                if (_channel)
                    params.push(["Channel", _channel]);

                var firstItemPos = requestIndex + countBefore;
                var pg = Math.floor(firstItemPos / that._pageSize)+1;

                params.push(["Pg", pg]);
                params.push(["Limit", that._pageSize]);

                return WPJS.Consumer.apiXhr("/restapi/Product/Browse", "GET", params).then(
                    //success
                    function (result) {
                        WPJS.Debug("Received results from popular products.");
                        var response = $.parseJSON(result.response);
                        var results = that._parseResultJson(response);
                        return {
                            items: results, // The array of items
                            offset: countBefore, //requestIndex - fetchIndex, // The offset into the array for the requested item
                            totalCount: Math.min(response.FullResultCount, 1000), // Total count of records, but cap the value so we don't go crazy fetching
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
            _parseResultJson: function (results) {
                var list = [];
 
                $.each(results.Results, function (i, prod) {
                    var p = parseProduct(prod);

                    //skip photo-less items
                    if (p == null || p.picture == null)
                        return true;

                    list.push({
                        key: p.id.toString(),
                        data: p
                    });
                });

                return list;
            }
        }       
    
    );

    // Definition of the data adapter
    var userWishesDataAdapter = WinJS.Class.define(

        function (userId) {
            _userId = userId;
        },

        // Data Adapter interface methods
        // These define the contract between the virtualized datasource and the data adapter.
        // These methods will be called by virtualized datasource to fetch items, count etc.
        {
            _userId: null,
            _pageSize: 100, //this matches the default on the server

            getCount: function () {
                return WPJS.Consumer.apiXhr("/restapi/User/" + _userId + "/Wishes/Count", "GET").then(
                    //success
                    function (result) {
                        return parseInt(result.response);
                    },
                    //fail
                    function (result) {
                        WPJS.Debug("Error from user wish count: " + result.status);
                        return WinJS.UI.FetchError.noResponse;
                    }
                );
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

                var params = [];
                if (_channel)
                    params.push(["Channel", _channel]);

                var firstItemPos = requestIndex + countBefore;
                var pg = Math.floor(firstItemPos / that._pageSize) + 1;

                params.push(["Pg", pg]);
                params.push(["Limit", that._pageSize]);

                return WPJS.Consumer.apiXhr("/restapi/User/" + _userId + "/Wishes", "GET", params).then(
                    //success
                    function (result) {
                        WPJS.Debug("Received results from user wishes.");
                        var results = that._parseResultJson(result);
                        return {
                            items: results, // The array of items
                            offset: countBefore, //requestIndex - fetchIndex, // The offset into the array for the requested item
                            totalCount: 100, //Math.min(count, that._maxCount), // Total count of records, bing will only return 1000 so we cap the value
                        };
                    },
                    //fail
                    function (result) {
                        WPJS.Debug("Error from user wishes: " + result.status);
                        return WinJS.UI.FetchError.noResponse;
                    }
                );
            },

            // Data adapter results needs an array of items of the shape:
            // items =[{ key: key1, data : { field1: value, field2: value, ... }}, { key: key2, data : {...}}, ...];
            // Form the array of results objects
            _parseResultJson: function (result) {
                var results = $.parseJSON(result.response);
                var list = [];

                $.each(results.Wishes, function (i, prod) {
                    var p = parseProduct(prod);

                    //skip photo-less items
                    if (p == null || p.picture == null)
                        return true;

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
                return that.itemsFromIndex(0, 0, 0).then(function (r) {
                    return r.totalCount
                });
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

    var expertsDataAdapter = WinJS.Class.define(
        //constructor
        function () {

        },

        // Data Adapter interface methods
        // These define the contract between the virtualized datasource and the data adapter.
        // These methods will be called by virtualized datasource to fetch items, count etc.
        {

            _cachedResults: null,

            _resultLimit: 8,

            //TODO:implement
            getCount: function () {
                var that = this;
                return that.itemsFromIndex(0, 0, 0).then(function (r) {
                    return r.totalCount
                });
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

                //if (that._cachedResults != null)
                //   return new WinJS.Promise(function () { return that._cachedResults; });

                return WPJS.Consumer.apiXhr("/restapi/User/Experts?Limit="+that._resultLimit, "GET").then(
                    //success
                    function (result) {
                        WPJS.Debug("Received results from experts.");
                        var results = that._parseResultJson(result);
                        //TODO: BUGBUG - we only cache one set of results, regardless of params
                        that._cachedResults = {
                            items: results, // The array of items
                            offset: requestIndex, //requestIndex - fetchIndex, // The offset into the array for the requested item
                            totalCount: results.length, //Math.min(count, that._maxCount), // Total count of records, bing will only return 1000 so we cap the value
                        };
                        return that._cachedResults;
                    },
                    //fail
                    function (result) {
                        WPJS.Debug("Error from experts: " + result.status);
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

                $.each(results.Users, function (i, user) {
                    var u= {};
                    u.id = user.Id;
                    u.firstName = user.FirstName;
                    u.lastName = user.LastName;
                    u.screenName = user.ScreenName;
                    u.headline = user.Headline;
                    u.picture = parsePhotoJson(user.UserPicture);

                    list.push({
                        key: "user_"+u.id.toString(),
                        data: u
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

    popularInChannelDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function (channel) {
        this._baseDataSourceConstructor(new popularItemsDataAdapter(channel));
    });

    channelsDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {
        this._baseDataSourceConstructor(new channelsDataAdapter());
    });

    expertsDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function () {
        this._baseDataSourceConstructor(new expertsDataAdapter());
    });

    userWishDataSource = WinJS.Class.derive(WinJS.UI.VirtualizedDataSource, function (userId) {
        this._baseDataSourceConstructor(new userWishesDataAdapter(userId));
    });

})();

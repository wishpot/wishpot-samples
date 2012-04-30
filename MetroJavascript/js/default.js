// For an introduction to the Grid template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkID=232446
(function () {
    "use strict";

    var app = WinJS.Application;

    function doProductSearch(term, callbackPerItem) {
        WinJS.xhr({ url: WPJS.PPConsumer.getSearchUri(term) }).then(
        function (result) {
            loadPPResultXml(result, term, callbackPerItem, function (groups, items) {
                pageData.groups = groups;
                pageData.items = items;
                var lv = WinJS.UI.getControl(document.querySelector('.landingList'));
                updateForLayout(lv, Windows.UI.ViewManagement.ApplicationLayout.value);
            });
        },
        function (result) {
            console.log("Error: " + result.status);
        },
        function (result) {
            console.log("Progress: " + result);
        });
    }

    function loadPPResultXml(result,
                             searchTerm,
                             callbackPerItem,
                             finalCallback) {
        WPJS.Debug("Parsing Product Portals Results.");

        var colors = ['rgba(209, 211, 212, 1)', 'rgba(147, 149, 152, 1)', 'rgba(65, 64, 66, 1)'];
        var xml = result.responseXML;

        var groups = [];
        groups.push({
            key: 'searchresult',
            title: "Search Results for \"" + searchTerm + "\"",
            backgroundColor: colors[i % colors.length]
        });

        var itemArr = [];

        var items = xml.selectNodes("summary/products/product");
        if (items) {
            var length = Math.min(500, items.length);
            for (var i = 0; i < length; i++) {
                var desc = WPJS.XML.safeParseXmlText(items[i], "description", '(no description)');

                var pic = null;
                if (items[i].selectNodes("image/source") != null && items[i].selectNodes("image/source")[0] != null)
                    pic = items[i].selectNodes("image/source")[0].text;

                var product = new Product();
                product.title = WPJS.XML.safeParseXmlText(items[i], "title", '(no title)'),
                product.price = WPJS.XML.safeParseXmlText(items[i], "price", null),
                product.picture = pic;
                product.largePicture = pic;
                product.description = desc;
                product.url = WPJS.XML.safeParseXmlText(items[i], "url", null);

                var item = {
                    group: groups[0],
                    key: 'item' + WPJS.XML.safeParseXmlText(items[i], "item_num", 'i_' + i),
                    backgroundColor: colors[i % colors.length],
                    product: product
                }
                itemArr.push(item);
                if (callbackPerItem != null)
                    callbackPerItem(item);
            }
        }

        if (finalCallback != null)
            finalCallback(groups, itemArr);

    }


    app.onactivated = function (eventObject) {
        if (eventObject.detail.kind === Windows.ApplicationModel.Activation.ActivationKind.launch) {
            if (eventObject.detail.previousExecutionState !== Windows.ApplicationModel.Activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize 
                // your application here.
                WPJS.loadCategories();

            } else {
                // TODO: This application has been reactivated from suspension. 
                // Restore application state here.
            }
            WinJS.UI.processAll();
        }
    };

    app.oncheckpoint = function (eventObject) {
        // TODO: This application is about to be suspended. Save any state
        // that needs to persist across suspensions here. You might use the 
        // WinJS.Application.sessionState object, which is automatically
        // saved and restored across suspension. If you need to complete an
        // asynchronous operation before your application is suspended, call
        // eventObject.setPromise(). 
    };

    app.start();
})();

(function () {
    'use strict';

    var listRenderer;
    var headerRenderer;
    var itemRenderer;
    var pageLayout;

    // Custom event raised after the fragment is appended to the DOM.
    WinJS.Application.addEventListener('fragmentappended', function handler(e) {
        if (e.location === '/html/landingPage.html') { fragmentLoad(e.fragment, e.state); }
    });


    function updateForLayout(lv, layout) {
        pageLayout = layout;
        if (pageLayout === Windows.UI.ViewManagement.ApplicationLayoutState.snapped) {
            WinJS.UI.setOptions(lv, {
                dataSource: pageData.groups,
                itemRenderer: listRenderer,
                groupDataSource: null,
                groupRenderer: null,
                oniteminvoked: itemInvoked
            });

            lv.layout = new WinJS.UI.ListLayout();
        } else {
            var groupDataSource = new WinJS.UI.GroupDataSource(
                    new WinJS.UI.ListDataSource(pageData.groups), function (item) {
                        return {
                            key: item.data.group.key,
                            data: {
                                title: item.data.group.title,
                                click: function () {
                                    WinJS.Navigation.navigate('/html/collectionPage.html', { group: item.data.group });
                                }
                            }
                        };
                    });

            WinJS.UI.setOptions(lv, {
                dataSource: pageData.items,
                itemRenderer: itemRenderer,
                groupDataSource: groupDataSource,
                groupRenderer: headerRenderer,
                oniteminvoked: itemInvoked
            });
            lv.layout = new WinJS.UI.GridLayout({ groupHeaderPosition: 'top' });
        }

        //WPJS.scaleToFill('.scaleToFill');

        lv.refresh();
    }

    function layoutChanged(e) {
        var list = document.querySelector('.landingList');
        if (list) {
            var lv = WinJS.UI.getControl(list);
            updateForLayout(lv, e.layout);
        }
    }

    function fragmentLoad(elements, options) {
        try {
            var appLayout = Windows.UI.ViewManagement.ApplicationLayout.getForCurrentView();
            if (appLayout) {
                appLayout.addEventListener('layoutchanged', layoutChanged);
            }
            //launchFacebookWebAuth();
        } catch (e) { }

        WinJS.UI.processAll(elements)
            .then(function () {
                itemRenderer = elements.querySelector('.itemTemplate');
                headerRenderer = elements.querySelector('.headerTemplate');
                listRenderer = elements.querySelector('.listTemplate');

                var lv = WinJS.UI.getControl(elements.querySelector('.landingList'));
                updateForLayout(lv, Windows.UI.ViewManagement.ApplicationLayout.value);
            });
    }

    function itemInvoked(e) {
        if (pageLayout === Windows.UI.ViewManagement.ApplicationLayoutState.snapped) {
            var group = pageData.groups[e.detail.itemIndex];
            WinJS.Navigation.navigate('/html/collectionPage.html', { group: group });
        } else {
            var item = pageData.items[e.detail.itemIndex];
            WinJS.Navigation.navigate('/html/detailPage.html', { item: item });
        }
    }


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
            title: "Search Results for \"" + searchTerm+"\"",
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


    function getPopular() {
        var message = WPJS.Consumer.generateBaseConsumerMessage("/restapi/Product/Browse", "GET");
        var url = WPJS.Consumer.generateFinalUrl(message);
        
        /*, headers: { "Accept": "application/json" }*/
        WinJS.xhr({ url: url, type: message.method }).then(
        function (result) {
            loadResultXml(result);
        },
        function (result) {
            console.log("Error: " + result.status);
        });
    }

    function loadResultXml(result) {

        var xml = result.responseXML;
        var groups = [];
        var itemArr = [];

        var colors = ['rgba(209, 211, 212, 1)', 'rgba(147, 149, 152, 1)', 'rgba(65, 64, 66, 1)'];
        var items = xml.selectNodes("SearchResult/Results/Result");

        if (items) {
            var length = Math.min(500, items.length);  //hard-coded max to prevent potential bugs
            for (var i = 0; i < length; i++) {
               // link.setAttribute("href", items[i].selectSingleNode("link").text);
                // link.innerText = (i + 1) + ") " + items[i].selectSingleNode("title").text;
                var cat = items[i].selectSingleNode("CategoryId");
                var currGroup = null;
                if(cat != null && cat.text != null)
                {
                    if (groups[cat.text] == null) {
                        groups[cat.text] = {
                            key: 'group' + cat.text,
                            title: WPJS.Categories()[cat.text],
                            backgroundColor: colors[i % colors.length],
                            label: 'group label'
                        };
                        //WPJS.Debug("Added category to list: " + cat.text + " (" + WPJS.Categories()[cat.text] + ")");
                    }
                    else {
                        //WPJS.Debug("Category already present: " + cat.text);
                    }
                    currGroup = groups[cat.text];
                }

                
                var desc = WPJS.XML.safeParseXmlText(items[i], "Description", '(no description)');
                var price = null;
                if (items[i].selectSingleNode("DisplayPrice") != null) {
                    var tp = items[i].selectSingleNode("DisplayPrice").text;
                    tp = isNaN(tp) || tp === '' || tp === null ? 0.00 : tp;
                    price = parseFloat(tp).toFixed(2);
                }

                var pic = null;
                var largePic = null;
                var picNodes = null;

                if(items[i].selectNodes("ProductPicture/CalculatedUrl1") != null && items[i].selectNodes("ProductPicture/CalculatedUrl1")[0] != null)
                    picNodes = items[i].selectNodes("ProductPicture/CalculatedUrl1");
                else
                    picNodes = items[i].selectNodes("ProductPicture/CalculatedUrl0");


                if (items[i].selectNodes("ProductPicture/CalculatedUrl2") != null && items[i].selectNodes("ProductPicture/CalculatedUrl2")[0] != null)
                    largePic = items[i].selectNodes("ProductPicture/CalculatedUrl2")[0].text;
           

                if (null != picNodes && null != picNodes[0])
                    pic = picNodes[0].text;

                if (null == largePic)
                    largePic = pic;

                var product = new Product();
                product.title = WPJS.XML.safeParseXmlText(items[i], "Title", '(no title)');
                product.price = price,
                product.picture = pic;
                product.largePicture = largePic;
                product.description = desc;
                product.url = WPJS.XML.safeParseXmlText(items[i], "RedirectUrl", null);

                itemArr.push({
                    group: currGroup,
                    key: 'item' + WPJS.XML.safeParseXmlText(items[i], "Id", 'i_' + i),
                    backgroundColor: colors[i % colors.length],
                    product: product
                });

            }

            pageData.groups = groups;
            pageData.items = itemArr;

            var lv = WinJS.UI.getControl(document.querySelector('.landingList'));
            updateForLayout(lv, Windows.UI.ViewManagement.ApplicationLayout.value);
        } else {
            outputArea.innerHTML = "There are no items available at this time";
        }
       
    }


    // Obtain the Search Pane object and register for handling search while running as the main application
    var searchPane = Windows.ApplicationModel.Search.SearchPane.getForCurrentView();
    searchPane.addEventListener("querysubmitted", function (e){ doProductSearch(e.queryText); }, false);


    WPJS.loadCategories();
    getPopular();

    var pageData = {};
    pageData.groups = [];
    pageData.items = [];

    WinJS.Namespace.define('landingPage', {
        fragmentLoad: fragmentLoad,
        itemInvoked: itemInvoked
    });
})();

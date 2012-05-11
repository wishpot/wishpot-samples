// For an introduction to the Search Contract template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232512

// TODO: Add the following script tag to the start page's head to
// subscribe to search contract events.
//  
// <script src="/html/search.js"></script>
//
// TODO: Edit the manifest to enable use as a search target.  The package 
// manifest could not be automatically updated.  Open the package manifest file
// and ensure that support for activation of searching is enabled.

(function () {
    "use strict";

    var appModel = Windows.ApplicationModel;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;
    var searchPageURI = "/html/search.html";

    function doProductSearch(term, finalCallback) {
        WinJS.xhr({ url: WPJS.PPConsumer.getSearchUri(term) }).then(
        function (result) {
            loadPPResultXml(result, term, null, finalCallback);
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


    ui.Pages.define(searchPageURI, {
        generateFilters: function () {
            this.filters = [];
            this.filters.push({ results: null, text: "All", predicate: function (item) { return true; } });

            // TODO: Replace or remove example filters.
            this.filters.push({ results: null, text: "Group 1", predicate: function (item) { return item.group.key === "group1"; } });
            this.filters.push({ results: null, text: "Group 2+", predicate: function (item) { return item.group.key !== "group1"; } });
        },

        itemInvoked: function (eventObject) {
            eventObject.detail.itemPromise.then(function (item) {
                // TODO: Navigate to the item that was invoked.
                nav.navigate("/html/itemDetailPage.html", {item: item.data});
            });
        },

        // This function populates a WinJS.Binding.List with search results for the
        // provided query.
        searchData: function (queryText, callback) {
            var originalResults;
            // TODO: Perform the appropriate search on your data.
            if (typeof (window.data) !== "undefined") {
                callback(data.items.createFiltered(function (item) {
                    var regex = new RegExp(queryText, "gi")
                    return (item.title.match(regex) || item.subtitle.match(regex) || item.description.match(regex));
                }));
            } else {
                doProductSearch(queryText, callback);
            }
        },

        // This function filters the search data using the specified filter.
        applyFilter: function (filter, originalResults) {
            if (filter.results == null) {
                filter.results = originalResults.createFiltered(filter.predicate);
            }
            return filter.results;
        },

        // This function responds to a user selecting a new filter. It updates the
        // selection list and the displayed results.
        filterChanged: function (element, filterIndex) {
            var filterBar = element.querySelector(".filterbar");
            utils.removeClass(filterBar.querySelector(".highlight"), "highlight");
            utils.addClass(filterBar.childNodes[filterIndex], "highlight");

            var filterSelect = element.querySelector(".filterselect");
            filterSelect.selectedIndex = filterIndex;

            var listView = element.querySelector(".resultslist").winControl;
            listView.itemDataSource = this.filters[filterIndex].results.dataSource;
        },

        // This function executes each step required to perform a search.
        handleQuery: function (element, eventObject) {
            this.lastSearch = eventObject.queryText;
            WinJS.Namespace.define("search", { markText: this.markText.bind(this) });
            this.updateLayout(element, Windows.UI.ViewManagement.ApplicationView.value);
            this.generateFilters();
            var that = this;
            this.searchData(eventObject.queryText, function (results) { that.searchComplete(results, element); });
        },

        searchComplete: function(results, element)
        {
            this.populateFilterBar(element, results);
            this.applyFilter(this.filters[0], results);
            document.body.focus();
        },

        // This function colors the search term. Referenced in /html/search.html
        // as part of the ListView item templates.
        markText: function(source, sourceProperties, dest, destProperties) {
            var text = source[sourceProperties[0]];
            var regex = new RegExp(this.lastSearch, "gi")
            dest[destProperties[0]] = text.replace(regex, "<mark>$&</mark>");
        },

        // This function generates the filter selection list.
        populateFilterBar: function (element, originalResults) {
            var filterBar = element.querySelector(".filterbar");
            filterBar.innerHTML = "";
            for (var filterIndex = 0; filterIndex < this.filters.length; filterIndex++) {
                this.applyFilter(this.filters[filterIndex], originalResults);

                var li = document.createElement("li");
                li.filterIndex = filterIndex;
                li.textContent = this.filters[filterIndex].text + " (" + this.filters[filterIndex].results.length + ")";
                li.onclick = function (eventObject) { this.filterChanged(element, eventObject.target.filterIndex); }.bind(this);
                filterBar.appendChild(li);

                if (filterIndex === 0) {
                    utils.addClass(li, "highlight");
                    var listView = element.querySelector(".resultslist").winControl;
                    listView.itemDataSource = this.filters[filterIndex].results.dataSource;
                }

                var option = document.createElement("option");
                option.value = filterIndex;
                option.textContent = this.filters[filterIndex].text + " (" + this.filters[filterIndex].results.length + ")";
                element.querySelector(".filterselect").appendChild(option);
            }

            element.querySelector(".filterselect").onchange = function (eventObject) { this.filterChanged(element, eventObject.currentTarget.value); }.bind(this);
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var listView = element.querySelector(".resultslist").winControl;
            ui.setOptions(listView, {
                itemTemplate: element.querySelector(".itemtemplate"),
                oniteminvoked: this.itemInvoked
            });
            this.handleQuery(element, options);
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState) {
            var modernQuotationMark = "&#148;";

            var listView = element.querySelector(".resultslist").winControl;
            if (viewState === Windows.UI.ViewManagement.ApplicationViewState.snapped) {
                listView.layout = new ui.ListLayout();
                element.querySelector(".titlearea .pagetitle").innerHTML = modernQuotationMark + toStaticHTML(this.lastSearch) + modernQuotationMark;
                element.querySelector(".titlearea .pagesubtitle").innerHTML = "";
            } else {
                listView.layout = new ui.GridLayout();
                element.querySelector(".titlearea .pagetitle").innerHTML = "Search";
                element.querySelector(".titlearea .pagesubtitle").innerHTML = "Results for " + modernQuotationMark + toStaticHTML(this.lastSearch) + modernQuotationMark;
            }
        }
    });

    Windows.UI.WebUI.WebUIApplication.onactivated = function (eventObject) {
        if (eventObject.kind === appModel.Activation.ActivationKind.search) {
            ui.processAll();
            nav.navigate(searchPageURI, { queryText: eventObject.queryText });
        }
    };

    appModel.Search.SearchPane.getForCurrentView().onquerysubmitted = function (eventObject) { nav.navigate(searchPageURI, eventObject); };
})();

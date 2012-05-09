(function () {
    "use strict";

    var appView = Windows.UI.ViewManagement.ApplicationView;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;

    // These three strings encode placeholder images. You will want to set the
    // backgroundImage property in your real data to be URLs to images.
    var lightGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY7h4+cp/AAhpA3h+ANDKAAAAAElFTkSuQmCC";
    var mediumGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY5g8dcZ/AAY/AsAlWFQ+AAAAAElFTkSuQmCC";
    var darkGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC";  

    ui.Pages.define("/html/groupedItemsPage.html", {

        // This function is used in updateLayout to select the data to display
        // from an item's group.
        groupDataSelector: function (item) {
            return {
                title: item.group.title,
                click: function () {
                    nav.navigate("/html/groupDetailPage.html", { group: item.group });
                }
            }
        },

        productInvoked: function (eventObject) {
            if (appView.value === appViewState.snapped) {
                // If the page is snapped, the user invoked a group.
                eventObject.detail.itemPromise.then(function (invokedItem) {
                    // Access item data from the itemPromise
                    nav.navigate("/html/groupDetailPage.html", { group: invokedItem.data });
                });
            } else {
                // If the page is not snapped, the user invoked an item.
                eventObject.detail.itemPromise.then(function (invokedItem) {
                    // Access item data from the itemPromise
                    invokedItem.data.group_title = "Popular Items";
                    nav.navigate("/html/itemDetailPage.html", { item: invokedItem.data });
                });
            }
        },

        channelInvoked: function (eventObject) {
            eventObject.detail.itemPromise.then(function (invokedItem) {
                // Access item data from the itemPromise
                nav.navigate("/html/groupDetailPage.html", { item: invokedItem.data });
            });
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var that = this;

            var channelView = element.querySelector("#channel").winControl;
            var channelDataSource = new channelsDataSource();

            ui.setOptions(channelView, {
                itemTemplate: element.querySelector(".channelTemplate"),
                oniteminvoked: this.channelInvoked.bind(this),
                itemDataSource: channelDataSource
            });

            var popularView = element.querySelector("#popular").winControl;
            var popularDataSource = new popularItemsDataSource();


            ui.setOptions(popularView, {
                itemTemplate: element.querySelector(".productTemplate"),
                oniteminvoked: this.productInvoked.bind(this),
                itemDataSource: popularDataSource
            });

            var communityView = element.querySelector("#community").winControl;
            var communityDataSource = new expertsDataSource();


            ui.setOptions(communityView, {
                itemTemplate: element.querySelector(".userTemplate"),
                oniteminvoked: this.productInvoked.bind(this),
                itemDataSource: communityDataSource
            });


            this.updateLayout(element, appView.value);
        },

        /*
        onPopularLoaded: function(element, data)
        {
            var listView = element.querySelector("#popular").winControl;
            var groupedItems = data.createGrouped(function (item) { return groups[2].key; },
                                                  function (item) { return groups[2]; });


            ui.setOptions(listView, {
                groupHeaderTemplate: element.querySelector(".headerTemplate"),
                itemTemplate: element.querySelector(".itemtemplate"),
                oniteminvoked: this.itemInvoked.bind(this),
                itemDataSource: groupedItems.dataSource,
                groupDataSource: groupedItems.groups.dataSource,
                layout: new ui.ListLayout()
            });

        },
        */

        updateLayout: function(viewElement, viewState)
        {
            if (viewState === Windows.UI.ViewManagement.ApplicationViewState.snapped) {
                viewElement.layout = new ui.ListLayout();
            } else {
                viewElement.layout = new ui.GridLayout({ groupHeaderPosition: "top" });
            }
        },

        /*
        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState) {
            var listView = element.querySelector("#popular").winControl;

            if (viewState === appViewState.snapped) {
                // If the page is snapped, display a list of groups.
                ui.setOptions(listView, {
                    itemDataSource: popularProducts.groups.dataSource,
                    groupDataSource: null,
                    layout: new ui.ListLayout()
                });
            } else {
                // If the page is not snapped, display a grid of grouped items.
                var groupDataSource = popularProducts.items.createGrouped(popularProducts.groupKeySelector, this.groupDataSelector).groups;

                ui.setOptions(listView, {
                    itemDataSource: popularProducts.items.dataSource,
                    groupDataSource: groupDataSource.dataSource,
                    layout: new ui.GridLayout({ groupHeaderPosition: "top" })
                });
            }
        },

        */

    });
})();

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

    // Each of these sample groups must have a unique key to be displayed
    // separately.
    var groups = [
        { key: "group1", title: "Group Title: 1", subtitle: "Group Subtitle: 1", backgroundImage: darkGray, description: "desc" },
        { key: "group2", title: "Group Title: 2", subtitle: "Group Subtitle: 2", backgroundImage: lightGray, description: "desc" },
        { key: "group3", title: "Popular Items", subtitle: "Group Subtitle: 3", backgroundImage: mediumGray, description: "desc" },
        { key: "group4", title: "Group Title: 4", subtitle: "Group Subtitle: 4", backgroundImage: lightGray, description: "desc" }
    ];
  

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
                var group = popularProducts.groups.getAt(eventObject.detail.itemIndex);
                nav.navigate("/html/groupDetailPage.html", { group: group });
            } else {
                // If the page is not snapped, the user invoked an item.
                var item = popularProducts.items.getAt(eventObject.detail.itemIndex);
                nav.navigate("/html/itemDetailPage.html", { item: item });
            }
        },

        channelInvoked: function (eventObject) {
            if (appView.value === appViewState.snapped) {
                // If the page is snapped, the user invoked a group.
                var group = popularProducts.groups.getAt(eventObject.detail.itemIndex);
                nav.navigate("/html/groupDetailPage.html", { group: group });
            } else {
                // If the page is not snapped, the user invoked an item.
                var item = popularProducts.items.getAt(eventObject.detail.itemIndex);
                nav.navigate("/html/itemDetailPage.html", { item: item });
            }
        },

        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            var that = this;

            var channelView = element.querySelector("#channel").winControl;
            var channelDataSource = new channelsDataSource();

            ui.setOptions(channelView, {
                groupHeaderTemplate: element.querySelector(".headerTemplate"),
                itemTemplate: element.querySelector(".channelTemplate"),
                oniteminvoked: this.channelInvoked.bind(this),
                itemDataSource: channelDataSource,
                layout: new ui.ListLayout()
            });

            var popularView = element.querySelector("#popular").winControl;
            var popularDataSource = new popularItemsDataSource();


            ui.setOptions(popularView, {
                groupHeaderTemplate: element.querySelector(".headerTemplate"),
                itemTemplate: element.querySelector(".productTemplate"),
                oniteminvoked: this.productInvoked.bind(this),
                itemDataSource: popularDataSource,
                //groupDataSource: popularDataSource.createGrouped(function (item) { return groups[2].key; },
                //                                                 function (item) { return groups[2]; }),
                layout: new ui.ListLayout()
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

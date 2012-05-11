(function () {
    "use strict";

    var appView = Windows.UI.ViewManagement.ApplicationView;
    var appViewState = Windows.UI.ViewManagement.ApplicationViewState;
    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;

    ui.Pages.define("/pages/groupedItems/groupedItems.html", {

        productInvoked: function (eventObject) {
            if (appView.value === appViewState.snapped) {
                // If the page is snapped, the user invoked a group.
                eventObject.detail.itemPromise.then(function (invokedItem) {
                    // Access item data from the itemPromise
                    nav.navigate("/pages/productCollection/productCollection.html", { group: invokedItem.data });
                });
            } else {
                // If the page is not snapped, the user invoked an item.
                eventObject.detail.itemPromise.then(function (invokedItem) {
                    // Access item data from the itemPromise
                    invokedItem.data.group_title = "Popular Items";
                    nav.navigate("/pages/itemDetail/itemDetail.html", { item: invokedItem.data });
                });
            }
        },

        channelInvoked: function (eventObject) {
            eventObject.detail.itemPromise.then(function (invokedItem) {
                var item = invokedItem.data;
                item.group_title = item.name;
                item.dataSource = new popularInChannelDataSource(item.channelType);
                nav.navigate("/pages/productCollection/productCollection.html", { item: item });
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



        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState, lastViewState) {
            /// <param name="element" domElement="true" />
            /// <param name="viewState" value="Windows.UI.ViewManagement.ApplicationViewState" />
            /// <param name="lastViewState" value="Windows.UI.ViewManagement.ApplicationViewState" />

            /*
            var listView = element.querySelector(".groupeditemslist").winControl;
            if (lastViewState !== viewState) {
                if (lastViewState === appViewState.snapped || viewState === appViewState.snapped) {
                    var handler = function (e) {
                        listView.removeEventListener("contentanimating", handler, false);
                        e.preventDefault();
                    }
                    listView.addEventListener("contentanimating", handler, false);
                    this.initializeLayout(listView, viewState);
                }
            }
            */
        }
    });
})();

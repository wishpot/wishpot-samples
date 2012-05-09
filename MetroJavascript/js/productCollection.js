(function () {
    "use strict";

    var nav = WinJS.Navigation;
    var ui = WinJS.UI;
    var utils = WinJS.Utilities;
    var group;
    var items;

    ui.Pages.define("/html/productCollection.html", {
        // This function is called whenever a user navigates to this page. It
        // populates the page elements with the app's data.
        ready: function (element, options) {
            group = options.item;
            element.querySelector("header[role=banner] .pagetitle").textContent = group.group_title;

            var listView = element.querySelector(".grouplist").winControl;
            ui.setOptions(listView, {
                itemDataSource: group.dataSource,
                itemTemplate: element.querySelector(".itemtemplate"),
                //groupDataSource: pageList.groups.dataSource,
                //groupHeaderTemplate: element.querySelector(".headerTemplate"),
                oniteminvoked: this.itemInvoked.bind(this)
            });
            this.updateLayout(element, Windows.UI.ViewManagement.ApplicationView.value);
        },

        // This function updates the page layout in response to viewState changes.
        updateLayout: function (element, viewState) {
            var listView = element.querySelector(".grouplist").winControl;

            if (viewState === Windows.UI.ViewManagement.ApplicationViewState.snapped) {
                listView.layout = new ui.ListLayout();
            } else {
                listView.layout = new ui.GridLayout({ groupHeaderPosition: "left" });
            }
        },

        itemInvoked: function (eventObject) {
            eventObject.detail.itemPromise.then(function (invokedItem) {
                invokedItem.data.group_title = group.group_title;
                nav.navigate("/html/itemDetailPage.html", { item: invokedItem.data });
            });
        }
    });
})();

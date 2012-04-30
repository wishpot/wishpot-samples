(function () {
    "use strict";


    // These three strings encode placeholder images. You will want to set the
    // backgroundImage property in your real data to be URLs to images.
    var lightGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY7h4+cp/AAhpA3h+ANDKAAAAAElFTkSuQmCC";
    var mediumGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY5g8dcZ/AAY/AsAlWFQ+AAAAAElFTkSuQmCC";
    var darkGray = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAANSURBVBhXY3B0cPoPAANMAcOba1BlAAAAAElFTkSuQmCC";
    /*
    // Each of these sample groups must have a unique key to be displayed
    // separately.
    var sampleGroups = [
        { key: "group1", title: "Group Title: 1", subtitle: "Group Subtitle: 1", backgroundImage: darkGray, description: groupDescription },
        { key: "group2", title: "Group Title: 2", subtitle: "Group Subtitle: 2", backgroundImage: lightGray, description: groupDescription },
        { key: "group3", title: "Group Title: 3", subtitle: "Group Subtitle: 3", backgroundImage: mediumGray, description: groupDescription },
        { key: "group4", title: "Group Title: 4", subtitle: "Group Subtitle: 4", backgroundImage: lightGray, description: groupDescription },
        { key: "group5", title: "Group Title: 5", subtitle: "Group Subtitle: 5", backgroundImage: mediumGray, description: groupDescription },
        { key: "group6", title: "Group Title: 6", subtitle: "Group Subtitle: 6", backgroundImage: darkGray, description: groupDescription }
    ];

  
    */

    var list = new WinJS.Binding.List();
    var groups = [];
    var colors = ['rgba(209, 211, 212, 1)', 'rgba(147, 149, 152, 1)', 'rgba(65, 64, 66, 1)'];

    function getPopular() {
        return WPJS.Consumer.apiXhr("/restapi/Product/Browse", "GET").then(
            function (result) { loadResultJson(result, list); },
            function (result) { console.log("Error: " + result.status); }
        );
    }

    function loadResultJson(result, appendToList) {
        console.log(result);
        var results = $.parseJSON(result.response);
        
 
        $.each(results.Results, function (i, prod) {
            var p = {};
            p.categoryId = prod.CategoryId;

            var currGroup = null;
            if (p.categoryId != null) {
                if (groups[p.categoryId] == null) {
                    groups[p.categoryId] = {
                        key: p.categoryId,
                        title: WPJS.Categories()[p.categoryId],
                        backgroundColor: colors[i % colors.length]
                    };
                    WPJS.Debug("Added category to list: " + p.categoryId + " (" + WPJS.Categories()[p.categoryId] + ")");
                }
                else {
                    WPJS.Debug("Category already present: " + p.categoryId);
                }
                currGroup = groups[p.categoryId];
                p.group = currGroup;
            }
            else {
                //don't load the item, since there's no group for it
                return true;
            }

            if (prod.ProductPicture == null) {
                //don't allow picture-less items
                return true;
            }else{
                p.picture = (prod.ProductPicture.CalculatedUrl1 == null) ? prod.ProductPicture.CalculatedUrl0 : prod.ProductPicture.CalculatedUrl1;
                p.largePic = (prod.ProductPicture.CalculatedUrl2 == null) ? p.pic : prod.ProductPicture.CalculatedUrl2;
            }

            p.title = prod.Title;
            p.key = prod.Id;
            p.description = prod.Description;
            p.url = prod.RedirectUrl;
            var tp = prod.DisplayPrice;
            var tp = isNaN(tp) || tp === '' || tp === null ? 0.00 : tp;
            p.price = parseFloat(tp).toFixed(2);

            appendToList.push(p);
        });

    }

    function groupKeySelector(item) {
        return item.group.key;
    }

    function groupDataSelector(item) {
        return item.group;
    }

    // This function returns a WinJS.Binding.List containing only the items
    // that belong to the provided group.
    function getItemsFromGroup(group) {
        return list.createFiltered(function (item) { return item.group.key === group.key; });
    }

    // This function returns a WinJS.Binding.List containing only the items
    // that belong to the provided group.
    function getItemsFromGroup(group) {
        return list.createFiltered(function (item) { return item.categoryId === group.key; });
    }

    // Returns the group key that an item belongs to.
    function getCategoryGroupKey(item) {
        return item.group.key;
    }


    // TODO: Replace the data with your real data.
    // You can add data from asynchronous sources whenever it becomes available.
    getPopular();
    var groupedItems = list.createGrouped(groupKeySelector, groupDataSelector);;

    WinJS.Namespace.define("popularProducts", {
        items: groupedItems,
        groups: groupedItems.groups,
        getItemsFromGroup: getItemsFromGroup,
        groupKeySelector: groupKeySelector,

    });
})();

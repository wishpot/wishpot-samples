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


    function getPopular() {
        return WPJS.Consumer.apiXhr("/restapi/Product/Browse", "GET").then(
            function (result) { loadResultJson(result, list); },
            function (result) { console.log("Error: " + result.status); }
        );
    }

    function loadResultJson(result, appendToList) {
        console.log(result);
        var results = $.parseJSON(result.response);
        var colors = ['rgba(209, 211, 212, 1)', 'rgba(147, 149, 152, 1)', 'rgba(65, 64, 66, 1)'];
 
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

    function loadResultXml(result, appendToList) {
        var xml = result.responseXML;

        var colors = ['rgba(209, 211, 212, 1)', 'rgba(147, 149, 152, 1)', 'rgba(65, 64, 66, 1)'];
        var items = xml.selectNodes("SearchResult/Results/Result");

        if (items) {
            var length = Math.min(500, items.length);  //hard-coded max to prevent potential bugs
            for (var i = 0; i < length; i++) {
                // link.setAttribute("href", items[i].selectSingleNode("link").text);
                // link.innerText = (i + 1) + ") " + items[i].selectSingleNode("title").text;
                var cat = items[i].selectSingleNode("CategoryId");
                var currGroup = null;
                if (cat != null && cat.text != null) {
                    if (groups[cat.text] == null) {
                        groups[cat.text] = {
                            key: 'group' + cat.text,
                            title: WPJS.Categories()[cat.text],
                            backgroundColor: colors[i % colors.length]
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

                if (items[i].selectNodes("ProductPicture/CalculatedUrl1") != null && items[i].selectNodes("ProductPicture/CalculatedUrl1")[0] != null)
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

                appendToList.push({
                    group: currGroup,
                    key: 'item' + WPJS.XML.safeParseXmlText(items[i], "Id", 'i_' + i),
                    backgroundColor: colors[i % colors.length],
                    product: product
                });
            }
        } 

    }

    // This function returns a WinJS.Binding.List containing only the items
    // that belong to the provided group.
    function getItemsFromGroup(group) {
        return list.createFiltered(function (item) { return item.categoryId === group.key; });
    }

    // Returns the group key that an item belongs to.
    function getCategoryGroupKey(item) {
        return item.categoryId;
    }

    // Returns the title for a group.
    function getGroupData(item) {
        return {
            title: groups[item.categoryId].title,
        };
    }


    function getGroupedData() {
        return list.createGrouped(
            getCategoryGroupKey,
            getGroupData,
            function (l, r) { return l < r; }
        );
    }


    // TODO: Replace the data with your real data.
    // You can add data from asynchronous sources whenever it becomes available.
    getPopular();
    var groupedItems = getGroupedData();

    WinJS.Namespace.define("popularProducts", {
        items: groupedItems,
        groups: groupedItems.groups,
        getItemsFromGroup: getItemsFromGroup,
        groupKeySelector: getCategoryGroupKey,

    });
})();

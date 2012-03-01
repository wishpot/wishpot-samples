(function () {
    'use strict';

    // Custom event raised after the fragment is appended to the DOM.
    WinJS.Application.addEventListener('fragmentappended', function handler(e) {
        if (e.location === '/html/detailPage.html') { fragmentLoad(e.fragment, e.state); }
    });

    function fragmentLoad(elements, options) {
        var item = options && options.item ? options.item : getItem();
        elements.querySelector('.pageTitle').textContent = item.group.title;

        WinJS.UI.processAll(elements)
            .then(function () {
                elements.querySelector('.title').textContent = item.product.title;
                elements.querySelector('.content').innerHTML = item.product.description;
                elements.querySelector('.itemImage').src = item.product.largePicture;
                elements.querySelector('.buy').onclick = function () {
                    window.open(item.product.url);
                }
                elements.querySelector('.add').onclick = function () {
                    WPJS.EnsureAuth(function (result) {
                        
                    });
                }
            });
    }

    // The getItem() function contains sample data.
    // TODO: Replace with custom data.
    function getItem() {
        //PROBLEM!  Should never need to call this.
    }

    WinJS.Namespace.define('detailPage', {
        fragmentLoad: fragmentLoad,
    });
})();

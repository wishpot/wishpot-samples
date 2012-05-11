WISHPOT_HOSTNAME = "main.test.wishpot.com"; //"main.test.wishpot.com"; 
PRODUCT_PORTALS_KEY = "558";
FACEBOOK_APP_ID = "3003981649"; 
//FACEBOOK_APP_ID = "2456371452";

var WPJS = {
    BaseUri: WISHPOT_HOSTNAME,

    Consumer:
    {
        consumerKey: "WindowsTablet"
        , consumerSecret: "ddfd6d1e1e8a43e8a41a5581bfd7439c"
        , userKey: null
        , userSecret: null
        , serviceProvider:
        {
            signatureMethod: "HMAC-SHA1"
                , requestTokenURL: "http://" + WISHPOT_HOSTNAME + "/api/RequestToken.ashx "
                , userAuthorizationURL: "https://" + WISHPOT_HOSTNAME + "/secure/signin.aspx"
                , accessTokenURL: "http://" + WISHPOT_HOSTNAME + "/api/AccessToken.ashx"
        },
        isLoggedIn: function () {
            return (WPJS.Consumer.userKey != null && WPJS.Consumer.userSecret != null);
        },

        generateAccess: function () {
            return { consumerSecret: WPJS.Consumer.consumerSecret, tokenSecret: WPJS.Consumer.userSecret };
        },

        //'params' should be an array of arrays, where each array has two entries: a name and a value
        generateBaseConsumerMessage: function (apiPath, method, params) {
            var p = [['oauth_signature_method', WPJS.Consumer.serviceProvider.signatureMethod]
                   , ['oauth_consumer_key', WPJS.Consumer.consumerKey]];

            if (null != WPJS.Consumer.userKey)
                p = p.concat([['oauth_token', WPJS.Consumer.userKey]]);

            if (null != params)
                p = p.concat(params);

            return {
                action: "http://" + WPJS.BaseUri + apiPath
              , method: method
              , parameters: p
            };
        },

        generateFinalUrl: function (message) {
            OAuth.setTimestampAndNonce(message);
            OAuth.completeRequest(message, WPJS.Consumer.generateAccess());
            return OAuth.addToURL(message.action, message.parameters);
        },

        //Returns an WinJS.xhr object calling the given method.  Params shuld be an array of arrays, where each internal array has two values.
        apiXhr: function (apiPath, method, params) {
            var message = WPJS.Consumer.generateBaseConsumerMessage(apiPath, method, params);
            var url = WPJS.Consumer.generateFinalUrl(message);
            WPJS.Debug(url);
            return WinJS.xhr({ url: url, type: message.method, headers: { "Accept": "application/json" } });
        }
    },

    PPConsumer:
    {
        getSearchUri: function (term) {
            return "http://productportals.wishpot.com/product_api.xml?term=" + term + "&placement_id=" + PRODUCT_PORTALS_KEY;
        }
    },

    //the lists of the logged in user
    UserLists : {},

    Debug: function (msg) {
        if (typeof(console) != "undefined" && console.log) { console.log(msg); }
    },

    AddWish: function(productId, productSource)
    {
        if (!WPJS.Consumer.isLoggedIn()) {
            return false;
        }

    },

    //Launches an auth dialog if necessary.  calls back with 'true' or 'false' depending on whether or now the user has auth'd 
    EnsureAuth: function (callback) {
        if (WPJS.Consumer.isLoggedIn()) {
            callback(true); return;
        }
        WPJS._launchFacebookWebAuth(function (token){ WPJS.TokenExchange(token, callback); });
    },

    TokenExchange: function (facebookToken, callback) {
        if (null == facebookToken)
            callback(false);

        WPJS.Consumer.apiXhr("/restapi/User/OAuthCredential/Exchange/2", "POST", [["OAuthCredential.AccessToken", facebookToken]]).then(
        function (result) {
            WPJS._StoreUserToken(result.response, callback);
            WPJS._StoreUserLists();
        },
        function (result) {
            console.log("Error: " + result.status);
            callback(false);
        });
    },

    _StoreUserToken: function (resultJson, callback) {
        var token = $.parseJSON(resultJson);
        WPJS.Consumer.userKey = token.Token;
        WPJS.Consumer.userSecret = token.TokenSecret;
        callback(true);
    },

    _StoreUserLists: function()
    {
        if (!WPJS.Consumer.isLoggedIn()) {
            return false;
        }
        var message = WPJS.Consumer.generateBaseConsumerMessage("/restapi/User/Lists", "GET");
        var url = WPJS.Consumer.generateFinalUrl(message);
        
        WinJS.xhr({ url: url, type: message.method, headers: { "Accept": "application/json" } }).then(
        function (result) {
            WPJS.UserLists = JSON.parse(result.response)["Lists"];
        },
        function (result) {
            console.log("Error getting user lists: " + result.status);
        });
    },

    _launchFacebookWebAuth: function (callback) {
        var facebookURL = "https://www.facebook.com/dialog/oauth?client_id=";
        var clientID = FACEBOOK_APP_ID;
        var callbackURL = "https://www.facebook.com/connect/login_success.html";
        facebookURL += clientID + "&redirect_uri=" + encodeURIComponent(callbackURL) +
 "&scope=publish_actions,user_birthday,user_likes,email&display=popup&response_type=token";

        try {
            var startURI = new Windows.Foundation.Uri(facebookURL);
            var endURI = new Windows.Foundation.Uri(callbackURL);

            Windows.Security.Authentication.Web.WebAuthenticationBroker.authenticateAsync(
			Windows.Security.Authentication.Web.WebAuthenticationOptions.default,
			startURI,
			endURI).then(function (result){ WPJS._callbackFacebookWebAuth(result, callback); }, WPJS.callbackFacebookWebAuthError);
        }
        catch (err) {	/*Error launching WebAuth"*/	return; }
    },

    _callbackFacebookWebAuth: function (result, callback) {
        var FacebookReturnedToken = result.responseData;
        var response = "Status returned by WebAuth broker: " + result.responseStatus + "\r\n";
        if (result.responseStatus == 2) {
            response += "Error returned: " + result.responseErrorDetail + "\r\n";
        }
        var hashPos = FacebookReturnedToken.indexOf("#");
        if (hashPos <= 0)
            callback(null); //we did not get a valid token

        var tokenParamName = "access_token="
        var tokenPos = FacebookReturnedToken.indexOf(tokenParamName, hashPos);
        if (tokenPos <= 0)
            callback(null); //again, no valid token

        callback(FacebookReturnedToken.substring(tokenPos + tokenParamName.length, FacebookReturnedToken.indexOf("&", tokenPos)));
    },

    _callbackFacebookWebAuthError: function (err) {
        var error = "Error returned by WebAuth broker. Error Number: " + err.number + " Error Message: " + err.message + "\r\n";
        WPJS.Debug(error);
    },

    initFluidLists: function (listSelector) {
        jQuery(function ($) {
            var listSelector = listSelector ? listSelector : 'ol.fluid:visible';
            $(listSelector).each(function () {
                var mainImageArray = $(this).find('div.top a.image img');
                var ownerImagegArray = $(this).find('div.owner a.image img');
                // Set container height
                var listHeightMultiple = $(this).attr('data-height-multiple') || 1;
                $(mainImageArray).each(function () {
                    var objRoot = $(this).closest('li');
                    var objParent = $(this).parent();
                    var objParentOriginalWidth = objParent.width();
                    var objWidthMultiple = objRoot.attr('data-width-multiple') || 1;
                    if (objWidthMultiple != 1) {
                        objRoot.css('width', (objRoot.width() * objWidthMultiple) + 'px');
                    }
                    var objHeightMultiple = objRoot.attr('data-height-multiple') || listHeightMultiple;
                    objParent.css('height', Math.round(objParentOriginalWidth * objHeightMultiple) + 'px');
                });
                $(ownerImagegArray).each(function () {
                    $(this).parent().css('height', Math.round($(this).parent().width()) + 'px');
                });
                // Resize images
                var imageArray = mainImageArray.add(ownerImagegArray);
                if ($(this).hasClass('scaletofit')) {
                    scaleToFit($(imageArray));
                }
                else {
                    scaleToFill($(imageArray));
                }
                // Attach Events: Slider
                if ($(this).hasClass('slideinfo')) {
                    $('li', this).bind('mouseenter.slider', function () {
                        $('div.bottom', this).stop().css('bottom', '-100px').animate({ 'bottom': '0' }, { queue: false, duration: 200 });
                    }).bind('mouseleave.slider', function () {
                        $('div.bottom', this).stop().animate({ 'bottom': '-100px' }, { queue: false, duration: 200 });
                    });
                }
            });
        })
    },

    scaleToFill: function (imgSelector, fallbackScaleToFit) {
        jQuery(function ($) {
            $(imgSelector).not('img.noimage').each(function () {
                $(this).parent().css({
                    'position': 'relative',
                    'overflow': 'hidden'
                });
                $(this).css({
                    'position': 'absolute',
                    'height': 'auto',
                    'width': 'auto'
                });
                var objHeight = $(this).height();
                var objWidth = $(this).width();

                //this can happen when an image hasn't downloaded yet.  If so, go back and scale it when it's ready
                if (WPJS.imageIsNotLoaded(this)) {
                    WPJS.Debug("Image hadn't loaded when we tried to scale it: " + $(this).attr("src"));
                    $(this).load(function () { scaleToFill(this, fallbackScaleToFit); });
                    return true;
                }
                //WPJS.Debug("Scaling to fill: " + $(this).attr("src"));

                var parentHeight = $(this).parent().height();
                var parentWidth = $(this).parent().width();

                if (fallbackScaleToFit && (objHeight * 2 < parentHeight && objWidth * 2 < parentWidth) || objHeight / objWidth > 2 || objWidth / objHeight > 2) {
                    WPJS.Debug("Doing a scaletofit because image was too small or oddly-shaped (" + objHeight + "x" + objWidth + "): " + this + " " + $(this).attr("src"));
                    return scaleToFit(this);
                }

                var heightDiff = parentHeight - objHeight;
                var widthDiff = parentWidth - objWidth;
                if (heightDiff >= widthDiff) {
                    $(this).css('height', parentHeight + 'px');
                }
                else if (widthDiff > heightDiff) {
                    $(this).css('width', parentWidth + 'px');
                }
                $(this).css({
                    'top': Math.round((parentHeight - $(this).height()) / 2) + 'px',
                    'left': Math.round((parentWidth - $(this).width()) / 2) + 'px',
                    'visibility': 'visible'
                });
            });
        })
    },

    scaleToFit: function (imgSelector) {
        jQuery(function ($) {
            $(imgSelector).not('img.noimage').each(function () {
                $(this).parent().css({
                    'position': 'relative',
                    'overflow': 'hidden'
                });
                $(this).css({
                    'position': 'absolute',
                    'height': 'auto',
                    'width': 'auto'
                });
                var objHeight = $(this).height();
                var objWidth = $(this).width();

                //this can happen when an image hasn't downloaded yet.  If so, go back and scale it when it's ready
                if (WPJS.imageIsNotLoaded(this)) {
                    WPJS.Debug("Image hadn't loaded when we tried to scale it: " + $(this).attr("src"));
                    $(this).load(function () { scaleToFit(this); });
                    return true;
                }

                var parentHeight = $(this).parent().height();
                var parentWidth = $(this).parent().width();
                var heightDiff = parentHeight - objHeight;
                var widthDiff = parentWidth - objWidth;

                if (heightDiff >= widthDiff) {
                    $(this).css('width', parentWidth + 'px');
                }
                else if (widthDiff > heightDiff) {
                    $(this).css('height', parentHeight + 'px');
                }
                $(this).css({
                    'top': Math.round((parentHeight - $(this).height()) / 2) + 'px',
                    'left': Math.round((parentWidth - $(this).width()) / 2) + 'px',
                    'visibility': 'visible'
                })
            });
        })
    },

    //Runs through images with the specific class and swaps them if they aren't loaded
    correctErroredImages: function () {
        jQuery('.handleError > img').each(function () {
            if (WPJS.imageIsNotLoaded(this)) swapImageForError(this);
        });
    },

    swapImageForError: function (imageSelector) {
        jQuery(function ($) {
            WPJS.Debug("Error handler called for: " + $(imageSelector).attr("src"));
            if ($(imageSelector).hasClass('wishPic') || $(imageSelector).hasClass('listPic'))
                $(imageSelector).attr('src', WISHPOT_IMG_ROOT + '/item_100.gif');
            else if ($(imageSelector).hasClass('userPic'))
                $(imageSelector).attr('src', WISHPOT_IMG_ROOT + '/nopicusr.gif');
            else if ($(imageSelector).hasClass('prodPic'))
                $(imageSelector).attr('src', WISHPOT_IMG_ROOT + '/item_150.gif');
            else
                $(imageSelector).attr('src', WISHPOT_IMG_ROOT + '/nophoto160x160.gif');

            //if the parent has height, fill it (some parents have a tiny bit of height 'cause of some text)
            if ($(imageSelector).parent().height() > 15)
                scaleToFill(imageSelector);
            else
                $(imageSelector).css({ 'height': 'auto', 'width': 'auto' });
        })
    },
    imageIsNotLoaded: function (imgObj) {
        //WPJS.Debug("Checking if image has loaded: " + $(imgObj).attr("src"));
        if (typeof (imgObj.naturalWidth) != "undefined") return (imgObj.naturalWidth == 0);
        if (typeof (imgObj.readyState) != "undefined") return (imgObj.readyState == 'uninitialized');
        return (jQuery(imgObj).width() == 0 || jQuery(imgObj).height() == 0);
    },

    Categories: function () {
        return WPJS.LocalCache.get("wishpotCategories") || [];
    },

    /* AJAX FUNCTIONS */
    loadCategories: function () {
        if (WPJS.Categories().length > 0) return;

        WinJS.xhr({ url: "http://" + WISHPOT_HOSTNAME + "/restapi/Category", headers: { accept: 'application/json'}}).then(
            function (result) {
                var cats = $.parseJSON(result.response);
                console.log(result);
                var categoryArray = [];
                $.each(cats.Categories, function (i,cat) {
                    categoryArray[cat.Id] = cat.Name;
                });
                WPJS.LocalCache.set("wishpotCategories", categoryArray, 60);
            },
            function (result) {
                console.log("Error: " + result.status);
            }
        );
    },

    LocalCache:
    {
        get: function (key) {
            var o = localStorage.getItem(key);
            if (o == null) return null;

            o = JSON.parse(o);

            //delete if expired
            if (o.timestamp + o.expiration < new Date().getTime()) {
                WPJS.Debug("Deleting " + key + " from cache, as it has expired.");
                localStorage.removeItem(key);
                return null;
            }
            return o.value;
        },
        set: function (key, value, expirationInMinutes) {
            var o = { value: value, timestamp: new Date().getTime(), expiration: expirationInMinutes * 60 * 1000 }
            localStorage.setItem(key, JSON.stringify(o));
        }
    },

    XML:
    {
        safeParseXmlText: function (xml, nodePath, defaultIfNotPresent) {
            var node = xml.selectNodes(nodePath);
            if(node != null && node[0] != null)
                return node[0].text;
            return defaultIfNotPresent;
        }
    }
}






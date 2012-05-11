/* All of these scripts are verbatim from wishpot.com, and can be pasted in unedited */

function scaleToFill(imgSelector, fallbackScaleToFit) {
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
            if (imageIsNotLoaded(this)) {
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
}

function scaleToFit(imgSelector) {
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
            if (imageIsNotLoaded(this)) {
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
}

//Runs through images with the specific class and swaps them if they aren't loaded
function correctErroredImages() {
    jQuery('.handleError > img').each(function () {
        if (imageIsNotLoaded(this)) {
            if (window.location.protocol == 'https:' &&
              ($(this).hasClass('wishPic') || $(this).hasClass('listPic') || $(this).hasClass('prodPic'))) {
                $(this).error(function () { WPJS.Debug("Error afer trying ssl trick."); swapImageForError(this); });
                var src = $(this).attr('src');
                if (src.indexOf('//') == 0) { src = src.substring(2); }
                var w = $(this).parent().width();
                var h = $(this).parent().height();
                WPJS.Debug("Setting source to proxy for SSL: " + src);
                $(this).attr('src', '//images.weserv.nl/?url=' + escape(src) + '&w=' + w + '&h=' + h);
            }
            else {
                swapImageForError(this);
            }
        }
    });
}

function swapImageForError(imageSelector) {
    jQuery(function ($) {
        WPJS.Debug("Error handler called for: " + $(imageSelector).attr("src"));
        if ($(imageSelector).hasClass('wishPic') || $(imageSelector).hasClass('listPic'))
            $(imageSelector).attr('src', WISHPOT_IMG_ROOT + 'item_100.gif');
        else if ($(imageSelector).hasClass('userPic'))
            $(imageSelector).attr('src', WISHPOT_IMG_ROOT + 'nopicusr.gif');
        else if ($(imageSelector).hasClass('prodPic'))
            $(imageSelector).attr('src', WISHPOT_IMG_ROOT + 'item_150.gif');
        else
            $(imageSelector).attr('src', WISHPOT_IMG_ROOT + 'nophoto160x160.gif');

        //if the parent has height, fill it (some parents have a tiny bit of height 'cause of some text)
        if ($(imageSelector).parent().height() > 15)
            scaleToFill(imageSelector);
        else
            $(imageSelector).css({ 'height': 'auto', 'width': 'auto' });
    })
}
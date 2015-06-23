/// <reference path="../js/jquery.history.js" />
/// <reference path="../js/jquery.utility.js" />
/// <reference path="../js/lt.js" />

/*!
 *  LoopedTube - search.js
 *  https://github.com/SamuelWang/LoopedTube
 *  
 *  Copyright 2015 Samuel W.
 *  https://plus.google.com/u/0/101455311553487495221/about
 */

(function ($) {
    var $content = $('#content'),
        prevQuery,
        next;

    $('#btnmore', $content)
        .on('click', function () {
            var state = History.getState().data;
            
            if (state && state.query) {
                loopedtube.searchVideo({
                    q: state.query,
                    pageToken: (next) ? next : null
                }, function (data) {
                    if (!prevQuery || (prevQuery && prevQuery !== state.query)) {
                        prevQuery = state.query;
                        loopedtube.renderVideoList($('#search-result'), data.items, true);
                    } else {
                        loopedtube.renderVideoList($('#search-result'), data.items, false);
                    }

                    next = data.next;
                });
            }
        });
}(jQuery));
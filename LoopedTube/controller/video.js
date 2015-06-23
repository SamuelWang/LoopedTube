/// <reference path="../js/jquery.history.js" />
/// <reference path="../js/jquery.utility.js" />
/// <reference path="../js/lt.js" />

/*!
 *  LoopedTube - video.js
 *  https://github.com/SamuelWang/LoopedTube
 *  
 *  Copyright 2015 Samuel W.
 *  https://plus.google.com/u/0/101455311553487495221/about
 */

(function ($) {
    var $content = $('#content');

    //construct player functionalities
    $('#player-funcs', $content)
        //repeat video button
        .find('.fa-repeat')
            .addClass((loopedtube.isLoop) ? 'active' : null)
            .on('click', function () {
                loopedtube.toggleButtonActive($(this), function () {
                    loopedtube.isLoop = true;
                }, function () {
                    loopedtube.isLoop = false;
                });
            })
        .end()

        //set video playing rang button
        .find('.fa-arrows-h')
            .on('click', function () {
                loopedtube.toggleButtonActive($(this), function () {
                    $('#time-interval').show();
                }, function () {
                    $('#time-interval').hide();
                });
            })
        .end()

        //set music mode button
        .find('.fa-music')
            .addClass((loopedtube.musicMode) ? 'active' : null)
            .on('click', function () {
                loopedtube.toggleButtonActive($(this), function () {
                    loopedtube.musicMode = true;

                    if (loopedtube.player && loopedtube.player.getPlayerState() > -1) {
                        loopedtube.player.setPlaybackQuality('small');
                    }
                }, function () {
                    loopedtube.musicMode = false;

                    if (loopedtube.player && loopedtube.player.getPlayerState() > -1) {
                        loopedtube.player.setPlaybackQuality('default');
                    }
                });
            });

    //video playing rang setting handler
    $('#time-interval', $content)
        .hide()
        .on('change', function (evt) {
            var $elem = $(this),
                $target = $(evt.target),
                id = $target.attr('id'),
                val = $target.val();

            if (/(\d{1,2}):?(\d{1,2}):?(\d{1,2})/.test(val)) {
                var sec = $.timeToSecond(val);

                if (sec > 0) {
                    switch (id) {
                        case 'starttime':
                            if (sec > loopedtube.currentVideo.duration) {
                                loopedtube.showMessage('開始時間不可大於影音總長度。', 'warning');
                                $target.val($.secondToTime(0));
                                return;
                            } else {
                                loopedtube.currentVideo.startTime = sec;

                                //seek to start time if current time less than the start time that user set
                                if ((sec - loopedtube.player.getCurrentTime()) > 5) {
                                    loopedtube.player.seekTo(sec);
                                }
                            }
                            break;

                        case 'endtime':
                            if (sec > loopedtube.currentVideo.duration) {
                                loopedtube.showMessage('結束時間不可大於影音總長度。', 'warning');
                                $target.val($.secondToTime(loopedtube.currentVideo.duration));
                                return;
                            } else {
                                loopedtube.currentVideo.endTime = sec;
                            }
                            break;
                    }

                    $target.val($.secondToTime(sec));
                    loopedtube.addRecentVideo(loopedtube.currentVideo);
                }
            } else {
                loopedtube.showMessage('請輸入正確的時間格式。', 'error');
            }
        });

    $('#recent-list .list-view-header-trash').on('click', function () {
        localStorage.clear();
        loopedtube.renderVideoList($('#recent-list'), null, true);
    });

    if (!loopedtube.cuedVideo) {
        $('#player-content').hide();
    }

    //render recent playing video lsit
    loopedtube.renderVideoList($('#recent-list', $content), loopedtube.getRecentVideoList(), true);
}(jQuery));
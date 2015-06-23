/// <reference path="js/jquery.history.js" />
/// <reference path="jquery.utility.js" />
/// <reference path="js/lt.js" />

/*!
 *  LoopedTube - index.js
 *  https://github.com/SamuelWang/LoopedTube
 *  
 *  Copyright 2015 Samuel W.
 *  https://plus.google.com/u/0/101455311553487495221/about
 * 
 *  Date: 2015-03-31 22:20 GMT+0800
 */

(function ($) {
    //Dom Ready
    $(function () {
        var $header = $('#header');

        //register button's action of header
        $('.header-funcs', $header)
            .on('click', '.button', function () {
                var $elem = $(this),
                    funcKey = $elem.attr('data-func');

                $elem.siblings('.active').removeClass('active');
                $header.find('.search-wrapper').hide(400, 'linear');

                loopedtube.toggleButtonActive($elem, function () {
                    $('#' + funcKey + 'box', $header)
                        .show(400, 'linear')
                            .find('input')
                            .focus();
                }, function () {
                    $('#' + funcKey + 'box', $header).hide(400, 'linear');
                });
            });

        //register search or key input action
        $('.search-wrapper', $header)
            .on('keyup', function (evt) {
                var $elem = $(this),
                    $input = $elem.find('input'),
                    value = $input.val(),
                    id = $elem.attr('id');

                if (evt.which === 13) {
                    switch (id) {
                        case 'keybox':
                            var cuedVideo = loopedtube.parseVideoId(value);

                            if (cuedVideo && cuedVideo.id) {
                                History.pushState({ video: cuedVideo }, '', '?video=' + cuedVideo.id);

                                $input.val('');
                                $('#btn' + id.replace('box', ''), $header).click();
                            } else {
                                loopedtube.showMessage('請輸入正確的影片ID或影片網址', 'warning');
                                $input.focus();
                            }
                            break;

                        case 'searchbox':
                            History.pushState({ query: value }, '', '?search=' + encodeURIComponent(value));

                            $input.val(value);
                            $('#btn' + id.replace('box', ''), $header).click();
                            break;
                    }
                }
            });

        $(window).on('resize', function () {
            var screenWidth = document.documentElement.clientWidth,
                playerWidth = 853,
                playerHeight = 480;

            if (screenWidth < 768) {
                playerWidth = 320;
                playerHeight = 240;
            }

            if (screenWidth >= 768 && screenWidth < 1024) {
                playerWidth = 640;
                playerHeight = 360;
            }

            if (screenWidth >= 1800) {
                playerWidth = 1280;
                playerHeight = 720;
            }

            if (loopedtube.player) {
                //reset video's dimension
                loopedtube.player.setSize(playerWidth, playerHeight);
            }
        });

        //load YouTube API
        $.getScript('https://www.youtube.com/iframe_api');

        loopedtube.loadYouTubeAPIStatus = 1;

        //inspect the init search string to go to specific func
        if (location.search) {
            var searchs = location.search.substring(1).split('&'),
                video;

            searchs = searchs.map(function (value) {
                var pair = {},
                    splits = value.split('=');

                pair.key = splits[0];
                pair.value = splits[1];

                return pair;
            });

            if (searchs[0].key === 'video') {
                video = loopedtube.parseVideoId(searchs[0].value);

                if (video && video.id) {
                    loopedtube.cuedVideo = video;
                }

                //load video player function
                loopedtube.loadFunc('video');
            } else if (searchs[0].key === 'search') {
                History.replaceState({ query: decodeURIComponent(searchs[0].value) }, '', '?search=' + searchs[0].value);
                History.Adapter.trigger(window, 'statechange');
            }
        } else {
            //load video player function
            loopedtube.loadFunc('video');
        }
    });
}(jQuery));

//register event handler of url state change
History.Adapter.bind(window, 'statechange', function () {
    var state = History.getState(),
        data = state.data,
        video;
    
    if (data.video) {
        video = data.video;

        if (loopedtube.currentVideo && video.id === loopedtube.currentVideo.id) {
            //if the video id of input is the same as current playing video, just restart the current video
            loopedtube.player.seekTo(loopedtube.currentVideo.startTime);
        } else {
            loopedtube.cuedVideo = video;
        }

        //load video player function
        loopedtube.loadFunc('video', function () {
            loopedtube.cueVideo();
        });
    } else if (data.query) {
        //load search result function
        loopedtube.loadFunc('search', function () {
            $('#btnmore').click();
        });
    }
});

//YouTube player ready event
function onPlayerReady() {
    //YouTube player state change event
    loopedtube.player.addEventListener('onStateChange', function (evt) {
        var state = evt.data,
            $timeInterval = $('#time-interval'),
            $startTime = $('#starttime', $timeInterval),
            $endTime = $('#endtime', $timeInterval);

        switch (state) {
            case YT.PlayerState.ENDED: //0
                //when current video end and user turn isLoop setting on, loop current video
                if (loopedtube.isLoop) {
                    loopedtube.cued = true;
                    loopedtube.player.playVideo();
                } else {
                    loopedtube.stopWatchCurrentTime();
                }
                break;

            case YT.PlayerState.PLAYING: //1
                var duration = loopedtube.player.getDuration(),
                    startTime = $.timeToSecond($startTime.val()),
                    endTime = $.timeToSecond($endTime.val());

                //it's first time to play video
                if (loopedtube.cued) {
                    $startTime.removeAttr('disabled');

                    if (startTime > 0) {
                        loopedtube.player.seekTo(startTime);
                    }

                    if (duration && endTime === 0) {
                        loopedtube.currentVideo.duration = duration;
                        $('#endtime', '#time-interval').val($.secondToTime(duration));
                        $endTime.removeAttr('disabled');
                    } else if (endTime !== 0) {
                        $endTime.removeAttr('disabled');
                    }

                    loopedtube.cued = false;
                    loopedtube.startWatchCurrentTime();
                    loopedtube.addRecentVideo(loopedtube.currentVideo, function (videos) {
                        loopedtube.renderVideoList($('#recent-list'), videos, true);
                    });
                }
                break;

            case YT.PlayerState.PAUSED:
                loopedtube.stopWatchCurrentTime();
                break;

            case YT.PlayerState.CUED: //5
                var startTime = (loopedtube.cuedVideo.startTime) ? loopedtube.cuedVideo.startTime : 0,
                    endTime = (loopedtube.cuedVideo.endTime) ? loopedtube.cuedVideo.endTime : 0;

                $startTime.val($.secondToTime(startTime));
                $endTime.val($.secondToTime(endTime));
                $startTime.attr('disabled', 'disabled');
                $endTime.attr('disabled', 'disabled');

                //init playing video by the id of input
                loopedtube.currentVideo = loopedtube.cuedVideo;
                loopedtube.cued = true;

                loopedtube.player.playVideo();
                break;
        }
    });

    //YouTube player error event
    loopedtube.player.addEventListener('onError', function (evt) {
        switch (evt.data) {
            case 2: //contains an invalid parameter value, eg: wrong video id
                loopedtube.showMessage('未知的影音ID。', 'error');
                break;

            case 5: //The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred
                loopedtube.showMessage('播放器發生未知錯誤。', 'error');
                break;

            case 100: //video has been removed (for any reason) or has been marked as private
                loopedtube.showMessage('此影音可能已被刪除或是為私人影音。', 'error');
                break;

            case 101: //The owner of the requested video does not allow it to be played in embedded players
                loopedtube.showMessage('影音擁有者不允許此影音在YouTube網站以外被播放。', 'error');
                break;

            case 150: //

                break;
        }
    });

    loopedtube.loadPlayerStatus = 2;

    //if have cued video before complete load YouTube API, cue the cued video
    if (loopedtube.cuedVideo) {
        loopedtube.cueVideo();
    }
}

//YouTube API Ready
function onYouTubeIframeAPIReady() {
    loopedtube.loadYouTubeAPIStatus = 2;

    //if have cued video before complete load YouTube API, cue the cued video
    if (loopedtube.cuedVideo) {
        loopedtube.cueVideo();
    }
}

/*!
 *  LoopedTube - index.js
 *  https://github.com/SamuelWang/LoopedTube
 *  
 *  Copyright 2015 Samuel W.
 *  https://plus.google.com/u/0/101455311553487495221/about
 * 
 *  Date: 2015-03-31 22:20 GMT+0800
 */

/// <reference path="js/jquery.js" />
/// <reference path="js/lt.js" />

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

                //the first time to play video
                if (loopedtube.cued) {
                    $startTime.removeAttr('disabled');

                    if (startTime > 0) {
                        loopedtube.player.seekTo(startTime);
                    }

                    if (duration && endTime === 0) {
                        loopedtube.currentVideo.duration = duration;
                        $('#endtime', '#time-interval').val($.secondToTime(duration));
                        $endTime.removeAttr('disabled');
                    }

                    loopedtube.cued = false;
                    loopedtube.startWatchCurrentTime();
                    loopedtube.addRecentVideo(loopedtube.currentVideo, function () {
                        loopedtube.renderRecentVedioList();
                    });
                    
                    $('#playin').val(loopedtube.currentVideo.id);
                }
                break;

            case YT.PlayerState.PAUSED:
                loopedtube.stopWatchCurrentTime();
                break;

            case YT.PlayerState.CUED: //5
                var startTime = (loopedtube.cuedVideo.startTime) ? loopedtube.cuedVideo.startTime : 0;

                $startTime.val($.secondToTime(startTime));
                $endTime.val($.secondToTime(0));
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
                loopedtube.showMessage('錯誤的影音ID。', 'warning');
                break;

            case 5: //The requested content cannot be played in an HTML5 player or another error related to the HTML5 player has occurred
                loopedtube.showMessage('播放器發生未知錯誤。', 'warning');
                break;

            case 100: //video has been removed (for any reason) or has been marked as private
                loopedtube.showMessage('此影音可能已被刪除或是為私人影音。', 'warning');
                break;

            case 101: //The owner of the requested video does not allow it to be played in embedded players
                loopedtube.showMessage('影音擁有者不允許此影音在YouTube網站以外被播放。', 'warning');
                break;

            case 150: //

                break;
        }
    });

    //cue video to ready to playing
    loopedtube.cueVideo();
}

//YouTube API Ready
function onYouTubeIframeAPIReady() {
    //Initialize YouTube player
    loopedtube.player = new YT.Player('player', {
        width: 854,
        height: 480,
        events: {
            onReady: onPlayerReady
        }
    });
}

//Dom Ready
$(function () {
    //init functionality
    loopedtube.initialize();
});

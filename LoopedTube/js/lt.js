/*!
 *  LoopedTube - lt.js
 *  https://github.com/SamuelWang/LoopedTube
 *  
 *  Copyright 2015 Samuel W.
 *  https://plus.google.com/u/0/101455311553487495221/about
 * 
 *  Date: 2015-03-31 22:20 GMT+0800
 */

/// <reference path="jquery.utility.js" />

(function (global) {
    //global namespace
    global.loopedtube = {
        player: null, //YouTube Player
        cuedVideo: null, //temporary video info after user input video id
        currentVideo: null, //current playing video
        loadedAPI: false, //specify if the YouTube API have loaded
        isLoop: true, //specify if current video should to loop
        cued: false //specify if playing video at first
    };

    var loopedtube = global.loopedtube;

    //Add "active" class if has no "active" class, or remove
    loopedtube.toggleButtonActive = function ($elem, onAct, offAct) {
        if (!$elem.hasClass('active')) {
            $elem.addClass('active');
            
            if ($.isFunction(onAct)) {
                onAct();
            }
        } else {
            $elem.removeClass('active');

            if ($.isFunction(offAct)) {
                offAct();
            }
        }

        return this;
    };

    //init status of every functionality
    loopedtube.initialize = function () {
        var $header = $('#header'),
            $container = $('#container');

        //fire header add video func button event
        $('#add', $header)
            .on('click', function () {
                loopedtube.toggleButtonActive($(this), function () {
                    var $playcontent = $('#playcontent');

                    $playcontent.show();
                    $playcontent.find('#playin').focus();
                }, function () {
                    $('#playcontent').hide();
                });
            });

        //hide search content at the beginning
        $('#searchcontent', $container).hide();;

        $('#playcontent', $container)
            .find('#playin')
                .focus()
                .on('keydown', function (evt) {
                    if (evt.which === 13) {
                        $('.fa-play', '#playcontent').trigger('click');
                    }
                })
            .end()
            .find('.fa-play')
                .on('click', function () {
                    var $playin = $(this).siblings('#playin');

                    loopedtube.cuedVideo = loopedtube.parseVideoId($playin.val());

                    if (loopedtube.cuedVideo.id) {
                        if (!loopedtube.loadedAPI) {
                            loopedtube.loadedAPI = true;

                            //load YouTube API
                            $.getScript('https://www.youtube.com/iframe_api');
                        } else {
                            loopedtube.cueVideo();
                        }

                        $playin.val(loopedtube.cuedVideo.id);
                        $('#playcontent').hide();
                        $('#add').removeClass('active');
                    } else {
                        window.alert('請輸入正確的影片ID或影片網址');
                        $playin.focus();
                    }
                });

        $('#player-funcs', $container)
            .find('.fa-repeat')
                .on('click', function () {
                    loopedtube.toggleButtonActive($(this), function () {
                        loopedtube.isLoop = true;
                    }, function () {
                        loopedtube.isLoop = false;
                    });
                })
            .end()
            .find('.fa-arrows-h')
                .on('click', function () {
                    loopedtube.toggleButtonActive($(this), function () {
                        $('#time-interval', $container).show();
                    }, function () {
                        $('#time-interval', $container).hide();
                    });
                });

        $('#time-interval', $container)
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
                    }
                } else {
                    loopedtube.showMessage('請輸入正確的時間格式。', 'error');
                }
            });

        $('#message-box', $container).hide()
            .find('.message')
                .on('click', function () {
                    $(this).parent().hide();
                });

        return this;
    };

    //cue YouTube video to ready to play
    loopedtube.cueVideo = function () {
        var videoId = this.cuedVideo && this.cuedVideo.id;

        if (videoId) {
            loopedtube.player.cueVideoById(videoId);
        }
        
        return this;
    };

    //watch playing video current time
    loopedtube.startWatchCurrentTime = function () {
        var $timeInterval = $('#time-interval'),
            $startTime = $('#starttime', $timeInterval),
            $endTime = $('#endtime', $timeInterval);

        this.startWatchCurrentTime.intervalId = setInterval(function () {
            if (loopedtube.player.getCurrentTime() >= $.timeToSecond($endTime.val())) {
                //replay since the start time when the current time is greater than end time
                loopedtube.player.seekTo($.timeToSecond($startTime.val()));
            }
        }, 100);
    };

    //stop watching playing video current time
    loopedtube.stopWatchCurrentTime = function () {
        clearInterval(this.startWatchCurrentTime.intervalId);
    };

    //show system message
    loopedtube.showMessage = function (msg, type) {
        var $messageBox = $('#message-box'),
            $message = $('.message', $messageBox),
            elapse = 6;

        if (msg) {
            clearTimeout(this.showMessage.timeout);

            $message
                .html(msg)
                .removeClass('warning error');

            switch (type) {
                case 'warning':
                    $message.addClass('warning');
                    elapse = 12;
                    break;

                case 'error':
                    $message.addClass('error');
                    elapse = 18;
                    break;
            }

            $messageBox.show();

            this.showMessage.timeout = setTimeout(function () {
                $messageBox.hide();
            }, elapse * 1000)
        }
        
        return this;
    };
    loopedtube.showMessage.timeout = null;

    //parse input string to get video id and start time
    loopedtube.parseVideoId = function (str) {
        if (!str) {
            return null;
        }

        var video = new loopedtube.Video(),
            match_url = /http[s]?\:\/\/www\.youtube\.com\/watch\?v\=([\w\-]{11})\&?.*/ig.exec(str),
            match_share = /http[s]?\:\/\/youtu\.be\/([\w\-]{11})(\?t\=([\w\d]+))?/ig.exec(str),
            match_iframe = /^<iframe\s{1}.*?https\:\/\/www\.youtube\.com\/embed\/([\w\-]{11})\??.*/ig.exec(str);

        //check input value type to retrieve video id
        if (match_iframe && match_iframe[1]) {
            video.id = match_iframe[1];
        } else if (match_url && match_url[1]) {
            video.id = match_url[1];
        } else if (match_share && match_share[1]) {
            video.id = match_share[1];

            if (match_share[3]) {
                var match_time = /((\d{1,2})h)?((\d{1,2})m)?((\d{1,2})s)?/ig.exec(match_share[3]),
                    seconds = 0;

                //hours
                if (match_time[2]) {
                    seconds += (parseInt(match_time[2], 10) * 60 * 60);
                }

                //minutes
                if (match_time[4]) {
                    seconds += (parseInt(match_time[4], 10) * 60);
                }

                //seconds
                if (match_time[6]) {
                    seconds += (parseInt(match_time[6], 10));
                }

                if (seconds >= 0) {
                    //set video start time
                    video.startTime = seconds;
                }
            }
        } else if (str.length === 11) {
            video.id = str;
        }

        return video;
    }



    //Video Class
    loopedtube.Video = function (id) {
        if (!(this instanceof loopedtube.Video)) {
            //force this constructor to new correctly
            return new loopedtube.Video(id);
        }

        this.id = (id) ? id : null; //video id
        this.duration = 0; //seconds of video duration
        this.startTime = 0; //seconds of video start time
        this.endTime = 0; //seconds of video end time
    };

    //Video Class's prototype
    loopedtube.Video.prototype = {
        //set or get video id
        videoId: function (id) {
            if (id) {
                this.id = this.parseVideoId(id);
                return this;
            }

            return this.id;
        }
    };
} (window));


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
        musicMode: false, //specify if user turn on music mode
        cued: false //specify if playing video at first
    };

    var loopedtube = global.loopedtube;

    //Add "active" class if has no "active" class, or remove
    loopedtube.toggleButtonActive = function ($elem, onAct, offAct) {
        if (!$elem.hasClass('active')) {
            $elem.addClass('active');
            
            if ($.isFunction(onAct)) {
                onAct.call($elem);
            }
        } else {
            $elem.removeClass('active');

            if ($.isFunction(offAct)) {
                offAct.call($elem);
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
        $('#searchcontent', $container).hide();

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
                    var $playin = $(this).siblings('#playin'),
                        cuedVideo = loopedtube.parseVideoId($playin.val());

                    if (cuedVideo.id) {
                        loopedtube.getRecentVideoList().every(function (video) {
                            if (video.id === cuedVideo.id) {
                                cuedVideo = video;
                                return false;
                            }

                            return true;
                        });

                        if (loopedtube.currentVideo && cuedVideo.id === loopedtube.currentVideo.id) {
                            loopedtube.player.seekTo(loopedtube.currentVideo.startTime);
                        } else {
                            loopedtube.cuedVideo = cuedVideo;
                            loopedtube.cueVideo();
                        }

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
                })
            .end()
            .find('.fa-music')
                .on('click', function () {
                    loopedtube.toggleButtonActive($(this), function () {
                        loopedtube.musicMode = true;

                        if (loopedtube.player.getPlayerState() > -1) {
                            loopedtube.player.setPlaybackQuality('small');
                        }
                    }, function () {
                        loopedtube.musicMode = false;

                        if (loopedtube.player.getPlayerState() > -1) {
                            loopedtube.player.setPlaybackQuality('default');
                        }
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
                        loopedtube.addRecentVideo(loopedtube.currentVideo);
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

        //render recent playing video lsit
        loopedtube.renderRecentVedioList();

        $('#recent-video .recent-video-header-trash').on('click', function () {
            localStorage.clear();
            loopedtube.renderRecentVedioList();
        });

        return this;
    };

    //cue YouTube video to ready to play
    loopedtube.cueVideo = function () {
        if (!loopedtube.loadedAPI) {
            loopedtube.loadedAPI = true;

            //load YouTube API
            $.getScript('https://www.youtube.com/iframe_api');
            return;
        }

        var cuedVideo = this.cuedVideo,
            videoId = cuedVideo.id;

        if (videoId) {
            loopedtube.player.cueVideoById(videoId, cuedVideo.startTime, (loopedtube.musicMode) ? 'small' : 'default');
        }
        
        return this;
    };

    //retrieve video datas
    loopedtube.retrieveVideoData = function (videoId, callback, error) {
        $.ajax({
            url: 'https://www.googleapis.com/youtube/v3/videos?key=AIzaSyBcc3KRsP4a0NpQMymFkQNXkMXoROsTov4&&part=snippet&fields=items(snippet(title,thumbnails))&id=' + videoId,
            async: true,
            dataType: 'json',
            method: 'GET',
            error: function (xhr, status, e) {
                if ($.isFunction(error)) {
                    error({
                        code: status,
                        message: e
                    });
                }
            },
            success: function (data) {
                if (data) {
                    if (data.error && $.isFunction(error)) {
                        //發生錯誤
                        error(data.error);
                    } else if ($.isArray(data.items) && $.isFunction(callback)) {
                        //成功取回資料
                        callback(data.items);
                    }
                } else {
                    //沒有取回任何資料
                    if ($.isFunction(error)) {
                        error({
                            code: "error",
                            message: "nothing"
                        });
                    }
                }
            }
        });
    };

    //add current video to the list of recent playing video
    loopedtube.addRecentVideo = function (video, callback) {
        var recentVideos = loopedtube.getRecentVideoList(),
            index = -1;

        try {
            recentVideos.forEach(function (item, i) {
                if (item.id === video.id) {
                    index = i;
                }
            });

            if (index === -1) {
                loopedtube.retrieveVideoData(video.id, function (items) {
                    video.title = items[0].snippet.title;
                    video.thumbnail = items[0].snippet.thumbnails["default"];

                    //max length is 50
                    if (recentVideos.length > 50) {
                        recentVideos.pop();
                    }

                    recentVideos.unshift(video);
                    localStorage.setItem('recentVideos', JSON.stringify(recentVideos));

                    if ($.isFunction(callback)) {
                        callback();
                    }
                });
            } else if (!video.title || !video.thumbnail) {
                loopedtube.retrieveVideoData(video.id, function (items) {
                    video.title = items[0].snippet.title;
                    video.thumbnail = items[0].snippet.thumbnails["default"];

                    recentVideos.splice(index, 1);
                    recentVideos.unshift(video);

                    localStorage.setItem('recentVideos', JSON.stringify(recentVideos));

                    if ($.isFunction(callback)) {
                        callback();
                    }
                });
            } else {
                //if vidoe had existed, change index to first
                recentVideos.splice(index, 1);
                recentVideos.unshift(video);

                localStorage.setItem('recentVideos', JSON.stringify(recentVideos));

                if ($.isFunction(callback)) {
                    callback();
                }
            }
        } catch (e) {

        }
    };

    //get recent playing video list from local storage
    loopedtube.getRecentVideoList = function () {
        var recentVideos = localStorage.getItem('recentVideos');

        if (!recentVideos) {
            recentVideos = [];
        } else {
            recentVideos = JSON.parse(recentVideos);
        }

        return recentVideos;
    };

    //render recent playing video lsit
    loopedtube.renderRecentVedioList = function () {
        var recentVideos = loopedtube.getRecentVideoList(),
            $recentVideo = $('#recent-video'),
            $recentVideoList = $('.recent-video-list', $recentVideo),
            $videoRecord;

        if (recentVideos.length > 0) {
            $recentVideoList.empty();

            recentVideos.forEach(function (video) {
                if (!video.title || !video.thumbnail) {
                    return;
                }

                $videoRecord = $('<div class="recent-video-list-record"></div>').appendTo($recentVideoList);

                $('<img class="recent-video-list-record-img" />')
                    .attr('src', video.thumbnail.url)
                    .appendTo($videoRecord);

                $('<div class="recent-video-list-record-title"></div>')
                    .text(video.title)
                    .appendTo($videoRecord);

                $videoRecord
                    .data('videoId', video.id)
                    .on('click', function () {
                        var cuedVideo,
                            $elem = $(this);

                        loopedtube.getRecentVideoList().forEach(function (video) {
                            if (video.id === $elem.data('videoId')) {
                                cuedVideo = video;
                            }
                        });

                        if (cuedVideo) {
                            loopedtube.cuedVideo = cuedVideo;
                            loopedtube.cueVideo();

                            $('#playcontent').hide();
                            $('#add').removeClass('active');
                        }
                    });
            });
        } else {
            $recentVideoList.text('無記錄');
        }
    };

    //watch playing video current time
    loopedtube.startWatchCurrentTime = function () {
        var $timeInterval = $('#time-interval'),
            $startTime = $('#starttime', $timeInterval),
            $endTime = $('#endtime', $timeInterval);

        this.startWatchCurrentTime.intervalId = setInterval(function () {
            var endSecond = $.timeToSecond($endTime.val());

            if (loopedtube.player.getCurrentTime() >= endSecond && endSecond < loopedtube.currentVideo.duration) {
                //replay since the start time when the current time is greater than end time
                loopedtube.player.seekTo($.timeToSecond($startTime.val()));
            }
        }, 500);
    };
    loopedtube.startWatchCurrentTime.intervalId = null;

    //stop watching playing video current time
    loopedtube.stopWatchCurrentTime = function () {
        clearInterval(this.startWatchCurrentTime.intervalId);

        this.startWatchCurrentTime.intervalId = null;
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
    };



    //Video Class
    loopedtube.Video = function (id) {
        if (!(this instanceof loopedtube.Video)) {
            //force this constructor to new correctly
            return new loopedtube.Video(id);
        }

        this.id = (id) ? id : null; //video id
        this.title = null; //video title
        this.thumbnail = null; //video thumbnail
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


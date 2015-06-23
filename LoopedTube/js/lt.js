/// <reference path="jquery.history.js" />
/// <reference path="jquery.utility.js" />

/*!
 *  LoopedTube - lt.js
 *  https://github.com/SamuelWang/LoopedTube
 *  
 *  Copyright 2015 Samuel W.
 *  https://plus.google.com/u/0/101455311553487495221/about
 * 
 *  Date: 2015-03-31 22:20 GMT+0800
 */

(function (global) {
    var loopedtube;

    //global namespace
    global.loopedtube = {
        //YouTube Player
        player: null,

        //temporary video info after user input video id
        cuedVideo: null,

        //current playing video
        currentVideo: null,

        //current function
        currentFunc: null,

        //specify if the YouTube API have loaded, 0: none, 1: loading, 2: loaded
        loadYouTubeAPIStatus: 0,

        //the status of player loading, 0: none, 1: loading, 2: loaded
        loadPlayerStatus: 0,

        //specify if playing video at first
        cued: false,

        //specify if current video should to loop
        isLoop: true,

        //specify if user turn on music mode
        musicMode: false
    };

    loopedtube = global.loopedtube;

    /*---------- LoopedTube Functionalities ----------*/

    //load function
    loopedtube.loadFunc = function (func, done) {
        //not reload again
        if (func === loopedtube.currentFunc) {
            if ($.isFunction(done)) {
                done();
            }

            return;
        }

        var path = 'view/' + func + '.html',
        	$content = $('#content');

        if (loopedtube.player) {
            loopedtube.player.destroy();
            loopedtube.player = null;
            loopedtube.currentVideo = null;
            loopedtube.cuedVideo = null;
            loopedtube.loadPlayerStatus = 0;
            loopedtube.cued = false;
        }

        $content.empty().text('loading...');

        //load template
        $.ajax({
            async: true,
            url: path,
            success: function (html) {
                $content.empty();

                if (!html) {
                    loopedtube.showMessage('Failure to load function.', 'error');
                    return;
                }

                try {
                    //put template html string to DOM
                    $('#content').html(html);

                    $.ajax({
                        async: true,
                        cache: true,
                        dataType: 'script',
                        url: 'controller/' + func + '.js',
                        success: function (data) {
                            loopedtube.currentFunc = func;

                            if ($.isFunction(done)) {
                                done();
                            }
                        },
                        error: function (xhr, status, error) {
                            $content.empty();
                            loopedtube.showMessage('Failure to load function.', 'error');
                        }
                    });
                } catch (e) {
                    $content.empty();
                    loopedtube.showMessage('Failure to load function.', 'error');
                }
            },
            error: function (xhr, status, error) {
                $content.empty();
                loopedtube.showMessage('Failure to load function.', 'error');
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
                loopedtube.getVideoData(video.id, function (items) {
                    video.title = items[0].title;
                    video.thumbnail = items[0].thumbnail;

                    //allowed max length is 100
                    if (recentVideos.length > 99) {
                        recentVideos = recentVideos.splice(0, 99);
                    }

                    recentVideos.unshift(video);
                    localStorage.setItem('recentVideos', JSON.stringify(recentVideos));

                    if ($.isFunction(callback)) {
                        callback(recentVideos);
                    }
                });
            } else if (!video.title || !video.thumbnail) {
                loopedtube.getVideoData(video.id, function (items) {
                    video.title = items[0].title;
                    video.thumbnail = items[0].thumbnail;

                    recentVideos.splice(index, 1);
                    recentVideos.unshift(video);

                    localStorage.setItem('recentVideos', JSON.stringify(recentVideos));

                    if ($.isFunction(callback)) {
                        callback(recentVideos);
                    }
                });
            } else {
                //if vidoe had existed, change index to first
                recentVideos.splice(index, 1);
                recentVideos.unshift(video);

                localStorage.setItem('recentVideos', JSON.stringify(recentVideos));

                if ($.isFunction(callback)) {
                    callback(recentVideos);
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

    //render video lsit
    loopedtube.renderVideoList = function (list, videos, clear) {
        var $listBody = list.find('.list-view-body'),
            $videoRecord;

        if ($.isArray(videos) && videos.length > 0) {
            if (clear === true) {
                $listBody.empty();
            }

            //render each video data
            videos.forEach(function (video) {
                if (!video.title || !video.thumbnail) {
                    return;
                }

                $videoRecord = $('<div class="list-view-body-record clearfix"></div>');

                $('<img class="list-view-body-record-img" />')
                    .attr('src', video.thumbnail.url)
                    .appendTo($videoRecord);

                $('<div class="list-view-body-record-title"></div>')
                    .text(video.title)
                    .appendTo($videoRecord);

                $videoRecord
                    .data('videoId', video.id)
                    .on('click', function () {
                        var $elem = $(this);
                        
                        History.pushState({ video: video }, '', '?video=' + video.id);
                    });

                $videoRecord.appendTo($listBody);
            });
        } else {
            if (clear === true) {
                $listBody.text('無記錄');
            }
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

    /*---------- LoopedTube Services ----------*/

    //cue YouTube video to ready to play
    loopedtube.cueVideo = function () {
        if (loopedtube.loadPlayerStatus === 1 || loopedtube.loadYouTubeAPIStatus === 1) {
            return;
        }

        if (loopedtube.loadPlayerStatus === 0) {
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

            loopedtube.loadPlayerStatus = 1;

            //Initialize YouTube player
            loopedtube.player = new YT.Player('player', {
                width: playerWidth,
                height: playerHeight,
                events: {
                    onReady: onPlayerReady
                }
            });

            return;
        }

        var cuedVideo = this.cuedVideo,
            videoId = cuedVideo.id,
            $playerContent = $('#player-content');

        if (videoId) {
            if (!$playerContent.is(':visible')) {
                $playerContent.show(600);
            }
            
            loopedtube.player.cueVideoById(videoId, cuedVideo.startTime, (loopedtube.musicMode) ? 'small' : 'default');
        }

        return this;
    };

    //get video data
    loopedtube.getVideoData = function (videoId, callback, error) {
        $.ajax({
            url: 'https://www.googleapis.com/youtube/v3/videos?key=AIzaSyBcc3KRsP4a0NpQMymFkQNXkMXoROsTov4&part=snippet&fields=items(id,snippet(title,thumbnails))&id=' + videoId,
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
                        data.items = data.items.map(function (item) {
                            var video = {};

                            video.id = item.id.videoId;
                            video.title = item.snippet.title;
                            video.thumbnail = item.snippet.thumbnails['default'];

                            return video;
                        });

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

    //search video by keyword
    loopedtube.searchVideo = function (config, callback, error) {
        var url = 'https://www.googleapis.com/youtube/v3/search?' +
                  'key=AIzaSyBcc3KRsP4a0NpQMymFkQNXkMXoROsTov4' +
                  '&part=snippet&fields=nextPageToken,items(id,snippet(title,thumbnails))' +
                  '&type=video&order=viewCount&maxResults=10' +
                  '&q=' + encodeURIComponent(config.q);

        if (config.pageToken) {
            url += '&pageToken=' + config.pageToken;
        }

        $.ajax({
            url: url,
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
                        data.items = data.items.map(function (item) {
                            var video = {};

                            video.id = item.id.videoId;
                            video.title = item.snippet.title;
                            video.thumbnail = item.snippet.thumbnails['default'];

                            return video;
                        });

                        //成功取回資料
                        callback({
                            items: data.items,
                            next: data.nextPageToken
                        });
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

    /*---------- LoopedTube Utilities ----------*/

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

            $messageBox.show(400, 'linear');

            this.showMessage.timeout = setTimeout(function () {
                $messageBox.hide(400, 'linear');
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

        //inspect whether there is record in recent list
        loopedtube.getRecentVideoList().every(function (item) {
            if (item.id === video.id) {
                video = item;
                return false;
            }

            return true;
        });

        return video;
    };



    /*---------- Video Class -----------*/
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


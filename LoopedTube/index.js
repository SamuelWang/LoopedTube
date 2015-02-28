/// <reference path="js/jquery.js" />

//only global variable
var loopedtube = {
    player: null,
    currentPlayId: null, //current playing video id
    loadedAPI: false //specified if the YouTube API have loaded
};

//init status of every functionality
loopedtube.initFunc = function () {
    var $playarea = $('.playarea');

    //fire header add video func button event
    $('#add').off('click').addClass('active')
        .on('click', function () {
            var $elem = $(this),
                $playcontent = $('#playcontent');

            if ($playcontent.is(':hidden')) {
                $elem.addClass('active');
                $playcontent.show();
                $playcontent.find('#playin').focus();
            } else {
                $elem.removeClass('active');
                $playcontent.hide();
            }
        });

    $('#searchcontent').hide() //hide search content at the beginning
        .find('.fa-search')
            .on('click', function () {
                //fire search event

            });

    $('#playcontent')
        .find('#playin')
            .focus()
        .end()
        .find('.fa-play')
            .on('click', function () {
                var $playin = $(this).siblings('#playin');

                //get play video id
                loopedtube.currentPlayId = loopedtube.parseVideoId($playin.val());

                if (loopedtube.currentPlayId) {
                    if (!loopedtube.loadedAPI) {
                        loopedtube.loadedAPI = true;

                        //load YouTube API
                        $.getScript('https://www.youtube.com/iframe_api');
                    } else {
                        loopedtube.loadVideo();
                    }

                    $playin.val(loopedtube.currentPlayId);
                    $('#playcontent').hide();
                    $('#add').removeClass('active');
                } else {
                    window.alert('請輸入正確的影片ID或影片網址');
                    $playin.focus();
                }
            });
};

//load video user key in
loopedtube.loadVideo = function () {
    loopedtube.player
        .loadVideoById(loopedtube.currentPlayId)
        .playVideo();
};

//parse input string to get video id
loopedtube.parseVideoId = function (str) {
    if (!str) {
        return null;
    }

    var videoId = null,
        match_url = /https\:\/\/www\.youtube\.com\/watch\?v\=(\w{11})\&?.*/ig.exec(str),
        match_share = /http\:\/\/youtu\.be\/(\w{11})\&?.*/ig.exec(str),
        match_iframe = /^\<iframe\s{1}.*?https\:\/\/www\.youtube\.com\/embed\/(\w{11})\??.*/ig.exec(str);

    //check input value type to retrieve video id
    if (match_iframe && match_iframe[1]) {
        videoId = match_iframe[1];
    } else if (match_url && match_url[1]) {
        videoId = match_url[1];
    } else if (match_share && match_share[1]) {
        videoId = match_share[1];
    } else if (str.length === 11) {
        videoId = str;
    }

    return videoId;
};

//YouTube player ready event
function onPlayerReady() {
    loopedtube.loadVideo();
}

//YouTube player state change event
function onStateChange(evt) {
    var state = evt.data;

    if (state === YT.PlayerState.ENDED) {
        loopedtube.player.playVideo();
    }
}

//YouTube API Ready
function onYouTubeIframeAPIReady() {
    //Initialize YouTube player
    loopedtube.player = new YT.Player('player', {
        width: 854,
        height: 480,
        events: {
            onReady: onPlayerReady,
            onStateChange: onStateChange
        }
    });
}

//Dom Ready
$(function () {
    //init functionality
    loopedtube.initFunc();
});

(function (g) {
    g.loopedtube = { player: null, cuedVideo: null, currentVideo: null, loadedAPI: !1, isLoop: !0, musicMode: !1, cued: !1 }; var a = g.loopedtube; a.toggleButtonActive = function (a, b, c) { a.hasClass("active") ? (a.removeClass("active"), $.isFunction(c) && c.call(a)) : (a.addClass("active"), $.isFunction(b) && b.call(a)); return this }; a.initialize = function () {
        var d = $("#header"), b = $("#container"); $("#add", d).on("click", function () {
            a.toggleButtonActive($(this), function () { var a = $("#playcontent"); a.show(); a.find("#playin").focus() },
            function () { $("#playcontent").hide() })
        }); $("#searchcontent", b).hide(); $("#playcontent", b).find("#playin").focus().on("keydown", function (a) { 13 === a.which && $(".fa-play", "#playcontent").trigger("click") }).end().find(".fa-play").on("click", function () { var c = $(this).siblings("#playin"); a.cuedVideo = a.parseVideoId(c.val()); a.cuedVideo.id ? (a.cueVideo(), $("#playcontent").hide(), $("#add").removeClass("active")) : (window.alert("\u8acb\u8f38\u5165\u6b63\u78ba\u7684\u5f71\u7247ID\u6216\u5f71\u7247\u7db2\u5740"), c.focus()) });
        $("#player-funcs", b).find(".fa-repeat").on("click", function () { a.toggleButtonActive($(this), function () { a.isLoop = !0 }, function () { a.isLoop = !1 }) }).end().find(".fa-arrows-h").on("click", function () { a.toggleButtonActive($(this), function () { $("#time-interval", b).show() }, function () { $("#time-interval", b).hide() }) }).end().find(".fa-music").on("click", function () {
            a.toggleButtonActive($(this), function () { a.musicMode = !0; -1 < a.player.getPlayerState() && a.player.setPlaybackQuality("small") }, function () {
                a.musicMode = !1; -1 <
                a.player.getPlayerState() && a.player.setPlaybackQuality("default")
            })
        }); $("#time-interval", b).hide().on("change", function (c) {
            $(this); c = $(c.target); var d = c.attr("id"), b = c.val(); if (/(\d{1,2}):?(\d{1,2}):?(\d{1,2})/.test(b)) {
                if (b = $.timeToSecond(b), 0 < b) {
                    switch (d) {
                        case "starttime": if (b > a.currentVideo.duration) { a.showMessage("\u958b\u59cb\u6642\u9593\u4e0d\u53ef\u5927\u65bc\u5f71\u97f3\u7e3d\u9577\u5ea6\u3002", "warning"); c.val($.secondToTime(0)); return } a.currentVideo.startTime = b; 5 < b - a.player.getCurrentTime() &&
                        a.player.seekTo(b); break; case "endtime": if (b > a.currentVideo.duration) { a.showMessage("\u7d50\u675f\u6642\u9593\u4e0d\u53ef\u5927\u65bc\u5f71\u97f3\u7e3d\u9577\u5ea6\u3002", "warning"); c.val($.secondToTime(a.currentVideo.duration)); return } a.currentVideo.endTime = b
                    } c.val($.secondToTime(b)); a.addRecentVideo(a.currentVideo)
                }
            } else a.showMessage("\u8acb\u8f38\u5165\u6b63\u78ba\u7684\u6642\u9593\u683c\u5f0f\u3002", "error")
        }); $("#message-box", b).hide().find(".message").on("click", function () { $(this).parent().hide() });
        a.renderRecentVedioList(); $("#recent-video .recent-video-header-trash").on("click", function () { localStorage.clear(); a.renderRecentVedioList() }); return this
    }; a.cueVideo = function () { if (a.loadedAPI) { var d = this.cuedVideo, b = d.id; b && a.player.cueVideoById(b, d.startTime, a.musicMode ? "small" : "default"); return this } a.loadedAPI = !0; $.getScript("https://www.youtube.com/iframe_api") }; a.retrieveVideoData = function (a, b, c) {
        $.ajax({
            url: "https://www.googleapis.com/youtube/v3/videos?key=AIzaSyBcc3KRsP4a0NpQMymFkQNXkMXoROsTov4&&part=snippet&fields=items(snippet(title,thumbnails))&id=" +
            a, async: !0, dataType: "json", method: "GET", error: function (a, d, b) { $.isFunction(c) && c({ code: d, message: b }) }, success: function (a) { a ? a.error && $.isFunction(c) ? c(a.error) : $.isArray(a.items) && $.isFunction(b) && b(a.items) : $.isFunction(c) && c({ code: "error", message: "nothing" }) }
        })
    }; a.addRecentVideo = function (d, b) {
        var c = a.getRecentVideoList(), e = -1; try {
            c.forEach(function (a, c) { a.id === d.id && (e = c, d = a) }), -1 === e ? a.retrieveVideoData(d.id, function (a) {
                d.title = a[0].snippet.title; d.thumbnail = a[0].snippet.thumbnails["default"];
                20 < c.length && c.pop(); c.unshift(d); localStorage.setItem("recentVideos", JSON.stringify(c)); $.isFunction(b) && b()
            }) : (c.splice(e, 1), c.unshift(d), localStorage.setItem("recentVideos", JSON.stringify(c)), $.isFunction(b) && b())
        } catch (f) { }
    }; a.getRecentVideoList = function () { var a = localStorage.getItem("recentVideos"); return a = a ? JSON.parse(a) : [] }; a.renderRecentVedioList = function () {
        var d = a.getRecentVideoList(), b = $("#recent-video"), c = $(".recent-video-list", b), e; 0 < d.length ? (c.empty(), d.forEach(function (b) {
            b.title &&
            b.thumbnail && (e = $('<div class="recent-video-list-record"></div>').appendTo(c), $('<img class="recent-video-list-record-img" />').attr("src", b.thumbnail.url).appendTo(e), $('<div class="recent-video-list-record-title"></div>').text(b.title).appendTo(e), e.on("click", function () { a.cuedVideo = b; a.cueVideo() }))
        })) : c.text("\u7121\u8a18\u9304")
    }; a.startWatchCurrentTime = function () {
        var d = $("#time-interval"), b = $("#starttime", d), c = $("#endtime", d); this.startWatchCurrentTime.intervalId = setInterval(function () {
            a.player.getCurrentTime() >=
            $.timeToSecond(c.val()) && a.player.seekTo($.timeToSecond(b.val()))
        }, 100)
    }; a.startWatchCurrentTime.intervalId = null; a.stopWatchCurrentTime = function () { clearInterval(this.startWatchCurrentTime.intervalId) }; a.showMessage = function (a, b) {
        var c = $("#message-box"), e = $(".message", c), f = 6; if (a) {
            clearTimeout(this.showMessage.timeout); e.html(a).removeClass("warning error"); switch (b) { case "warning": e.addClass("warning"); f = 12; break; case "error": e.addClass("error"), f = 18 } c.show(); this.showMessage.timeout = setTimeout(function () { c.hide() },
            1E3 * f)
        } return this
    }; a.showMessage.timeout = null; a.parseVideoId = function (d) {
        if (!d) return null; var b = new a.Video, c = /http[s]?\:\/\/www\.youtube\.com\/watch\?v\=([\w\-]{11})\&?.*/ig.exec(d), e = /http[s]?\:\/\/youtu\.be\/([\w\-]{11})(\?t\=([\w\d]+))?/ig.exec(d), f = /^<iframe\s{1}.*?https\:\/\/www\.youtube\.com\/embed\/([\w\-]{11})\??.*/ig.exec(d); f && f[1] ? b.id = f[1] : c && c[1] ? b.id = c[1] : e && e[1] ? (b.id = e[1], e[3] && (d = /((\d{1,2})h)?((\d{1,2})m)?((\d{1,2})s)?/ig.exec(e[3]), c = 0, d[2] && (c += 3600 * parseInt(d[2], 10)), d[4] &&
        (c += 60 * parseInt(d[4], 10)), d[6] && (c += parseInt(d[6], 10)), 0 <= c && (b.startTime = c))) : 11 === d.length && (b.id = d); return b
    }; a.Video = function (d) { if (!(this instanceof a.Video)) return new a.Video(d); this.id = d ? d : null; this.thumbnail = this.title = null; this.endTime = this.startTime = this.duration = 0 }; a.Video.prototype = { videoId: function (a) { return a ? (this.id = this.parseVideoId(a), this) : this.id } }
})(window);
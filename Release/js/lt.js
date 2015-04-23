(function (g) {
    g.loopedtube = { player: null, cuedVideo: null, currentVideo: null, loadedAPI: !1, isLoop: !0, musicMode: !1, cued: !1 }; var a = g.loopedtube; a.toggleButtonActive = function (a, d, c) { a.hasClass("active") ? (a.removeClass("active"), $.isFunction(c) && c.call(a)) : (a.addClass("active"), $.isFunction(d) && d.call(a)); return this }; a.initialize = function () {
        var b = $("#header"), d = $("#container"); $("#add", b).on("click", function () {
            a.toggleButtonActive($(this), function () { var a = $("#playcontent"); a.show(); a.find("#playin").focus() },
            function () { $("#playcontent").hide() })
        }); $("#searchcontent", d).hide(); $("#playcontent", d).find("#playin").focus().on("keydown", function (a) { 13 === a.which && $(".fa-play", "#playcontent").trigger("click") }).end().find(".fa-play").on("click", function () {
            var c = $(this).siblings("#playin"), b = a.parseVideoId(c.val()); b.id ? (a.getRecentVideoList().every(function (a) { return a.id === b.id ? (b = a, !1) : !0 }), a.currentVideo && b.id === a.currentVideo.id ? a.player.seekTo(a.currentVideo.startTime) : (a.cuedVideo = b, a.cueVideo()), $("#playcontent").hide(),
            $("#add").removeClass("active")) : (window.alert("\u8acb\u8f38\u5165\u6b63\u78ba\u7684\u5f71\u7247ID\u6216\u5f71\u7247\u7db2\u5740"), c.focus())
        }); $("#player-funcs", d).find(".fa-repeat").on("click", function () { a.toggleButtonActive($(this), function () { a.isLoop = !0 }, function () { a.isLoop = !1 }) }).end().find(".fa-arrows-h").on("click", function () { a.toggleButtonActive($(this), function () { $("#time-interval", d).show() }, function () { $("#time-interval", d).hide() }) }).end().find(".fa-music").on("click", function () {
            a.toggleButtonActive($(this),
            function () { a.musicMode = !0; -1 < a.player.getPlayerState() && a.player.setPlaybackQuality("small") }, function () { a.musicMode = !1; -1 < a.player.getPlayerState() && a.player.setPlaybackQuality("default") })
        }); $("#time-interval", d).hide().on("change", function (b) {
            $(this); b = $(b.target); var d = b.attr("id"), e = b.val(); if (/(\d{1,2}):?(\d{1,2}):?(\d{1,2})/.test(e)) {
                if (e = $.timeToSecond(e), 0 < e) {
                    switch (d) {
                        case "starttime": if (e > a.currentVideo.duration) {
                            a.showMessage("\u958b\u59cb\u6642\u9593\u4e0d\u53ef\u5927\u65bc\u5f71\u97f3\u7e3d\u9577\u5ea6\u3002",
                            "warning"); b.val($.secondToTime(0)); return
                        } a.currentVideo.startTime = e; 5 < e - a.player.getCurrentTime() && a.player.seekTo(e); break; case "endtime": if (e > a.currentVideo.duration) { a.showMessage("\u7d50\u675f\u6642\u9593\u4e0d\u53ef\u5927\u65bc\u5f71\u97f3\u7e3d\u9577\u5ea6\u3002", "warning"); b.val($.secondToTime(a.currentVideo.duration)); return } a.currentVideo.endTime = e
                    } b.val($.secondToTime(e)); a.addRecentVideo(a.currentVideo)
                }
            } else a.showMessage("\u8acb\u8f38\u5165\u6b63\u78ba\u7684\u6642\u9593\u683c\u5f0f\u3002",
            "error")
        }); $("#message-box", d).hide().find(".message").on("click", function () { $(this).parent().hide() }); a.renderRecentVedioList(); $("#recent-video .recent-video-header-trash").on("click", function () { localStorage.clear(); a.renderRecentVedioList() }); return this
    }; a.cueVideo = function () { if (a.loadedAPI) { var b = this.cuedVideo, d = b.id; d && a.player.cueVideoById(d, b.startTime, a.musicMode ? "small" : "default"); return this } a.loadedAPI = !0; $.getScript("https://www.youtube.com/iframe_api") }; a.retrieveVideoData = function (a,
    d, c) { $.ajax({ url: "https://www.googleapis.com/youtube/v3/videos?key=AIzaSyBcc3KRsP4a0NpQMymFkQNXkMXoROsTov4&&part=snippet&fields=items(snippet(title,thumbnails))&id=" + a, async: !0, dataType: "json", method: "GET", error: function (a, b, d) { $.isFunction(c) && c({ code: b, message: d }) }, success: function (a) { a ? a.error && $.isFunction(c) ? c(a.error) : $.isArray(a.items) && $.isFunction(d) && d(a.items) : $.isFunction(c) && c({ code: "error", message: "nothing" }) } }) }; a.addRecentVideo = function (b, d) {
        var c = a.getRecentVideoList(), f = -1; try {
            c.forEach(function (a,
            c) { a.id === b.id && (f = c) }), -1 === f ? a.retrieveVideoData(b.id, function (a) { b.title = a[0].snippet.title; b.thumbnail = a[0].snippet.thumbnails["default"]; 50 < c.length && c.pop(); c.unshift(b); localStorage.setItem("recentVideos", JSON.stringify(c)); $.isFunction(d) && d() }) : b.title && b.thumbnail ? (c.splice(f, 1), c.unshift(b), localStorage.setItem("recentVideos", JSON.stringify(c)), $.isFunction(d) && d()) : a.retrieveVideoData(b.id, function (a) {
                b.title = a[0].snippet.title; b.thumbnail = a[0].snippet.thumbnails["default"]; c.splice(f,
                1); c.unshift(b); localStorage.setItem("recentVideos", JSON.stringify(c)); $.isFunction(d) && d()
            })
        } catch (e) { }
    }; a.getRecentVideoList = function () { var a = localStorage.getItem("recentVideos"); return a = a ? JSON.parse(a) : [] }; a.renderRecentVedioList = function () {
        var b = a.getRecentVideoList(), d = $("#recent-video"), c = $(".recent-video-list", d), f; 0 < b.length ? (c.empty(), b.forEach(function (b) {
            b.title && b.thumbnail && (f = $('<div class="recent-video-list-record"></div>').appendTo(c), $('<img class="recent-video-list-record-img" />').attr("src",
            b.thumbnail.url).appendTo(f), $('<div class="recent-video-list-record-title"></div>').text(b.title).appendTo(f), f.data("videoId", b.id).on("click", function () { var b, c = $(this); a.getRecentVideoList().forEach(function (a) { a.id === c.data("videoId") && (b = a) }); b && (a.cuedVideo = b, a.cueVideo(), $("#playcontent").hide(), $("#add").removeClass("active")) }))
        })) : c.text("\u7121\u8a18\u9304")
    }; a.startWatchCurrentTime = function () {
        var b = $("#time-interval"), d = $("#starttime", b), c = $("#endtime", b); this.startWatchCurrentTime.intervalId =
        setInterval(function () { var b = $.timeToSecond(c.val()); a.player.getCurrentTime() >= b && b < a.currentVideo.duration && a.player.seekTo($.timeToSecond(d.val())) }, 500)
    }; a.startWatchCurrentTime.intervalId = null; a.stopWatchCurrentTime = function () { clearInterval(this.startWatchCurrentTime.intervalId); this.startWatchCurrentTime.intervalId = null }; a.showMessage = function (a, d) {
        var c = $("#message-box"), f = $(".message", c), e = 6; if (a) {
            clearTimeout(this.showMessage.timeout); f.html(a).removeClass("warning error"); switch (d) {
                case "warning": f.addClass("warning");
                    e = 12; break; case "error": f.addClass("error"), e = 18
            } c.show(); this.showMessage.timeout = setTimeout(function () { c.hide() }, 1E3 * e)
        } return this
    }; a.showMessage.timeout = null; a.parseVideoId = function (b) {
        if (!b) return null; var d = new a.Video, c = /http[s]?\:\/\/www\.youtube\.com\/watch\?v\=([\w\-]{11})\&?.*/ig.exec(b), f = /http[s]?\:\/\/youtu\.be\/([\w\-]{11})(\?t\=([\w\d]+))?/ig.exec(b), e = /^<iframe\s{1}.*?https\:\/\/www\.youtube\.com\/embed\/([\w\-]{11})\??.*/ig.exec(b); e && e[1] ? d.id = e[1] : c && c[1] ? d.id = c[1] : f && f[1] ? (d.id =
        f[1], f[3] && (b = /((\d{1,2})h)?((\d{1,2})m)?((\d{1,2})s)?/ig.exec(f[3]), c = 0, b[2] && (c += 3600 * parseInt(b[2], 10)), b[4] && (c += 60 * parseInt(b[4], 10)), b[6] && (c += parseInt(b[6], 10)), 0 <= c && (d.startTime = c))) : 11 === b.length && (d.id = b); return d
    }; a.Video = function (b) { if (!(this instanceof a.Video)) return new a.Video(b); this.id = b ? b : null; this.thumbnail = this.title = null; this.endTime = this.startTime = this.duration = 0 }; a.Video.prototype = { videoId: function (a) { return a ? (this.id = this.parseVideoId(a), this) : this.id } }
})(window);
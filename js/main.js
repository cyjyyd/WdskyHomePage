var api = "https://blog.wdsky.top/";

$(document).ready(function () {
    $(".loading").hide();
    getAchives();
    getHitokoto();
});

$('#fold').click(function () {
    $('body').toggleClass('folded');
    var $i = $(this).find('i');
    if ($('body').hasClass('folded')) {
        $i.removeClass('fa-compress').addClass('fa-expand');
    } else {
        $i.removeClass('fa-expand').addClass('fa-compress');
    }
});

// 音量控制：滑块 0-100%，localStorage 持久化
var savedVol = 0;
try {
    var s = localStorage.getItem('bgVideoVolume');
    if (s !== null) savedVol = parseFloat(s);
} catch(e) {}

function updateVolumeIcon(vol) {
    var $i = $('#volume i');
    $i.removeClass('fa-volume-off fa-volume-down fa-volume-up');
    if (vol === 0) $i.addClass('fa-volume-off');
    else if (vol <= 0.3) $i.addClass('fa-volume-down');
    else $i.addClass('fa-volume-up');
}

function setVolume(val) {
    val = Math.max(0, Math.min(1, val));
    bv.videoEl.volume = val;
    bv.videoEl.muted = (val === 0);
    $('#volume-slider').val(Math.round(val * 100));
    updateVolumeIcon(val);
    if (val > 0) {
        savedVol = val;
        try { localStorage.setItem('bgVideoVolume', val); } catch(e) {}
    }
}

// Start muted (autoplay policy), slider shows saved position
bv.videoEl.volume = 0;
bv.videoEl.muted = true;
$('#volume-slider').val(Math.round(savedVol * 100));
updateVolumeIcon(0);

$('#volume-slider').on('input', function () {
    setVolume(this.value / 100);
});

$('#volume i').click(function (e) {
    e.stopPropagation();
    var cur = bv.videoEl.volume;
    if (cur === 0) {
        var restore = savedVol > 0 ? savedVol : 0.3;
        setVolume(restore);
    } else {
        setVolume(0);
    }
});

// Slider hover: JS timeout avoids gap between icon and slider
var sliderTimer;
$('#volume').on('mouseenter', function () {
    clearTimeout(sliderTimer);
    $('#volume-slider').show();
}).on('mouseleave', function () {
    sliderTimer = setTimeout(function () {
        $('#volume-slider').hide();
    }, 200);
});
$('#volume-slider').on('mouseenter', function () {
    clearTimeout(sliderTimer);
}).on('mouseleave', function () {
    sliderTimer = setTimeout(function () {
        $('#volume-slider').hide();
    }, 200);
});

// 随机切换视频
$('#shuffle').click(function () {
    var url = videoUrls[Math.floor(Math.random() * videoUrls.length)];
    var video = bv.videoEl;
    while (video.firstChild) {
        video.removeChild(video.firstChild);
    }
    var source = document.createElement('source');
    source.src = url;
    source.type = 'video/mp4';
    video.appendChild(source);
    bv.onLoadCalled = false;
    video.load();
    video.play();
});

$('.menu a').click(function () {
    target = $(this).attr('goto');
    switchTo(target);
});

function switchTo(target) {
    $('.right section').each(function () {
        $(this).removeClass('active');
    });
    $(target).addClass('active');
}

function getAchives() {
    t = ``;
    $.ajax({
        type: "GET",
        url: api + "wp-json/wp/v2/posts?per_page=10&page=1&_fields=date,title,link",
        dataType: "json",
        success: function (json) {
            for (var i = 0; i < json.length; i++) {
                title = json[i].title.rendered;
                link = json[i].link;
                time = new Date(json[i].date).Format("yyyy-MM-dd");
                t += `<li><a href="${link}" target="_blank">${title} <span class="meta">/ ${time}</span></a></li>`;
                $('.archive-list').html(t);
            }
        }
    })
}

function getHitokoto() {
    $.ajax({
        url: "https://v1.hitokoto.cn/",
        dataType: "json",
        success: function (result) {
            write(result.hitokoto + " —— " + result.from);
        },
        error: function () {
            write("Error...");
        }
    });
}

function write(text) {
    if (text.length < 30) {
        $('#hitokoto').html(text);
    } else {
        getHitokoto();
    }
}

// 对Date的扩展，将 Date 转化为指定格式的String
// 月(M)、日(d)、小时(h)、分(m)、秒(s)、季度(q) 可以用 1-2 个占位符， 
// 年(y)可以用 1-4 个占位符，毫秒(S)只能用 1 个占位符(是 1-3 位的数字) 
// 例子： 
// (new Date()).Format("yyyy-MM-dd hh:mm:ss.S") ==> 2006-07-02 08:09:04.423 
// (new Date()).Format("yyyy-M-d h:m:s.S")      ==> 2006-7-2 8:9:4.18 
Date.prototype.Format = function (fmt) { //author: meizz 
    var o = {
        "M+": this.getMonth() + 1, //月份 
        "d+": this.getDate(), //日 
        "h+": this.getHours(), //小时 
        "m+": this.getMinutes(), //分 
        "s+": this.getSeconds(), //秒 
        "q+": Math.floor((this.getMonth() + 3) / 3), //季度 
        "S": this.getMilliseconds() //毫秒 
    };
    if (/(y+)/.test(fmt)) fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
    for (var k in o)
        if (new RegExp("(" + k + ")").test(fmt)) fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
    return fmt;
}

//异步加载背景

function blobToDataURI(blob, callback) {
    var reader = new FileReader();
    reader.onload = function (e) {
        callback(e.target.result);
    }
    reader.readAsDataURL(blob);
}
var url = "img/bg.webp";
var xhr = new XMLHttpRequest();
xhr.open('GET', url, true);
xhr.responseType = "blob";
xhr.onload = function () {
    if (this.status == 200) {
        var blob = this.response;
        blobToDataURI(blob, function (t) {
            $("body").css("background-image", "url('" + t + "')");
            $("#background-small").addClass("smallBg");
            $("#background-small").css("opacity", "0");
        });
    }
}
xhr.send();
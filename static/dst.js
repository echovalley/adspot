(function() {
  var dataHost = window['_adspot_host'] ? window['_adspot_host'] + '/ads/' : "http://www.adspot.cn/ads/";
  var resHost = window['_adspot_host'] ? window['_adspot_host'] + '/static/' : "http://www.adspot.cn/static/";
  var logHost = window['_adspot_host'] ? window['_adspot_host'] + '/log/' : "http://www.adspot.cn/log/";
  var wbCode = window['_adspot_wb_code'];

  var DEFAULT_THUMB = resHost + 'res/pro.jpg';
  var SPOT_TYPE_SPACE = "0";
  var SPOT_TYPE_PRODUCT = "1";
  var SPOT_TYPE_LINK = "2";

  var last_log_timestamp = 0;

  //获取字母数字随机数。
  function genRandomStr(l) {
    var x = "0123456789qwertyuioplkjhgfdsazxcvbnm";
    var tmp = "";
    for(var i=0;i<l;i++) tmp += x.charAt(Math.ceil(Math.random()*100000000)%x.length);
    return tmp;
  }

  //判断变量是否为空
  function isEmpty(v) {
    return (typeof(v) == 'undefined' || v == 'undefined' || v == null || v == "") ? 1 : 0;
  }

  function check_jquery_version(v) {
    var v1 = jQuery.fn.jquery.split(".");
    var v2 = v.split(".");
    var v1v = v1[0]*100 + v1[1]*10 + v1[2];
    var v2v = v2[0]*100 + v2[1]*10 + v2[2];
    return (v1v >= v2v);
  }

  //把相对路径转换成URL绝对路径
  function getAbsoluteURL(src) {
    if (/^((https?):\/\/)/i.test(src)) return src;
    if (src.indexOf("/") == 0) return location.protocol + "//" + location.host + src;
      var dt = location.href.split("?")[0].split("/");
      dt.length--;
      while(src.indexOf("../") == 0){
        src = src.slice(3);
        dt.length--;
      }
      return (dt.join("/") + "/" + src);
  }

  //是否需要记录
  function need_log() {
    return isEmpty(window['_adspot_cancel_log']);
  }

  function generateClickTarget(spot) {
    if (need_log()) {
      return (spot.type == SPOT_TYPE_LINK) ? dataHost + "pixel.php?t=sc&sid=" + spot.id + "&dest=" + encodeURIComponent(spot.link_addr) : dataHost + "pixel.php?t=sc&sid=" + spot.id + "&pid=" + spot.pid + "&dest=" + encodeURIComponent(spot.click_target);
    } else {
      return (spot.type == SPOT_TYPE_LINK) ? spot.link_addr : spot.click_target;
    }
  }

  function getOriginalClickTarget(url) {
    var m = url.match(/&dest=(.*?)$/);
    return decodeURIComponent(m[1]);
  }

  function validateURL(url, nullable) {
    if (nullable && !url) return 1;
    var urlmatch = /^(http(s)?:\/\/)?([\w-]+\.)+[\w]+(:\d+)?(.*)$/; 
    return urlmatch.test(url);
  }

  function dolog(url) {
    var now = new Date().getTime();
    if (now - last_log_timestamp < 1000) return;
    last_log_timestamp = now;

    var img = document.createElement("img");
    img.width = 0;
    img.height = 0;
    img.src = url;
  }

  function log_image_impression(imgid) {
    dolog(dataHost + "pixel.php?t=im&imgid=" + imgid);
  }

  function log_image_hover(imgid) {
    dolog(dataHost + "pixel.php?t=ih&imgid=" + imgid);
  }

  function log_spot_hover(sid, pid) {
    isEmpty(pid) ? dolog(dataHost + "pixel.php?t=sh&sid=" + sid) : dolog(dataHost + "pixel.php?t=sh&sid=" + sid + "&pid=" + pid);
  }

  function log_spot_hover(sid, pid) {
    isEmpty(pid) ? dolog(dataHost + "pixel.php?t=sh&sid=" + sid) : dolog(dataHost + "pixel.php?t=sh&sid=" + sid + "&pid=" + pid);
  }

  function startAdspot($) {	

    //构建编辑spot表单DIV
    function getEditDiv() {
      return	'<div class="adspot_layer_info add-edit-adspot">' +
        '<div class="adspot_layer_inner">' +
        '<div class="adspot_tab">' +
        '<a class="adspot_tab1 adspot_tab_selected"><i></i>商品锚点</a><a class="adspot_tab2"><i class="adspot_i2"></i>链接锚点</a>' +
        '</div>' +
        '<div class="adspot_tab_con tab_con_product">' +
        '<label>请输入你要链接的商品关键字</label>' +
        '<input type="text" placeholder="比如：婚纱、地毯等"><a class="adspot_search_btn"></a>' +
        '</div>' +
        '<div class="adspot_tab_con tab_con_link" style="display:none;">' +
        '<input type="text" class="link_addr" placeholder="请输入链接地址后按回车">' +
        '<div class="adspot_link_more_info" style="display:none">' +
        '<input type="text" class="link_thumb" placeholder="输入图片的URL">' +
        '<div class="adspot_img_preview"><img src="">' +
        '<input type="text" class="link_title" placeholder="请输入标题">' +
        '<textarea type="text" class="link_desc" placeholder="请输入描述"></textarea>' +
        '<div class="adspot_clear"></div>' +
        '</div>' +
        '<i></i>' +
        '</div>' +
        '</div>' +
        '<div style="display: block; opacity: 1;" class="adspot_search_box">' +
        '<div style="display: none;" class="adspot_search_noresult"><p>你要寻找的商品不存在，请试试其他关键字 </p></div>' +
        '</div>' +
        '<div class="adspot_search_loader" style="display: none;"><img class="adspot_search_spinner" alt="Searching..." src="' + resHost + 'res/spinner-white.gif"><p>链接分析中，请稍候…</p></div>' +
        '</div>' +
        '<div class="adspot_tab_action"><a class="adspot_edit_btn cancel" title="取消">取 消</a><a class="adspot_edit_btn adspot_green_btn submit" title="确定">确 定</a></div>' +
        '</div>';
    }


    //锚点信息层spotDiv
    function getSpotDiv(spot, modify) {
      return (spot.type == SPOT_TYPE_LINK) ? getLinkSpotDiv(spot, modify) : getProductSpotDiv(spot, modify);
    }

    //Link类型的spotDiv
    function getLinkSpotDiv(spot, modify) {
      var d = spot.link_desc;
      if (d && d.length > 50) {
        d = d.substr(0, 50) + '...';
      }
      if (!d) d = '';

      var divclass = 'adspot_layer_info adspot_info_detail ';
      if (spot.link_css) {
        divclass += (spot.link_css == 'video') ? 'adspot_video' : 'adspot_link adspot_linkshow_sns';
      }

      var cktarget = generateClickTarget(spot);

      var str = '<div class="' + divclass + '" ';
      if (spot.link_css) str += 'lsc="' + spot.link_css + '"';
      str += 	'spot-div-id=' + spot.id + '><div class="adspot_layer_inner1">';
      if (spot.link_thumb) {
        str += '<a href="' + cktarget + '" target="_blank"><img class="adspot_link_pic" src="' + spot.link_thumb + '" /></a>'; 
      } else if (spot.link_css) {
        str += '<a href="' + cktarget + '" target="_blank"><img class="adspot_link_pic" src="' + DEFAULT_THUMB + '" /></a>'; 
      }

      if (spot.link_css && spot.link_css == 'video') {
        str += '<a href="#" class="adspot_play_btn" player="' + spot.player + '" vid="' + spot.vid + '" title="点击播放视频"></a>';
        str += '<a href="#" class="adspot_video_close" style="display:none" title="点击关闭视频"></a>'
      }

      str += '<a class="adspot_link_title" href="' + cktarget + '" target="_blank"><h4>' + spot.link_title + '</h4></a><p class="adspot_link_des">' + d + '</p><div class="adspot_clear"></div></div>';

      if (modify) {
        str += '<div class="adspot_edit_area"><a title="编辑信息" class="adspot_edit_btn adspot_edit_button"><i></i></a><a title="删除锚点" class="adspot_edit_btn adspot_edit_edit adspot_edit_delete"><i></i></a></div>';
      }

      str += '</div></div>';
      return str;
    }

    //Product类型的spotDiv
    function getProductSpotDiv(spot, modify) {
      var cktarget = generateClickTarget(spot);
      var div = '<div class="adspot_layer_info adspot_info_detail" spot-div-id=' + spot.id +'>' + 
        '<div class="adspot_layer_inner1">' +
        '<div class="adspot_layer_left"><a href="' + cktarget + '" target="_blank"><img alt="' + spot.pname + '" src="' + spot.pdct_thumb + '"></a></div>' +
        '<div class="adspot_layer_right"><h1 pid=' + spot.pid + ' search_tag="' + spot.search_tag + '">' + spot.pname + '</h1>' +
        '<div class="adspot_layer_price"><label>购买价格：</label><span>' + spot.pdct_price + '</span></div>';

      if (spot.aname) {
        div += '<div class="adspot_layer_source"><label>信息来源：</label><a href="' + spot.homepage + '" target="_blank">' + spot.aname + '</a></div>'; 
      }
      div += 	'<div class="adspot_layer_shop"><a class="adspot_edit_btn adspot_buy_btn adspot_green_btn" href="' + cktarget + '" target="_blank">购买</a></div></div><div class="clear"></div>';

      if (modify) {
        div += '<div class="adspot_edit_area"><a title="编辑信息" class="adspot_edit_btn adspot_edit_button"><i></i></a><a title="删除锚点" class="adspot_edit_btn adspot_edit_edit adspot_edit_delete"><i></i></a></div>';
      }
      div += '</div></div>';
      return div;
    }

    //删除确定DIV
    function getConfirmDiv() {
      return '<div class="adspot_layer_info confirm_div">' +
        '<div class="adspot_layer_inner">' +
        '<p style="text-align:center">你确定你要删除该锚点嘛？</p>' +
        '</div><div class="adspot_tab_action"><a title="取消" class="adspot_edit_btn adspot_edit_btn_cancel">取 消</a><a title="确定" class="adspot_edit_btn adspot_edit_btn_submit">确 定</a></div></div>';
    }

    //圆点div
    function getDotDiv(spot, parent_img, show) {
      var display = (show) ? "display:block;" : "display:none;";
      var clas = '';
      if (spot.type == SPOT_TYPE_LINK) {
        clas = (spot.link_css && spot.link_css == 'video') ? 'adspot_icon_video' : 'adspot_icon_link';
      } else if (spot.type == SPOT_TYPE_PRODUCT) {
        clas = 'adspot_icon_product';
      } else {
        clas = 'adspot_icon_space';
      }
      var left_margin = spot.x_offset_ratio ? Math.round(spot.x_offset_ratio * parent_img.width()): spot.left;
      var top_margin = spot.y_offset_ratio ? Math.round(spot.y_offset_ratio * parent_img.height()): spot.top;
      return "<div class='adspot_icon " + clas + "' style='" + display + "left:" + left_margin + "px;top:" + top_margin + "px;opacity:0.7;' adspot-id='" + spot.id + "'></div>";
    }

    /**
     *  搜索结果div
     */
    function getSearchResultDiv(pdcts, append) {
      var str = '';
      for(var p in pdcts) {
        var pname = pdcts[p].pname;
        if (pname.length > 12) {
          pname = pname.substr(0,12);
        }
        str += '<li class="adspot_search_item">';
        str += '<img src="' + pdcts[p].pdct_thumb + '" class="adspot_search_image"><div class="adspot_search_info" id="' + pdcts[p].pid + '"><h2>' + pname + '</h2><p>' + pdcts[p].pdct_price + '</p><p>' + pdcts[p].aname + '</p></div></li>';
      }
      if (!append) {
        str = '<ul style="display: block;" class="adspot_search_items">' + str + '</ul>';
      }
      return str;
    }

    /**
     * 删除页面覆盖
     */
    function removeOverlay() {
      $(document.body).css('overflow', 'auto')
      $("body div.adspot-overlay").remove();
    }

    /**
     * 创建页面覆盖
     */
    function createOverlay() {
      var iTop = 0;
      if ($.browser.mozilla) {
        iTop = $('html').scrollTop();
      } else {
        iTop = $(document.body).scrollTop();
      } 

      var overlay = $('<div></div>').addClass("adspot-overlay");

      overlay
      .css({
        background: '#000000',
        opacity: 0.5,
        top: iTop,
        left: 0,
        width: '100%',
        height: '100%',
        position: 'absolute',
        zIndex: 1998,
        display: 'none',
        overflow: 'hidden'
      });

      $(document.body).append(overlay);
      $(document.body).css('overflow', 'hidden')
      $("body div.adspot-overlay").show();
    }

    //绑定删除确认层的事件
    function bindConfirmDivEvent(confirmDiv) {
      var spotId = confirmDiv.attr("edit-adspot-id");
      var spotDiv = $("div[spot-div-id=" + spotId + "]"); //商品的详细DIV

      var cancelBtn = confirmDiv.find(".adspot_edit_btn_cancel");
      cancelBtn.unbind("click");	
      cancelBtn.click(function() {
        confirmDiv.hide();
        bindShowSpotEvent(spotDiv);
        removeOverlay();
      });

      var submitBtn = confirmDiv.find(".adspot_edit_btn_submit");
      submitBtn.unbind("click");
      submitBtn.click(function() {
        confirmDiv.parent().find(".adspot_icon[adspot-id='" + spotId + "']").remove(); //删除对应的锚点				
        confirmDiv.hide();
        bindShowSpotEvent(spotDiv);
        removeOverlay();
        spotDiv.hide();

        var dataUrl = dataHost + "spot-delete.php?id=" + spotId;
        $.getJSON(dataUrl+"&callback=?", function(deletedSpotId){
          //delete the info div
          $("div.adspot_info_detail[spot-div-id=" + deletedSpotId + "]").remove();
        });
      });
    }

    //绑定锚点信息层上的事件
    function bindSpotDivEvent(spotDiv) {
      var spotId = spotDiv.attr("spot-div-id");
      var imgIndex = spotDiv.attr("adspot-img-index"); //获取当前广告层是属于那个图片的
      var wrapDiv = $(".adspot_wrapper[adspot-img-index='" + imgIndex + "']");
      var dotDiv = wrapDiv.find(".adspot_icon[adspot-id='" + spotId + "']")

      //绑定锚点信息层上的点击删除按钮事件
      var delBtn = spotDiv.find("a.adspot_edit_delete");
      delBtn.unbind("click");
      delBtn.click(function(e) {
        e.preventDefault();
        var confirmDiv = wrapDiv.find(".confirm_div");

        var left = parseInt(dotDiv.css("left")) + 20;
        var top =  parseInt(dotDiv.css("top"));

        var h =  spotDiv.height();
        confirmDiv.css({left: left, top: (top + h/2)});
        confirmDiv.attr("edit-adspot-id", spotId); //设置要操作的ID，方便以后处理

        createOverlay();
        confirmDiv.show();

        spotDiv.unbind("hover");
        bindConfirmDivEvent(confirmDiv); //绑定确定，取消事件。
      });

      //绑定锚点信息层上的点击编辑按钮事件
      var editBtn = spotDiv.find("a.adspot_edit_button");
      editBtn.unbind("click");
      editBtn.click(function(e) {
        e.preventDefault();
        var editDiv = wrapDiv.find(".add-edit-adspot");

        var left = dotDiv.css("left");
        var top =  dotDiv.css("top");

        spotDiv.hide();

        editDiv.css({left: left, top: top});
        editDiv.attr("adspot_edit_pdct_id", spotId);
        editDiv.show(100);
        spotDiv.unbind("hover");
        bindEditDivEvent(editDiv);//绑定编辑层的所有事件，此处为修改触发
        unbindDotDivEvent(wrapDiv);
        unbindNewDivEvent(wrapDiv);

        var spot = getSpotData(spotId);
        setEditDivValue(editDiv, spot);
        if (spot.type == SPOT_TYPE_PRODUCT) {
          bindSelectItemEvent(editDiv);
        } else {
          var _linkthumb = editDiv.find(".link_thumb"); 
          _linkthumb.unbind("change");
          _linkthumb.change(function() {
            if (validateURL(_linkthumb.val())) {
              editDiv.find("div.adspot_img_preview img").attr("src", _linkthumb.val());
            } else {
              editDiv.find("div.adspot_img_preview img").attr("src", "");
            }
          });
        }
      });

      //绑定Video类型Spot的点击播放事件
      var playBtn = spotDiv.find("a.adspot_play_btn");
      playBtn.unbind("click");
      playBtn.click(function(e) {
        //var left = parseInt(dotDiv.css("left")) + 20;
        //var top =  parseInt(dotDiv.css("top"));
        turn2VideoMode(spotDiv);
      });

      var closeBtn = spotDiv.find("a.adspot_video_close");
      closeBtn.unbind("click");
      closeBtn.click(function(e) {
        turn2NormalMode(spotDiv);
      });

    }

    function turn2VideoMode(spotDiv) {
      var imgIndex = spotDiv.attr("adspot-img-index"); //获取当前广告层是属于那个图片的
      var wrapDiv = $(".adspot_wrapper[adspot-img-index='" + imgIndex + "']");
      var playBtn = spotDiv.find("a.adspot_play_btn");
      var closeBtn = spotDiv.find("a.adspot_video_close");
      var innerDiv = spotDiv.find(".adspot_layer_inner1");
      var thumblink = spotDiv.find("img.adspot_link_pic").parent();
      var player = playBtn.attr("player");
      var vid = playBtn.attr("vid");

      var embedstr = '';
      if (player == 'youku') {
        embedstr = '<div class="adspot_videoplay_box"><embed height="330" allowscriptaccess="never" style="visibility: visible; display: block !important; " pluginspage="http://get.adobe.com/cn/flashplayer/" flashvars="isAutoPlay=true" width="400" allowfullscreen="true" quality="hight" src="http://player.youku.com/player.php/sid/' + vid + '/v.swf" type="application/x-shockwave-flash" wmode="transparent"></embed></div>';
      } else if (player == 'tudou') {
        embedstr = '<div class="adspot_videoplay_box"><embed src="http://www.tudou.com/v/' + vid + '/&autoPlay=true/v.swf" type="application/x-shockwave-flash" allowscriptaccess="never" allowfullscreen="true" wmode="opaque" width="400" height="330"></embed></div>';
      }

      thumblink.hide();
      playBtn.hide();

      spotDiv.find("div.adspot_layer_inner1").animate({
        width: '400'
      }, 300, function() {
        // Animation complete.
      });

      innerDiv.prepend(embedstr);
      unbindDotDivEvent(wrapDiv);
      unbindNewDivEvent(wrapDiv);
      spotDiv.unbind('hover');
      closeBtn.show();
      spotDiv.find(".adspot_edit_area").hide();

    }

    function turn2NormalMode(spotDiv) {
      var imgIndex = spotDiv.attr("adspot-img-index"); //获取当前广告层是属于那个图片的
      var wrapDiv = $(".adspot_wrapper[adspot-img-index='" + imgIndex + "']");
      var playBtn = spotDiv.find("a.adspot_play_btn");
      var closeBtn = spotDiv.find("a.adspot_video_close");
      var innerDiv = spotDiv.find(".adspot_layer_inner1");
      var thumblink = spotDiv.find("img.adspot_link_pic").parent();

      innerDiv.find('.adspot_videoplay_box').remove();
      thumblink.show();
      playBtn.show();
      closeBtn.hide();
      innerDiv.css('width', 240);

      bindDotDivEvent(wrapDiv);
      bindNewDivEvent(wrapDiv);
      spotDiv.bind('hover');
      spotDiv.find(".adspot_edit_area").show();
      spotDiv.hide();
    }


    //绑定选择商品事件
    function bindSelectItemEvent(editDiv) {
      var selectedItem = editDiv.find(".adspot_search_box .adspot_search_items li");
      selectedItem.unbind("click"); 
      selectedItem.click(function() {
        $(this).siblings().removeClass("adspot_search_item_selected");
        $(this).toggleClass("adspot_search_item_selected").toggleClass("adspot_search_item");
      });
    }


    /**
     * 处于编辑(新增)状态时的点击事件。 
     */
    function bindImgDivEvent(wrapDiv) {
      var img = wrapDiv.find("img.adSpotImgWrap");
      img.css('cursor','crosshair');
      img.unbind("click");
      img.click(function(e) {
        e.preventDefault();

        var left = e.pageX - img.offset().left - 16;
        var top = e.pageY - img.offset().top - 16;

        var spot = {left:left, top:top, type: SPOT_TYPE_SPACE};

        wrapDiv.append(getDotDiv(spot, img, true));

        var editDiv = wrapDiv.find(".add-edit-adspot");
        bindEditDivEvent(editDiv); //绑定编辑层的所有事件，此处为新增触发
        editDiv.css({left: (left + 25),top: (top +  12)});
        editDiv.removeAttr("adspot_edit_pdct_id");

        setEditDivValue(editDiv, spot);
        unbindImgDivEvent(wrapDiv);
        unbindNewDivEvent(wrapDiv);//新增时左上角按钮无效

        editDiv.show();
      });
    }

    /**
     * 取消spot编辑状态，对应 bindImgDivEvent
     */
    function unbindImgDivEvent(wrapDiv) {
      var img = wrapDiv.find("img.adSpotImgWrap");
      img.css('cursor', 'auto');
      img.unbind('click');
      wrapDiv.find("div.add-edit-adspot").hide();
    }


    /**
     * 绑定编辑层事件（包括新增和修改两张情况）
     */
    function bindEditDivEvent(editDiv) {

      var wrapDiv = editDiv.parents("div.adspot_wrapper");
      var tabBtn = editDiv.find("div.adspot_tab a");
      var searchBtn = editDiv.find("a.adspot_search_btn");
      var searchDiv = editDiv.find("div.adspot_search_box"); 
      var inputText = editDiv.find("div.tab_con_product>input:text");
      var cancelBtn = editDiv.find(".adspot_tab_action a.cancel");
      var submitBtn = editDiv.find(".adspot_tab_action a.submit");
      var linkDiv = editDiv.find("div.tab_con_link");
      var loadDiv = editDiv.find(".adspot_search_loader");


      //绑定打点时product,link类型切换
      tabBtn.unbind("click");
      tabBtn.click(function(e) {
        e.preventDefault();
        $(this).addClass("adspot_tab_selected");
        $(this).siblings().removeClass("adspot_tab_selected");
        if ($(this).hasClass("adspot_tab1")) {
          editDiv.find(".adspot_layer_inner .tab_con_link").hide();
          editDiv.find(".adspot_layer_inner .tab_con_product").show();
          editDiv.find(".adspot_search_box").show();
        } else {
          editDiv.find(".adspot_layer_inner .tab_con_product").hide();
          editDiv.find(".adspot_search_box").hide();
          editDiv.find(".adspot_layer_inner .tab_con_link").show();
        }
        loadDiv.hide();
      });

      //绑定编辑层搜索事件
      searchBtn.unbind("click");
      //last若大于0，表示本次click触发来自scroll（非回车或点击搜索按钮），last代表前一次搜素数量
      searchBtn.click(function(e, last) {
        var tags = editDiv.find("input:text").val();
        if (!tags) {
          return;
        }

        var searchBox = editDiv.find("div.adspot_search_box");
        var noresultDiv = editDiv.find("div.adspot_search_noresult");
        if (!last) {
          loadDiv.show();
          searchBox.hide();
        }
        noresultDiv.hide();
        var findUrl = dataHost + "spot-find.php?tags=" + encodeURIComponent(tags);
        if (last) {
          findUrl += "&last=" + last; 
        }

        $.getJSON(findUrl + "&callback=?", function(pdcts) {
          var items = editDiv.find("ul.adspot_search_items");
          loadDiv.hide();
          if (last) {
            if (pdcts.length > 0) {
              items.append(getSearchResultDiv(pdcts, true));
            }
          } else {
            items.remove();
            if (pdcts.length > 0) {
              searchDiv.append(getSearchResultDiv(pdcts, false)); 
            } else {
              noresultDiv.show();
            }
          }
          items = editDiv.find("ul.adspot_search_items");
          if (items.size() > 0) {
            searchBox.show();
            bindSelectItemEvent(editDiv);
          }
        });
      });

      //绑定搜索回车事件
      inputText.unbind("keyup");
      inputText.keyup(function(e) {
        if (e.which == 13) {//仅响应回车
          $(this).siblings("a.adspot_search_btn").trigger("click");
        }
      });

      //绑定产品搜索结果页面滚动事件
      searchDiv.unbind("scroll");
      searchDiv.scroll(function() {
        var _sh = $(this).prop("scrollHeight");
        var _ch = $(this).prop("clientHeight");
        var _st = $(this).scrollTop();
        if (_st + _ch >= _sh) {
          //alert (_st + "+" + _ch + "=" + _sh);
          var items_number = searchDiv.find("ul.adspot_search_items>li").size();
          $(this).parent().find("a.adspot_search_btn").trigger("click", items_number);
        }
      });

      //点击cancel事件
      cancelBtn.unbind("click");
      cancelBtn.click(function() {
        editDiv.parent().find(".adspot_icon_space").remove();//如有未保存的新增点，删除
        if (!editDiv.attr("adspot_edit_pdct_id")) {
          bindImgDivEvent(wrapDiv);
        } else {
          bindDotDivEvent(wrapDiv);
        }
        editDiv.removeAttr("adspot_edit_pdct_id");
        bindNewDivEvent(wrapDiv);

        editDiv.hide();
      });

      //点击提交
      submitBtn.unbind("click");
      submitBtn.click(function() {
        var wrapDiv = $(this).parents("div.adspot_wrapper");
        var img = wrapDiv.find("img.adSpotImgWrap");

        var sid = editDiv.attr("adspot_edit_pdct_id") ? editDiv.attr("adspot_edit_pdct_id") : 0;

        var spot = {id: sid};

        if (editDiv.find(".adspot_tab .adspot_tab_selected").hasClass("adspot_tab1")) {
          spot.type = SPOT_TYPE_PRODUCT;	
          spot.pid = editDiv.find("li.adspot_search_item_selected>div").attr("id");
          if (!spot.pid) {//必须选中至少一个商品
            return;
          }
          spot.search_tag = editDiv.find(".tab_con_product input:text").val();
        } else {
          spot.type = SPOT_TYPE_LINK;
          spot.link_addr = editDiv.find("input.link_addr").val();
          spot.link_title = editDiv.find("input.link_title").val();
          spot.link_thumb = editDiv.find("input.link_thumb").val();
          spot.link_desc = editDiv.find("textarea.link_desc").val();
          var _classes = getCssClass(linkDiv);
          if (_classes) spot.link_css = _classes.slice(12);
          if (!spot.link_title) {//必e填写title
            return;
          }
          if (!validateURL(spot.link_addr)) {
            editDiv.find("input.link_addr").addClass("input_warning");
            return;
          }
          if (!validateURL(spot.link_thumb, true)) {
            editDiv.find("input.link_thumb").addClass("input_warning");
            return;
          }
        }

        spot.wbcode = wbCode;
        spot.imgWidth = img.width();
        spot.imgHeight = img.height();
        spot.imgTitle = img.attr("title") ? img.attr("title") : (img.attr("alt") ? img.attr("alt") : "");
        spot.imgSrc  = img.attr("original_path") ? img.attr("original_path") : getAbsoluteURL(img.attr("src"));

        if (!sid) {//新增
          var adDot = wrapDiv.find("div.adspot_icon_space");
          spot.left = adDot.css("left").replace("px","");
          spot.top  = adDot.css("top").replace("px","");
        }

        var spotstr = '';
        for (var key in spot) {
          spotstr += key + '=' + encodeURIComponent(spot[key]) + '&';
        }
        spotstr = spotstr.substring(0, spotstr.length-1);

        var saveUrl = dataHost + "spot-save-update.php?" + spotstr + "&callback=?" ;
        //alert (saveUrl);
        $.getJSON(saveUrl, function(_spot) {//返回本次操作的spot id,如果是新增adspot_inco_space，就赋予spotid属性
          var dotclass = '';
          if (_spot.type == SPOT_TYPE_PRODUCT) {
            dotclass = 'adspot_icon_product';
          } else {
            dotclass = (_spot.link_css && _spot.link_css == 'video') ? 'adspot_icon_video' : 'adspot_icon_link';
          }
          if (!_spot['first']) {
            $("div.adspot_info_detail[spot-div-id='" + sid + "']").remove();
            wrapDiv.find("div.adspot_icon[adspot-id=" + _spot['id']+ "]").removeClass().addClass("adspot_icon " + dotclass);
          } else {
            var adDot = wrapDiv.find(".adspot_icon_space");
            adDot.removeClass().addClass("adspot_icon " + dotclass);
            if (adDot) adDot.attr("adspot-id", _spot['id']);
            refreshDots(wrapDiv);
          }
          wrapDiv.append(getSpotDiv(_spot, 1));
          var spotDiv = $(".adspot_info_detail[spot-div-id=" + _spot['id'] + "]");
          spotDiv.attr("adspot-img-index", wrapDiv.attr("adspot-img-index"));
          bindSpotDivEvent(spotDiv); //绑定展示广告，右下角的删除按钮事件。
          $("div.adspot_btn_add_dot").removeClass("adspot_btn_add_clicked");
        });

        unbindImgDivEvent(wrapDiv);
        bindDotDivEvent(wrapDiv);
        bindNewDivEvent(wrapDiv);
        editDiv.hide();
      });

      //link类型输入地址后回车
      linkDiv.find(".link_addr").unbind("keyup");
      linkDiv.find(".link_addr").keyup(function(e) {
        $(this).removeClass("input_warning");
        if (e.which != 13) return; //仅响应回车
        var _link_target = $(this).val();
        if (!validateURL(_link_target)) {
          $(this).addClass("input_warning");
          return;
        }
        var linkUrl = dataHost + "spot-link.php?u=" + encodeURIComponent(_link_target);

        linkDiv.find(".link_thumb").val("");
        linkDiv.find("div.adspot_img_preview :text").val("");
        linkDiv.find("div.adspot_img_preview textarea").val("");
        linkDiv.find("div.adspot_img_preview img").attr("src", "");
        linkDiv.hide();
        loadDiv.show();

        $.getJSON(linkUrl + "&callback=?", function(obj) {
          loadDiv.hide();
          linkDiv.show();
          if (obj) {
            $("div.adspot_link_more_info").show();
            if (obj["thumb"]) {
              linkDiv.find(".link_thumb").val(obj["thumb"]);
              linkDiv.find("div.adspot_img_preview img").attr("src", obj["thumb"]);
            } else {
              linkDiv.find("div.adspot_img_preview img").attr("src", DEFAULT_THUMB);
            }
            if (obj["title"]) {
              linkDiv.find("div.adspot_img_preview input").val(obj["title"]);
            }
            if (obj["desc"]) {
              linkDiv.find("div.adspot_img_preview textarea").val(obj["desc"]);
            }
            if (obj["css"]) {
              removeCssClass(linkDiv);
              linkDiv.addClass("adspot_link_" + obj["css"]);
            }
          } else {
            linkDiv.find("div.adspot_img_preview input").val(_link_target);
          }
        });
      });

    }

    function getCssClass(div) {
      var _arr_c = div.attr("class").split(" ");
      for (var i in _arr_c) {
        if (_arr_c[i].indexOf("adspot_link_") != -1) {
          return _arr_c[i];
        }
      }
      return '';
    }

    //移除link_css样式,以adspot_link_开头
    function removeCssClass(div) {
      if (div) div.removeClass(getCssClass(div));
    }


    //绑定展示广告事件
    function bindShowSpotEvent(spotDiv) {
      spotDiv.unbind("hover");
      spotDiv.hover (
        function() {
        clearTimeout(timeoutId);
        $(this).show();
      },
      function() {
        timeoutId = setTimeout(function() {
          clearTimeout(timeoutId);
          spotDiv.fadeOut(150);
        }, FADE_INTERVAL);
      }
      );
    }

    //取消绑定锚点悬浮
    function unbindDotDivEvent(wrapDiv) {
      wrapDiv.find("div.adspot_icon").unbind("hover");
    }

    //绑定锚点悬浮事件
    function bindDotDivEvent(wrapDiv) {
      var dotDiv = wrapDiv.find("div.adspot_icon");
      dotDiv.unbind("hover");
      dotDiv.hover(
      function() {
        $(this).css("opacity", "1");

        var offset = $(this).position();
        var id = $(this).attr("adspot-id");
        var pIdDiv = $("div[spot-div-id=" + id + "]");

        //获取该点属于那个图片
        var spotImgIndex = $(this).parent().attr("adspot-img-index");
        //设置显示的spot是由那个图片下的锚点触发。
        pIdDiv.attr("adspot-img-index", spotImgIndex);
        bindShowSpotEvent(pIdDiv);
        pIdDiv.css({left:offset.left + 24, top:offset.top + 24});

        clearTimeout(timeoutId);
        $("div.adspot_info_detail").not(pIdDiv).fadeOut(150);
        if (pIdDiv.css("display") == "none") {
          pIdDiv.fadeIn(150);
        }

        var product_id = pIdDiv.find("h1").attr("pid");
        if (need_log()) log_spot_hover(id, product_id);
      },
      function() {
        $(this).css("opacity", "0.7");
        var id = $(this).attr("adspot-id");

        timeoutId = setTimeout(function() {
          clearTimeout(timeoutId);
          var pIdDiv = $("div[spot-div-id=" + id + "]");
          if (pIdDiv.css("display") == "block") {
            pIdDiv.fadeOut(150);
          }
        }, FADE_INTERVAL);
      }
      );
    }

    //绑定左上角的新增按钮事件。
    function bindNewDivEvent(wrapDiv) {
      var newBtn = wrapDiv.find(".adspot_btn_add_dot a");
      newBtn.unbind("click");
      newBtn.click(function(e) {
        //e.preventDefault();
        if ($(this).parent().hasClass("adspot_btn_add_clicked")) {
          unbindImgDivEvent(wrapDiv); //取消页面点击添加锚点事件。
          bindDotDivEvent(wrapDiv);  //绑定鼠标移到锚点，显示对应广告事件。
          newBtn.attr("title", "进入添加模式");
        } else {
          bindImgDivEvent(wrapDiv);
          unbindDotDivEvent(wrapDiv);
          newBtn.attr("title", "进入正常模式");
          $("div.adspot_info_detail").fadeOut(150);
        }
        $(this).parent().toggleClass("adspot_btn_add_clicked");
      });
    }

    //绑定左上角的新增按钮事件。
    function unbindNewDivEvent(wrapDiv) {
      wrapDiv.find(".adspot_btn_add_dot a").unbind("click");
    }


    function setEditDivValue(editDiv, spot) {//设置锚点信息表单的初始值，新增或编辑时调用，传入spot对象
      editDiv.find(".adspot_tab1").removeClass("adspot_tab_selected");
      editDiv.find(".adspot_tab2").removeClass("adspot_tab_selected");
      editDiv.find("input:text").val("");
      editDiv.find("ul.adspot_search_items").remove();
      editDiv.find("div.adspot_search_noresult").hide();
      editDiv.find("div.adspot_search_loader").hide();
      editDiv.find("input.link_addr").val("");
      editDiv.find("input.link_addr").removeClass("input_warning");
      editDiv.find("input.link_title").val("");
      editDiv.find("input.link_thumb").val("");
      editDiv.find("input.link_thumb").removeClass("input_warning");
      editDiv.find("textarea.link_desc").val("");
      editDiv.find("div.adspot_img_preview img").attr("src", "");

      removeCssClass(editDiv.find("div.tab_con_link"));
      if (spot.type == SPOT_TYPE_SPACE) {
        editDiv.find("div.adspot_link_more_info").hide();
        editDiv.find("a.adspot_tab1").trigger("click");
      } else if (spot.type == SPOT_TYPE_LINK) {
        editDiv.find("input.link_addr").val(spot.link_addr);
        editDiv.find("input.link_title").val(spot.link_title);
        editDiv.find("input.link_thumb").val(spot.link_thumb);
        editDiv.find("div.adspot_img_preview img").attr("src", spot.link_thumb);
        editDiv.find("textarea.link_desc").val(spot.link_desc);
        editDiv.find("div.adspot_link_more_info").show();
        if (spot.link_css) {
          editDiv.find("div.tab_con_link").addClass("adspot_link_" + spot.link_css);
          if (!spot.link_thumb) {
            editDiv.find("div.adspot_img_preview img").attr("src", DEFAULT_THUMB);
          }
        }
        editDiv.find("a.adspot_tab2").trigger("click");
      } else {
        editDiv.find("div.tab_con_product input:text").val(spot.search_tag);
        var pdct = {pid: spot.pid, pname: spot.pdct_name, pdct_thumb: spot.pdct_thumb, pdct_price: spot.pdct_price, aname: spot.advname};
        var str = getSearchResultDiv([pdct], false);
        editDiv.find("div.adspot_search_box").append(str);
        editDiv.find("div.adspot_link_more_info").hide();
        editDiv.find("a.adspot_tab1").trigger("click");
      }
    }

    function getSpotData(sid) {//从adspot_info_detail根据spot-div-id得到spot对象
      var infoDiv = $("div.adspot_info_detail[spot-div-id=" + sid + "]");
      var spot = {id: sid};
      if (infoDiv.find(".adspot_link_title").size() > 0) {
        spot.type = SPOT_TYPE_LINK;
        spot.link_addr = getOriginalClickTarget(infoDiv.find("a").attr("href"));
        spot.link_thumb = infoDiv.find("img").attr("src");
        if (spot.link_thumb == DEFAULT_THUMB) spot.link_thumb = ''; 
        spot.link_title = infoDiv.find("h4").text();
        spot.link_desc = infoDiv.find("p.adspot_link_des").text();
        spot.link_css = infoDiv.attr("lsc");
      } else {
        spot.type = SPOT_TYPE_PRODUCT;
        spot.pid = infoDiv.find(".adspot_layer_right h1").attr("pid");
        spot.pdct_thumb = infoDiv.find(".adspot_layer_left img").attr("src");
        spot.pdct_addr = infoDiv.find(".adspot_layer_left a").attr("href");
        spot.pdct_name = infoDiv.find(".adspot_layer_right h1").text();
        spot.pdct_price = infoDiv.find(".adspot_layer_price span").text();
        spot.advname = infoDiv.find(".adspot_layer_source a").text();
        spot.advlink = infoDiv.find(".adspot_layer_source a").attr("href");
        spot.search_tag = infoDiv.find(".adspot_layer_right h1").attr("search_tag");
      }
      return spot;
    }

    //包装图片
    function wrapperImg(img, imageInfo, index) {
      spots = imageInfo.spots;
      modify = imageInfo.modify;

      var wrapDivStr = "<div class='adspot_wrapper' adspot-img-index='" + index + "' style='width:" + img.width() + "px;height:" + img.height() + "px;'></div>";
      var logoDivStr = "<div class='adspot_btn_logo'><a href='http://www.adspot.cn' target='_blank'>访问Adpot</a> </div>";
      var newDivStr = "<div class='adspot_btn_add_dot'><a title='进入添加模式'>添加锚点</a></div>";

      img.addClass("adSpotImgWrap");
      if (img.parent().is("a")) {
        img.parent().wrap(wrapDivStr); //包装图片
      } else {
        img.wrap(wrapDivStr);
      }

      if (need_log() && imageInfo.imgid) log_image_impression(imageInfo.imgid);

      var wrapDiv = img.parents("div.adspot_wrapper");
      for(var i in spots) {
        var spot = spots[i];
        if (spot.type) {
          wrapDiv.append(getDotDiv(spot, img, false));

          if (!$(document.body).find("div.adspot_info_detail").is("div[spot-div-id=" + spot.id + "]")){
            wrapDiv.append(getSpotDiv(spot, modify));
          }
          var infoDiv = $("div.adspot_info_detail[spot-div-id=" + spot.id + "]");
          infoDiv.attr("adspot-img-index", index);
        }
      }

      wrapDiv.append(logoDivStr);
      if (modify) {
        wrapDiv.append(newDivStr).append(getEditDiv()).append(getConfirmDiv());
      }

      bindNewDivEvent(wrapDiv); //绑定左上角点击事件，以便图片处于编辑或者查看状态。
      bindDotDivEvent(wrapDiv); //绑定鼠标移到锚点，显示对应广告事件。
      return wrapDiv;
    }

    function refreshDots(wrapDiv) {
      var logo_area = wrapDiv.find(".adspot_icon");
      wrapDiv.hover(
        function() { 
          logo_area.fadeIn(100); 
        },	
        function() { 
          logo_area.fadeOut(100); 
        }
      );
    }

    //初始化图的锚点
    function initImg(img, imageInfo, index) {
      var wrapDiv = wrapperImg(img, imageInfo, index);
      var logo_area = wrapDiv.find(".adspot_btn_logo,.adspot_icon,.adspot_btn_add_dot");
      wrapDiv.unbind("hover");
      wrapDiv.hover(
        function(e) { 
          logo_area.fadeIn(100); 
          if (need_log() && imageInfo.imgid) log_image_hover(imageInfo.imgid);
        },	
        function(e) { 
          //alert ('here');
          //$(".adspot_layer_info adspot_info_detail").mouseenter(e);
          logo_area.fadeOut(100); 
        }
      );
    }

    function prepareImg(img, imgArr) {
      img_dom = img[0];
      if (img_dom.complete) { // 如果图片已经存在于浏览器缓存，直接调用回调函数
        imgArr.push(img);
        return;
      }
      img_dom.onload = function () {
        imgArr.push(img);
      }
    }

    function images_ready(imgArr) {
      return $('img').size() == imgArr.length ? true : false;
    }

    function querySpots(imgArr) {
      var length = imgArr.length;
      if (length <= 0) return;

      var imgArrJson = '';
      var imgIndex = 0;
      for (var i in imgArr) {
        var img = imgArr[i];
        var src = img.attr("original_path") ? img.attr("original_path") : getAbsoluteURL(img.attr("src"));
        if (imgArrJson.indexOf(src) >= 0) continue;
        var width = img.width();
        var height = img.height();
        var excluded_thumb = img.attr("excluded_spot");//特定标记用于排除标点
        if (width < 200 || height < 200 || excluded_thumb) continue; //小于一定尺寸的图片不打点

        var strVal = (imgIndex++ > 0) ? "," : "";
        strVal += '{"src":"' + src + '","width":' + width + ',"height":' + height +'}';
        imgArrJson += strVal;
      }

      imgArrJson = "[" + imgArrJson + "]";
      var dataUrl = dataHost + "spot-data.php?wbcode=" + wbCode + "&imgs=" + imgArrJson;

      $.getJSON(dataUrl + "&callback=?", function(tagged_images) {
        for (var i=0; i<length; i++) {
          for (var j=0; j<tagged_images.length; j++) {
            var _src = imgArr[i].attr("original_path") ? imgArr[i].attr("original_path") : getAbsoluteURL(imgArr[i].attr("src"));
            if (tagged_images[j].remote_addr == _src) {
              initImg(imgArr[i], tagged_images[j], i);
            }
          }
        }
        $(".adspot_info_detail").each(function() {
          bindSpotDivEvent($(this)); //绑定锚点信息层上的事件
        });
      });
    }

    var timeoutId = 0;
    var FADE_INTERVAL = 800;

    //查找所有图片(img),过滤不符合尺寸的图片
    (function() {
      var imgArr = new Array(); //存储符合规则的图片img对象。
      var imgIndex = 0;
      var imgArrJson = ""; //把符合规则的图片数据包装成josn数据格式字符串。

      $("img").each(function() {
        prepareImg($(this), imgArr);
      });

      querySpotsFn = setInterval(function() {
        if (images_ready(imgArr)) {
          clearInterval(querySpotsFn);
          querySpots(imgArr);
        }
      }, 100);

    })();
  };

  (function() {

    if (!wbCode || wbCode.length != 10) { return; };
    var cssLink, jqueryScript, clearFn;

    //添加css
    cssLink = document.createElement("link");
    cssLink.rel = "stylesheet";
    cssLink.type = "text/css";
    cssLink.href = resHost + "adspot.css";
    cssLink.media = "all";

    document.documentElement.getElementsByTagName("HEAD")[0].appendChild(cssLink);

    //页面上所有图片加载完毕后再执行
    if (typeof jQuery !== "undefined" && check_jquery_version("1.7.1")) {
      startAdspot(jQuery);
    } else {
      jqueryScript = document.createElement("script");
      jqueryScript.src = "http://ajax.googleapis.com/ajax/libs/jquery/1.7.1/jquery.min.js";
      document.documentElement.getElementsByTagName("HEAD")[0].appendChild(jqueryScript);
      clearFn = setInterval(function() {
        if (typeof jQuery !== "undefined" && check_jquery_version("1.7.1")) {
          clearInterval(clearFn);
          startAdspot(jQuery);
        }
      }, 25);
    }
  })();

})();

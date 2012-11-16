<?php

require_once "simple_html_dom.php";

function parse($url) {
	$url = getAbsoluteURL(trim($url));
	$cssobj = parseLinkAddr($url);
	$obj = call_user_func_array($cssobj['func'], $cssobj['params']);
  if (empty($obj)) { return ''; }
  $obj['css'] = $cssobj['css'];
	//print_r($obj);
	return json_encode($obj);
}

function parse_sinaweibo($url) {
	$html = file_get_html($url);
  if (empty($html)) { return ''; }
	$obj = array();
	try {
		$_thumb = $html->find('img.por', 0);
		if ($_thumb) { 
			$obj['thumb'] = $_thumb->src;
		}
		$_title = $html->find('div.ut', 0);
		if ($_title) {
			$txt = $_title->plaintext;
			$txt = str_replace("\r", "", $txt);
			$pieces = split("\s|&nbsp;|\n", $txt); 
			$obj['title'] = $pieces[0];
			$obj['desc'] = $pieces[4];
		}
		unset($html);
		return $obj;
	} catch (Exception $e) {
		return '';
	}
}

function parse_sinaweibo_ct($url) {
	preg_match('/^(http:\/\/weibo\.cn\/\d+)\/\w+$/', $url, $m);
	$obj = parse_sinaweibo($m[1]);
	$html = file_get_html($url);
  if (empty($html)) { return ''; }
	try {
		$_desc = $html->find('span.ctt', 0);
		if ($_desc) $obj->desc = preg_replace('/^:/', '', $_desc->plaintext);
		unset($html);
		//print_r($obj);
		return $obj;
	} catch (Exception $e) {
		return '';
	}
}

function parse_txweibo($url) {
	$html = file_get_html($url);
  if (empty($html)) { return ''; }
	$obj = array();
	$content = $html->innertext;
	try {
		$_thumb = $html->find('img.img-br', 0);
		if ($_thumb) {
			$obj['thumb'] = preg_replace("/30$/", "100", $_thumb->src);
		}
		if (preg_match('/<img (?:.*?)class="img-br"\/>(.*?)</', $content, $m)) {
			$obj['title'] = preg_replace ("/\(.*\)&nbsp;/", "", $m[1]);
		}
		if (preg_match('/<br\/>简介：(.*?)</', $content, $n)) {
			$obj['desc'] = str_replace ("&#160;", "", $n[1]);
		}
		unset($html);
		unset($content);
		return $obj;
	} catch (Exception $e) {
		return '';
	}
}

function parse_360buy($url) {
	$html = file_get_html($url);
  if (empty($html)) { return ''; }
	$obj = array();
	try {
		foreach ($html->find('script') as $js) {
			$txt = $js->innertext;
			if (strpos($txt, 'jdPshowRecommend')) {
				if (preg_match('/var content = "(.*?)";/', $txt, $m)) {
					if (preg_match('/(\d+\.\d{2})/', $m[1], $n)) {
						$obj['desc'] = $n[1];
					}
				}
				break;
			}
		}
		$img = $html->find('div[id="spec-n1"] img', 0);
		if ($img) {
			$obj['thumb'] = preg_replace('/360buyimg.com\/n\d+\//', '360buyimg.com/n5/', $img->src);
			$obj['title'] = iconv("gbk", "utf-8", $img->alt); //360buy use gbk
		}
		unset($html);
		return $obj;
	} catch (Exception $e) {
		return '';
	}
}

function parse_douban($url, $t) {
	$html = file_get_html($url);
  if (empty($html)) { return ''; }
	$obj = array();
	//echo $html->innertext;
	try {
		$_thumb = $html->find('a.nbg img', 0);
		if ($_thumb) $obj['thumb'] = $_thumb->src;

		$_title = '';
		if ($t == 'book') {
			$_title = $html->find('h1', 0);
			$_tmp = $html->find('div.itm', 0);
			if (preg_match('/作者: (.*?)<br \/>/', $_tmp->innertext, $m)) {
				$obj['desc'] = $m[1]; 
				//$obj['desc'] = str_replace ("&#160;", "", $obj['desc']);
			}
		} elseif ($t == 'music') {
			$_title = $html->find('h1', 0);
			$_tmp = $html->find('div.itm', 0);
			if (preg_match('/表演者: (.*?)<br \/>/', $_tmp->innertext, $m)) {
				$obj['desc'] = $m[1]; 
				//$obj['desc'] = str_replace ("&#160;", "", $obj['desc']);
			}
		} elseif ($t == 'movie') {
			$_title = $html->find('div.movie-item span', 0);
			$_itm = $html->find('div.itm');
			if (count($_itm) == 8) {
				$_desc = $html->find('div.itm', 3);
			} else {
				$_desc = $html->find('div.itm', 2);
			}
			if ($_desc) $obj['desc'] = trim($_desc->plaintext);
		}

		if ($_title) $obj['title'] = trim($_title->plaintext);
		$obj['css'] = 'douban';
		//print_r($obj);
		unset($html);
		return $obj;
	} catch (Exception $e) {
		return '';
	}
}

function parse_taobao($url) {
	$html = file_get_html($url);
  if (empty($html)) { return ''; }
	$obj = array();
	//echo $html->innertext;
	try {
		$_thumb = $html->find('div.detail img', 0);
		if ($_thumb) {
			$_imgsrc = $_thumb->src;
			$obj['thumb'] = preg_replace('/\.jpg_(\w+)\.jpg$/', '.jpg_80x80.jpg', $_thumb->src);	
			$obj['title'] = $_thumb->alt;	
		}

		$_price = $html->find('div.detail', 1);
		if ($_price) {
			$obj['desc'] = $_price->find('p strong', 0)->plaintext;
		}
		unset($html);
		return $obj;
	} catch (Exception $e) {
		return '';
	}
}

function parse_tmall($url) {
	return parse_taobao($url);
}

function parse_dianping($url) {
	$html = file_get_html($url);
  if (empty($html)) { return ''; }
	$obj = array();
	//echo $html->innertext;
	try {
		$_info = $html->find('div.shop_m', 0);
		if ($_info) {
			$obj['title'] = $_info->find('h4', 0)->plaintext;
			$obj['thumb'] = $_info->find('dl.shop img', 0)->src;
			$obj['desc'] = $_info->find('p.pd', 0)->plaintext;
		}
		unset($html);
		return $obj;
	} catch (Exception $e) {
		return '';
	}
}

function parse_youku($url) {
	$html = file_get_html($url);
  if (empty($html)) { return ''; }
	$obj = array();
	try {
		$obj['title'] = preg_replace('/- 优酷视频 - 在线观看/', '', $html->find('head title', 0)->innertext);
		preg_match('/^http:\/\/v\.youku\.com\/v_show\/id_(\w+)/', $url, $m);
		$vid = $m[1];
		$_thumb = $html->find('a[id="s_msn1"]', 0);
		if ($_thumb) {
			if (preg_match('/&screenshot=(.*)$/', $_thumb->href, $m)) {
				$obj['thumb'] = $m[1];
			}
		}
		//$obj['desc'] = '<embed height="356" allowscriptaccess="never" style="visibility: visible; display: block !important; " pluginspage="http://get.adobe.com/cn/flashplayer/" flashvars="playMovie=true&amp;auto=1" width="440" allowfullscreen="true" quality="hight" src="http://player.youku.com/player.php/sid/' . $vid . '/v.swf" type="application/x-shockwave-flash" wmode="transparent"></embed>';
		$obj['desc'] = $html->find('meta[name="description"]', 0)->content;
		//print_r($obj);
		unset($html);
		return $obj;
	} catch (Exception $e) {
		return '';
	}
}

function parse_tudou($url) {
	$html = file_get_html($url);
  if (empty($html)) { return ''; }
	$obj = array();
	try {
		$js = $html->find('body script', 0)->innertext;
		if (preg_match("/pic = '(\S+)'/", $js, $m)) { $obj['thumb'] = $m[1]; }
		if (preg_match('/kw = "(.+?)"/', $js, $m)) { $obj['title'] = $obj['desc'] = iconv("gbk", "utf-8", $m[1]); }
		unset($html);
		return $obj;
	} catch (Exception $e) {
		return '';
	}
}

function parse_tudou_pl($url, $vid) {
	$html = file_get_html($url);
  if (empty($html)) { return ''; }
	$obj = array();
	try {
		$js = $html->find('body script', 0)->innertext;
		if (preg_match('/listData = (\[.+?\]);/', $js, $m)) {
			$plstr = preg_replace("/([{ ,])(\w+)(\s*):/", "\${1}\"\${2}\":", $m[1]);
			$plobjs = json_decode(iconv("gbk", "utf-8", $plstr));
			//print_r($plobjs);
			foreach ($plobjs as $k) {
				if ($k->icode == $vid) {
					$plobj = $k;
					break;
				}
			}
			$obj['title'] = $obj['desc'] = $plobj->kw;
			$obj['thumb'] = $plobj->pic;
		}
		//print_r($obj);
		unset($html);
		return $obj;
	} catch (Exception $e) {
		return '';
	}
}

function parse_normal($url) {
	$html = file_get_html($url);
  if (empty($html)) { return ''; }
	$obj = array();
	try {
		$encoding = 'utf-8';
		$cv = $html->find('meta[http-equiv="Content-Type"]', 0);
		if ($cv) {
			if (strpos($cv->content, 'gb2312') || strpos($cv->content, 'gbk')) {
				$encoding = 'gbk';
			}
		}
		$_title = $html->find('head title', 0);
		if ($_title) {
			$obj['title'] = ($encoding == 'utf-8') ? $_title->innertext: iconv('gbk', 'utf-8', $_title->innertext);
		}
		$_desc = $html->find('meta[name="description"]', 0);
		if ($_desc) {
			$obj['desc'] = ($encoding == 'utf-8') ? $_desc->content: iconv('gbk', 'utf-8', $_desc->content);
		}
		unset($html);
		return $obj;
	} catch (Exception $e) {
		return '';
	}
}

?>

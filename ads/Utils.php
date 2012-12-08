<?php

require_once 'config.php';
function _post($name) {
	return empty ( $_POST [$name] ) ? null : $_POST [$name];
}
function _get($name) {
	return empty ( $_GET [$name] ) ? null : $_GET [$name];
}
function _getDomainByReferrer() {
	if (empty ( $_SERVER ['HTTP_REFERER'] ))
		return "";
	$referer = $_SERVER ['HTTP_REFERER'];
	if (preg_match ( '/^(http:\/\/)?([^(\/|:)]+)/i', $referer, $matches )) {
		return $matches [2];
	}
	return "";
}
function get_main_domain($url) {
	if (preg_match ( '/([\w-]+\.(com|net|org|gov|cc|biz|info|cn|me|cc|la|tv)(\.(cn|hk|tw|jp))*)(\/|:|$)/', $url, $matches )) {
		return $matches [1];
	}
}

// Check whether the sub_domain belongs to (or equal to) main_domain
function belong_to_domain($sub_domain, $main_domain) {
	if ($sub_domain == $main_domain)
		return true;
	$regex = "/\.$main_domain$/";
	return preg_match ( $regex, $sub_domain );
}
function validate_url($url) {
	return preg_match ( '/^(http(s)?:\/\/)?([\w-]+\.)+[\w]+(:\d+)?(.*)$/i', $url );
}
function getAbsoluteURL($url) {
	if (preg_match ( '/^(http(s)?:\/\/)?([\w-]+\.)+[\w]+(:\d+)?(.*)$/i', $url, $m )) {
		return empty ( $m [1] ) ? 'http://' . $url : $url;
	}
	return '';
}
function get_backend_host() {
	return "dst.adspot.cn";
}
function extend_cookie_expiry() {
	if (empty ( $_COOKIE ['u'] ))
		return;
	
	$user_code = $_COOKIE ['u'];
	$domain = get_main_domain ( $_SERVER ["SERVER_NAME"] );
	setcookie ( 'u', $user_code, time () + 3600, '/', $domain );
}

// 根据传入的url，分析对应截的地址(一般是对应手机版)，和对应css类型
function parseLinkAddr($url) {
	$url = trim ( $url );
	$cssobj = array ();
	
	if (preg_match ( '/^http:\/\/(?:e\.)?weibo\.(?:com|cn)\/(?:n\/)?(\w+)/', $url, $m )) {
		$cssobj ['func'] = 'parse_sinaweibo';
		$cssobj ['params'] = array (
				'http://weibo.cn/' . $m [1] 
		);
		$cssobj ['css'] = 'weibo';
	} elseif (preg_match ( '/^http:\/\/weibo\.(?:com|cn)\/(?:n\/)?(\d+)\/(\w+)$/', $url, $m )) {
		$cssobj ['func'] = 'parse_sinaweibo_ct';
		$cssobj ['params'] = array (
				'http://weibo.cn/' . $m [1] . '/' . $m [2] 
		);
		$cssobj ['css'] = 'weibo';
	} elseif (preg_match ( '/^http:\/\/t\.qq\.com\/(\w+)$/', $url, $m )) {
		$cssobj ['func'] = 'parse_txweibo';
		$cssobj ['params'] = array (
				'http://ti.3g.qq.com/g/s?aid=h&hu=' . $m [1] 
		);
		$cssobj ['css'] = 'tweibo';
	} elseif (preg_match ( '/^http:\/\/www\.360buy\.com\/product\/(\d+)\.html$/', $url, $m )) {
		$cssobj ['func'] = 'parse_360buy';
		$cssobj ['params'] = array (
				$url 
		);
		$cssobj ['css'] = 'jingdong';
	} elseif (preg_match ( '/^http:\/\/(?:book|mvd)\.360buy\.com\/(\d+)\.html$/', $url, $m )) {
		$cssobj ['func'] = 'parse_360buy';
		$cssobj ['params'] = array (
				$url 
		);
		$cssobj ['css'] = 'jingdong';
	} elseif (preg_match ( '/^http:\/\/(book|music|movie)\.douban\.com\/subject\/(\d+)\/$/', $url, $m )) {
		$cssobj ['func'] = 'parse_douban';
		$cssobj ['params'] = array (
				'http://m.douban.com/' . $m [1] . '/subject/' . $m [2] . '/',
				$m [1] 
		);
		$cssobj ['css'] = 'douban';
	} elseif (preg_match ( '/^http:\/\/item\.taobao\.com\/item\.htm\?(.*)$/', $url, $m )) {
		if (preg_match ( '/(?:^|&)id=(\d+)/', $m [1], $n )) {
			$cssobj ['func'] = 'parse_taobao';
			$cssobj ['params'] = array (
					'http://a.m.taobao.com/i' . $n [1] . '.htm' 
			);
			$cssobj ['css'] = 'taobao';
		}
	} elseif (preg_match ( '/^http:\/\/detail\.tmall\.com\/venus\/spu_detail\.htm\?(.*)$/', $url, $m )) {
		if (preg_match ( '/(?:^|&)mallstItemId=(\d+)/', $m [1], $n )) {
			$cssobj ['func'] = 'parse_tmall';
			$cssobj ['params'] = array (
					'http://a.m.tmall.com/i' . $n [1] . '.htm' 
			);
			$cssobj ['css'] = 'tmall';
		}
	} elseif (preg_match ( '/^http:\/\/detail\.tmall\.com\/item\.htm\?id=(\d+)/', $url, $m )) {
		$cssobj ['func'] = 'parse_tmall';
		$cssobj ['params'] = array (
				'http://a.m.tmall.com/i' . $m [1] . '.htm' 
		);
		$cssobj ['css'] = 'tmall';
	} elseif (preg_match ( '/^http:\/\/www\.dianping\.com\/shop\/(\d+)/', $url, $m )) {
		$cssobj ['func'] = 'parse_dianping';
		$cssobj ['params'] = array (
				'http://m.dianping.com/shop.aspx?pid=' . $m [1] 
		);
		$cssobj ['css'] = 'dianping';
	} elseif (preg_match ( '/^http:\/\/v\.youku\.com\/v_show\/id_(\w+)/', $url, $m )) {
		$cssobj ['func'] = 'parse_youku';
		$cssobj ['params'] = array (
				$url 
		);
		$cssobj ['css'] = 'video';
		$cssobj ['player'] = 'youku'; // Only for video type
		$cssobj ['vid'] = $m [1]; // Only for video type
	} elseif (preg_match ( '/^http:\/\/www\.tudou\.com\/programs\/view\/([\w-]+)/', $url, $m )) {
		$cssobj ['func'] = 'parse_tudou';
		$cssobj ['params'] = array (
				$url 
		);
		$cssobj ['css'] = 'video';
		$cssobj ['player'] = 'tudou';
		$cssobj ['vid'] = $m [1];
	} elseif (preg_match ( '/^http:\/\/www\.tudou\.com\/listplay\/([\w-]+)\/([\w-]+)\.html/', $url, $m )) {
		$cssobj ['func'] = 'parse_tudou_pl';
		$cssobj ['params'] = array (
				$url,
				$m [2] 
		);
		$cssobj ['css'] = 'video';
		$cssobj ['player'] = 'tudou';
		$cssobj ['vid'] = $m [2];
	} else {
		$cssobj ['func'] = 'parse_normal';
		$cssobj ['params'] = array (
				$url 
		);
		$cssobj ['css'] = '';
	}
	
	return $cssobj;
}
function get_thumbnail_dir() {
	if (empty ( $_SERVER ['DOCUMENT_ROOT'] )) {
		return __DIR__ . '/../static/tagged_images/thumbnail/';
	}
	return $_SERVER ['DOCUMENT_ROOT'] . '/static/tagged_images/thumbnail/';
}
function create_thumbnail_60($imgurl, $imgid) {
	$dest = get_thumbnail_dir () . $imgid . '_60.jpg';
	create_thumbnail ( $imgurl, $dest, 60, 60, true );
}
function create_thumbnail_200($imgurl, $imgid) {
	$dest = get_thumbnail_dir () . $imgid . '_200.jpg';
	create_thumbnail ( $imgurl, $dest, 200, 0, false );
}
function create_thumbnail_600($imgurl, $imgid) {
	$dest = get_thumbnail_dir () . $imgid . '_600.jpg';
	create_thumbnail ( $imgurl, $dest, 600, 0, false );
}
function create_thumbnail($imgurl, $dest, $width, $height, $crop = false) {
	if (empty ( $imgurl ) || empty ( $dest ))
		return;
	$im = new Imagick ();
	$im->readImage ( $imgurl );
	if ($crop) {
		$im->cropThumbnailImage ( $width, $height );
	} else {
		$im->thumbnailImage ( $width, 0 );
	}
	$im->writeImage ( $dest );
	$im->destroy ();
}

?>

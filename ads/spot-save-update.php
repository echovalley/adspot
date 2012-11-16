<?php 
header('Content-type: application/json');

require_once 'config.php';
require_once 'Utils.php';
require_once 'dal/WebsiteDal.php';
require_once 'dal/TaggedImageDal.php';
require_once 'dal/SpotDal.php';

$logger = Logger::getLogger("file");

$wbcode = _get("wbcode");	//网站编号
$type   = _get("type");	//类型
$link_addr   = _get("link_addr");	//
$link_thumb   = _get("link_thumb");	//
$link_desc   = _get("link_desc");	//
$link_title   = _get("link_title");	//
$link_css = _get("link_css");
$left = _get("left");
$top  = _get("top");
$sid = _get('id'); //spot id
$pid = _get("pid"); //商品id
$search_tag = _get("search_tag");
$imgSrc = _get("imgSrc");
$imgWidth = _get("imgWidth");
$imgHeight = _get("imgHeight");
$imgTitle = _get("imgTitle");


if (empty($wbcode) || empty($type)) {
	exit;
}
if (empty($sid) && (empty($left) || empty($top) || empty($imgWidth) || empty($imgHeight))) {
  exit;
}

$x_offset_ratio = round($left/$imgWidth, 4);
$y_offset_ratio = round($top/$imgHeight, 4);

$con = mysql_connect($mysql_host, $mysql_user, $mysql_pwd);
mysql_select_db($mysql_adspot_db, $con);

$websiteDal = new WebsiteDal($con);
$imageDal = new TaggedImageDal($con);
$spotDal  = new SpotDal($con);

$website = $websiteDal->getWebsite($wbcode);

if (!$websiteDal->verify_host_url($website['url'])) { exit; }
if (!$websiteDal->verify_host_user()) { exit; }


$taggedImage = $imageDal->getImage($imgSrc, $website['wid']);
if (empty($taggedImage)) {
	$taggedImage =  array();
	$taggedImage['wid'] = $website['wid'];
	$taggedImage['remote_addr'] = $imgSrc;
	$taggedImage['width']    = $imgWidth;
	$taggedImage['height']   = $imgHeight;
	$taggedImage['title']    = $imgTitle;
  $taggedImage['locate_url'] = $_SERVER['HTTP_REFERER'];
	$imageDal->saveImage(&$taggedImage);

  create_thumbnail_60($imgSrc, $taggedImage['imgid']);
  create_thumbnail_200($imgSrc, $taggedImage['imgid']);
  create_thumbnail_600($imgSrc, $taggedImage['imgid']);
}

if (empty($taggedImage['imgid'])) {
	return;	
}

$spot = array();
$spot['id'] = $sid;
$spot['x_offset_ratio'] = $x_offset_ratio;
$spot['y_offset_ratio'] = $y_offset_ratio;
$spot['type'] = $type;
$spot['link_addr'] = $link_addr;
$spot['link_desc'] = $link_desc;
$spot['link_thumb'] = $link_thumb;
$spot['link_title'] = $link_title;
$spot['link_css'] = $link_css;
#$spot['marginy'] = $top;
#$spot['marginx'] = $left;
$spot['pid'] = $pid;
$spot['search_tag'] = $search_tag;
$spot['imgid'] = $taggedImage['imgid'];

if (is_numeric($sid)) {
	$tspot = $spotDal->getSpot($sid);
}

//validate if the url user updated can match the original css
$cssobj = parseLinkAddr($spot['link_addr']);
$spot['link_css'] = $cssobj['css'];
#print_r($spot);
if (empty($tspot)) {
	$spotDal->save(&$spot);
} else {
  if ($tspot['imgid'] == $taggedImage['imgid']) {
    $spotDal->update(&$spot);
  }
}

if ($spot['type'] == SpotDal::SPOT_TYPE_PRODUCT) {
	$spot = $spotDal->getProductSpot($spot['id']);
} else {
	$spot = $spotDal->getSpot($spot['id']);
}

$spot['first'] = empty($tspot) ? 1 : 0;

//Only for video link. Return player and video ID for JS to invoke
if (!empty($spot['link_css']) && $spot['link_css'] == 'video') {
	$spot['player'] = $cssobj['player'];
	$spot['vid'] = $cssobj['vid'];
}

extend_cookie_expiry();//extend the user code cookie for a more hour
echo _get('callback') . '(' . json_encode($spot) . ')';

mysql_close($con);

?>

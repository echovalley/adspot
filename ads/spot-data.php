<?php 

header('Content-type: application/json');

require_once 'config.php';
require_once 'Utils.php';
require_once 'dal/SpotDal.php';
require_once 'dal/WebsiteDal.php';
require_once 'dal/TaggedImageDal.php';

$logger = Logger::getLogger("file");

$wbcode = _get("wbcode");	//网站编号
$imgs   = _get("imgs");	//符合规则的网站图片

if(empty($wbcode) || empty($imgs)){
	echo "{}";
	exit;
}
#$logger->info($wbcode);
#$logger->info($imgs);

$con = mysql_connect($mysql_host, $mysql_user, $mysql_pwd);
mysql_select_db($mysql_adspot_db, $con);

$websiteDal = new WebsiteDal($con);
$taggedImageDal = new TaggedImageDal($con);
$spotDal = new SpotDal($con);

$wid = $websiteDal->getWebsiteId($wbcode);
if(empty($wid)){
	echo "{}";
	exit;
}
$modify = ($websiteDal->verify_host_user()) ? 1 : 0; 

$images = array();
$imgArr = json_decode($imgs);
foreach ($imgArr as $i => $imgSrc) {
  $image = $taggedImageDal->getImage($imgSrc->src, $wid);
  $spots = $spotDal->getSpotsByImg($image['imgid']);
  $images[$i] = array('imgid' => $image['imgid'], 'remote_addr' => $imgSrc->src, 'spots' => $spots, 'modify' => $modify);
}
#print_r($images);
echo _get('callback') . '(' . json_encode($images) . ')';

mysql_close($con);

?>

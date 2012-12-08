<?php 

header('Content-type: application/json; charset=utf-8');

require_once 'config.php';
require_once 'Utils.php';
require_once 'dal/ProductDal.php';
//sleep(3);
$tags = rawurldecode(_get("tags"));
$last = _get("last") ? _get("last") : 0;

if (empty($tags)) {
	echo "{}";
	exit;
}
$logger->debug($tags);

$con = mysql_connect($mysql_host, $mysql_user, $mysql_pwd);
mysql_select_db($mysql_adspot_db, $con);

$pdctDal = new ProductDal($con);

$pdctids = $pdctDal->findProductsByTags($tags, $last);

#print_r($pdctids); 
$pdcts = array();
foreach ($pdctids as $pid) {
	$pdcts[] = $pdctDal->getProduct($pid);
}
#print_r(json_encode($pdcts));
echo _get('callback') . '(' . json_encode($pdcts) . ')';

mysql_close($con);

?>

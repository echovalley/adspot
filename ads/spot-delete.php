<?php 

header('Content-type: application/json; charset=utf-8');

require_once 'config.php';
require_once 'Utils.php';
require_once 'dal/SpotDal.php';
require_once 'dal/WebsiteDal.php';

$logger = Logger::getLogger("file");

$spotid = _get("id");	//spot ID

if(empty($spotid)){ exit; }
#$logger->info($spotid);

$con = mysql_connect($mysql_host, $mysql_user, $mysql_pwd);
mysql_select_db($mysql_adspot_db, $con);

$spotDal = new SpotDal($con);
$websiteDal = new WebsiteDal($con);

if (!$websiteDal->verify_host_user()) { exit; }
if (!$spotDal->verify_spot_host($spotid)) { exit; }

extend_cookie_expiry();//extend the user code cookie for a more hour

if ($spotDal->delete($spotid)) {
	echo _get('callback') . '(' . $spotid. ')';
} else {
	echo _get('callback') . '(-1)';
}

mysql_close($con);

?>

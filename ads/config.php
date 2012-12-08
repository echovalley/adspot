<?php 

require_once "log4php/Logger.php";

Logger::configure('log4php.xml');
$logger = Logger::getLogger("file");

$mysql_host = "localhost";
$mysql_user = "root";
$mysql_pwd  = "123456";
#$mysql_adspot_db = "adspot";
$mysql_adspot_db = "dstadmin_development";

?>

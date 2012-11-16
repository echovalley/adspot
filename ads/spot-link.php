<?php 

header('Content-type: application/json');

require_once 'config.php';
require_once 'Utils.php';
require_once 'sns.php';

$url = rawurldecode(_get('u'));

//echo _get('callback') . '({})';
//return;
if (empty($url)) {
	echo '{}';
	exit;
}
//sleep(5);
$logger->debug($url);

echo _get('callback') . '(' . parse($url) . ')';

?>

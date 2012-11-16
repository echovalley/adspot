<?php

require_once 'Utils.php';
#$logger = Logger::getLogger("file");

$type = _get("t");
#$image_id = _get("imgid");
#$spot_id = _get("sid");
#$product_id = _get("pid");

if (empty($type)) exit;

if ($type == "sc") {
  $desc = rawurldecode(getAbsoluteURL(_get("dest")));
  header("location: " . $desc);
} else {
  header("Content-type: image/png");
  $imagename = dirname(dirname(__FILE__)) . "/static/res/pixel.png";
  imagejpeg(imagecreatefrompng($imagename));
}

?>

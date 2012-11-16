<?php

require_once "simple_html_dom.php";
require_once 'dal/TaggedImageDal.php';
require_once 'config.php';
require_once 'Utils.php';

//header('Content-type: application/json');

$url = rawurldecode(_get('u'));

if (empty($url)) {
  $url = 'http://huaban.com/popular/?limit=100';
}
//sleep(5);
//$logger->debug($url);

$pins = get_pins($url);

#$test_pin_url = 'http://huaban.com/pins/28410993/';


$con = mysql_connect($mysql_host, $mysql_user, $mysql_pwd);
mysql_select_db($mysql_adspot_db, $con);
$imageDal = new TaggedImageDal($con);

foreach ($pins as $p) {
  $url = 'http://huaban.com/pins/' . $p;
  parse_image($url, $imageDal);
}

mysql_close($con);


function get_pins($url) {
  $url = trim($url);
  $html = file_get_html($url);
  $pins = array();
  try {
    foreach ($html->find('script') as $js) {
      $txt = $js->innertext;
      if (preg_match('/app\.page\["pins"\] = (\[(.*?)\]);/', $txt, $m)) {
        $script_content = $m[1];
        if (preg_match_all('/{"pin_id":(\d+)/', $script_content, $n)) {
          foreach ($n[1] as $pin) {
            array_push($pins, $pin);
          }
        }
      }
    }
    unset($html);
    return $pins;
  } catch (Exception $e) {
    return '';
  }
}

function parse_image($url, $dal) {
	$html = file_get_html($url);
	//echo $html->innertext;
	try {
    foreach ($html->find('script') as $js) {
      $txt = $js->innertext;
      if (preg_match('/app\["page"\] = ({.*?});/', $txt, $m)) {
        $obj = json_decode($m[1], true);
        #print_r($obj);
        $img_key = $obj['pin']['file']['key'];
        $img_width = $obj['pin']['file']['width'];
        $img_height = $obj['pin']['file']['height'];
        $img_alt = $obj['pin']['raw_text'];

        $taggedImage = array();
        $taggedImage['wid'] = 1;
        $taggedImage['remote_addr'] = 'http://img.hb.aicdn.com/' . $img_key;
        $taggedImage['width']    = $img_width;
        $taggedImage['height']   = $img_height;
        $taggedImage['title']    = $img_alt;
        $taggedImage['locate_url'] = $url;
        $dal->saveImage(&$taggedImage);
        create_thumbnail_60($taggedImage['remote_addr'], $taggedImage['imgid']);
        create_thumbnail_200($taggedImage['remote_addr'], $taggedImage['imgid']);
      }
    }
    unset($html);
  } catch (Exception $e) {
    return '';
  }
}


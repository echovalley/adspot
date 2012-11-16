<?php 
require_once 'DBModel.php';

class ProductDal extends DBModel {
	
	function getProduct($pid) {
		$sql = "select p.id as pid,pcode,pname,brand,pdct_price,pricing,unit_price,upper_limit,pdct_thumb,click_target,p.updated_at,p.created_at,a.name as aname from products p inner join advertisers a on p.advertiser_id=a.id where p.id=" . $this->safeStr($pid);
		$this->logger->debug($sql);
		$rs = mysql_query($sql, $this->conn);
		$row = mysql_fetch_assoc($rs);
		
    if (substr($row['pdct_thumb'], 0, 7) != 'http://') {
      $row['pdct_thumb'] = 'http://' . $_SERVER["SERVER_NAME"] . '/static' . $row['pdct_thumb'];
    }
    return $row;
  }

  function findProductsByTags($tags, $last) {
    $tagstr = implode("','", explode(" ", $tags));
    $sql = "select pt.product_id,count(distinct t.id) as matchs from tags t inner join products_tags pt on t.id=pt.tag_id where t.tname in ('" . $tagstr . "') group by pt.product_id order by matchs desc limit " . $last. ",5"; 
    $this->logger->debug($sql);

    $rs = mysql_query($sql, $this->conn);

    $pdctArr= array();
    $i = 0;
    while ($row = mysql_fetch_assoc($rs)) {
      $pdctArr[$i++] = $row["product_id"];
    }
    return $pdctArr;
  }
}

?>

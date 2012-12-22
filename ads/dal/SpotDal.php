<?php 
require_once 'DBModel.php';
require_once 'Utils.php';
require_once 'config.php';

class SpotDal extends DBModel {

  const SPOT_TYPE_SPACE = 0;
  const SPOT_TYPE_PRODUCT = 1;
  const SPOT_TYPE_LINK = 2;

	function getSpotsByImg($imgid) {
		$first = true;
		
    $sql = "select s.id,s.spot_type as 'type',s.tagged_image_id as imgid,s.link_addr,s.link_title,s.link_desc,s.link_thumb,s.link_css,s.link_extra,s.search_tag,s.x_offset_ratio,s.y_offset_ratio,
      p.id as pid,p.pcode,p.pname,p.brand,p.pdct_price,p.pdct_thumb,p.click_target,p.delivery_type,p.delivery_rule,p.status as pstatus,
      a.name as aname,a.homepage,a.open
      from spots s left join products p on p.id=s.product_id left join advertisers a on p.advertiser_id=a.id where s.tagged_image_id="
      . $this->safeStr($imgid);
    $this->logger->debug($sql);
		$result = mysql_query($sql, $this->conn);
		
		$spots = array();
		
		while (($row = mysql_fetch_assoc($result)) != false) {
			if ($row['type'] == SpotDal::SPOT_TYPE_PRODUCT && $row['open'] != 1) {
				$row['aname'] = '';
				$row['homepage'] = '';
			}
			if ($row['link_css'] == 'video') {
				$cssobj = parseLinkAddr($row['link_addr']);
				$row['player'] = $cssobj['player'];
				$row['vid'] = $cssobj['vid'];
			} elseif ($row['link_css'] == 'soundcloud') {
				$row['player'] = 'soundcloud';
				$row['vid'] = $row['link_extra'];
      }
      $row['pdct_thumb'] = $this->get_pdct_thumb_path($row['pdct_thumb']);
			$spots[] = $row;
		}
		mysql_free_result($result);	
		return $spots;
	}

	function getSpotsByImgs($imgArr) {
		$first = true;
		$imgAddrs = "";
		foreach ($imgArr as $key => $img) {
			if ($first) {
			  $first = false;
				$imgAddrs = $this->safeStr($img->src);
			} else {
				if (!empty($img->src)) {
				  $imgAddrs = $imgAddrs . "," . $this->safeStr($img->src);
        }
			}
		}
		
    $sql = "select s.id,s.spot_type as 'type',s.tagged_image_id as imgid,s.link_addr,s.link_title,s.link_desc,s.link_thumb,s.link_css,s.search_tag,s.x_offset_ratio,s.y_offset_ratio,
      p.id as pid,p.pcode,p.pname,p.brand,p.pdct_price,p.pdct_thumb,p.click_target,p.delivery_type,p.delivery_rule,p.status as pstatus,
      a.name as aname,a.homepage,a.open,t.remote_addr
      from spots s inner join tagged_images t on t.id = s.tagged_image_id 
      left join products p on p.id=s.product_id left join advertisers a on p.advertiser_id=a.id where t.remote_addr in (" . $imgAddrs .")";
    $this->logger->debug($sql);
		$result = mysql_query($sql, $this->conn);
		
		$imgArrTmp = array();
		
		while (($row = mysql_fetch_assoc($result)) != false) {
			if ($row['type'] == SpotDal::SPOT_TYPE_PRODUCT && $row['open'] != 1) {
				$row['aname'] = '';
				$row['homepage'] = '';
			}
			if ($row['link_css'] == 'video') {
				$cssobj = parseLinkAddr($row['link_addr']);
				$row['player'] = $cssobj['player'];
				$row['vid'] = $cssobj['vid'];
			} elseif ($row['link_css'] == 'soundcloud') {
				$row['player'] = 'soundcloud';
				$row['vid'] = $row['link_extra'];
			}
      $row['pdct_thumb'] = $this->get_pdct_thumb_path($row['pdct_thumb']);

			$imgArrTmp[] = $row;
		}
		mysql_free_result($result);	
		return $imgArrTmp;
	}
	
	function getProductSpot($sid) {
    $sql = "select s.id,s.spot_type as 'type',s.tagged_image_id as imgid,s.x_offset_ratio,s.y_offset_ratio,s.link_addr,s.link_title,s.link_desc,s.link_thumb,s.link_css,s.link_extra,s.search_tag,
      p.id as pid,p.pcode,p.pname,p.brand,p.pdct_price,p.pdct_thumb,p.click_target,p.delivery_type,p.delivery_rule,p.status as pstatus,a.name as aname,a.homepage,a.open 
      from spots s inner join products p on p.id=s.product_id inner join advertisers a on p.advertiser_id=a.id where s.id=" . $sid;
		$this->logger->debug($sql);
		
		$result = mysql_query($sql, $this->conn);
		
    $row = mysql_fetch_assoc($result);
    $row['pdct_thumb'] = $this->get_pdct_thumb_path($row['pdct_thumb']);
    mysql_free_result($result);	
    return $row;
  }

  function getSpot($sid) {
    $sql = "select * from spots where id = " . $this->safeStr($sid);
    $rs = mysql_query($sql, $this->conn);
    $row = mysql_fetch_array($rs);

    $spot = array();
    if ($row) {
      $spot["id"] = $row["id"];
      $spot["type"] = $row["spot_type"];
      $spot["imgid"] = $row["tagged_image_id"];
      $spot["x_offset_ratio"] = $row["x_offset_ratio"];
      $spot["y_offset_ratio"] = $row["y_offset_ratio"];
      $spot["link_addr"] = $row["link_addr"];
      $spot["link_title"] = $row["link_title"];
      $spot["link_desc"] = $row["link_desc"];
      $spot["link_thumb"] = $row["link_thumb"];
      $spot["link_css"] = $row["link_css"];
      $spot["link_extra"] = $row["link_extra"];
      $spot["pid"] = $row["product_id"];
      $spot["crt_time"] = $row["created_at"];
      $spot["update_time"] = $row["updated_at"];
    }
    return $spot;
  }

  function save(&$spot) {
    $sql = "insert into spots(spot_type,tagged_image_id,x_offset_ratio,y_offset_ratio,link_addr,link_title,link_desc,link_thumb,link_css,link_extra,product_id,search_tag,created_at,updated_at)" 
      . " values (". $this->safeStr($spot['type']) . "," . $this->safeStr($spot['imgid']) . "," . $this->safeStr($spot['x_offset_ratio']) . "," . $this->safeStr($spot['y_offset_ratio']) . "," . $this->safeStr($spot['link_addr'])
      . ",". $this->safeStr($spot['link_title']) . "," . $this->safeStr($spot['link_desc']) . ",". $this->safeStr($spot['link_thumb'])
      . "," . $this->safeStr($spot['link_css']) . "," . $this->safeStr($spot['link_extra']) . "," . $this->safeStr($spot['pid']) . "," . $this->safeStr($spot['search_tag']) . ",now(),now())";
    $this->logger->debug($sql);

    if (mysql_query($sql, $this->conn) > 0) {
      $spot['id'] = mysql_insert_id($this->conn);
    }
  }

  function update(&$spot) {
    if (empty($spot['id'])) return;

    $fields = array('spot_type=' . $this->safeStr($spot['type']));
    array_push($fields, 'link_desc=' . $this->safeStr($spot['link_desc']));
    array_push($fields, 'link_thumb=' . $this->safeStr($spot['link_thumb']));
    array_push($fields, 'link_addr=' . $this->safeStr($spot['link_addr']));
    array_push($fields, 'link_css=' . $this->safeStr($spot['link_css']));
    array_push($fields, 'link_title=' . $this->safeStr($spot['link_title']));
    array_push($fields, 'link_extra=' . $this->safeStr($spot['link_extra']));
    array_push($fields, 'product_id=' . $this->safeStr($spot['pid']));
    array_push($fields, 'search_tag=' . $this->safeStr($spot['search_tag']));
    array_push($fields, 'updated_at=now()');

    $sql = "update spots set " . implode($fields, ',') . " where id=" . $spot['id'];
    $this->logger->debug($sql);
    mysql_query($sql, $this->conn);
  }

  function delete($sid) {
    #$logger = Logger::getLogger("file");
    $sql = 'delete from spots where id=' . $this->safeStr($sid);
    $this->logger->debug($sql);
    return mysql_query($sql, $this->conn);
  }

  //Check whether user can manage(insert/update/delete) spots under his own websites. User code comes by cookie, website cames from referrer
	function verify_spot_host($spot_id) {
    $host = _getDomainByReferrer();
    if (empty($spot_id) || empty($host)) return false;

    if ($host == get_backend_host()) return true;

    $token = false;
    $sql = 'select url from spots s inner join tagged_images t on s.tagged_image_id=t.id inner join websites w on w.id=t.website_id where w.status=1 and s.id=' . $this->safeStr($spot_id);
    $rs = mysql_query($sql, $this->conn);
    while (($row = mysql_fetch_array($rs)) != false) {
      if (belong_to_domain($host, $row['url'])) {
        $token = true;
        break;
      }
    }
		mysql_free_result($rs);	
    return $token;
  }
  
  function get_pdct_thumb_path($field) {
    if ($field && substr($field, 0, 7) != 'http://') {
      return 'http://' . $_SERVER["SERVER_NAME"] . '/static' . $field;
    }
    return $field;
  }

}

?>

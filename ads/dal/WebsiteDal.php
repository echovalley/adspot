<?php 
require_once 'DBModel.php';
require_once 'Utils.php';

class WebsiteDal extends DBModel {

  function getWebsite($wcode) {
    $sql = "select * from websites where wcode = " . $this->safeStr($wcode);
    $rs = mysql_query($sql, $this->conn);
    $row = mysql_fetch_array($rs);
    $website = null;
    if ($row) {
      $website = array();
      $website["wid"] = $row["id"];
      $website["wcode"] = $row["wcode"];
      $website["wname"] = $row["wname"];
      $website["url"] = $row["url"];
      $website["pv"] = $row["pv"];
      $website["wcid"] = $row["website_category_id"];
      $website["crt_time"] = $row["created_at"];
      $website["status"] = $row["status"];
    } 
    return $website;			
  }

  function getWebsiteId($wcode) {
    $sql = "select id from websites where wcode = " . $this->safeStr($wcode);
    $this->logger->debug($sql);
    $rs = mysql_query($sql, $this->conn);
    $row = mysql_fetch_array($rs);
    if ($row) {
      return $row['id'];
    } 
    return null;	
  }

  function getWebsiteUrl($wcode) {
    $sql = "select url from websites where wcode = " . $this->safeStr($wcode);
    $rs = mysql_query($sql, $this->conn);
    $row = mysql_fetch_array($rs);
    if ($row) {
      return $row["url"];
    }
    return null;			
  }

  //Compare the wcode from parameters with http referrer
  function verify_host_wcode($wcode) {
    $url = $this->getWebsiteUrl($wcode);
    $host = _getDomainByReferrer();
    return belong_to_domain($host, $url) || $host == get_backend_host();
  }

  function verify_host_url($url) {
    $host = _getDomainByReferrer();
    return belong_to_domain($host, $url) || $host == get_backend_host();
  }

  function verify_host_user() {
    if (empty($_COOKIE['u'])) return false;
    $user_code = $_COOKIE['u'];
    $host = _getDomainByReferrer();
    if (empty($host)) return false;

    if ($host == get_backend_host()) return true;

    $token = false;
    $sql = 'select w.url from users u inner join websites_users wu on u.id=wu.user_id inner join websites w on wu.website_id=w.id where w.status=1 and u.user_code=' . $this->safeStr($user_code);
    $this->logger->debug($sql);
    $rs = mysql_query($sql, $this->conn);
    while ($row = mysql_fetch_array($rs)) {
      if (belong_to_domain($host, $row['url'])) {
        $token = true;
        break;
      }
    }
		mysql_free_result($rs);	
    return $token;
  }
}
?>

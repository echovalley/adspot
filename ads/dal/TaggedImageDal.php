<?php 
require_once 'DBModel.php';	

class TaggedImageDal extends DBModel {
	
	/**
	 * @param  $remoteAddr 图片地址
	 * @param  $wid website id
	 */
	function getImage($remoteAddr, $wid) {
		$sql = "select id as imgid,website_id as wid,remote_addr,width,height,title,thumb,locate_url from tagged_images where website_id=" . $wid . " and remote_addr=" . $this->safeStr($remoteAddr);
    $this->logger->debug($sql);
		$rs = mysql_query($sql, $this->conn);
		return mysql_fetch_assoc($rs);
	}

	/**
	 * 保存
	 * @param unknown_type $img
	 */
	function saveImage(&$img) {
		if (empty($img["title"])) {
			$pieces = explode("/", $img["remote_addr"]);
			$img["title"] = end($pieces);
		}
		$sql = "insert into tagged_images(website_id,remote_addr,width,height,title,created_at,updated_at,locate_url) "
		."values (" . $this->safeStr($img['wid']) . "," . $this->safeStr($img["remote_addr"]) . ", " . $this->safeStr($img["width"]) . "," . $this->safeStr($img["height"]) . "," . $this->safeStr($img["title"]) . ",now(),now()," . $this->safeStr($img["locate_url"]) . ")";
    #$this->logger->debug($sql);
		$count = mysql_query($sql, $this->conn);
		
		if ($count > 0) {
			$img['imgid'] = mysql_insert_id($this->conn);
		}
	}
}

?>

<?php
/// Copyright (c) 2004-2008, Needlworks / Tatter Network Foundation
/// All rights reserved. Licensed under the GPL.
/// See the GNU General Public License for more details. (/doc/LICENSE, /doc/COPYRIGHT)
if (isset($_POST['page']))
	$_GET['page'] = $_POST['page'];
if (!empty($_POST['mode']) && $_POST['mode'] == 'fb') {
	$IV = array(
		'GET' => array(
			'page' => array('int', 1, 'default' => 1)
		),
		'POST' => array(
			'mode' => array(array('fb')),
			'partial' => array('bool','default' => false),
			's_home_title' => array('string', 'default'=>''),
			's_name' => array('string' , 'default'=>''),
			's_no' => array('int'),
			'url' => array('string', 'default'=>''),
			's_url' => array('string', 'default'=>''),
			's_post_title' => array('string', 'default'=>''),
			'r1_no' => array('int'),
			'r1_name' => array('string', 'default'=>''),
			'r1_rno' => array('int'),
			'r1_homepage' => array('string', 'default'=>''),
			'r1_regdate' => array('timestamp'),
			'r1_body' => array('string'),
			'r1_url' => array('string', 'default'=>''),
			'r2_no' => array('int'),
			'r2_name' => array('string', 'default'=>''),
			'r2_rno' => array('int'),
			'r2_homepage' => array('string', 'default'=>''),
			'r2_regdate' => array('timestamp'),
			'r2_body' => array('string'),
			'r2_url' => array('string', 'default'=>'')
		)
	);
} else {
	$IV = array(
		'GET' => array(
			'page' => array('int', 1, 'default' => 1)
		)
	);
}

require ROOT . '/lib/includeForBlog.php';
if (false) {
	fetchConfigVal();
}

publishEntries();

if (!empty($_POST['mode']) && $_POST['mode'] == 'fb') { // Treat comment notifier.
	$result = receiveNotifiedComment($_POST);
	if ($result > 0)
		echo '<?xml version="1.0" encoding="utf-8"?><response><error>1</error><message>error('.$result.')</message></response>';
	else
		echo '<?xml version="1.0" encoding="utf-8"?><response><error>0</error></response>';
} else {
	notifyComment();
}


fireEvent('OBStart');

if(empty($suri['id'])) {  // Without id.
	$skin = new Skin($skinSetting['skin']);
	if(empty($suri['value']) && $suri["directive"] == "/" && count($coverpageMappings) > 0 && getBlogSetting("coverpageInitView") && isset($skin->cover)) {
		require ROOT . '/lib/piece/blog/begin.php';
		$automaticLink = "<link rel=\"stylesheet\" href=\"{$defaultURL}/style/system.css\" type=\"text/css\" media=\"screen\" />\n";
		dress('SKIN_head_end', $automaticLink."[##_SKIN_head_end_##]", $view);
		dress('article_rep', '', $view);
		dress('paging', '', $view);
		require ROOT . '/lib/piece/blog/cover.php';
	} else {
		list($entries, $paging) = getEntriesWithPaging($blogid, $suri['page'], $blog['entriesOnPage']);
		require ROOT . '/lib/piece/blog/begin.php';
		$automaticLink = "<link rel=\"stylesheet\" href=\"{$defaultURL}/style/system.css\" type=\"text/css\" media=\"screen\" />\n";
		dress('SKIN_head_end', $automaticLink."[##_SKIN_head_end_##]", $view);
		require ROOT . '/lib/piece/blog/entries.php';
	}
	
	require ROOT . '/lib/piece/blog/end.php';
} else {  // With id.
	list($entries, $paging) = getEntryWithPaging($blogid, $suri['id']);
	if (isset($_POST['partial'])) { // Partial output.
		header('Content-Type: text/plain; charset=utf-8');
		$skin = new Skin($skinSetting['skin']);
		$view = '[##_article_rep_##]';
		require ROOT . '/lib/piece/blog/entries.php';
		$view = removeAllTags($view);
		if ($view != '[##_article_rep_##]')
			print $view;
	} else {
		require ROOT . '/lib/piece/blog/begin.php';
		$automaticLink = "<link rel=\"stylesheet\" href=\"{$defaultURL}/style/system.css\" type=\"text/css\" media=\"screen\" />\n";
		dress('SKIN_head_end', $automaticLink."[##_SKIN_head_end_##]", $view);
		if (empty($entries)) {
			header('HTTP/1.1 404 Not Found');
			if (empty($skin->pageError)) { 
				dress('article_rep', '<div class="TCwarning">' . _text('존재하지 않는 페이지입니다.') . '</div>', $view);
			} else{
				dress('article_rep', NULL, $view); 
				dress('page_error', $skin->pageError, $view);
			}
			unset($paging);
		} else {
			require ROOT . '/lib/piece/blog/entries.php';
		}
		require ROOT . '/lib/piece/blog/end.php';
	}
}
fireEvent('OBEnd');
?>

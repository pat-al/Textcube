<?php
define('ROOT', '../..');
require ROOT . '/lib/include.php';
if (false) {
	fetchConfigVal();
}
if (strlen($suri['value'])) {
	$tag = getTagId($owner, $suri['value']);
	$listWithPaging = getEntryListWithPagingByTag($owner, $tag, $suri['page'], $blog['entriesOnList']);
	$list = array('title' => $suri['value'], 'items' => $listWithPaging[0], 'count' => $listWithPaging[1]['total']);
	list($entries, $paging) = getEntriesWithPagingByTag($owner, $tag, $suri['page'], $blog['entriesOnList']);
	require ROOT . '/lib/piece/blog/begin.php';
	require ROOT . '/lib/piece/blog/list.php';
	require ROOT . '/lib/piece/blog/entries.php';
} else {
	$siteTags = getSiteTags($owner);
	require ROOT . '/lib/piece/blog/begin.php';
	require ROOT . '/lib/piece/blog/siteTags.php';
}
require ROOT . '/lib/piece/blog/end.php';
?>

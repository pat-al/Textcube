<?php
/// Copyright (c) 2004-2008, Needlworks / Tatter Network Foundation
/// All rights reserved. Licensed under the GPL.
/// See the GNU General Public License for more details. (/doc/LICENSE, /doc/COPYRIGHT)
$IV = array(
	'GET' => array(
		'userid'=>array('id'),
		'blogid'=>array('id')
	)
);
require ROOT . '/library/includeForBlogOwner.php';
requireStrictRoute();
requirePrivilege('group.creators');

if (deleteTeamblogUser($_GET['userid'],$_GET['blogid'],false)) {
	respond::ResultPage(0);
}
respond::ResultPage(-1);
?>

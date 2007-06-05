﻿<?php
/// Copyright (c) 2004-2007, Needlworks / Tatter Network Foundation
/// All rights reserved. Licensed under the GPL.
/// See the GNU General Public License for more details. (/doc/LICENSE, /doc/COPYRIGHT)
define('ROOT', '../../../../..');
$IV = array(
	'POST' => array(
		'email' => array('email'),
		'name' => array('string', 'default' => ''),
		'password'=>array('string','default'=>''),
		'comment' => array('string', 'default' => ''),
		'senderName' => array('string', 'default' => ''),
		'senderEmail' => array('email')
	)
);
require ROOT . '/lib/includeForBlogOwner.php';
requireStrictRoute();
if ($owner != $_SESSION['admin'])
	respondResultPage(false);

$result = addTeamUser($_POST['email'], $_POST['name'], $_POST['password'], $_POST['comment'], $_POST['senderName'], $_POST['senderEmail']);
respondResultPage($result);
?>

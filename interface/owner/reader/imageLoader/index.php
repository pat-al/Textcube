<?php
/// Copyright (c) 2004-2008, Needlworks / Tatter Network Foundation
/// All rights reserved. Licensed under the GPL.
/// See the GNU General Public License for more details. (/doc/LICENSE, /doc/COPYRIGHT)
$IV = array(
	'GET' => array(
		'url' => array('url')
	)
);
require ROOT . '/library/includeForReader.php';
requireComponent('Eolin.PHP.HTTPRequest');
if (preg_match('/\.jpe?g/i', $_GET['url']))
	header('Content-type: image/jpeg');
else if (preg_match('/\.gif/i', $_GET['url']))
	header('Content-type: image/gif');
else if (preg_match('/\.png/i', $_GET['url']))
	header('Content-type: image/png');
$request = new HTTPRequest($_GET['url']);
if ($request->send()) {
	echo $request->responseText;
} else
	respond::NotFoundPage();
?>

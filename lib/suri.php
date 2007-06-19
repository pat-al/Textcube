<?php
/// Copyright (c) 2004-2007, Needlworks / Tatter Network Foundation
/// All rights reserved. Licensed under the GPL.
/// See the GNU General Public License for more details. (/doc/LICENSE, /doc/COPYRIGHT)
$url = isset($_SERVER['REDIRECT_URL']) ? $_SERVER['REDIRECT_URL'] : $_SERVER['SCRIPT_NAME'];
$suri = array('url' => $url, 'value' => '');
$owner = null;
$depth = substr_count($service['path'], '/');
if ($depth > 0) {
	if (ereg("^((/+[^/]+){{$depth}})(.*)$", $url, $matches))
		$url = $matches[3];
	else
		respondNotFoundPage();
}
if ($service['type'] == 'single') {
	$owner = 1;
} else {
	if ($service['type'] == 'domain') {
		if ($_SERVER['HTTP_HOST'] == $service['domain']) {
			$owner = 1;
		} else {
			$domain = explode('.', $_SERVER['HTTP_HOST'], 2);
			if ($domain[1] == $service['domain']) {
				$owner = getOwner($domain[0]);
				if ($owner === null)
					$owner = getOwnerBySecondaryDomain($_SERVER['HTTP_HOST']);
			} else {
				$owner = getOwnerBySecondaryDomain($_SERVER['HTTP_HOST']);
			}
		}
	} else {
		if ($url == '/') {
			$owner = 1;
		} else if (ereg('^/+([^/]+)(.*)$', $url, $matches)) {
			$owner = getOwner($matches[1]);
			if ($owner === null)
				$owner = 1;
			$url = $matches[2];
		} else {
			respondNotFoundPage();
		}
	}
	if ($owner === null)
		respondNotFoundPage();
}

$blog = getBlogSetting($owner);
$skinSetting = getSkinSetting($owner);

$depth = substr_count(ROOT, '/');
if ($depth > 0) {
	if (ereg("^((/+[^/]+){{$depth}})/*(.*)$", $url, $matches)) {
		$suri['directive'] = $matches[1];
		if ($matches[3] !== false)
			$suri['value'] = $matches[3];
	} else
		respondNotFoundPage();
} else {
	$suri['directive'] = '/';
	$suri['value'] = ltrim($url, '/');
}
if (is_numeric($suri['value']))
	$suri['id'] = $suri['value'];
$suri['page'] = empty($_POST['page']) ? (empty($_GET['page']) ? true : $_GET['page']) : $_POST['page'];

if (!isset($serviceURL))
	$serviceURL = 'http://' . $service['domain'] . (isset($service['port']) ? ':' . $service['port'] : '') . $service['path'];

switch ($service['type']) {
	case 'domain':
		$pathURL = $service['path'];
		$blog['primaryBlogURL'] = 'http://' . $blog['name'] . '.' . $service['domain'] . (isset($service['port']) ? ':' . $service['port'] : '') . $pathURL;
		if( !empty($blog['secondaryDomain']) )
			$blog['secondaryBlogURL'] = 'http://' . $blog['secondaryDomain'] . (isset($service['port']) ? ':' . $service['port'] : '') . $pathURL;
		else
			$blog['secondaryBlogURL'] = null;
		if ($blog['defaultDomain']) {
			$defaultURL = $blog['secondaryBlogURL'];
			if ($_SERVER['HTTP_HOST'] == $blog['secondaryDomain'])
				$baseURL = $service['path'];
			else
				$baseURL = $defaultURL;
		} else {
			$defaultURL = $blog['primaryBlogURL'];
			if ($_SERVER['HTTP_HOST'] == ($blog['name'] . '.' . $service['domain']))
				$baseURL = $service['path'];
			else
				$baseURL = $defaultURL;
		}
		break;
	case 'path':
		$pathURL = $service['path'] . '/' . $blog['name'];
		$blog['primaryBlogURL'] = 'http://' . $service['domain'] . (isset($service['port']) ? ':' . $service['port'] : '') . $pathURL;
		$blog['secondaryBlogURL'] = null;
		$defaultURL = $blog['primaryBlogURL'];
		if ($_SERVER['HTTP_HOST'] == $service['domain'])
			$baseURL = $service['path'] . '/' . $blog['name'];
		else
			$baseURL = $defaultURL;
		break;
	case 'single':
	default:
		$pathURL = $service['path'];
		$blog['primaryBlogURL'] = 'http://' . $service['domain'] . (isset($service['port']) ? ':' . $service['port'] : '') . $pathURL;
		$blog['secondaryBlogURL'] = null;
		$defaultURL = $blog['primaryBlogURL'];
		if ($_SERVER['HTTP_HOST'] == $service['domain'])
			$baseURL = $service['path'];
		else
			$baseURL = $defaultURL;
		break;
}

$hostURL = 'http://' . $_SERVER['HTTP_HOST'] . (isset($service['port']) ? ':' . $service['port'] : '');
$blogURL = $pathURL;
$folderURL = rtrim($blogURL . $suri['directive'], '/');


if (defined('__TEXTCUBE_MOBILE__')) {
	$blogURL .= '/m';
}
unset($url, $domain);

// 어드민 스킨 및 에디터 템플릿 설정.
$adminSkinSetting = array();
$adminSkinSetting['skin'] = "/style/admin/".getUserSetting("adminSkin", "default");

// 리샘플링 설정값.
$useImageResampling = getUserSetting("resamplingDefault");

// content 본문에 removeAllTags()가 적용되는 것을 방지하기 위한 프로세스를 위한 변수.
$contentContainer = array();

if (file_exists(ROOT . "/skin/{$skinSetting['skin']}/wysiwyg.css"))
	$adminSkinSetting['editorTemplate'] = "/skin/{$skinSetting['skin']}/wysiwyg.css";
else
	$adminSkinSetting['editorTemplate'] = "/style/default-wysiwyg.css";

if (!file_exists(ROOT . '/config.php')) {
	header('Location: ' . ROOT . '/setup.php');
	exit;
}
function respondNotFoundPage() {
	header('HTTP/1.1 404 Not Found');
	header("Connection: close");
	exit;
}

function respondForbiddenPage() {
	header('HTTP/1.1 403 Forbidden');
	header("Connection: close");
	exit;
}
?>

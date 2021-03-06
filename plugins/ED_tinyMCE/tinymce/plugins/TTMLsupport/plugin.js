/**
 * Textcube editor support for tinyMCE 4
 * Version 3.0.0.20150607
 *
 * Created       : May 30, 2011
 * Last modified : June 7, 2015
 *
 * Copyright 2011, 2015 Jeongkyu Shin <inureyes@gmail.com>
 * Released under LGPL License.
 *
 */
tinymce.create('tinymce.Textcube.TTMLsupport', {
    /**
     */
    init: function (ed, url) {
        var t = this;
        t.propertyFilePath = ed.propertyFilePath;
        t.propertyNames = ["propertyInsertObject", "propertyImage1", "propertyImage2", "propertyImage3", "propertyObject", "propertyObject1", "propertyObject2", "propertyiMazing", "propertyGallery", "propertyJukebox", "propertyEmbed", "propertyFlash", "propertyMoreLess"];
        t.styleUnknown = 'style="width: 90px; height: 30px; border: 2px outset #796; background-color: #efd; background-repeat: no-repeat; background-position: center center; background-image: url(\'' + servicePath + '/resources/image/extension/unknown.gif\')"';
        ed.editorMode = 'tinymce';
        ed.on('LoadContent', function (e) {
            e.content = t.TTMLtoHTML(e.content);
        });
        ed.on('BeforeSetContent', function (e) {
            if (e.set) {
                e.content = t.TTMLtoHTML(e.content);
            }
            if (e.get) {
                e.content = t.HTMLtoTTML(e.content);
            }
        });

        ed.on('PostProcess', function (e) {
            if (e.set) {
                e.content = t.TTMLtoHTML(e.content);
            }
            if (e.get) {
                e.content = t.HTMLtoTTML(e.content);
            }
        });
        var lastNode = null;
        var showPropertyCall = null;
        var uploadDlg = jQuery('#upload-section');
        var uploadDlgCounter = true;
        ed.on('NodeChange', function (e) {
            if (e.element == lastNode) {
                return false
            } else {
                clearTimeout(showPropertyCall);
                lastNode = e.element;
                showPropertyCall = setTimeout(t.showProperty(e.element), 500);
                if (uploadDlgCounter == false) {
                    uploadDlg.slideUp(600);
                    uploadDlgCounter = true;
                }
            }
        });
        ed.addCommand('textcubeToggleUploadDlg', function () {
            if (uploadDlg.is(':hidden')) {
                uploadDlg.slideDown(600);
                setTimeout(function () {
                    uploadDlgCounter = false
                }, 3000);
            } else {
                uploadDlg.slideUp(600);
                uploadDlgCounter = true;
            }
        });
        ed.addCommand('textcubeSavePost', function () {
            entryManager.saveEntry();
            return false;
        });
        ed.addCommand('textcubeMoreLessBlock', function () {
            t.command('MoreLessBlock');
            return false;
        });
        ed.addCommand('textcubeToggleSourceCodeEditor', function () {
            t.command('ToggleTextarea');
            return false;
        });
        ed.addButton('tcattach', {
            title: 'Upload and insert files',
            cmd: 'textcubeToggleUploadDlg',
            icon: 'browse'
        });
        ed.addButton('tcsave', {
            title: 'Save current post',
            cmd: 'textcubeSavePost',
            icon: 'save'
        });
        ed.addButton('tcmoreless', {
            title: 'Add more/less block',
            cmd: 'textcubeMoreLessBlock',
            icon: 'pagebreak'
        });
        //ed.addButton('tcsourcecodeedit', {
        //    title: 'Source code editor',
        //    cmd: 'textcubeToggleSourceCodeEditor',
        //    icon: 'code'
        //});

        var div = document.createElement('div');
        div.id = 'tinyMCEeditor-textbox';
        div.className = 'container';
        document.getElementById('editWindow').parentNode.insertBefore(div, document.getElementById('editWindow'));
        div.appendChild(t.getEditorProperty());
    },
    /** HTML-TTML Conversion methods **/
    TTMLtoHTML: function (str) {
        var t = this;
        // MORE/LESS manipulation
        while (true) {
            var pos1 = str.indexOf("[#M_");

            if (pos1 > -1) {
                var pos2 = str.indexOf("_M#]", pos1);

                if (pos2 > -1) {
                    var block = str.substring(pos1 + 4, pos2);

                    while (true) {
                        if (block.indexOf("[#M_") == -1)
                            break;
                        else
                            block = block.substring(block.indexOf("[#M_") + 4, block.length);
                    }

                    var more = t._htmlspecialchars(block.substring(0, block.indexOf("|")));
                    var remain = block.substring(block.indexOf("|") + 1, block.length);
                    var less = t._htmlspecialchars(remain.substring(0, remain.indexOf("|")));
                    remain = remain.substring(remain.indexOf("|"), remain.length);
                    var body = remain.substring(remain.indexOf("|") + 1, remain.length);
                    // Avoid the bug
                    more = more.replaceAll("&lt;span id=&quot;CmCaReT&quot;&gt;&lt;/span&gt;", "");
                    more = more.replaceAll("&lt;", "&amp;lt;");
                    more = more.replaceAll("&gt;", "&amp;gt;");
                    less = less.replaceAll("&lt;span id=&quot;CmCaReT&quot;&gt;&lt;/span&gt;", "");
                    less = less.replaceAll("&lt;", "&amp;lt;");
                    less = less.replaceAll("&gt;", "&amp;gt;");

                    str = str.replaceAll("[#M_" + block + "_M#]", '<div class="tattermoreless" more="' + more + '" less="' + less + '">' + body + '</div>');
                }
                else
                    break;
            }
            else
                break;
        }

        // 이미지 치환자 처리
        var regImage = new RegExp("\\[##_(([1-3][CLR])(\\|[^|]*?)+)_##\\]", "");
        while (result = regImage.exec(str)) {
            var search = result[0];

            var longDesc = ' longdesc="' + t.addQuot(t._htmlspecialchars(result[1])) + '" ';
            // Avoid the bug
            longDesc = longDesc.replaceAll("&lt;span id=&quot;CmCaReT&quot;&gt;&lt;/span&gt;", "");
            longDesc = longDesc.replaceAll("&lt;", "&amp;lt;");
            longDesc = longDesc.replaceAll("&gt;", "&amp;gt;");
            var attributes = result[1].split("|");
            var imageType = attributes[0];
            if (t._isImageFile(attributes[1])) {
                var imageName = t.propertyFilePath + attributes[1];
                var imageAttr = t.parseImageSize(attributes[2], "string");
            }
            else {
                var imageName = servicePath + adminSkin + "/image/spacer.gif";
                var imageAttr = t.styleUnknown;
            }
            switch (imageType) {
                case "1L":
                    var replace = '<img class="tatterImageLeft" src="' + imageName + '" ' + imageAttr + longDesc + " />";
                    break;
                case "1R":
                    var replace = '<img class="tatterImageRight" src="' + imageName + '" ' + imageAttr + longDesc + " />";
                    break;
                case "1C":
                    var replace = '<img class="tatterImageCenter" src="' + imageName + '\" ' + imageAttr + longDesc + " />";
                    break;
                case "2C":
                    var replace = '<img class="tatterImageDual" src="' + servicePath + adminSkin + '/image/spacer.gif" width="200" height="100" ' + longDesc + " />";
                    break;
                case "3C":
                    var replace = '<img class="tatterImageTriple" src="' + servicePath + adminSkin + '/image/spacer.gif" width="300" height="100" ' + longDesc + " />";
            }

            str = str.replaceAll(search, replace);
        }

        // iMazing
        var regImazing = new RegExp("\\[##_iMazing\\|(.*?)_##\\]", "");
        while (result = regImazing.exec(str)) {
            var search = result[0];

            var longDesc = ' longdesc="iMazing|' + t.addQuot(t._htmlspecialchars(result[1])) + '" ';
            // Avoid the bug
            longDesc = longDesc.replaceAll("&lt;span id=&quot;CmCaReT&quot;&gt;&lt;/span&gt;", "");

            longDesc = longDesc.replaceAll("&lt;", "&amp;lt;");
            longDesc = longDesc.replaceAll("&gt;", "&amp;gt;");

            var imageAttr = t.parseImageSize(result[1], "string");

            var replace = '<img class="tatterImazing" src="' + servicePath + adminSkin + '/image/spacer.gif" ' + imageAttr + longDesc + " />";

            str = str.replaceAll(search, replace);
        }


        // Gallery
        var regGallery = new RegExp("\\[##_Gallery\\|(.*?)_##\\]", "");
        while (result = regGallery.exec(str)) {
            var search = result[0];

            var longDesc = ' longdesc="Gallery|' + t.addQuot(t._htmlspecialchars(result[1])) + '" ';

            // Avoid the bug
            longDesc = longDesc.replaceAll("&lt;span id=&quot;CmCaReT&quot;&gt;&lt;/span&gt;", "");

            longDesc = longDesc.replaceAll("&lt;", "&amp;lt;");
            longDesc = longDesc.replaceAll("&gt;", "&amp;gt;");

            var imageAttr = t.parseImageSize(result[1], "string");

            var replace = '<img class="tatterGallery" src="' + servicePath + adminSkin + '/image/spacer.gif" ' + imageAttr + longDesc + " />";

            str = str.replaceAll(search, replace);
        }

        // Jukebox
        var regJukebox = new RegExp("\\[##_Jukebox\\|(.*?)_##\\]", "");
        while (result = regJukebox.exec(str)) {
            var search = result[0];

            var longDesc = ' longdesc="Jukebox|' + t.addQuot(t._htmlspecialchars(result[1])) + '" ';

            // Avoid the bug
            longDesc = longDesc.replaceAll("&lt;span id=&quot;CmCaReT&quot;&gt;&lt;/span&gt;", "");
            longDesc = longDesc.replaceAll("&lt;", "&amp;lt;");
            longDesc = longDesc.replaceAll("&gt;", "&amp;gt;");

            var replace = '<img class="tatterJukebox" src="' + servicePath + adminSkin + '/image/spacer.gif" width="200" height="25"' + longDesc + " />";

            str = str.replaceAll(search, replace);
        }

        // Single image manipulation
        var regImage = new RegExp("src=[\"']?(\\[##_ATTACH_PATH_##\\][a-z.0-9/]*)", "i");
        while (result = regImage.exec(str))
            str = str.replaceAll(result[0], 'class="tatterImageFree" longdesc="' + result[1] + '" src="' + t.propertyFilePath.substring(0, t.propertyFilePath.length - 1) + result[1].replaceAll("[##_ATTACH_PATH_##]", ""));

        // Object manipulation
        var objects = getTagChunks(str, "object");
        if (objects.length > 0) {
            for (i in objects) {
                str = str.replaceAll(objects[i], '<img class="tatterObject" src="' + servicePath + adminSkin + '/image/spacer.gif"' + t.parseImageSize(objects[i], "string", "css") + ' longDesc="' + t.objectSerialize(objects[i]) + '" />');
            }
        }
        // Flash manipulation
        var regEmbed = new RegExp("<embed([^<]*?)application/x-shockwave-flash(.*?)></embed>", "i");
        while (result = regEmbed.exec(str)) {
            var body = result[0];
            str = str.replaceAll(body, '<img class="tatterFlash" src="' + servicePath + adminSkin + '/image/spacer.gif"' + t.parseImageSize(body, "string", "css") + ' longDesc="' + t.parseAttribute(body, "src") + '"/>');
        }

        // Embed manipulation
        var regEmbed = new RegExp("<embed([^<]*?)></embed>", "i");
        while (result = regEmbed.exec(str)) {
            var body = result[0];
            str = str.replaceAll(body, '<img class="tatterEmbed" src="' + servicePath + adminSkin + '/image/spacer.gif"' + t.parseImageSize(body, "string", "css") + ' longDesc="' + t.parseAttribute(body, "src") + '"/>');
        }
        return str;
    },
    HTMLtoTTML: function (str) {
        var t = this;

        // more/less handling
        str = t.morelessConvert(str);

        // TTML Image type
        var regImage = new RegExp("<img[^>]*?class=[\"']?tatterImage[^>]*?>", "i");
        while (result = regImage.exec(str)) {
            var body = result[0];
            var replace = t.parseAttribute(result[0], "longdesc");
            if (replace && replace.indexOf("[##_ATTACH_PATH_##]") == -1)
                str = str.replaceAll(body, "[##_" + t.removeQuot(replace).replace(new RegExp("&amp;", "gi"), "&") + "_##]");
            else {
                var align = t.parseAttribute(body, "align").toLowerCase();
                if (align == "left" || align == "right" || align == "center")
                    str = str.replaceAll(body, '<img src="' + replace + '"' + t.parseImageSize(body, "string") + 'align="' + align + '"/>');
                else
                    str = str.replaceAll(body, '<img src="' + replace + '"' + t.parseImageSize(body, "string") + "/>");
            }
        }

        // iMazing
        var regImaging = new RegExp("<img[^>]*class=[\"']?tatterImazing[^>]*>", "i");
        while (result = regImaging.exec(str)) {
            var body = result[0];
            var size = t.parseImageSize(body, "array");
            var longdesc = t.parseAttribute(result[0], "longdesc");
            longdesc = t.removeQuot(longdesc);
            longdesc = longdesc.replace(new RegExp("(width=[\"']?)\\d*", "i"), "$1" + size[0]);
            longdesc = longdesc.replace(new RegExp("(height=[\"']?)\\d*", "i"), "$1" + size[1]);
            str = str.replaceAll(body, "[##_" + longdesc.replace(new RegExp("&amp;", "gi"), "&") + "_##]");
        }

        // TT Gallery
        var regGallery = new RegExp("<img[^>]*class=[\"']?tatterGallery[^>]*>", "i");
        while (result = regGallery.exec(str)) {
            var body = result[0];

            var size = t.parseImageSize(body, "array");

            var longdesc = t.parseAttribute(result[0], "longdesc");
            longdesc = t.removeQuot(longdesc);
            longdesc = longdesc.replace(new RegExp("(width=[\"']?)\\d*", "i"), "$1" + size[0]);
            longdesc = longdesc.replace(new RegExp("(height=[\"']?)\\d*", "i"), "$1" + size[1]);
            longdesc = longdesc.split("|");

            // TT 1.0 alpha ~ 1.0.1까지 쓰던 Gallery 치환자를 위한 코드 Legacy code for TT 1.0 alpha to 1.0.1
            if (longdesc.length % 2 == 1)
                longdesc.length--;

            var files = "";

            for (var i = 1; i < longdesc.length - 1; i++)
                files += longdesc[i].replace(new RegExp("&amp;", "gi"), "&") + "|";

            str = str.replaceAll(body, "[##_Gallery|" + files + t.un_htmlspecialchars(trim(longdesc[longdesc.length - 1])) + "_##]");
        }

        // Jukebox handling
        var regJukebox = new RegExp("<img[^>]*class=[\"']?tatterJukebox[^>]*>", "i");
        while (result = regJukebox.exec(str)) {
            var body = result[0];

            var size = t.parseImageSize(body, "array");

            var longdesc = t.parseAttribute(result[0], "longdesc");
            longdesc = t.removeQuot(longdesc);
            longdesc = longdesc.replace(new RegExp("(width=[\"']?)\\d*", "i"), "$1" + size[0]);
            longdesc = longdesc.replace(new RegExp("(height=[\"']?)\\d*", "i"), "$1" + size[1]);

            longdesc = longdesc.split("|");

            var files = "";

            for (var i = 1; i < longdesc.length - 2; i++)
                files += longdesc[i].replace(new RegExp("&amp;", "gi"), "&") + "|";

            str = str.replaceAll(body, "[##_Jukebox|" + files + t.un_htmlspecialchars(trim(longdesc[longdesc.length - 2])) + "|_##]");
        }
        return str;
    },
    /** Internal methods **/
    morelessConvert: function (string) {
        var t = this;

        while (new RegExp("<div[^>]*?class=['\"]?tattermoreless[^>]*>", "i").test(string))
            string = t.morelessConvert_process(string);
        return string;
    },
    morelessConvert_process: function (string) {
        var t = this;

        var result = "";
        var pos1 = pos2 = 0;
        var head = new RegExp("<div[^>]*?class=['\"]?tattermoreless[^>]*>", "i");
        var chunk = undefined;
        if ((pos1 = string.indexOfCaseInsensitive(head, pos2)) > -1) {
            result += string.substring(0, pos1);
            do {
                if ((pos2 = string.indexOfCaseInsensitive(new RegExp("</div>", "i"), Math.max(pos1, pos2))) == -1)
                    return result + string.substring(pos1, string.length).replace(head, '');
                pos2 += 6;
                chunk = string.substring(pos1, pos2);
            } while (chunk != "" && chunk.count(new RegExp("<div[>\\s]", "gi")) != chunk.count(new RegExp("</div>", "gi")));
            var less = t.parseAttribute(chunk, "less").replaceAll("&amp;", "&");
            var more = t.parseAttribute(chunk, "more").replaceAll("&amp;", "&");
            chunk = chunk.replace(head, "[#M_" + more + "|" + less + "|");
            chunk = chunk.replace(new RegExp("</div>$", "i"), "_M#]");
            result += chunk;
        }
        return result + string.substring(pos2, string.length);
    },
    objectSerialize: function(str) {
    	str = str.replace(new RegExp("<br\\s*/?>", "gi"), "");
    	str = str.replace(new RegExp("\r?\n", "g"), "");
    	str = str.replace(new RegExp("<", "g"), "__LT__");
    	str = str.replace(new RegExp(">", "g"), "__GT__");
    	str = str.replace(new RegExp('"', "g"), "__QUOT__");
    	return str;
    },
    objectUnSerialize: function(str) {
    	str = str.replaceAll("__QUOT__", '"');
    	str = str.replaceAll("__GT__", ">");
    	str = str.replaceAll("__LT__", "<");
    	return str;
    },
    parseAttribute: function (str, name) {
        var t = this;

        var regAttribute1 = new RegExp("(^|\\W)" + name + '="([^"]*)"', "gi");
        var regAttribute2 = new RegExp("(^|\\W)" + name + "='([^']*)'", "gi");
        var regAttribute3 = new RegExp("(^|\\W)" + name + "=([^\\s>]*)", "gi");

        if (result = regAttribute1.exec(str)) {
            return result[2];
        } else if (result = regAttribute2.exec(str)) {
            return result[2];
        } else if (result = regAttribute3.exec(str)) {
            return result[2];
        } else {
            return "";
        }
    },
    parseImageSize: function (target, type, mode) {
        var t = this;

        var width = 0;
        var height = 0;

        if (typeof(target) == "object") {
            if (target.style.width && target.style.height) {
                width = parseInt(target.style.width);
                height = parseInt(target.style.height);
            } else {
                width = target.width;
                height = target.height;
            }
        } else {
            target = target.replace(new RegExp('longdesc=".*?"', "gi"), "");
            target = target.replace(new RegExp("longdesc='.*?'", "gi"), "");

            var regStyleWidth = new RegExp("width:\\s*(\\d+)", "gi");
            var regStyleHeight = new RegExp("height:\\s*(\\d+)", "gi");
            var regWidth = new RegExp("width=[\"']?(\\d+)", "gi");
            var regHeight = new RegExp("height=[\"']?(\\d+)", "gi");

            var sizeWidth, sizeHeight;

            if (sizeWidth = regStyleWidth.exec(target))
                width = sizeWidth[1];
            else if (sizeWidth = regWidth.exec(target))
                width = sizeWidth[1];

            if (sizeHeight = regStyleHeight.exec(target))
                height = sizeHeight[1];
            else if (sizeHeight = regHeight.exec(target))
                height = sizeHeight[1];
        }

        if (type == "array") {
            return new Array(width, height);
        } else if (mode == "css") {
            var size = ' style="';
            if (width > 0)
                size += 'width: ' + width + 'px;';
            if (height > 0)
                size += 'height: ' + height + 'px;';
            return size + '"';
        } else {
            var size = ' ';
            if (width > 0)
                size += 'width="' + width + '" ';
            if (height > 0)
                size += 'height="' + height + '" ';
            return size;
        }
    },
    _htmlspecialchars: function (str) {
        var t = this;
        return t.addQuot(str.replace(new RegExp("&", "g"), "&amp;").replace(new RegExp("<", "g"), "&lt;").replace(new RegExp(">", "g"), "&gt;"));
    },
    // Convert HTML entities Reverse
    un_htmlspecialchars: function (str) {
        var t = this;
        return t.removeQuot(str.replace(new RegExp("&amp;", "gi"), "&").replace(new RegExp("&lt;", "gi"), "<").replace(new RegExp("&gt;", "gi"), ">"));
    },
    // " -> &quot; / ' -> &#39;
    addQuot: function (str) {
        return str.replace(new RegExp('"', "g"), "&quot;").replace(new RegExp("'", "g"), "&#39;");
    },
    // &quot; -> " / &#39; -> '
    removeQuot: function (str) {
        return str.replace(new RegExp("&quot;", "gi"), '"').replace(new RegExp("&#39;", "g"), "'");
    },
    nl2br: function(str) {
    	return str.replace(new RegExp("\r\n", "gi"), "<br />").replace(new RegExp("\r", "gi"), "<br />").replace(new RegExp("\n", "gi"), "<br />");
    },
    // Determine whether the file is image or not.
    _isImageFile: function (filename) {
        return new RegExp("\\.(jpe?g|gif|png|bmp)$", "gi").exec(filename);
    },
    // Determine whether the file is flash or not.
    _isMediaFile: function (filename) {
        return new RegExp("\\.(swf|mid|mp3|wav|wax|wma|avi|asf|asx|mov|mpe?g|wmv|wm|wvx)$", "gi").exec(filename);
    },
    getFilenameFromFilelist: function (name) {
        var fileList = getObject("TCfilelist");

        for (var i = 0; i < fileList.length; i++)
            if (fileList.options[i].value.indexOf(name) == 0)
                return fileList.options[i].text.substring(0, fileList.options[i].text.lastIndexOf("(") - 1);

        return name;
    },
    /** Property sidebar creators **/
    showProperty: function (obj) {
        var t = this;
        t.selectedAnchorElement = null;
        t.selectedNode = obj;
        if (typeof obj.getAttribute != "undefined") {
            var attribute = obj.getAttribute("longdesc");
        }
        t.id = 'tinyMCE';
        getObject(t.id + "propertyImage1").style.display = "none";
        getObject(t.id + "propertyImage2").style.display = "none";
        getObject(t.id + "propertyImage3").style.display = "none";
        getObject(t.id + "propertyObject").style.display = "none";
        getObject(t.id + "propertyObject1").style.display = "none";
        getObject(t.id + "propertyObject2").style.display = "none";
        getObject(t.id + "propertyObject3").style.display = "none";
        getObject(t.id + "propertyiMazing").style.display = "none";
        getObject(t.id + "propertyiMazing_preview").style.display = "none";
        getObject(t.id + "propertyGallery").style.display = "none";
        getObject(t.id + "propertyGallery_preview").style.display = "none";
        getObject(t.id + "propertyJukebox").style.display = "none";
        getObject(t.id + "propertyEmbed").style.display = "none";
        getObject(t.id + "propertyMoreLess").style.display = "none";
        if (obj.className == "tatterObject") {
            t.propertyHeader = "tatterObject";
            t.propertyWindowId = t.id + "propertyObject";
            var size = t.parseImageSize(obj, "array");
            getObject(t.id + "propertyObject_width").value = size[0];
            getObject(t.id + "propertyObject_height").value = size[1];
            getObject(t.id + "propertyObject_chunk").value = t.objectUnSerialize(attribute);
            getObject(t.id + "propertyInsertObject").style.display = "none";
            getObject(t.id + "propertyObject").style.display = "block";
        } else if (obj.className == "tatterEmbed") {
            t.propertyHeader = "tatterEmbed";
            t.propertyWindowId = t.id + "propertyEmbed";
            var size = t.parseImageSize(obj, "array");
            getObject(t.id + "propertyEmbed_width").value = size[0];
            getObject(t.id + "propertyEmbed_height").value = size[1];
            getObject(t.id + "propertyEmbed_src").value = attribute;
            getObject(t.id + "propertyEmbed").style.display = "block";
        } else if (obj.tagName && obj.tagName.toLowerCase() == "img" && attribute) {
            var values = attribute.split("|");

            if (values.length == 1)
                return false;
            t.propertyHeader = values[0];

            if (values[0] == "iMazing" || values[0] == "Gallery" || values[0] == "Jukebox") {
                var objectCount = 1;
                var objectType = values[0];
                var propertyWindowId = t.id + "property" + objectType;
            } else {
                var objectCount = values[0].charAt(0);
                var objectType = t._isImageFile(values[1]) ? "Image" : "Object";
                var propertyWindowId = t.id + "property" + objectType + objectCount;
            }

            t.propertyWindowId = propertyWindowId;

            if (objectType == "Image") {
                getObject(propertyWindowId + "_width1").value = trim(t.removeQuot(t.parseAttribute(values[2], "width")));
                getObject(propertyWindowId + "_alt1").value = trim(t.un_htmlspecialchars(t.removeQuot(t.parseAttribute(values[2], "alt"))));
                getObject(propertyWindowId + "_caption1").value = trim(t.un_htmlspecialchars(t.removeQuot(values[3])));

                t.propertyFilename1 = values[1];

                // 1번 이미지.
                if (objectCount == 1) {

                    var size = t.parseImageSize(obj, "array");

                    if (t.propertyCurrentImage == obj.getAttribute("src")) {
                        var newWidth = size[0];
                        var newHeight = parseInt(size[0] * t.propertyCurrentProportion1);
                        t.propertyCurrentProportion1 = newHeight / newWidth;
                        obj.removeAttribute("width");
                        obj.removeAttribute("height");
                        if (!isNaN(newWidth))
                            obj.style.width = newWidth + "px";
                        if (!isNaN(newHeight))
                            obj.style.height = newHeight + "px";
                    }
                    else {
                        t.propertyCurrentProportion1 = size[1] / size[0];
                        t.propertyCurrentImage = obj.getAttribute("src");
                    }
                }
                else {
                    var size = t.parseImageSize(values[2], "array");
                    t.propertyCurrentProportion1 = size[1] / size[0];
                    if (objectCount > 1) {
                        var size = t.parseImageSize(values[5], "array");
                        t.propertyCurrentProportion2 = size[1] / size[0];
                    }
                    if (objectCount > 2) {
                        var size = t.parseImageSize(values[8], "array");
                        t.propertyCurrentProportion3 = size[1] / size[0];
                    }
                }

                // 2번 이미지.
                if (objectCount > 1) {
                    getObject(propertyWindowId + "_width2").value = trim(t.removeQuot(t.parseAttribute(values[5], "width")));
                    getObject(propertyWindowId + "_alt2").value = trim(t.un_htmlspecialchars(t.removeQuot(t.parseAttribute(values[5], "alt"))));
                    getObject(propertyWindowId + "_caption2").value = trim(t.un_htmlspecialchars(t.removeQuot(values[6])));
                }

                t.propertyFilename2 = values[4];

                // 3번 이미지.
                if (objectCount > 2) {
                    getObject(propertyWindowId + "_width3").value = trim(t.removeQuot(t.parseAttribute(values[8], "width")));
                    getObject(propertyWindowId + "_alt3").value = trim(t.un_htmlspecialchars(t.removeQuot(t.parseAttribute(values[8], "alt"))));
                    getObject(propertyWindowId + "_caption3").value = trim(t.un_htmlspecialchars(t.removeQuot(values[9])));
                }

                t.propertyFilename3 = values[7];
            }
            else if (objectType == "Object") {
                getObject(propertyWindowId + "_caption1").value = trim(t.un_htmlspecialchars(t.removeQuot(values[3])));
                getObject(propertyWindowId + "_filename1").value = t.getFilenameFromFilelist(values[1]);
                t.propertyFilename1 = values[1];
                if (objectCount > 1) {
                    getObject(propertyWindowId + "_caption2").value = trim(t.un_htmlspecialchars(t.removeQuot(values[6])));
                    getObject(propertyWindowId + "_filename2").value = t.getFilenameFromFilelist(values[4]);
                    t.propertyFilename2 = values[4];
                }

                if (objectCount > 2) {
                    getObject(propertyWindowId + "_caption3").value = trim(t.un_htmlspecialchars(t.removeQuot(values[9])));
                    getObject(propertyWindowId + "_filename3").value = t.getFilenameFromFilelist(values[7]);
                    t.propertyFilename3 = values[7];
                }
            }
            else if (objectType == "iMazing") {
                var size = t.parseImageSize(obj, "array");
                var attributes = values[values.length - 2];

                getObject(propertyWindowId + "_width").value = size[0];
                getObject(propertyWindowId + "_height").value = size[1];
                getObject(propertyWindowId + "_frame").value = t.parseAttribute(attributes, "frame");
                getObject(propertyWindowId + "_tran").value = t.parseAttribute(attributes, "transition");
                getObject(propertyWindowId + "_nav").value = t.parseAttribute(attributes, "navigation");
                getObject(propertyWindowId + "_sshow").value = t.parseAttribute(attributes, "slideshowInterval");
                getObject(propertyWindowId + "_page").value = t.parseAttribute(attributes, "page");
                getObject(propertyWindowId + "_align").value = t.parseAttribute(attributes, "align");
                getObject(propertyWindowId + "_caption").value = trim(t.un_htmlspecialchars(t.removeQuot(values[values.length - 1])));

                var list = getObject(propertyWindowId + "_list");

                list.innerHTML = "";

                for (var i = 1; i < values.length - 2; i += 2)
                    list.options[list.length] = new Option(t.getFilenameFromFilelist(values[i]), values[i] + "|", false, false);
            }
            else if (objectType == "Gallery") {
                var size = t.parseImageSize(obj, "array");
                var attributes = values[values.length - 2];

                getObject(propertyWindowId + "_width").value = size[0];
                getObject(propertyWindowId + "_height").value = size[1];
                getObject(propertyWindowId + "_caption").value = "";

                var list = getObject(propertyWindowId + "_list");

                list.innerHTML = "";

                for (var i = 1; i < values.length - 2; i += 2) {
                    list.options[list.length] = new Option(t.getFilenameFromFilelist(values[i]), values[i] + "|" + t.un_htmlspecialchars(values[i + 1]), false, false);
                    if (i == 1) {
                        list.selectedIndex = 0;
                        t.listChanged('propertyGallery_list');
                    }
                }
            }
            else if (objectType == "Jukebox") {
                getObject(propertyWindowId + "_autoplay").checked = t.parseAttribute(values[values.length - 2], "autoplay") == 1;
                getObject(propertyWindowId + "_visibility").checked = t.parseAttribute(values[values.length - 2], "visible") == 1;

                var list = getObject(propertyWindowId + "_list");

                list.innerHTML = "";

                for (var i = 1; i < values.length - 2; i += 2)
                    list.options[list.length] = new Option(t.getFilenameFromFilelist(values[i]), values[i] + "|" + t.un_htmlspecialchars(values[i + 1]), false, false);
            }

            getObject(propertyWindowId).style.display = "block";
        } else {
            var node = obj;

            while (node.parentNode) {
                if (node.tagName && node.tagName.toLowerCase() == "div" && node.getAttribute("more") != null && node.getAttribute("less") != null) {
                    var moreText = node.getAttribute("more");
                    var lessText = node.getAttribute("less");
                    getObject(t.id + "propertyInsertObject").style.display = "none";
                    getObject(t.id + "propertyMoreLess").style.display = "block";
                    getObject(t.id + "propertyMoreLess_more").value = trim(t.un_htmlspecialchars(moreText));
                    getObject(t.id + "propertyMoreLess_less").value = trim(t.un_htmlspecialchars(lessText));
                    t.propertyWindowId = t.id + "propertyMoreLess";
                    t.setPropertyPosition();
                    return false;
                }

                node = node.parentNode;
            }
            return false;
        }
        //        	t.setPropertyPosition();
        return true;
    },
    setProperty: function () {
        var t = this;

        var obj = t.selectedNode;
        var attribute = obj.getAttribute("longdesc");
        if (obj.className == "tatterObject" || obj.className == "tatterEmbed" || obj.className == "tatterFlash") {
            obj.removeAttribute("width");
            obj.removeAttribute("height");
            obj.style.width = "auto";
            obj.style.height = "auto";

            try {
                var width = parseInt(getObject(t.propertyWindowId + "_width").value);
                if (!isNaN(width) && width > 0 && width < 10000)
                    obj.style.width = width + "px";
                var height = parseInt(getObject(t.propertyWindowId + "_height").value);
                if (!isNaN(height) && height > 0 && height < 10000)
                    obj.style.height = height + "px";
            } catch (e) {
            }

            if (obj.className == "tatterEmbed" || obj.className == "tatterFlash")
                obj.setAttribute("longDesc", getObject(t.propertyWindowId + "_src").value);
            else {
                obj.setAttribute("longDesc", t.objectSerialize(getObject(t.propertyWindowId + "_chunk").value));
            }
        } else if (obj.tagName && obj.tagName.toLowerCase() == "img" && attribute) {
            if (t.propertyWindowId.indexOf(t.id + "propertyImage") == 0) {
                var objectCount = t.propertyWindowId.charAt(t.propertyWindowId.length - 1);

                // 1L,1C,1R일 경우에는 수정된 속성의 크기로 실제 이미지 크기를 변경
                // 1번 이미지.
                if (objectCount == 1) {
                    obj.removeAttribute("width");
                    obj.removeAttribute("height");
                    obj.style.width = "auto";
                    obj.style.height = "auto";

                    try {
                        var value = parseInt(getObject(t.propertyWindowId + "_width1").value);
                        if (!isNaN(value) && value > 0 && value < 10000) {
                            var newWidth = value;
                            var newHeight = parseInt(value * t.propertyCurrentProportion1);
                            obj.style.width = newWidth + "px";
                            obj.style.height = newHeight + "px";
                        }
                    } catch (e) {
                    }
                }

                var imageSize = "";
                var imageAlt = "";
                var imageCaption = "";
                var imageResample = "";

                try {
                    var value = parseInt(getObject(t.propertyWindowId + "_width1").value);
                    if (!isNaN(value) && value > 0 && value < 10000)
                        imageSize = 'width="' + value + '" height="' + parseInt(value * t.propertyCurrentProportion1) + '" ';
                } catch (e) {
                }
                try {
                    if (t._isImageFile(t.propertyFilename1))
                        imageAlt = 'alt="' + t._htmlspecialchars(getObject(t.propertyWindowId + "_alt1").value) + '"';
                } catch (e) {
                    imageAlt = 'alt=""';
                }
                try {
                    imageCaption = t._htmlspecialchars(getObject(t.propertyWindowId + "_caption1").value);
                } catch (e) {
                    imageCaption = '';
                }

                var longdesc = t.propertyHeader + '|' + t.propertyFilename1 + '|' + imageSize + imageAlt + '|' + imageCaption;

                // 2번 이미지.
                if (objectCount > 1) {
                    imageSize = "";
                    imageAlt = "";
                    imageCaption = "";

                    try {
                        var value = parseInt(getObject(t.propertyWindowId + "_width2").value);
                        if (!isNaN(value) && value > 0 && value < 10000)
                            imageSize = 'width="' + value + '" height="' + parseInt(value * t.propertyCurrentProportion2) + '" ';
                        ;
                    } catch (e) {
                    }
                    try {
                        if (t._isImageFile(t.propertyFilename2))
                            imageAlt = 'alt="' + t._htmlspecialchars(getObject(t.propertyWindowId + "_alt2").value) + '"';
                    } catch (e) {
                        imageAlt = 'alt = ""';
                    }
                    try {
                        imageCaption = t._htmlspecialchars(getObject(t.propertyWindowId + "_caption2").value);
                    } catch (e) {
                        imageCaption = '';
                    }

                    longdesc += '|' + t.propertyFilename2 + '|' + imageSize + imageAlt + '|' + imageCaption;
                }

                // 3번 이미지.
                if (objectCount > 2) {
                    imageSize = "";
                    imageAlt = "";
                    imageCaption = "";

                    try {
                        var value = parseInt(getObject(t.propertyWindowId + "_width3").value);
                        if (!isNaN(value) && value > 0 && value < 10000)
                            imageSize = 'width="' + value + '" height="' + parseInt(value * t.propertyCurrentProportion3) + '" ';
                    } catch (e) {
                    }
                    try {
                        if (t._isImageFile(t.propertyFilename3))
                            imageAlt = 'alt="' + t._htmlspecialchars(getObject(t.propertyWindowId + "_alt3").value) + '"';
                    } catch (e) {
                        imageAlt = 'alt = ""';
                    }
                    try {
                        imageCaption = t._htmlspecialchars(getObject(t.propertyWindowId + "_caption3").value);
                    } catch (e) {
                        imageCaption = '';
                    }

                    longdesc += '|' + t.propertyFilename3 + '|' + imageSize + imageAlt + '|' + imageCaption;
                }

                obj.setAttribute("longDesc", longdesc);
            }
            else if (t.propertyWindowId.indexOf(t.id + "propertyObject") == 0) {
                var objectCount = t.propertyWindowId.charAt(t.propertyWindowId.length - 1);

                var longdesc = t.propertyHeader + '|' + t.propertyFilename1 + '||' + t._htmlspecialchars(getObject(t.propertyWindowId + "_caption1").value);

                if (objectCount > 1)
                    longdesc += '|' + t.propertyFilename2 + '||' + t._htmlspecialchars(getObject(t.propertyWindowId + "_caption2").value);

                if (objectCount > 2)
                    longdesc += '|' + t.propertyFilename3 + '||' + t._htmlspecialchars(getObject(t.propertyWindowId + "_caption3").value);

                obj.setAttribute("longDesc", longdesc);
            }
            else if (t.propertyWindowId.indexOf(t.id + "propertyiMazing") == 0) {
                var list = getObject(t.id + "propertyiMazing_list");
                var longdesc = "iMazing|";

                for (var i = 0; i < list.length; i++)
                    longdesc += list[i].value.substring(0, list[i].value.indexOf("|")) + "||";

                obj.removeAttribute("width");
                obj.removeAttribute("height");
                obj.style.width = "auto";
                obj.style.height = "auto";

                var size = "";

                var width = parseInt(getObject(t.id + "propertyiMazing_width").value);
                if (!isNaN(width) && width > 0 && width < 10000) {
                    obj.style.width = width + "px";
                    size = 'width="' + width + '" ';
                }

                var height = parseInt(getObject(t.id + "propertyiMazing_height").value);
                if (!isNaN(height) && height > 0 && height < 10000) {
                    obj.style.height = height + "px";
                    size += 'height="' + height + '"';
                }

                if (isNaN(width) && isNaN(height)) {
                    obj.style.width = obj.style.height = 100 + "px";
                    size = 'width="100" height="100"';
                }

                longdesc += size;
                longdesc += ' frame="' + getObject(t.id + "propertyiMazing_frame").value + '"';
                longdesc += ' transition="' + getObject(t.id + "propertyiMazing_tran").value + '"';
                longdesc += ' navigation="' + getObject(t.id + "propertyiMazing_nav").value + '"';
                longdesc += ' slideshowInterval="' + getObject(t.id + "propertyiMazing_sshow").value + '"';
                longdesc += ' page="' + getObject(t.id + "propertyiMazing_page").value + '"';
                longdesc += ' align="' + getObject(t.id + "propertyiMazing_align").value + '"';
                longdesc += ' skinPath="' + servicePath + '/script/gallery/iMazing/"';
                longdesc += "|" + t._htmlspecialchars(getObject(t.id + "propertyiMazing_caption").value);

                obj.setAttribute("longDesc", longdesc);
            }
            else if (t.propertyWindowId.indexOf(t.id + "propertyGallery") == 0) {
                var list = getObject(t.id + "propertyGallery_list");
                var longdesc = "Gallery|";

                if (list.selectedIndex != -1) {
                    var caption = getObject(t.id + "propertyGallery_caption").value.replaceAll("|", "");
                    var tmp = list[list.selectedIndex].value.split("|");
                    list[list.selectedIndex].value = tmp[0] + "|" + caption;
                }

                for (var i = 0; i < list.length; i++)
                    longdesc += t._htmlspecialchars(list[i].value) + "|";

                obj.removeAttribute("width");
                obj.removeAttribute("height");
                obj.style.width = "auto";
                obj.style.height = "auto";

                var size = "";

                var width = parseInt(getObject(t.id + "propertyGallery_width").value);
                if (!isNaN(width) && width > 0 && width < 10000) {
                    obj.style.width = width + "px";
                    size = 'width="' + width + '" ';
                }

                var height = parseInt(getObject(t.id + "propertyGallery_height").value);
                if (!isNaN(height) && height > 0 && height < 10000) {
                    obj.style.height = height + "px";
                    size += 'height="' + height + '"';
                }

                if (isNaN(width) && isNaN(height)) {
                    obj.style.width = obj.style.height = 100 + "px";
                    size = 'width=100 height=100';
                }

                longdesc += trim(size) + "|";

                obj.setAttribute("longDesc", longdesc);
            }
            else if (t.propertyWindowId.indexOf(t.id + "propertyJukebox") == 0) {
                var list = getObject(t.id + "propertyJukebox_list");
                var longdesc = "Jukebox|";

                if (list.selectedIndex != -1) {
                    var title = getObject(t.id + "propertyJukebox_title").value.replaceAll("|", "");
                    var tmp = list[list.selectedIndex].value.split("|");
                    list[list.selectedIndex].value = tmp[0] + "|" + title;
                }

                for (var i = 0; i < list.length; i++)
                    longdesc += list[i].value + "|";

                longdesc += "autoplay=" + (getObject(t.id + "propertyJukebox_autoplay").checked ? 1 : 0);
                longdesc += " visible=" + (getObject(t.id + "propertyJukebox_visibility").checked ? 1 : 0);

                obj.setAttribute("longDesc", longdesc + "|");
            }
        }
        else if (obj.tagName && obj.tagName.toLowerCase() == "div" && obj.getAttribute("more") != null && obj.getAttribute("less") != null) {
            obj.setAttribute("more", t._htmlspecialchars(getObject(t.id + "propertyMoreLess_more").value));
            obj.setAttribute("less", t._htmlspecialchars(getObject(t.id + "propertyMoreLess_less").value));
        }
    },
    getEditorProperty: function (/*$alt*/) {
        //$fixPosition = getUserSetting('editorPropertyPositionFix', 0);
        var t = this;
        var fixPosition = editor.fixPosition;
        var hasGD = true;
        // object
        html = ////
            '<div id="__ID__propertyInsertObject" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyInsertObject-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyInsertObject-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('오브젝트 삽입') + '</h4>' +
            '<div class="group">' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyInsertObject_type">' + _t('유형') + '</label></dt>' +
            '<dd>' +
            '<select id="__ID__propertyInsertObject_type" style="width: 105px" onchange="getObject(\'__ID__propertyInsertObject_part_url\').style.display=getObject(\'__ID__propertyInsertObject_part_raw\').style.display=\'none\';getObject(\'__ID__propertyInsertObject_part_\' + t.value).style.display = \'block\'">' +
            '<option value="url">' + _t('주소입력') + '</option>' +
            '<option value="raw">' + _t('코드 붙여넣기') + '</option>' +
            '</select>' +
            '</dd>' +
            '</dl>' +
            '<dl id="__ID__propertyInsertObject_part_url" class="line">' +
            '<dt class="property-name"><label for="__ID__propertyInsertObject_url">' + _t('파일 주소') + '</label></dt>' +
            '<dd><input type="text" id="__ID__propertyInsertObject_url" class="input-text" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl id="__ID__propertyInsertObject_part_raw" class="line" style="display: none">' +
            '<dt class="property-name"><label for="__ID__propertyInsertObject_chunk">' + _t('코드') + '</label></dt>' +
            '<dd>' +
            '<textarea id="__ID__propertyInsertObject_chunk" cols="30" rows="10"></textarea>' +
            '</dd>' +
            '</dl>' +
            '</div>' +
            '<div class="button-box">' +
            '<span class="insert-button button" onclick="__EDITOR__.command(\'InsertObject\'); return false"><span class="text">' + _t('삽입하기') + '</span></span>' +
            '<span class="divider"> | </span>' +
            '<span class="cancel-button button" onclick="__EDITOR__.command(\'HideObjectBlock\'); return false"><span class="text">' + _t('취소하기') + '</span></span>' +
            '</div>' +
            '</div>';

        // one image
        html += ////
            '<div id="__ID__propertyImage1" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyImage1-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyImage1-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('Image') + '</h4>' +
            '<div class="group">' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage1_width1">' + _t('폭') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyImage1_width1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage1_alt1">' + _t('대체 텍스트') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyImage1_alt1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage1_caption1">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyImage1_caption1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '</div>' +
            '</div>';

        // two images
        html += ////
            '<div id="__ID__propertyImage2" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyImage2-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyImage2-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('Image') + '</h4>' +
            '<div class="group">' +
            '<div class="title">' + _t('첫번째 이미지') + '</div>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage2_width1">' + _t('폭') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyImage2_width1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage2_alt1">' + _t('대체 텍스트') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyImage2_alt1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage2_caption1">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyImage2_caption1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '</div>' +
            '<div class="group">' +
            '<div class="title">' + _t('두번째 이미지') + '</div>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage2_width2">' + _t('폭') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyImage2_width2" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage2_alt2">' + _t('대체 텍스트') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyImage2_alt2" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage2_caption2">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyImage2_caption2" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '</div>' +
            '</div>';

        // three images
        html += ////
            '<div id="__ID__propertyImage3" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyImage3-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyImage3-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('Image') + '</h4>' +
            '<div class="group">' +
            '<div class="title">' + _t('첫번째 이미지') + '</div>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage3_width1">' + _t('폭') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyImage3_width1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage3_alt1">' + _t('대체 텍스트') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyImage3_alt1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage3_caption1">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyImage3_caption1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '</div>' +
            '<div class="group">' +
            '<div class="title">' + _t('두번째 이미지') + '</div>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage3_width2">' + _t('폭') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyImage3_width2" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage3_alt2">' + _t('대체 텍스트') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyImage3_alt2" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage3_caption2">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyImage3_caption2" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '</div>' +
            '<div class="group">' +
            '<div class="title">' + _t('세번째 이미지') + '</div>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage3_width3">' + _t('폭') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyImage3_width3" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage3_alt3">' + _t('대체 텍스트') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyImage3_alt3" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyImage3_caption3">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyImage3_caption3" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '</div>' +
            '</div>';

        // object
        html += ////
            '<div id="__ID__propertyObject" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyObject-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyObject-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('Object') + '</h4>' +
            '<div class="group">' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject_width">' + _t('폭') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyObject_width" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject_height">' + _t('높이') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyObject_height" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject_chunk">' + _t('코드') + '</label></dt>' +
            '<dd><textarea id="__ID__propertyObject_chunk" class="propertyObject_chunk" cols="30" rows="10" onkeyup="__EDITOR__.setProperty()"></textarea></dd>' +
            '</dl>' +
            '</div>' +
            '</div>';

        // one video
        html += ////
            '<div id="__ID__propertyObject1" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyObject1-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyObject1-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('Object 1') + '</h4>' +
            '<div class="group">' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject1_caption1">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyObject1_caption1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject1_filename1">' + _t('파일명(수정불가)') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyObject1_filename1" readonly="readonly" /></dd>' +
            '</dl>' +
            '</div>' +
            '</div>';

        // two videoes
        html += ////
            '<div id="__ID__propertyObject2" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyObject2-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyObject2-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('Object') + '</h4>' +
            '<div class="group">' +
            '<div class="title">' + _t('첫번째 오브젝트') + '</div>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject2_caption1">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyObject2_caption1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject2_filename1">' + _t('파일명') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyObject2_filename1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '</div>' +
            '<div class="group">' +
            '<div class="title">' + _t('두번째 오브젝트') + '</div>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject2_caption2">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyObject2_caption2" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject2_filename2">' + _t('파일명') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyObject2_filename2" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '</div>' +
            '</div>';

        // three videoes
        html += ////
            '<div id="__ID__propertyObject3" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyObject3-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyObject3-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('Object') + '</h4>' +
            '<div class="group">' +
            '<div class="title">' + _t('첫번째 오브젝트') + '</div>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject3_caption1">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyObject3_caption1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject3_filename1">' + _t('파일명') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyObject3_filename1" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '</div>' +
            '<div class="group">' +
            '<div class="title">' + _t('두번째 오브젝트') + '</div>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject3_caption2">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyObject3_caption2" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject3_filename2">' + _t('파일명') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyObject3_filename2" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '</div>' +
            '<div class="group">' +
            '<div class="title">' + _t('세번째 오브젝트') + '</div>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject3_caption3">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyObject3_caption3" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyObject3_filename3">' + _t('파일명') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyObject3_filename3" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '</div>' +
            '</div>';

        // iMazing
        html += ////
            '<div id="__ID__propertyiMazing" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyiMazing-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyiMazing-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('iMazing') + '</h4>' +
            '<div class="group">' +
            '<div class="title">' + _t('설정') + '</div>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyiMazing_width">' + _t('폭') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyiMazing_width" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyiMazing_height">' + _t('높이') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyiMazing_height" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyiMazing_frame">' + _t('테두리') + '</label></dt>' +
            '<dd>' +
            '<select id="__ID__propertyiMazing_frame" onchange="__EDITOR__.setProperty()">' +
            '<option value="net_imazing_frame_none">' + _t('테두리 없음') + '</option>' +
            '</select>' +
            '</dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyiMazing_tran">' + _t('장면전환효과') + '</label></dt>' +
            '<dd>' +
            '<select id="__ID__propertyiMazing_tran" onchange="__EDITOR__.setProperty()">' +
            '<option value="net_imazing_show_window_transition_none">' + _t('효과없음') + '</option>' +
            '<option value="net_imazing_show_window_transition_alpha">' + _t('투명전환') + '</option>' +
            '<option value="net_imazing_show_window_transition_contrast">' + _t('플래쉬') + '</option>' +
            '<option value="net_imazing_show_window_transition_sliding">' + _t('슬라이딩') + '</option>' +
            '</select>' +
            '</dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyiMazing_nav">' + _t('내비게이션') + '</label></dt>' +
            '<dd>' +
            '<select id="__ID__propertyiMazing_nav" onchange="__EDITOR__.setProperty()">' +
            '<option value="net_imazing_show_window_navigation_none">' + _t('기본') + '</option>' +
            '<option value="net_imazing_show_window_navigation_simple">' + _t('심플') + '</option>' +
            '<option value="net_imazing_show_window_navigation_sidebar">' + _t('사이드바') + '</option>' +
            '</select>' +
            '</dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name">' + _t('슬라이드쇼 간격') + '</dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyiMazing_sshow" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name">' + _t('화면당 이미지 수') + '</dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyiMazing_page" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyiMazing_align">' + _t('정렬방법') + '</label></dt>' +
            '<dd>' +
            '<select id="__ID__propertyiMazing_align" onchange="__EDITOR__.setProperty()">' +
            '<option value="h">' + _t('가로') + '</option>' +
            '<option value="v">' + _t('세로') + '</option>' +
            '</select>' +
            '</dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyiMazing_caption">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyiMazing_caption" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '</div>' +
            '<div class="group">' +
            '<div class="title">' + _t('파일') + '</div>' +
            '<dl class="file-list-line line">' +
            '<dd>' +
            '<select id="__ID__propertyiMazing_list" class="file-list" size="10" onchange="__EDITOR__.listChanged(\'propertyiMazing_list\')" onclick="__EDITOR__.listChanged(\'propertyiMazing_list\')"></select>' +
            '</dd>' +
            '</dl>' +
            '<div class="button-box">' +
            '<span class="up-button button" onclick="__EDITOR__.moveUpFileList(\'__ID__propertyiMazing_list\'); return false" title="' + _t('선택한 항목을 위로 이동합니다.') + '"><span class="text">' + _t('위로') + '</span></span>' +
            '<span class="divider"> | </span>' +
            '<span class="dn-button button" onclick="__EDITOR__.moveDownFileList(\'__ID__propertyiMazing_list\'); return false" title="' + _t('선택한 항목을 아래로 이동합니다.') + '"><span class="text">' + _t('아래로') + '</span></span>' +
            '</div>' +
            '<div id="__ID__propertyiMazing_preview" class="preview-box" style="display: none;"></div>' +
            '</div>' +
            '</div>';

        // gallery
        html += ////
            '<div id="__ID__propertyGallery" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyGallery-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyGallery-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('Gallery') + '</h4>' +
            '<div class="group">' +
            '<div class="title">' + _t('설정') + '</div>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyGallery_width">' + _t('최대너비') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyGallery_width" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyGallery_height">' + _t('최대높이') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyGallery_height" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl id="__ID__propertyGallery_captionLine" class="line" style="display: none;">' +
            '<dt class="property-name"><label for="__ID__propertyGallery_caption">' + _t('자막') + '</label></dt>' +
            '<dd><textarea class="input-text" id="__ID__propertyGallery_caption" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);"></textarea></dd>' +
            '</dl>' +
            '</div>' +
            '<div class="group">' +
            '<div class="title">' + _t('파일') + '</div>' +
            '<dl class="file-list-line line">' +
            '<dd>' +
            '<select id="__ID__propertyGallery_list" class="file-list" size="10" onchange="__EDITOR__.listChanged(\'propertyGallery_list\')" onclick="__EDITOR__.listChanged(\'propertyGallery_list\'); return false"></select>' +
            '</dd>' +
            '</dl>' +
            '<div class="button-box">' +
            '<span class="up-button button" onclick="__EDITOR__.moveUpFileList(\'__ID__propertyGallery_list\')" title="' + _t('선택한 항목을 위로 이동합니다.') + '"><span class="text">' + _t('위로') + '</span></span>' +
            '<span class="divider"> | </span>' +
            '<span class="dn-button button" onclick="__EDITOR__.moveDownFileList(\'__ID__propertyGallery_list\')" title="' + _t('선택한 항목을 아래로 이동합니다.') + '"><span class="text">' + _t('아래로') + '</span></span>' +
            '</div>' +
            '<div id="__ID__propertyGallery_preview" class="preview-box" style="display: none;"></div>' +
            '</div>' +
            '</div>';

        // jukebox
        html += ////
            '<div id="__ID__propertyJukebox" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyJukebox-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyJukebox-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('Jukebox') + '</h4>' +
            '<div class="group">' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyJukebox_title">' + _t('제목') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyJukebox_title" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dd><input type="checkbox" id="__ID__propertyJukebox_autoplay" onclick="__EDITOR__.setProperty()" /> <label for="__ID__propertyJukebox_autoplay">' + _t('자동재생') + '</label></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dd><input type="checkbox" id="__ID__propertyJukebox_visibility" onclick="__EDITOR__.setProperty()" /> <label for="__ID__propertyJukebox_visibility">' + _t('플레이어 보이기') + '</label></dd>' +
            '</dl>' +
            '</div>' +
            '<div class="group">' +
            '<div class="title">' + _t('파일') + '</div>' +
            '<dl class="file-list-line line">' +
            '<dd>' +
            '<select id="__ID__propertyJukebox_list" class="file-list" size="10" onchange="__EDITOR__.listChanged(\'propertyJukebox_list\')" onclick="__EDITOR__.listChanged(\'propertyJukebox_list\')"></select>' +
            '</dd>' +
            '</dl>' +
            '<div class="button-box">' +
            '<span class="up-button button" onclick="__EDITOR__.moveUpFileList(\'__ID__propertyJukebox_list\')" title="' + _t('선택한 항목을 위로 이동합니다.') + '"><span class="text">' + _t('위로') + '</span></span>' +
            '<span class="divider"> | </span>' +
            '<span class="dn-button button" onclick="__EDITOR__.moveDownFileList(\'__ID__propertyJukebox_list\')" title="' + _t('선택한 항목을 아래로 이동합니다.') + '"><span class="text">' + _t('아래로') + '</span></span>' +
            '</div>' +
            '</div>' +
            '</div>';

        // embedded things
        html += ////
            '<div id="__ID__propertyEmbed" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyEmbed-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyEmbed-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('Embed') + '</h4>' +
            '<div class="group">' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyEmbed_width">' + _t('폭') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyEmbed_width" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyEmbed_height">' + _t('높이') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyEmbed_height" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyEmbed_src"><acronym class="text" title="Uniform Resource Locator">URL</acronym></label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyEmbed_src" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '</div>' +
            '</div>';

        // flash object
        html += ////
            '<div id="__ID__propertyFlash" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyFlash-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyFlash-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('Embed') + '</h4>' +
            '<div class="group">' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyFlash_width">' + _t('폭') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyFlash_width" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyFlash_height">' + _t('높이') + '</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyFlash_height" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyFlash_src">URL</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyFlash_src" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '</div>' +
            '</div>';

        // more/less
        html += ////
            '<div id="__ID__propertyMoreLess" class="entry-editor-property" style="display: none;">' +
            '<div class="entry-editor-property-option">' +
            '<input type="checkbox" class="checkbox" id="__ID__propertyMoreLess-fix-position" onclick="__EDITOR__.setPropertyPosition(1); return true;"' + (fixPosition ? ' checked="checked"' : '') + '/>' +
            '<label for="__ID__propertyMoreLess-fix-position">' + _t('위치 고정') + '</label>' +
            '</div>' +
            '<h4>' + _t('More/Less') + '</h4>' +
            '<div class="group">' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyMoreLess_more">More Text</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyMoreLess_more" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '<dl class="line">' +
            '<dt class="property-name"><label for="__ID__propertyMoreLess_less">Less Text</label></dt>' +
            '<dd><input type="text" class="input-text" id="__ID__propertyMoreLess_less" onkeyup="__EDITOR__.setProperty()" onkeypress="return preventEnter(event);" /></dd>' +
            '</dl>' +
            '</div>' +
            '</div>';

        html = html.replace(new RegExp('__EDITOR__', 'g'), 'editor.plugins.TTMLsupport');
        html = html.replace(new RegExp('__ID__', 'g'), 'tinyMCE');
        var div = document.createElement('div');
        div.id = 'property-section';
        div.className = 'section';
        div.innerHTML = html;
        return div;
    },
    moveUpFileList: function (id) {
        var list = getObject(id);
        var t = this;
        if (list && list.selectedIndex > 0) {
            var value = list[list.selectedIndex - 1].value;
            var text = list[list.selectedIndex - 1].text;

            list[list.selectedIndex - 1].value = list[list.selectedIndex].value;
            list[list.selectedIndex - 1].text = list[list.selectedIndex].text;
            list[list.selectedIndex].value = value;
            list[list.selectedIndex].text = text;
            list.selectedIndex--;
            t.setProperty();
            t.listChanged(id);
        }
    },

    moveDownFileList: function (id) {
        var list = getObject(id);
        var t = this;
        if (list && list.selectedIndex < list.length - 1) {
            var value = list[list.selectedIndex + 1].value;
            var text = list[list.selectedIndex + 1].text;

            list[list.selectedIndex + 1].value = list[list.selectedIndex].value;
            list[list.selectedIndex + 1].text = list[list.selectedIndex].text;
            list[list.selectedIndex].value = value;
            list[list.selectedIndex].text = text;
            list.selectedIndex++;
            t.setProperty();
            t.listChanged(id);
        }
    },
    listChanged: function (id) {
        var t = this;
        if (id == "propertyGallery_list") {
            var list = getObject(t.id + "propertyGallery_list");
            if (list.selectedIndex > -1) {
                var values = list[list.selectedIndex].value.split("|");
                getObject(t.id + "propertyGallery_preview").style.display = "block";
                getObject(t.id + "propertyGallery_preview").innerHTML = '<img src="' + t.propertyFilePath + values[0] + '" width="198" />';
                getObject(t.id + "propertyGallery_captionLine").style.display = "block";
                getObject(t.id + "propertyGallery_caption").value = values[1];
            }
        }
        else if (id == "propertyiMazing_list") {
            var list = getObject(t.id + "propertyiMazing_list");
            if (list.selectedIndex > -1) {
                var values = list[list.selectedIndex].value.split("|");
                getObject(t.id + "propertyiMazing_preview").style.display = "block";
                getObject(t.id + "propertyiMazing_preview").innerHTML = '<img src="' + t.propertyFilePath + values[0] + '" width="198" />';
            }
        }
        else if (id == "propertyJukebox_list") {
            var list = getObject(t.id + "propertyJukebox_list");
            if (list.selectedIndex > -1) {
                var values = list[list.selectedIndex].value.split("|");
                getObject(t.id + "propertyJukebox_title").value = values[1];
            }
        }
    },
    setPropertyPosition: function (flag) {
        var t = this;
        if (win = document.getElementById(t.propertyWindowId)) {
            var isFixed = document.getElementById(t.propertyWindowId + "-fix-position").checked;
            if (flag) {
                if (isFixed)
                    setUserSetting("editorPropertyPositionFix", 1);
                else
                    setUserSetting("editorPropertyPositionFix", 0);
                for (var i in t.propertyNames)
                    document.getElementById(t.id + t.propertyNames[i] + "-fix-position").checked = isFixed;
            }
            if (isFixed)
                win.style.top = "120px";
            else {
                if (t.propertyOffsetTop === null)
                    t.propertyOffsetTop = getOffsetTop(win);
                if (t.scrollTop === null)
                    t.scrollTop = STD.getScrollTop();
                scrollHeight = STD.getScrollTop() - t.scrollTop;
                if (STD.getScrollTop() > t.propertyOffsetTop - 15) {
                    if (win.offsetHeight > getWindowCleintHeight()) {
                        if (scrollHeight > 0) { // scroll down
                            win.style.top = Math.max(9, Math.min(3000, STD.getScrollTop() + getWindowCleintHeight() - t.propertyOffsetTop - win.offsetHeight)) + "px";
                        }
                        else { // scroll up
                            win.style.top = Math.max(9, Math.min(3000, STD.getScrollTop() + getWindowCleintHeight() - t.propertyOffsetTop - win.offsetHeight)) + "px";
                        }
                    }
                    else
                        win.style.top = Math.min(3000, 24 + STD.getScrollTop() - t.propertyOffsetTop) + "px";
                }
                else
                    win.style.top = "120px";
                t.scrollTop = STD.getScrollTop();
            }
        }
    },
    /** Attachment button binder **/
    addObject: function (data) {
        var t = this;
        var objects = data.objects;
        switch (data.mode) {
            case 'Image1L':
            case 'Image1C':
            case 'Image1R':
                if (t._isMediaFile(objects[0][0])) {
                    getObject(t.id + "propertyInsertObject_type").value = "url";
                    getObject(t.id + "propertyInsertObject_url").value = blogURL + "/attachment/" + objects[0][0];
                    t.command("InsertObject");
                    return true;
                } else {

                }
            // *fall through*
            case 'Image2C':
            case 'Image3C':
                try {
                    if (editor.editorMode == 'tinymce') {
                        var src = servicePath + adminSkin + "/image/spacer.gif";
                        var moreattrs = '';
                        var longdesc;
                        if (data.mode == 'Image1L' || data.mode == 'Image1C' || data.mode == 'Image1R') {
                            if (new RegExp("\.(jpe?g|gif|png|bmp|webm|svg)$", "i").test(objects[0][0])) {
                                src = t.propertyFilePath + objects[0][0];
                                moreattrs = objects[0][1];
                            } else {
                                objects[0][1] = '';
                                moreattrs = t.styleUnknown;
                            }
                            longdesc = data.mode.substr(5) + '|' + objects[0][0] + '|' + objects[0][1] + '|' + objects[0][2].replaceAll("|", "");
                        } else {
                            moreattrs = 'width="' + (parseInt(data.mode.substr(5)) * 100) + '" height="100"';
                            longdesc = data.mode.substr(5);
                            for (var i = 0; objects[i]; ++i) {
                                longdesc += '|' + objects[i][0] + '|' + objects[i][1] + '|' + objects[i][2];
                            }
                        }
    
                        var className = {
                            Image1L: 'tatterImageLeft', Image1C: 'tatterImageCenter', Image1R: 'tatterImageRight',
                            Image2C: 'tatterImageDual', Image3C: 'tatterImageTriple'
                        }[data.mode];
                        var prefix = '<img class="' + className + '" src="' + src + '" ' + moreattrs + ' longdesc="' + t.addQuot(longdesc) + '" />';
                        t.command("Raw", prefix);
                        return true;
                    }
                } catch (e) {
                }

                var code = data.mode.substr(5);
                for (var i = 0; objects[i]; ++i) {
                    code += '|' + objects[i][0] + '|' + objects[i][1] + '|' + objects[i][2];
                }
                t.insert_tag(codemirror, '[##_' + code + '_##]', "");
                return true;

            case 'ImageFree':

                var prefix = '';
                for (var i = 0; objects[i]; ++i) {
                    if(editor.editorMode == 'tinymce') {
                        prefix += '<img class="tatterImageFree" src="' + t.propertyFilePath + objects[i][0] + '" longdesc="[##_ATTACH_PATH_##]/' + objects[i][0] + '" ' + objects[i][1] + ' />';
                    } else {
                        prefix += '<img src="[##_ATTACH_PATH_##]/' + objects[i][0] + '" ' + objects[i][1] + ' />';
                    }
                }
                t.command("Raw", prefix);
                return true;

            case 'Imazing':
            case 'Gallery':
            case 'Jukebox':
                var code = (data.mode == 'Imazing' ? 'iMazing' : data.mode);
                for (var i = 0; objects[i]; ++i) {
                    code += '|' + objects[i][0] + '|' + objects[i][1];
                }
                switch (data.mode) {
                    case 'Imazing':
                        code += '|' + data.properties + '|';
                        break;
                    case 'Gallery':
                        code += '|width="400" height="300"';
                        break;
                    case 'Jukebox':
                        code += '|autoplay=0 visible=1|';
                        break;
                }

                try {
                    if(editor.editorMode == 'tinymce') {
                        var className = 'tatter' + data.mode;
                        var widthheight = (data.mode == 'Jukebox' ? 'width="200" height="30"' : 'width="400" height="300"');
                        t.command("Raw", '<img class="' + className + '" src="' + servicePath + adminSkin + '/image/spacer.gif" ' + widthheight + ' longdesc="' + code + '" />');
                        return true;
                    }
                } catch (e) {
                }
                t.insert_tag(codemirror, '[##_' + code + '_##]', '');
                return true;
        }
        return false;
    },
    command: function (command, value1, value2) {
        var t = this;

        switch (command) {
            case "MoreLessBlock":
                if(editor.editorMode == 'tinymce') {
                    t.command("Raw", '<div class="tattermoreless" more=" more.. " less=" less.. ">&nbsp;', "</div>");
                } else {
                    t.insert_tag(codemirror, "[#M_ more.. | less.. | ", "_M#]");
                }
                break;
            case "InsertObject":
                if (getObject(t.id + "propertyInsertObject_type").value == "url") {
                    var url = getObject(t.id + "propertyInsertObject_url").value.trim();
                    if (url == "") {
                        alert(s_enterURL);
                        return;
                    }
                    var ext = new RegExp("\\.(\\w+)(?:$|\\?)").exec(url);
                    ext = (ext && ext.length == 2) ? ext[1].toLowerCase() : "";
                    var code = "";
                    if (ext == "swf" || ext == "") {
                        code = '<object classid="clsid:d27cdb6e-ae6d-11cf-96b8-444553540000" codebase="http://download.macromedia.com/pub/shockwave/cabs/flash/swflash.cab#version=7,0,0,0" width="400" height="300">' +
                        '<param name="wmode" value="transparent"/>' +
                        '<param name="movie" value="' + url + '"/>' +
                        '<!--[if !IE]> <-->' +
                        '<object type="application/x-shockwave-flash" transparent="yes" data="' + url + '" width="400" height="300">' +
                        '<p><a href="' + url + '">[Flash] ' + url + '</a></p>' +
                        '<\/object>' +
                        '<!--> <![endif]-->' +
                        '<\/object>';
                    }
                    else {
                        var type = null;

                        switch (ext) {
                            case "mp3":
                                type = "audio/mpeg";
                                break;
                            case "mid":
                                type = "audio/x-ms-mid";
                                break;
                            case "wav":
                                type = "audio/x-ms-wav";
                                break;
                            case "wax":
                                type = "audio/x-ms-wax";
                                break;
                            case "wma":
                                type = "audio/x-ms-wma";
                                break;
                            case "avi":
                                type = "video/x-msvideo";
                                break;
                            case "asf":
                            case "asx":
                                type = "video/x-ms-asf";
                                break;
                            case "mov":
                                type = "video/quicktime";
                                break;
                            case "mpg":
                            case "mpeg":
                                type = "video/x-ms-mpeg";
                                break;
                            case "wmv":
                                type = "video/x-ms-wmv";
                                break;
                            case "wm":
                                type = "video/x-ms-wm";
                                break;
                            case "wvx":
                                type = "video/x-ms-wvx";
                                break;
                        }
                        if (type === null) {
                            alert(s_unknownFileType);
                            return;
                        }
                        else if (type == "video/quicktime") {
                            code = '<object classid="clsid:02BF25D5-8C17-4B23-BC80-D3488ABDDC6B" codebase="http://www.apple.com/qtactivex/qtplugin.cab" width="320" height="260">' +
                            '<param name="src" value="' + url + '"/>' +
                            '<param name="controller" value="true"/>' +
                            '<param name="autoplay" value="false"/>' +
                            '<!--[if !IE]>-->' +
                            '<object type="video/quicktime" data="' + url + '" width="320" height="260">' +
                            '<param name="autoplay" value="false"/>' +
                            '<param name="controller" value="true"/>' +
                            '</object>' +
                            '<!--<![endif]-->' +
                            '</object>';
                        }
                        else {
                            code = '<object classid="clsid:22D6F312-B0F6-11D0-94AB-0080C74C7E95">' +
                            '<param name="Filename" value="' + url + '"/>' +
                            '<param name="AutoStart" value="false"/>' +
                            '<!--[if !IE]> <-->' +
                            '<object type="' + type + '" data="' + url + '" width="320" height="' + (type == "audio/mpeg" ? "20" : "240") + '">' +
                            '<param name="AutoStart" value="0"/>' +
                            '<embed pluginspage="http://www.microsoft.com/Windows/Downloads/Contents/Products/MediaPlayer/" src="' + url + '" width="320" height="' + (type == "audio/mpeg" ? "20" : "240") + '" type="application/x-mplayer2" autostart="0"></embed>' +
                            '</object>' +
                            '<!--> <![endif]-->' +
                            '</object>';
                        }
                    }
                }
                else {
                    var code = getObject(t.id + "propertyInsertObject_chunk").value.trim();
                    if (!(new RegExp("^<object(?:.|\\s)*</object>$", "i").test(code))) {
                        alert(s_enterObjectTag);
                        return;
                    }
                    lowercasedCode = code.toLowerCase();
                    if (lowercasedCode.count("<object") == 0 || lowercasedCode.count("<object") != lowercasedCode.count("</object>")) {
                        alert(s_enterCorrectObjectTag);
                        return;
                    }
                }
                if (editor.editorMode == 'tinymce') {
                    t.command("Raw", '<img class="tatterObject" src="' + servicePath + adminSkin + '/image/spacer.gif"' + t.parseImageSize(code, "string", "css") + ' longDesc="' + t.objectSerialize(code) + '" />', "");
                } else {
                    t.insert_tag(codemirror, code, "");
                }
                getObject(t.id + "propertyInsertObject").style.display = "none";
                break;

            case "Raw":
                value2 = (typeof value2 == "undefined") ? "" : value2;
                if (editor.editorMode == 'tinymce') {
                    selectedContent = editor.selection.getContent();
                    editor.execCommand('mceInsertContent', false, value1 + selectedContent + value2);
                } else {
                    t.insert_tag(codemirror, value1, value2);
                }
                break;
            case "ToggleTextarea":
                if (editor.editorMode == 'tinymce') {
                    editor.save();
                    jQuery(".mce-edit-area").hide();
                    jQuery(".mce-statusbar").hide();
                    document.getElementById('editWindow').style.display = "block";
                    document.getElementById('editWindow').style.width = "100%";
                    editor.editorMode = 'codemirror';
                } else {
                    editor.load();
                    document.getElementById('editWindow').style.display = "none";
                    jQuery(".mce-edit-area").show();
                    jQuery(".mce-statusbar").show();
                    editor.editorMode = 'tinymce';
                }
                break;
        }
    },
    insert_tag: function(cm, prefix, postfix) {
        selection = cm.getSelection();
        if (selection) {
            cm.replaceSelection(prefix+selection+postfix);
        } else {
            cm.setValue(cm.getValue()+prefix+postfix);
        }
        return true;
/*
        if (isSafari && !isMinSafari3)
            var selection = window.getSelection;
        else
            var selection = document.selection;
        
        if (selection) {
            if (oTextarea.createTextRange && oTextarea.currentPos) {
                oTextarea.currentPos.text = prefix + oTextarea.currentPos.text + postfix;
                oTextarea.focus();
                savePosition(oTextarea);
            }
            else
                oTextarea.value = oTextarea.value + prefix + postfix;
        }
        else if (oTextarea.selectionStart != null && oTextarea.selectionEnd != null) {
            var s1 = oTextarea.value.substring(0, oTextarea.selectionStart);
            var s2 = oTextarea.value.substring(oTextarea.selectionStart, oTextarea.selectionEnd);
            var s3 = oTextarea.value.substring(oTextarea.selectionEnd);
            oTextarea.value = s1 + prefix + s2 + postfix + s3;
        }
        else
            oTextarea.value += prefix + postfix;
            
        return true;*/
    },
    savePosition: function(oTextarea) {
        if (oTextarea.createTextRange)
            oTextarea.currentPos = document.selection.createRange().duplicate();
    },
    /** Plugin information **/
    getInfo: function () {
        return {
            longname: 'TTML Support',
            author: 'Jeongkyu Shin',
            authorurl: 'https://www.textcube.org',
            infourl: 'http://github.com/needlworks/textcube',
            version: "3.1.0"
        };
    }
});

// Register plugin
tinymce.PluginManager.add('TTMLsupport', tinymce.Textcube.TTMLsupport);

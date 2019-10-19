/* squared.base 1.3.1
   https://github.com/anpham6/squared */

(function (global, factory) {
    typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports) :
    typeof define === 'function' && define.amd ? define(['exports'], factory) :
    (global = global || self, factory((global.squared = global.squared || {}, global.squared.base = {})));
}(this, function (exports) { 'use strict';

    class NodeList extends squared.lib.base.Container {
        constructor(children) {
            super(children);
            this._currentId = 0;
        }
        append(node, delegate = true) {
            super.append(node);
            if (delegate && this.afterAppend) {
                this.afterAppend.call(this, node);
            }
            return this;
        }
        reset() {
            this._currentId = 0;
            this.clear();
            return this;
        }
        get nextId() {
            return ++this._currentId;
        }
    }

    const { regex: $regex, util: $util } = squared.lib;
    class Resource {
        reset() {
            for (const name in Resource.ASSETS) {
                Resource.ASSETS[name].clear();
            }
            const fileHandler = this.fileHandler;
            if (fileHandler) {
                fileHandler.reset();
            }
        }
        addImage(element) {
            if (element && element.complete) {
                if (element.src.startsWith('data:image/')) {
                    const match = new RegExp(`^${$regex.STRING.DATAURI}$`).exec(element.src);
                    if (match && match[1] && match[2]) {
                        this.addRawData(element.src, match[1], match[2], match[3], element.naturalWidth, element.naturalHeight);
                    }
                }
                const uri = element.src;
                if (uri !== '') {
                    Resource.ASSETS.images.set(uri, { width: element.naturalWidth, height: element.naturalHeight, uri });
                }
            }
        }
        getImage(src) {
            return Resource.ASSETS.images.get(src);
        }
        addFont(data) {
            const fonts = Resource.ASSETS.fonts;
            const items = fonts.get(data.fontFamily) || [];
            items.push(data);
            fonts.set(data.fontFamily, items);
        }
        getFont(fontFamily, fontStyle = 'normal', fontWeight) {
            const font = Resource.ASSETS.fonts.get(fontFamily);
            if (font) {
                const fontFormat = this.controllerSettings.supported.fontFormat;
                return font.find(item => item.fontStyle === fontStyle && (fontWeight === undefined || item.fontWeight === parseInt(fontWeight)) && (fontFormat === '*' || fontFormat.includes(item.srcFormat)));
            }
            return undefined;
        }
        addRawData(dataURI, mimeType, encoding, content, width = 0, height = 0) {
            mimeType = mimeType.toLowerCase();
            encoding = encoding.toLowerCase();
            let base64;
            if (encoding === 'base64') {
                base64 = content;
                if (mimeType === 'image/svg+xml') {
                    content = window.atob(content);
                }
            }
            else {
                content = content.replace(/\\(["'])/g, (match, ...capture) => capture[0]);
            }
            const imageFormat = this.controllerSettings.supported.imageFormat;
            const pathname = dataURI.startsWith(location.origin) ? dataURI.substring(location.origin.length + 1, dataURI.lastIndexOf('/')) : '';
            const getFileName = () => $util.buildAlphaString(5).toLowerCase() + '_' + new Date().getTime();
            let filename;
            if (imageFormat === '*') {
                if (dataURI.startsWith(location.origin)) {
                    filename = $util.fromLastIndexOf(dataURI, '/');
                }
                else {
                    let extension = mimeType.split('/').pop();
                    if (extension === 'svg+xml') {
                        extension = 'svg';
                    }
                    filename = getFileName() + '.' + extension;
                }
            }
            else {
                for (const extension of imageFormat) {
                    if (mimeType.indexOf(extension) !== -1) {
                        if (dataURI.endsWith('.' + extension)) {
                            filename = $util.fromLastIndexOf(dataURI, '/');
                        }
                        else {
                            filename = getFileName() + '.' + extension;
                        }
                        break;
                    }
                }
            }
            if (filename) {
                Resource.ASSETS.rawData.set(dataURI, {
                    pathname,
                    filename,
                    content,
                    base64,
                    mimeType,
                    width,
                    height
                });
                return filename;
            }
            return '';
        }
        getRawData(dataURI) {
            if (dataURI.startsWith('url(')) {
                const match = $regex.CSS.URL.exec(dataURI);
                if (match) {
                    dataURI = match[1];
                }
            }
            return Resource.ASSETS.rawData.get(dataURI);
        }
        setFileHandler(instance) {
            instance.resource = this;
            this.fileHandler = instance;
        }
    }
    Resource.ASSETS = {
        ids: new Map(),
        images: new Map(),
        fonts: new Map(),
        rawData: new Map()
    };

    var __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {
        function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
        return new (P || (P = Promise))(function (resolve, reject) {
            function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
            function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
            function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
            step((generator = generator.apply(thisArg, _arguments || [])).next());
        });
    };
    const { css: $css, dom: $dom, regex: $regex$1, session: $session, util: $util$1 } = squared.lib;
    const ASSETS = Resource.ASSETS;
    const REGEXP_MEDIATEXT = /all|screen/;
    const REGEXP_DATAURI = new RegExp(`(url\\("(${$regex$1.STRING.DATAURI})"\\)),?\\s*`, 'g');
    let REGEXP_IMPORTANT;
    let REGEXP_FONT_FACE;
    let REGEXP_FONT_FAMILY;
    let REGEXP_FONT_SRC;
    let REGEXP_FONT_STYLE;
    let REGEXP_FONT_WEIGHT;
    let REGEXP_URL;
    let NodeConstructor;
    function parseConditionText(rule, value) {
        const match = new RegExp(`^@${rule}([^{]+)`).exec(value);
        return match ? match[1].trim() : value;
    }
    function getImageSvgAsync(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield fetch(value, {
                method: 'GET',
                headers: new Headers({ 'Accept': 'application/xhtml+xml, image/svg+xml', 'Content-Type': 'image/svg+xml' })
            });
            return response.text();
        });
    }
    class Application {
        constructor(framework, nodeConstructor, ControllerConstructor, ResourceConstructor, ExtensionManagerConstructor) {
            this.framework = framework;
            this.initializing = false;
            this.closed = false;
            this.rootElements = new Set();
            this.session = {
                active: []
            };
            this.processing = {
                cache: new NodeList(),
                excluded: new NodeList(),
                sessionId: ''
            };
            this._cascadeAll = false;
            NodeConstructor = nodeConstructor;
            const cache = this.processing.cache;
            this.controllerHandler = new ControllerConstructor(this, cache);
            this.resourceHandler = new ResourceConstructor(this, cache);
            this.extensionManager = new ExtensionManagerConstructor(this, cache);
        }
        copyToDisk(directory, callback, assets) {
            const file = this.resourceHandler.fileHandler;
            if (file) {
                file.copyToDisk(directory, assets, callback);
            }
        }
        appendToArchive(pathname, assets) {
            const file = this.resourceHandler.fileHandler;
            if (file) {
                file.appendToArchive(pathname, assets);
            }
        }
        saveToArchive(filename, assets) {
            const file = this.resourceHandler.fileHandler;
            if (file) {
                file.saveToArchive(filename || this.userSettings.outputArchiveName, assets);
            }
        }
        reset() {
            this.session.active.length = 0;
            const processing = this.processing;
            processing.cache.reset();
            processing.excluded.clear();
            processing.sessionId = '';
            this.controllerHandler.reset();
            for (const ext of this.extensions) {
                ext.subscribers.clear();
            }
            this.closed = false;
        }
        parseDocument(...elements) {
            const controller = this.controllerHandler;
            const resource = this.resourceHandler;
            let __THEN;
            this.rootElements.clear();
            this.initializing = false;
            const sessionId = controller.generateSessionId;
            this.processing.sessionId = sessionId;
            controller.sessionId = sessionId;
            this.session.active.push(sessionId);
            controller.init();
            this.setStyleMap();
            if (elements.length === 0) {
                elements.push(document.body);
            }
            for (const value of elements) {
                let element;
                if (typeof value === 'string') {
                    element = document.getElementById(value);
                }
                else if ($css.hasComputedStyle(value)) {
                    element = value;
                }
                else {
                    continue;
                }
                if (element) {
                    this.rootElements.add(element);
                }
            }
            const documentRoot = this.rootElements.values().next().value;
            const preloaded = [];
            const resume = () => {
                this.initializing = false;
                for (const image of preloaded) {
                    if (image.parentElement) {
                        documentRoot.removeChild(image);
                    }
                }
                preloaded.length = 0;
                for (const ext of this.extensions) {
                    ext.beforeParseDocument();
                }
                for (const element of this.rootElements) {
                    if (this.createCache(element)) {
                        this.afterCreateCache(element);
                    }
                }
                for (const ext of this.extensions) {
                    ext.afterParseDocument();
                }
                if (typeof __THEN === 'function') {
                    __THEN.call(this);
                }
            };
            const preloadImages = this.userSettings.preloadImages;
            const images = [];
            if (preloadImages) {
                for (const element of this.rootElements) {
                    element.querySelectorAll('input[type=image]').forEach((image) => {
                        const { width, height, src: uri } = image;
                        if (uri !== '') {
                            ASSETS.images.set(uri, { width, height, uri });
                        }
                    });
                }
                for (const image of ASSETS.images.values()) {
                    const uri = image.uri;
                    if (uri) {
                        if (uri.toLowerCase().endsWith('.svg')) {
                            images.push(uri);
                        }
                        else if (image.width === 0 && image.height === 0) {
                            const element = document.createElement('img');
                            element.src = uri;
                            const width = element.naturalWidth;
                            const height = element.naturalHeight;
                            if (width > 0 && height > 0) {
                                image.width = width;
                                image.height = height;
                            }
                            else {
                                documentRoot.appendChild(element);
                                preloaded.push(element);
                            }
                        }
                    }
                }
            }
            for (const [uri, data] of ASSETS.rawData.entries()) {
                if (data.mimeType && data.mimeType.startsWith('image/') && !data.mimeType.endsWith('svg+xml')) {
                    const element = document.createElement('img');
                    element.src = 'data:' + data.mimeType + ';' + (data.base64 ? 'base64,' + data.base64 : data.content);
                    const width = element.naturalWidth;
                    const height = element.naturalHeight;
                    if (width > 0 && height > 0) {
                        data.width = width;
                        data.height = height;
                        ASSETS.images.set(uri, {
                            width,
                            height,
                            uri: data.filename
                        });
                    }
                    else {
                        document.body.appendChild(element);
                        preloaded.push(element);
                    }
                }
            }
            for (const element of this.rootElements) {
                element.querySelectorAll('img').forEach((image) => {
                    if (image.src.toLowerCase().endsWith('.svg')) {
                        if (preloadImages) {
                            images.push(image.src);
                        }
                    }
                    else if (image.complete) {
                        resource.addImage(image);
                    }
                    else if (preloadImages) {
                        images.push(image);
                    }
                });
            }
            if (images.length) {
                this.initializing = true;
                Promise.all($util$1.objectMap(images, image => {
                    return new Promise((resolve, reject) => {
                        if (typeof image === 'string') {
                            resolve(getImageSvgAsync(image));
                        }
                        else {
                            image.addEventListener('load', () => resolve(image));
                            image.addEventListener('error', () => reject(image));
                        }
                    });
                }))
                    .then((result) => {
                    const length = result.length;
                    for (let i = 0; i < length; i++) {
                        const value = result[i];
                        if (typeof value === 'string') {
                            const uri = images[i];
                            if (typeof uri === 'string') {
                                resource.addRawData(uri, 'image/svg+xml', 'utf8', value);
                            }
                        }
                        else {
                            resource.addImage(value);
                        }
                    }
                    resume();
                })
                    .catch((error) => {
                    const message = error.target ? error.target.src : error['message'];
                    if (!this.userSettings.showErrorMessages || !$util$1.isString(message) || confirm('FAIL: ' + message)) {
                        resume();
                    }
                });
            }
            else {
                resume();
            }
            const PromiseResult = class {
                then(resolve) {
                    if (images.length) {
                        __THEN = resolve;
                    }
                    else {
                        resolve();
                    }
                }
            };
            return new PromiseResult();
        }
        createCache(documentRoot) {
            const node = this.createRootNode(documentRoot);
            if (node) {
                const CACHE = this.processing.cache;
                node.parent.setBounds();
                for (const item of CACHE) {
                    item.setBounds();
                    item.saveAsInitial();
                }
                this.controllerHandler.sortInitialCache(CACHE);
                return true;
            }
            return false;
        }
        createNode(element, append = true, parent, children) {
            const node = new NodeConstructor(this.nextId, this.processing.sessionId, element, this.controllerHandler.afterInsertNode);
            if (parent) {
                node.depth = parent.depth + 1;
            }
            if (children) {
                for (const item of children) {
                    item.parent = node;
                }
            }
            if (append) {
                this.processing.cache.append(node, children !== undefined);
            }
            return node;
        }
        toString() {
            return '';
        }
        createRootNode(element) {
            const processing = this.processing;
            processing.cache.clear();
            processing.excluded.clear();
            this._cascadeAll = false;
            const node = this.cascadeParentNode(element);
            if (node) {
                const parent = new NodeConstructor(0, processing.sessionId, element.parentElement || document.body, this.controllerHandler.afterInsertNode);
                node.parent = parent;
                node.actualParent = parent;
                node.childIndex = 0;
                node.documentRoot = true;
            }
            processing.node = node;
            processing.cache.afterAppend = undefined;
            return node;
        }
        cascadeParentNode(parentElement, depth = 0) {
            const node = this.insertNode(parentElement);
            if (node) {
                const controller = this.controllerHandler;
                const processing = this.processing;
                const CACHE = processing.cache;
                node.depth = depth;
                if (depth === 0) {
                    CACHE.append(node);
                }
                if (controller.preventNodeCascade(parentElement)) {
                    return node;
                }
                const childNodes = parentElement.childNodes;
                const length = childNodes.length;
                const children = new Array(length);
                const elements = new Array(parentElement.childElementCount);
                let inlineText = true;
                let j = 0;
                let k = 0;
                for (let i = 0; i < length; i++) {
                    const element = childNodes[i];
                    let child;
                    if (element.nodeName.charAt(0) === '#') {
                        if ($dom.isTextNode(element)) {
                            child = this.insertNode(element, node);
                        }
                    }
                    else if (controller.includeElement(element)) {
                        child = this.cascadeParentNode(element, depth + 1);
                        if (child) {
                            elements[k++] = child;
                            CACHE.append(child);
                            inlineText = false;
                        }
                    }
                    else {
                        child = this.insertNode(element);
                        if (child) {
                            processing.excluded.append(child);
                            inlineText = false;
                        }
                    }
                    if (child) {
                        child.parent = node;
                        child.actualParent = node;
                        child.childIndex = j;
                        children[j++] = child;
                    }
                }
                children.length = j;
                elements.length = k;
                node.naturalChildren = children;
                node.naturalElements = elements;
                node.inlineText = inlineText;
                if (this.userSettings.createQuerySelectorMap && k > 0) {
                    node.queryMap = this.createQueryMap(elements, k);
                }
            }
            return node;
        }
        createQueryMap(elements, length) {
            const result = [elements];
            for (let i = 0; i < length; i++) {
                const childMap = elements[i].queryMap;
                if (childMap) {
                    const lengthA = childMap.length;
                    for (let j = 0; j < lengthA; j++) {
                        const k = j + 1;
                        const map = result[k];
                        result[k] = map ? map.concat(childMap[j]) : childMap[j];
                    }
                }
            }
            return result;
        }
        setStyleMap() {
            let warning = false;
            const applyStyleSheet = (item) => {
                try {
                    const cssRules = item.cssRules;
                    if (cssRules) {
                        const lengthA = cssRules.length;
                        for (let j = 0; j < lengthA; j++) {
                            const rule = cssRules[j];
                            switch (rule.type) {
                                case CSSRule.STYLE_RULE:
                                case CSSRule.FONT_FACE_RULE:
                                    this.applyStyleRule(rule);
                                    break;
                                case CSSRule.IMPORT_RULE:
                                    applyStyleSheet(rule.styleSheet);
                                    break;
                                case CSSRule.MEDIA_RULE:
                                    if ($css.validMediaRule(rule.conditionText || parseConditionText('media', rule.cssText))) {
                                        this.applyCSSRuleList(rule.cssRules);
                                    }
                                    break;
                                case CSSRule.SUPPORTS_RULE:
                                    if (CSS.supports && CSS.supports(rule.conditionText || parseConditionText('supports', rule.cssText))) {
                                        this.applyCSSRuleList(rule.cssRules);
                                    }
                                    break;
                            }
                        }
                    }
                }
                catch (error) {
                    if (this.userSettings.showErrorMessages && !warning) {
                        alert('CSS cannot be parsed inside <link> tags when loading files directly from your hard drive or from external websites. ' +
                            'Either use a local web server, embed your CSS into a <style> tag, or you can also try using a different browser. ' +
                            'See the README for more detailed instructions.\n\n' +
                            item.href + '\n\n' + error);
                        warning = true;
                    }
                }
            };
            const styleSheets = document.styleSheets;
            const length = styleSheets.length;
            for (let i = 0; i < length; i++) {
                const styleSheet = styleSheets[i];
                const mediaText = styleSheet.media.mediaText;
                if (mediaText === '' || REGEXP_MEDIATEXT.test(mediaText)) {
                    applyStyleSheet(styleSheet);
                }
            }
        }
        applyCSSRuleList(rules) {
            const length = rules.length;
            for (let i = 0; i < length; i++) {
                this.applyStyleRule(rules[i]);
            }
        }
        applyStyleRule(item) {
            const resource = this.resourceHandler;
            const sessionId = this.processing.sessionId;
            const styleSheetHref = item.parentStyleSheet && item.parentStyleSheet.href || undefined;
            const cssText = item.cssText;
            switch (item.type) {
                case CSSRule.STYLE_RULE: {
                    const cssStyle = item.style;
                    const fromRule = [];
                    const important = {};
                    const parseImageUrl = (styleMap, attr) => {
                        const value = styleMap[attr];
                        if (value && value !== 'initial') {
                            REGEXP_DATAURI.lastIndex = 0;
                            let result = value;
                            let match;
                            while ((match = REGEXP_DATAURI.exec(value)) !== null) {
                                if (match[3] && match[4]) {
                                    resource.addRawData(match[2], match[3], match[4], match[5]);
                                }
                                else if (this.userSettings.preloadImages) {
                                    const uri = $util$1.resolvePath(match[5], styleSheetHref);
                                    if (uri !== '') {
                                        if (resource.getImage(uri) === undefined) {
                                            ASSETS.images.set(uri, { width: 0, height: 0, uri });
                                        }
                                        result = result.replace(match[1], `url("${uri}")`);
                                    }
                                }
                            }
                            styleMap[attr] = result;
                        }
                    };
                    for (const attr of Array.from(cssStyle)) {
                        fromRule.push($util$1.convertCamelCase(attr));
                    }
                    if (cssText.indexOf('!important') !== -1) {
                        if (REGEXP_IMPORTANT) {
                            REGEXP_IMPORTANT.lastIndex = 0;
                        }
                        else {
                            REGEXP_IMPORTANT = /\s*([a-z\-]+):.*?!important;/g;
                        }
                        let match;
                        while ((match = REGEXP_IMPORTANT.exec(cssText)) !== null) {
                            const attr = $util$1.convertCamelCase(match[1]);
                            switch (attr) {
                                case 'margin':
                                    important.marginTop = true;
                                    important.marginRight = true;
                                    important.marginBottom = true;
                                    important.marginLeft = true;
                                    break;
                                case 'padding':
                                    important.paddingTop = true;
                                    important.paddingRight = true;
                                    important.paddingBottom = true;
                                    important.paddingLeft = true;
                                    break;
                                case 'background':
                                    important.backgroundColor = true;
                                    important.backgroundImage = true;
                                    important.backgroundSize = true;
                                    important.backgroundRepeat = true;
                                    important.backgroundPositionX = true;
                                    important.backgroundPositionY = true;
                                    break;
                                case 'backgroundPosition':
                                    important.backgroundPositionX = true;
                                    important.backgroundPositionY = true;
                                    break;
                                case 'border':
                                    important.borderTopStyle = true;
                                    important.borderRightStyle = true;
                                    important.borderBottomStyle = true;
                                    important.borderLeftStyle = true;
                                    important.borderTopWidth = true;
                                    important.borderRightWidth = true;
                                    important.borderBottomWidth = true;
                                    important.borderLeftWidth = true;
                                    important.borderTopColor = true;
                                    important.borderRightColor = true;
                                    important.borderBottomColor = true;
                                    important.borderLeftColor = true;
                                    break;
                                case 'borderStyle':
                                    important.borderTopStyle = true;
                                    important.borderRightStyle = true;
                                    important.borderBottomStyle = true;
                                    important.borderLeftStyle = true;
                                    break;
                                case 'borderWidth':
                                    important.borderTopWidth = true;
                                    important.borderRightWidth = true;
                                    important.borderBottomWidth = true;
                                    important.borderLeftWidth = true;
                                    break;
                                case 'borderColor':
                                    important.borderTopColor = true;
                                    important.borderRightColor = true;
                                    important.borderBottomColor = true;
                                    important.borderLeftColor = true;
                                    break;
                                case 'font':
                                    important.fontFamily = true;
                                    important.fontStyle = true;
                                    important.fontSize = true;
                                    important.fontWeight = true;
                                    important.lineHeight = true;
                                    break;
                            }
                            important[attr] = true;
                        }
                    }
                    for (const selectorText of $css.parseSelectorText(item.selectorText)) {
                        const specificity = $css.getSpecificity(selectorText);
                        const [selector, target] = selectorText.split('::');
                        const targetElt = target ? '::' + target : '';
                        document.querySelectorAll(selector || '*').forEach((element) => {
                            const style = $css.getStyle(element, targetElt);
                            const styleMap = {};
                            for (const attr of fromRule) {
                                const value = $css.checkStyleValue(element, attr, cssStyle[attr], style);
                                if (value) {
                                    styleMap[attr] = value;
                                }
                            }
                            parseImageUrl(styleMap, 'backgroundImage');
                            parseImageUrl(styleMap, 'listStyleImage');
                            parseImageUrl(styleMap, 'content');
                            const attrStyle = 'styleMap' + targetElt;
                            const attrSpecificity = 'styleSpecificity' + targetElt;
                            const styleData = $session.getElementCache(element, attrStyle, sessionId);
                            if (styleData) {
                                const specificityData = $session.getElementCache(element, attrSpecificity, sessionId) || {};
                                for (const attr in styleMap) {
                                    const value = styleMap[attr];
                                    const revisedSpecificity = specificity + (important[attr] ? 1000 : 0);
                                    if (specificityData[attr] === undefined || revisedSpecificity >= specificityData[attr]) {
                                        specificityData[attr] = revisedSpecificity;
                                        if (value === 'initial' && cssStyle.background && attr.startsWith('background')) {
                                            continue;
                                        }
                                        styleData[attr] = value;
                                    }
                                }
                            }
                            else {
                                const specificityData = {};
                                for (const attr in styleMap) {
                                    specificityData[attr] = specificity + (important[attr] ? 1000 : 0);
                                }
                                $session.setElementCache(element, 'style' + targetElt, '0', style);
                                $session.setElementCache(element, 'sessionId', '0', sessionId);
                                $session.setElementCache(element, attrStyle, sessionId, styleMap);
                                $session.setElementCache(element, attrSpecificity, sessionId, specificityData);
                            }
                        });
                    }
                    break;
                }
                case CSSRule.FONT_FACE_RULE: {
                    if (REGEXP_FONT_FACE === undefined) {
                        REGEXP_FONT_FACE = /\s*@font-face\s*{([^}]+)}\s*/;
                        REGEXP_FONT_FAMILY = /\s*font-family:[^\w]*([^'";]+)/;
                        REGEXP_FONT_SRC = /\s*src:\s*([^;]+);/;
                        REGEXP_FONT_STYLE = /\s*font-style:\s*(\w+)\s*;/;
                        REGEXP_FONT_WEIGHT = /\s*font-weight:\s*(\d+)\s*;/;
                        REGEXP_URL = /\s*(url|local)\((?:['"]([^'")]+)['"]|([^)]+))\)\s*format\(['"]?(\w+)['"]?\)\s*/;
                    }
                    const match = REGEXP_FONT_FACE.exec(cssText);
                    if (match) {
                        const familyMatch = REGEXP_FONT_FAMILY.exec(match[1]);
                        const srcMatch = REGEXP_FONT_SRC.exec(match[1]);
                        if (familyMatch && srcMatch) {
                            const styleMatch = REGEXP_FONT_STYLE.exec(match[1]);
                            const weightMatch = REGEXP_FONT_WEIGHT.exec(match[1]);
                            const fontFamily = familyMatch[1].trim();
                            const fontStyle = styleMatch ? styleMatch[1].toLowerCase() : 'normal';
                            const fontWeight = weightMatch ? parseInt(weightMatch[1]) : 400;
                            for (const value of srcMatch[1].split($regex$1.XML.SEPARATOR)) {
                                const urlMatch = REGEXP_URL.exec(value);
                                if (urlMatch) {
                                    let srcUrl;
                                    let srcLocal;
                                    const url = (urlMatch[2] || urlMatch[3]).trim();
                                    if (urlMatch[1] === 'url') {
                                        srcUrl = $util$1.resolvePath(url, styleSheetHref);
                                    }
                                    else {
                                        srcLocal = url;
                                    }
                                    resource.addFont({
                                        fontFamily,
                                        fontWeight,
                                        fontStyle,
                                        srcUrl,
                                        srcLocal,
                                        srcFormat: urlMatch[4].toLowerCase().trim()
                                    });
                                }
                            }
                        }
                    }
                    break;
                }
            }
        }
        get nextId() {
            return this.processing.cache.nextId;
        }
        get length() {
            return 0;
        }
    }

    class Controller {
        preventNodeCascade(element) {
            return false;
        }
        get generateSessionId() {
            return new Date().getTime().toString();
        }
    }

    class Extension {
        constructor(name, framework, options) {
            this.name = name;
            this.framework = framework;
            this.options = {};
            this.dependencies = [];
            this.subscribers = new Set();
            if (options) {
                Object.assign(this.options, options);
            }
        }
        require(name, preload = false) {
            this.dependencies.push({ name, preload });
        }
        beforeParseDocument() { }
        afterParseDocument() { }
        set application(value) {
            this._application = value;
            this.controller = value.controllerHandler;
        }
        get application() {
            return this._application;
        }
    }

    const $util$2 = squared.lib.util;
    class ExtensionManager {
        constructor(application) {
            this.application = application;
        }
        include(ext) {
            const application = this.application;
            const extensions = application.extensions;
            const index = extensions.findIndex(item => item.name === ext.name);
            if (index !== -1) {
                extensions[index] = ext;
                return true;
            }
            else {
                const framework = ext.framework;
                if (framework > 0) {
                    for (const item of ext.dependencies) {
                        if (item.preload && this.retrieve(item.name) === null) {
                            const extension = application.builtInExtensions[item.name];
                            if (extension) {
                                this.include(extension);
                            }
                        }
                    }
                }
                if ((framework === 0 || $util$2.hasBit(framework, application.framework)) && ext.dependencies.every(item => !!this.retrieve(item.name))) {
                    ext.application = application;
                    extensions.push(ext);
                    return true;
                }
            }
            return false;
        }
        exclude(ext) {
            const extensions = this.application.extensions;
            for (let i = 0; i < extensions.length; i++) {
                if (extensions[i] === ext) {
                    extensions.splice(i, 1);
                    return true;
                }
            }
            return false;
        }
        retrieve(name) {
            for (const ext of this.application.extensions) {
                if (ext.name === name) {
                    return ext;
                }
            }
            return null;
        }
        optionValue(name, attr) {
            const ext = this.retrieve(name);
            if (ext && typeof ext.options === 'object') {
                return ext.options[attr];
            }
            return undefined;
        }
        optionValueAsObject(name, attr) {
            const value = this.optionValue(name, attr);
            if (typeof value === 'object') {
                return value;
            }
            return null;
        }
        optionValueAsString(name, attr) {
            const value = this.optionValue(name, attr);
            return typeof value === 'string' ? value : '';
        }
        optionValueAsNumber(name, attr) {
            const value = this.optionValue(name, attr);
            return typeof value === 'number' ? value : 0;
        }
        optionValueAsBoolean(name, attr) {
            const value = this.optionValue(name, attr);
            return typeof value === 'boolean' ? value : false;
        }
    }

    const $util$3 = squared.lib.util;
    class File {
        constructor() {
            this.assets = [];
        }
        static getMimeType(value) {
            switch (value.toLowerCase()) {
                case 'aac':
                    return 'audio/aac';
                case 'abw':
                    return 'application/x-abiword';
                case 'arc':
                    return 'application/x-freearc';
                case 'avi':
                    return 'video/x-msvideo';
                case 'azw':
                    return 'application/vnd.amazon.ebook';
                case 'bin':
                    return 'application/octet-stream';
                case 'bmp':
                    return 'image/bmp';
                case 'bz':
                    return 'application/x-bzip';
                case 'bz2':
                    return 'application/x-bzip2';
                case 'csh':
                    return 'application/x-csh';
                case 'css':
                    return 'text/css';
                case 'csv':
                    return 'text/csv';
                case 'doc':
                    return 'application/msword';
                case 'docx':
                    return 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
                case 'eot':
                    return 'application/vnd.ms-fontobject';
                case 'epub':
                    return 'application/epub+zip';
                case 'gif':
                    return 'image/gif';
                case 'htm':
                case 'html':
                    return 'text/html';
                case 'ico':
                    return 'image/vnd.microsoft.icon';
                case 'ics':
                    return 'text/calendar';
                case 'jar':
                    return 'application/java-archive';
                case 'jpeg':
                case 'jpg':
                    return 'image/jpeg';
                case 'js':
                case 'mjs':
                    return 'text/javascript';
                case 'json':
                    return 'application/json';
                case 'jsonld':
                    return 'application/ld+json';
                case 'mid':
                case 'midi':
                    return 'audio/midi';
                case 'mp3':
                    return 'audio/mpeg';
                case 'mpeg':
                    return 'video/mpeg';
                case 'mpkg':
                    return 'application/vnd.apple.installer+xml';
                case 'odp':
                    return 'application/vnd.oasis.opendocument.presentation';
                case 'ods':
                    return 'application/vnd.oasis.opendocument.spreadsheet';
                case 'odt':
                    return 'application/vnd.oasis.opendocument.text';
                case 'oga':
                    return 'audio/ogg';
                case 'ogv':
                    return 'video/ogg';
                case 'ogx':
                    return 'application/ogg';
                case 'otf':
                    return 'font/otf';
                case 'png':
                    return 'image/png';
                case 'pdf':
                    return 'application/pdf';
                case 'ppt':
                    return 'application/vnd.ms-powerpoint';
                case 'pptx':
                    return 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
                case 'rar':
                    return 'application/x-rar-compressed';
                case 'rtf':
                    return 'application/rtf';
                case 'sh':
                    return 'application/x-sh';
                case 'svg':
                    return 'image/svg+xml';
                case 'swf':
                    return 'application/x-shockwave-flash';
                case 'tar':
                    return 'application/x-tar';
                case 'tif':
                case 'tiff':
                    return 'image/tiff';
                case 'ts':
                    return 'video/mp2t';
                case 'ttf':
                    return 'font/ttf';
                case 'txt':
                    return 'text/plain';
                case 'vsd':
                    return 'application/vnd.visio';
                case 'wav':
                    return 'audio/wav';
                case 'weba':
                    return 'audio/webm';
                case 'webm':
                    return 'video/webm';
                case 'webp':
                    return 'image/webp';
                case 'woff':
                    return 'font/woff';
                case 'woff2':
                    return 'font/woff2';
                case 'xhtml':
                    return 'application/xhtml+xml';
                case 'xls':
                    return 'application/vnd.ms-excel';
                case 'xlsx':
                    return 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                case 'xml':
                    return 'text/xml';
                case 'xul':
                    return 'application/vnd.mozilla.xul+xml';
                case 'zip':
                    return 'application/zip';
                case '3gp':
                    return 'video/3gpp';
                case '.3g2':
                    return 'video/3gpp2';
                case '.7z':
                    return 'application/x-7z-compressed';
                default:
                    return '';
            }
        }
        static downloadFile(data, filename, mime) {
            const blob = new Blob([data], { type: mime || 'application/octet-stream' });
            const url = window.URL.createObjectURL(blob);
            const element = document.createElement('a');
            element.style.setProperty('display', 'none');
            element.setAttribute('href', url);
            element.setAttribute('download', filename);
            if (!element.download) {
                element.setAttribute('target', '_blank');
            }
            const body = document.body;
            body.appendChild(element);
            element.click();
            body.removeChild(element);
            setTimeout(() => window.URL.revokeObjectURL(url), 1);
        }
        addAsset(data) {
            if (data.content || data.uri || data.base64) {
                const index = this.assets.findIndex(item => item.pathname === data.pathname && item.filename === data.filename);
                if (index !== -1) {
                    Object.assign(this.assets[index], data);
                }
                else {
                    this.assets.push(data);
                }
            }
        }
        reset() {
            this.assets.length = 0;
        }
        copying(directory, assets, callback) {
            if (location.protocol.startsWith('http')) {
                assets = assets.concat(this.assets);
                if (assets.length) {
                    const settings = this.userSettings;
                    fetch('/api/assets/copy' +
                        '?to=' + encodeURIComponent(directory.trim()) +
                        '&directory=' + encodeURIComponent($util$3.trimString(settings.outputDirectory, '/')) +
                        '&timeout=' + settings.outputArchiveTimeout, {
                        method: 'POST',
                        headers: new Headers({ 'Accept': 'application/json, text/plain, */*', 'Content-Type': 'application/json' }),
                        body: JSON.stringify(assets)
                    })
                        .then((response) => response.json())
                        .then((result) => {
                        if (result) {
                            if (typeof callback === 'function') {
                                callback(result);
                            }
                            if (result.system && this.userSettings.showErrorMessages) {
                                alert(result.application + '\n\n' + result.system);
                            }
                        }
                    })
                        .catch(err => {
                        if (this.userSettings.showErrorMessages) {
                            alert('ERROR: ' + err);
                        }
                    });
                }
            }
            else if (this.userSettings.showErrorMessages) {
                alert('SERVER (required): See README for instructions');
            }
        }
        archiving(filename, assets, appendTo) {
            if (location.protocol.startsWith('http')) {
                assets = assets.concat(this.assets);
                if (assets.length) {
                    const settings = this.userSettings;
                    fetch('/api/assets/archive' +
                        '?filename=' + encodeURIComponent(filename.trim()) +
                        '&directory=' + encodeURIComponent($util$3.trimString(settings.outputDirectory, '/')) +
                        '&format=' + settings.outputArchiveFormat +
                        (appendTo ? '&append_to=' + encodeURIComponent(appendTo.trim()) : '') +
                        '&timeout=' + settings.outputArchiveTimeout, {
                        method: 'POST',
                        headers: new Headers({ 'Accept': 'application/json, text/plain, */*', 'Content-Type': 'application/json' }),
                        body: JSON.stringify(assets)
                    })
                        .then((response) => response.json())
                        .then((result) => {
                        if (result) {
                            const zipname = result.zipname;
                            if (zipname) {
                                fetch('/api/browser/download?filename=' + encodeURIComponent(zipname))
                                    .then((response) => response.blob())
                                    .then((blob) => File.downloadFile(blob, $util$3.fromLastIndexOf(zipname, '/')));
                            }
                            else if (result.system && this.userSettings.showErrorMessages) {
                                alert(result.application + '\n\n' + result.system);
                            }
                        }
                    })
                        .catch(err => {
                        if (this.userSettings.showErrorMessages) {
                            alert('ERROR: ' + err);
                        }
                    });
                }
            }
            else if (this.userSettings.showErrorMessages) {
                alert('SERVER (required): See README for instructions');
            }
        }
    }

    const { css: $css$1, dom: $dom$1, regex: $regex$2, session: $session$1, util: $util$4 } = squared.lib;
    const CACHE_PATTERN = {
        BACKGROUND: /\s*(url\(.+?\))\s*/,
        NTH_CHILD_OFTYPE: /^:nth(-last)?-(child|of-type)\((.+)\)$/,
        NTH_CHILD_OFTYPE_VALUE: /^(-)?(\d+)?n\s*([+\-]\d+)?$/,
        LANG: /^:lang\(\s*(.+)\s*\)$/
    };
    function getFormElement(element) {
        let result = element.parentElement;
        while (result) {
            if (result.tagName === 'FORM') {
                return result;
            }
            result = result.parentElement;
        }
        return null;
    }
    const validateCssSet = (value, styleValue) => value === styleValue || $css$1.isLength(value, true) && styleValue.endsWith('px');
    class Node extends squared.lib.base.Container {
        constructor(id, sessionId = '0', element) {
            super();
            this.id = id;
            this.sessionId = sessionId;
            this.documentRoot = false;
            this.depth = -1;
            this.childIndex = Number.POSITIVE_INFINITY;
            this._fontSize = 0;
            this._element = null;
            this._initial = {
                iteration: -1,
                children: [],
                styleMap: {}
            };
            this._data = {};
            this._inlineText = false;
            if (element) {
                this._element = element;
            }
            else {
                this.style = {};
                this._styleMap = {};
            }
        }
        static getPseudoElt(node) {
            return node.pseudoElement ? $session$1.getElementCache(node.element, 'pseudoElement', node.sessionId) : '';
        }
        init() {
            const element = this._element;
            if (element) {
                const sessionId = this.sessionId;
                if (sessionId !== '0') {
                    $session$1.setElementCache(element, 'node', sessionId, this);
                }
                this.style = this.pseudoElement ? $css$1.getStyle(element.parentElement, Node.getPseudoElt(this)) : $css$1.getStyle(element);
                this._styleMap = $session$1.getElementCache(element, 'styleMap', sessionId) || {};
                if (this.styleElement && !this.pseudoElement && sessionId !== '0') {
                    for (let attr of Array.from(element.style)) {
                        let value = element.style.getPropertyValue(attr);
                        attr = $util$4.convertCamelCase(attr);
                        value = $css$1.checkStyleValue(element, attr, value, this.style);
                        if (value !== '') {
                            this._styleMap[attr] = value;
                        }
                    }
                }
            }
        }
        saveAsInitial(overwrite = false) {
            const initial = this._initial;
            if (initial.iteration === -1 || overwrite) {
                initial.children = this.duplicate();
                initial.styleMap = Object.assign({}, this._styleMap);
            }
            const bounds = this._bounds;
            if (bounds) {
                initial.bounds = $dom$1.assignRect(bounds);
                initial.linear = $dom$1.assignRect(this.linear);
                initial.box = $dom$1.assignRect(this.box);
            }
            initial.iteration++;
        }
        data(name, attr, value, overwrite = true) {
            const data = this._data;
            if ($util$4.hasValue(value)) {
                if (typeof data[name] !== 'object') {
                    data[name] = {};
                }
                if (overwrite || data[name][attr] === undefined) {
                    data[name][attr] = value;
                }
            }
            else if (value === null) {
                delete this._data[name];
            }
            return typeof data[name] === 'object' && data[name] !== null ? data[name][attr] : undefined;
        }
        unsetCache(...attrs) {
            if (attrs.length) {
                const cached = this._cached;
                for (const attr of attrs) {
                    switch (attr) {
                        case 'position':
                            this._cached = {};
                            return;
                        case 'width':
                            cached.actualWidth = undefined;
                            cached.percentWidth = undefined;
                        case 'minWidth':
                            cached.width = undefined;
                            break;
                        case 'height':
                            cached.actualHeight = undefined;
                            cached.percentHeight = undefined;
                        case 'minHeight':
                            cached.height = undefined;
                            break;
                        case 'verticalAlign':
                            cached.baseline = undefined;
                            break;
                        case 'display':
                            cached.block = undefined;
                            cached.blockDimension = undefined;
                            cached.blockStatic = undefined;
                            cached.inline = undefined;
                            cached.inlineVertical = undefined;
                            cached.inlineFlow = undefined;
                            cached.autoMargin = undefined;
                            cached.flexElement = undefined;
                            cached.gridElement = undefined;
                            cached.tableElement = undefined;
                            cached.layoutElement = undefined;
                            break;
                        case 'backgroundColor':
                        case 'backgroundImage':
                            cached.visibleStyle = undefined;
                            break;
                        case 'pageFlow':
                            cached.positionAuto = undefined;
                            cached.blockStatic = undefined;
                            cached.baseline = undefined;
                            cached.floating = undefined;
                            cached.autoMargin = undefined;
                            cached.rightAligned = undefined;
                            cached.bottomAligned = undefined;
                            break;
                        case 'float':
                            cached.floating = undefined;
                            break;
                        default:
                            if (attr.startsWith('margin')) {
                                cached.autoMargin = undefined;
                            }
                            if (attr.startsWith('padding') || attr.startsWith('border')) {
                                cached.contentBoxWidth = undefined;
                                cached.contentBoxHeight = undefined;
                            }
                            break;
                    }
                    cached[attr] = undefined;
                }
            }
            else {
                this._cached = {};
                this._textStyle = undefined;
            }
        }
        ascend(condition, parent, attr = 'actualParent') {
            const result = [];
            let current = this[attr];
            while (current && current.id !== 0) {
                if (condition) {
                    if (condition(current)) {
                        return [current];
                    }
                }
                else {
                    result.push(current);
                }
                if (current === parent) {
                    break;
                }
                current = current[attr];
            }
            return result;
        }
        intersectX(rect, dimension = 'linear') {
            const self = this[dimension];
            return ($util$4.aboveRange(rect.left, self.left) && Math.ceil(rect.left) < self.right ||
                rect.right > Math.ceil(self.left) && $util$4.belowRange(rect.right, self.right) ||
                $util$4.aboveRange(self.left, rect.left) && $util$4.belowRange(self.right, rect.right) ||
                $util$4.aboveRange(rect.left, self.left) && $util$4.belowRange(rect.right, self.right));
        }
        intersectY(rect, dimension = 'linear') {
            const self = this[dimension];
            return ($util$4.aboveRange(rect.top, self.top) && Math.ceil(rect.top) < self.bottom ||
                rect.bottom > Math.ceil(self.top) && $util$4.belowRange(rect.bottom, self.bottom) ||
                $util$4.aboveRange(self.top, rect.top) && $util$4.belowRange(self.bottom, rect.bottom) ||
                $util$4.aboveRange(rect.top, self.top) && $util$4.belowRange(rect.bottom, self.bottom));
        }
        withinX(rect, dimension = 'linear') {
            const self = this[dimension];
            return $util$4.aboveRange(self.left, rect.left) && $util$4.belowRange(self.right, rect.right);
        }
        withinY(rect, dimension = 'linear') {
            const self = this[dimension];
            return $util$4.aboveRange(self.top, rect.top) && $util$4.belowRange(self.bottom, rect.bottom);
        }
        outsideX(rect, dimension = 'linear') {
            const self = this[dimension];
            return self.left < Math.floor(rect.left) || Math.floor(self.right) > rect.right;
        }
        outsideY(rect, dimension = 'linear') {
            const self = this[dimension];
            return self.top < Math.floor(rect.top) || Math.floor(self.bottom) > rect.bottom;
        }
        css(attr, value, cache = true) {
            if (value && this.styleElement) {
                this.style[attr] = value;
                if (validateCssSet(value, this.style[attr])) {
                    this._styleMap[attr] = value;
                    if (cache) {
                        this.unsetCache(attr);
                    }
                    return value;
                }
            }
            return this._styleMap[attr] || this.styleElement && this.style[attr] || '';
        }
        cssApply(values, cache = true) {
            for (const attr in values) {
                const value = values[attr];
                if (this.css(attr, value, cache) === value && cache) {
                    this.unsetCache(attr);
                }
            }
            return this;
        }
        cssInitial(attr, modified = false, computed = false) {
            if (this._initial.iteration === -1 && !modified) {
                computed = true;
            }
            let value = (modified ? this._styleMap : this._initial.styleMap)[attr];
            if (computed && !value) {
                value = this.style[attr];
            }
            return value || '';
        }
        cssAny(attr, ...values) {
            for (const value of values) {
                if (this.css(attr) === value) {
                    return true;
                }
            }
            return false;
        }
        cssInitialAny(attr, ...values) {
            for (const value of values) {
                if (this.cssInitial(attr) === value) {
                    return true;
                }
            }
            return false;
        }
        cssAscend(attr, startSelf = false) {
            let current = startSelf ? this : this.actualParent;
            let value;
            while (current) {
                value = current.cssInitial(attr);
                if (value !== '') {
                    return value;
                }
                if (current.documentBody) {
                    break;
                }
                current = current.actualParent;
            }
            return '';
        }
        cssSort(attr, ascending = true, duplicate = false) {
            const children = duplicate ? this.duplicate() : this.children;
            children.sort((a, b) => {
                const valueA = a.toFloat(attr);
                const valueB = b.toFloat(attr);
                if (valueA === valueB) {
                    return 0;
                }
                if (ascending) {
                    return valueA < valueB ? -1 : 1;
                }
                else {
                    return valueA > valueB ? -1 : 1;
                }
            });
            return children;
        }
        cssPX(attr, value, negative = false, cache = false) {
            const current = this._styleMap[attr];
            if (current && $css$1.isLength(current)) {
                value += $css$1.parseUnit(current, this.fontSize);
                if (!negative && value < 0) {
                    value = 0;
                }
                const length = $css$1.formatPX(value);
                this.css(attr, length);
                if (cache) {
                    this.unsetCache(attr);
                }
                return length;
            }
            return '';
        }
        cssSpecificity(attr) {
            if (this.styleElement) {
                const element = this._element;
                const data = $session$1.getElementCache(this.pseudoElement ? element.parentElement : element, 'styleSpecificity' + Node.getPseudoElt(this), this.sessionId);
                if (data) {
                    return data[attr] || 0;
                }
            }
            return 0;
        }
        cssTry(attr, value) {
            if (this.styleElement) {
                const current = $css$1.getStyle(this._element).getPropertyValue(attr);
                if (current !== value) {
                    const element = this._element;
                    element.style.setProperty(attr, value);
                    if (validateCssSet(value, element.style.getPropertyValue(attr))) {
                        $session$1.setElementCache(element, attr, this.sessionId, current);
                        return true;
                    }
                }
                else {
                    return true;
                }
            }
            return false;
        }
        cssFinally(attr) {
            if (this.styleElement) {
                const element = this._element;
                const value = $session$1.getElementCache(element, attr, this.sessionId);
                if (value) {
                    element.style.setProperty(attr, value);
                    $session$1.deleteElementCache(element, attr, this.sessionId);
                    return true;
                }
            }
            return false;
        }
        toInt(attr, initial = false, fallback = 0) {
            const value = parseInt((initial ? this._initial.styleMap : this._styleMap)[attr]);
            return isNaN(value) ? fallback : value;
        }
        toFloat(attr, initial = false, fallback = 0) {
            const value = parseFloat((initial ? this._initial.styleMap : this._styleMap)[attr]);
            return isNaN(value) ? fallback : value;
        }
        parseUnit(value, dimension = 'width', parent = true) {
            if (value) {
                if ($css$1.isPercent(value)) {
                    const node = parent && this.absoluteParent || this;
                    let result = parseFloat(value) / 100;
                    switch (dimension) {
                        case 'width':
                            result *= node.bounds.width;
                            break;
                        case 'height':
                            result *= node.bounds.height;
                            break;
                    }
                    return result;
                }
                return $css$1.parseUnit(value, this.fontSize);
            }
            return 0;
        }
        convertPX(value, dimension = 'width', parent = true) {
            return value.endsWith('px') ? value : Math.round(this.parseUnit(value, dimension, parent)) + 'px';
        }
        has(attr, checkType = 0, options) {
            const value = (options && options.map === 'initial' ? this._initial.styleMap : this._styleMap)[attr];
            if (value) {
                switch (value) {
                    case 'auto':
                    case 'none':
                    case 'initial':
                    case 'normal':
                    case 'transparent':
                    case 'rgba(0, 0, 0, 0)':
                        return false;
                    case 'baseline':
                    case 'left':
                    case 'start':
                        return this.flexElement || !!this.actualParent && this.actualParent.flexElement;
                    default:
                        if (options) {
                            if (options.not) {
                                if (value === options.not) {
                                    return false;
                                }
                                else if (Array.isArray(options.not)) {
                                    for (const exclude of options.not) {
                                        if (value === exclude) {
                                            return false;
                                        }
                                    }
                                }
                            }
                        }
                        if (checkType > 0) {
                            if ($util$4.hasBit(checkType, 2 /* LENGTH */) && $css$1.isLength(value)) {
                                return true;
                            }
                            if ($util$4.hasBit(checkType, 4 /* PERCENT */) && $css$1.isPercent(value)) {
                                return true;
                            }
                        }
                        return checkType === 0;
                }
            }
            return false;
        }
        hasPX(attr, percent = true, initial = false) {
            const value = (initial ? this._initial.styleMap : this._styleMap)[attr];
            return value ? $css$1.isLength(value, percent) : false;
        }
        setBounds(cache = true) {
            if (this.styleElement) {
                this._bounds = $dom$1.assignRect($session$1.actualClientRect(this._element, this.sessionId, cache), true);
                if (this.documentBody && this.marginTop === 0) {
                    this._bounds.top = 0;
                }
            }
            else if (this.plainText) {
                const rect = $dom$1.getRangeClientRect(this._element);
                const bounds = $dom$1.assignRect(rect, true);
                const numberOfLines = rect.numberOfLines;
                bounds.numberOfLines = numberOfLines;
                this._bounds = bounds;
                this._textBounds = bounds;
                this._cached.multiline = numberOfLines > 1;
            }
            if (!cache) {
                this._box = undefined;
                this._linear = undefined;
            }
        }
        querySelector(value) {
            return this.querySelectorAll(value, 1)[0] || null;
        }
        querySelectorAll(value, resultCount = -1) {
            let result = [];
            const queryMap = this.queryMap;
            if (queryMap) {
                const queries = $css$1.parseSelectorText(value);
                for (let i = 0; i < queries.length; i++) {
                    const query = queries[i];
                    const selectors = [];
                    let offset = -1;
                    invalid: {
                        $regex$2.CSS.SELECTOR_G.lastIndex = 0;
                        let adjacent;
                        let match;
                        while ((match = $regex$2.CSS.SELECTOR_G.exec(query)) !== null) {
                            let segment = match[1];
                            let all = false;
                            let tagName;
                            let id;
                            let classList;
                            let attrList;
                            let pseudoList;
                            let notList;
                            if (segment.length === 1) {
                                const ch = segment.charAt(0);
                                switch (ch) {
                                    case '+':
                                    case '~':
                                        offset--;
                                    case '>':
                                        if (adjacent || selectors.length === 0) {
                                            selectors.length = 0;
                                            break invalid;
                                        }
                                        adjacent = ch;
                                        continue;
                                    case '*':
                                        all = true;
                                        break;
                                }
                            }
                            else if (segment.endsWith('|*')) {
                                all = segment === '*|*';
                            }
                            else if (segment.charAt(0) === '*') {
                                segment = segment.substring(1);
                            }
                            else if (segment.startsWith('::')) {
                                selectors.length = 0;
                                break invalid;
                            }
                            if (!all) {
                                let subMatch;
                                while ((subMatch = $regex$2.CSS.SELECTOR_ATTR.exec(segment)) !== null) {
                                    if (attrList === undefined) {
                                        attrList = [];
                                    }
                                    const caseInsensitive = subMatch[6] === 'i';
                                    let attrValue = subMatch[3] || subMatch[4] || subMatch[5] || '';
                                    if (caseInsensitive) {
                                        attrValue = attrValue.toLowerCase();
                                    }
                                    attrList.push({
                                        key: subMatch[1],
                                        symbol: subMatch[2],
                                        value: attrValue,
                                        caseInsensitive
                                    });
                                    segment = $util$4.spliceString(segment, subMatch.index, subMatch[0].length);
                                }
                                if (segment.indexOf('::') !== -1) {
                                    selectors.length = 0;
                                    break invalid;
                                }
                                while ((subMatch = $regex$2.CSS.SELECTOR_PSEUDO_CLASS.exec(segment)) !== null) {
                                    if (subMatch[0].startsWith(':not(')) {
                                        if (subMatch[1]) {
                                            if (notList === undefined) {
                                                notList = [];
                                            }
                                            notList.push(subMatch[1]);
                                        }
                                    }
                                    else {
                                        if (pseudoList === undefined) {
                                            pseudoList = [];
                                        }
                                        pseudoList.push(subMatch[0]);
                                    }
                                    segment = $util$4.spliceString(segment, subMatch.index, subMatch[0].length);
                                }
                                while ((subMatch = $regex$2.CSS.SELECTOR_LABEL.exec(segment)) !== null) {
                                    const label = subMatch[0];
                                    switch (label.charAt(0)) {
                                        case '#':
                                            id = label.substring(1);
                                            break;
                                        case '.':
                                            if (classList === undefined) {
                                                classList = [];
                                            }
                                            classList.push(label.substring(1));
                                            break;
                                        default:
                                            tagName = label.toUpperCase();
                                            break;
                                    }
                                    segment = $util$4.spliceString(segment, subMatch.index, subMatch[0].length);
                                }
                            }
                            selectors.push({
                                all,
                                tagName,
                                id,
                                adjacent,
                                classList,
                                pseudoList,
                                notList,
                                attrList
                            });
                            offset++;
                            adjacent = undefined;
                        }
                    }
                    let length = queryMap.length;
                    if (selectors.length && offset !== -1 && offset < length) {
                        const validate = (node, data, last, adjacent) => {
                            if (data.all) {
                                return true;
                            }
                            if (data.tagName && data.tagName !== node.tagName.toUpperCase()) {
                                return false;
                            }
                            if (data.id && data.id !== node.elementId) {
                                return false;
                            }
                            if (data.pseudoList) {
                                const parent = node.actualParent;
                                const tagName = node.tagName;
                                for (const pseudo of data.pseudoList) {
                                    switch (pseudo) {
                                        case ':first-child':
                                        case ':nth-child(1)':
                                            if (node !== parent.firstChild) {
                                                return false;
                                            }
                                            break;
                                        case ':last-child':
                                        case ':nth-last-child(1)':
                                            if (node !== parent.lastChild) {
                                                return false;
                                            }
                                            break;
                                        case ':only-child':
                                            if (parent.naturalElements.length > 1) {
                                                return false;
                                            }
                                            break;
                                        case ':only-of-type': {
                                            let j = 0;
                                            for (const item of parent.naturalElements) {
                                                if (item.tagName === tagName && ++j > 1) {
                                                    return false;
                                                }
                                            }
                                            break;
                                        }
                                        case ':first-of-type': {
                                            for (const item of parent.naturalElements) {
                                                if (item.tagName === tagName) {
                                                    if (item !== node) {
                                                        return false;
                                                    }
                                                    break;
                                                }
                                            }
                                            break;
                                        }
                                        case ':nth-child(n)':
                                        case ':nth-last-child(n)':
                                            break;
                                        case ':empty':
                                            if (node.element.childNodes.length) {
                                                return false;
                                            }
                                            break;
                                        case ':checked':
                                            if (tagName === 'INPUT') {
                                                if (!node.element.checked) {
                                                    return false;
                                                }
                                            }
                                            else if (tagName === 'OPTION') {
                                                if (!node.element.selected) {
                                                    return false;
                                                }
                                            }
                                            else {
                                                return false;
                                            }
                                            break;
                                        case ':enabled':
                                            if (!node.inputElement || node.element.disabled) {
                                                return false;
                                            }
                                            break;
                                        case ':disabled':
                                            if (!node.inputElement || !node.element.disabled) {
                                                return false;
                                            }
                                            break;
                                        case ':read-only': {
                                            const element = node.element;
                                            if (element.isContentEditable || (tagName === 'INPUT' || tagName === 'TEXTAREA') && !element.readOnly) {
                                                return false;
                                            }
                                            break;
                                        }
                                        case ':read-write': {
                                            const element = node.element;
                                            if (!element.isContentEditable || (tagName === 'INPUT' || tagName === 'TEXTAREA') && element.readOnly) {
                                                return false;
                                            }
                                            break;
                                        }
                                        case ':required':
                                            if (!node.inputElement || tagName === 'BUTTON' || !node.element.required) {
                                                return false;
                                            }
                                            break;
                                        case ':optional':
                                            if (!node.inputElement || tagName === 'BUTTON' || node.element.required) {
                                                return false;
                                            }
                                            break;
                                        case ':placeholder-shown': {
                                            if (!((tagName === 'INPUT' || tagName === 'TEXTAREA') && node.element.placeholder)) {
                                                return false;
                                            }
                                            break;
                                        }
                                        case ':default': {
                                            switch (tagName) {
                                                case 'INPUT': {
                                                    const element = node.element;
                                                    switch (element.type) {
                                                        case 'radio':
                                                        case 'checkbox':
                                                            if (!element.checked) {
                                                                return false;
                                                            }
                                                            break;
                                                        default:
                                                            return false;
                                                    }
                                                    break;
                                                }
                                                case 'OPTION':
                                                    if (node.element.attributes['selected'] === undefined) {
                                                        return false;
                                                    }
                                                    break;
                                                case 'BUTTON': {
                                                    const element = node.element;
                                                    const form = getFormElement(element);
                                                    if (form) {
                                                        let valid = false;
                                                        const children = form.querySelectorAll('*');
                                                        const lengthA = children.length;
                                                        for (let j = 0; j < lengthA; j++) {
                                                            const item = children[i];
                                                            if (item.tagName === 'BUTTON') {
                                                                valid = element === item;
                                                                break;
                                                            }
                                                            else if (item.tagName === 'INPUT') {
                                                                const type = item.type;
                                                                if (type === 'submit' || type === 'image') {
                                                                    valid = element === item;
                                                                    break;
                                                                }
                                                            }
                                                        }
                                                        if (!valid) {
                                                            return false;
                                                        }
                                                    }
                                                    break;
                                                }
                                                default:
                                                    return false;
                                            }
                                            break;
                                        }
                                        case ':in-range':
                                        case ':out-of-range': {
                                            if (tagName === 'INPUT') {
                                                const element = node.element;
                                                const rangeValue = parseFloat(element.value);
                                                if (!isNaN(rangeValue)) {
                                                    const min = $util$4.convertFloat(element.min);
                                                    const max = $util$4.convertFloat(element.max);
                                                    if (rangeValue >= min && rangeValue <= max) {
                                                        if (pseudo === ':out-of-range') {
                                                            return false;
                                                        }
                                                    }
                                                    else if (pseudo === ':in-range') {
                                                        return false;
                                                    }
                                                }
                                                else if (pseudo === ':in-range') {
                                                    return false;
                                                }
                                            }
                                            else {
                                                return false;
                                            }
                                            break;
                                        }
                                        case ':indeterminate':
                                            if (tagName === 'INPUT') {
                                                const element = node.element;
                                                switch (element.type) {
                                                    case 'checkbox':
                                                        if (!element.indeterminate) {
                                                            return false;
                                                        }
                                                        break;
                                                    case 'radio':
                                                        if (element.checked) {
                                                            return false;
                                                        }
                                                        else if (element.name) {
                                                            const children = (getFormElement(element) || document).querySelectorAll(`input[type=radio][name="${element.name}"`);
                                                            const lengthA = children.length;
                                                            for (let j = 0; j < lengthA; j++) {
                                                                if (children[j].checked) {
                                                                    return false;
                                                                }
                                                            }
                                                        }
                                                        break;
                                                    default:
                                                        return false;
                                                }
                                            }
                                            else if (tagName === 'PROGRESS') {
                                                if (node.element.value !== -1) {
                                                    return false;
                                                }
                                            }
                                            else {
                                                return false;
                                            }
                                            break;
                                        case ':target': {
                                            if (location.hash === '') {
                                                return false;
                                            }
                                            else {
                                                const element = node.element;
                                                if (!(location.hash === '#' + element.id || tagName === 'A' && location.hash === '#' + element.name)) {
                                                    return false;
                                                }
                                            }
                                            break;
                                        }
                                        case ':scope':
                                            if (!last || adjacent === '>' && node !== this) {
                                                return false;
                                            }
                                            break;
                                        case ':root':
                                            if (!last || adjacent) {
                                                return false;
                                            }
                                            break;
                                        case ':link':
                                        case ':visited':
                                        case ':any-link':
                                        case ':hover':
                                        case ':focus':
                                        case ':focus-within':
                                        case ':valid':
                                        case ':invalid': {
                                            const element = node.element;
                                            const children = parent.element.querySelectorAll(':scope > ' + pseudo);
                                            let valid = false;
                                            const lengthA = children.length;
                                            for (let j = 0; j < lengthA; j++) {
                                                if (children.item(i) === element) {
                                                    valid = true;
                                                    break;
                                                }
                                            }
                                            if (!valid) {
                                                return false;
                                            }
                                            break;
                                        }
                                        default: {
                                            let match = CACHE_PATTERN.NTH_CHILD_OFTYPE.exec(pseudo);
                                            if (match) {
                                                const placement = match[3].trim();
                                                let children = parent.naturalElements;
                                                if (match[1]) {
                                                    children = children.slice(0).reverse();
                                                }
                                                const index = (match[2] === 'child' ? children.indexOf(node) : $util$4.filterArray(children, item => item.tagName === tagName).indexOf(node)) + 1;
                                                if (index > 0) {
                                                    if ($util$4.isNumber(placement)) {
                                                        if (parseInt(placement) !== index) {
                                                            return false;
                                                        }
                                                    }
                                                    else {
                                                        switch (placement) {
                                                            case 'even':
                                                                if (index % 2 !== 0) {
                                                                    return false;
                                                                }
                                                                break;
                                                            case 'odd':
                                                                if (index % 2 === 0) {
                                                                    return false;
                                                                }
                                                                break;
                                                            default:
                                                                const subMatch = CACHE_PATTERN.NTH_CHILD_OFTYPE_VALUE.exec(placement);
                                                                if (subMatch) {
                                                                    const modifier = $util$4.convertInt(subMatch[3]);
                                                                    if (subMatch[2]) {
                                                                        if (subMatch[1]) {
                                                                            return false;
                                                                        }
                                                                        const increment = parseInt(subMatch[2]);
                                                                        if (increment !== 0) {
                                                                            if (index !== modifier) {
                                                                                for (let j = increment;; j += increment) {
                                                                                    const total = increment + modifier;
                                                                                    if (total === index) {
                                                                                        break;
                                                                                    }
                                                                                    else if (total > index) {
                                                                                        return false;
                                                                                    }
                                                                                }
                                                                            }
                                                                        }
                                                                        else if (index !== modifier) {
                                                                            return false;
                                                                        }
                                                                    }
                                                                    else if (subMatch[3]) {
                                                                        if (modifier > 0) {
                                                                            if (subMatch[1]) {
                                                                                if (index > modifier) {
                                                                                    return false;
                                                                                }
                                                                            }
                                                                            else if (index < modifier) {
                                                                                return false;
                                                                            }
                                                                        }
                                                                        else {
                                                                            return false;
                                                                        }
                                                                    }
                                                                }
                                                                break;
                                                        }
                                                    }
                                                    continue;
                                                }
                                            }
                                            else {
                                                match = CACHE_PATTERN.LANG.exec(pseudo);
                                                if (match) {
                                                    const attributes = node.attributes;
                                                    if (attributes['lang'] && match[1].toLowerCase() === attributes['lang'].toLowerCase()) {
                                                        continue;
                                                    }
                                                }
                                            }
                                            return false;
                                        }
                                    }
                                }
                            }
                            if (data.notList) {
                                for (const not of data.notList) {
                                    const notData = { all: false };
                                    switch (not.charAt(0)) {
                                        case '.':
                                            notData.classList = [not];
                                            break;
                                        case '#':
                                            notData.id = not.substring(1);
                                            break;
                                        case ':':
                                            notData.pseudoList = [not];
                                            break;
                                        case '[': {
                                            $regex$2.CSS.SELECTOR_ATTR.lastIndex = 0;
                                            const match = $regex$2.CSS.SELECTOR_ATTR.exec(not);
                                            if (match) {
                                                const caseInsensitive = match[6] === 'i';
                                                let attrValue = match[3] || match[4] || match[5] || '';
                                                if (caseInsensitive) {
                                                    attrValue = attrValue.toLowerCase();
                                                }
                                                notData.attrList = [{
                                                        key: match[1],
                                                        symbol: match[2],
                                                        value: attrValue,
                                                        caseInsensitive
                                                    }];
                                            }
                                            else {
                                                continue;
                                            }
                                            break;
                                        }
                                        default:
                                            if ($regex$2.CHAR.WORDDASH.test(not)) {
                                                notData.tagName = not;
                                            }
                                            else {
                                                return false;
                                            }
                                    }
                                    if (validate(node, notData, last)) {
                                        return false;
                                    }
                                }
                            }
                            if (data.classList) {
                                const classList = node.element.classList;
                                for (const className of data.classList) {
                                    if (!classList.contains(className)) {
                                        return false;
                                    }
                                }
                            }
                            if (data.attrList) {
                                const attributes = node.attributes;
                                for (const attr of data.attrList) {
                                    let actualValue = attributes[attr.key];
                                    if (actualValue === undefined) {
                                        return false;
                                    }
                                    else if (attr.value) {
                                        if (attr.caseInsensitive) {
                                            actualValue = actualValue.toLowerCase();
                                        }
                                        if (attr.symbol) {
                                            switch (attr.symbol) {
                                                case '~':
                                                    if (!actualValue.split($regex$2.CHAR.SPACE).includes(attr.value)) {
                                                        return false;
                                                    }
                                                    break;
                                                case '^':
                                                    if (!actualValue.startsWith(attr.value)) {
                                                        return false;
                                                    }
                                                    break;
                                                case '$':
                                                    if (!actualValue.endsWith(attr.value)) {
                                                        return false;
                                                    }
                                                    break;
                                                case '*':
                                                    if (actualValue.indexOf(attr.value) === -1) {
                                                        return false;
                                                    }
                                                    break;
                                                case '|':
                                                    if (actualValue !== attr.value && !actualValue.startsWith(attr.value + '-')) {
                                                        return false;
                                                    }
                                                    break;
                                            }
                                        }
                                        else if (actualValue !== attr.value) {
                                            return false;
                                        }
                                    }
                                }
                            }
                            return true;
                        };
                        const dataEnd = selectors.pop();
                        const lastEnd = selectors.length === 0;
                        let pending = [];
                        for (let j = offset; j < length; j++) {
                            const dataMap = queryMap[j];
                            if (dataEnd.all) {
                                pending = pending.concat(dataMap);
                            }
                            else {
                                for (const node of dataMap) {
                                    if (validate(node, dataEnd, lastEnd)) {
                                        pending.push(node);
                                    }
                                }
                            }
                        }
                        if (selectors.length) {
                            const depth = this.depth;
                            selectors.reverse();
                            length = selectors.length;
                            function ascend(index, adjacent, nodes) {
                                const selector = selectors[index];
                                const last = index === length - 1;
                                const next = [];
                                for (const node of nodes) {
                                    if (adjacent) {
                                        const parent = node.actualParent;
                                        if (adjacent === '>') {
                                            if (validate(parent, selector, last, adjacent)) {
                                                next.push(parent);
                                            }
                                        }
                                        else {
                                            const children = parent.naturalElements;
                                            switch (adjacent) {
                                                case '+': {
                                                    const indexA = children.indexOf(node);
                                                    if (indexA > 0) {
                                                        const sibling = children[indexA - 1];
                                                        if (sibling && validate(sibling, selector, last, adjacent)) {
                                                            next.push(sibling);
                                                        }
                                                    }
                                                    break;
                                                }
                                                case '~': {
                                                    const lengthA = children.length;
                                                    for (let k = 0; k < lengthA; k++) {
                                                        const sibling = children[k];
                                                        if (sibling === node) {
                                                            break;
                                                        }
                                                        else if (validate(sibling, selector, last, adjacent)) {
                                                            next.push(sibling);
                                                        }
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                    else if (node.depth - depth >= length - index) {
                                        let parent = node.actualParent;
                                        do {
                                            if (validate(parent, selector, last)) {
                                                next.push(parent);
                                            }
                                            parent = parent.actualParent;
                                        } while (parent);
                                    }
                                }
                                if (next.length) {
                                    if (++index === length) {
                                        return true;
                                    }
                                    return ascend(index, selector.adjacent, next);
                                }
                                return false;
                            }
                            for (const node of pending) {
                                if (ascend(0, dataEnd.adjacent, [node])) {
                                    result.push(node);
                                    if (result.length === resultCount) {
                                        return result;
                                    }
                                }
                            }
                        }
                        else if (result.length === 0 && (i === queries.length - 1 || resultCount >= 0 && resultCount <= pending.length)) {
                            if (resultCount >= 0 && pending.length > resultCount) {
                                pending.length = resultCount;
                            }
                            return pending;
                        }
                        else {
                            result = result.concat(pending);
                            if (resultCount >= 0 && result.length >= resultCount) {
                                result.length = resultCount;
                                return result;
                            }
                        }
                    }
                }
            }
            return result;
        }
        getTextStyle() {
            if (this._textStyle === undefined) {
                this._textStyle = {
                    fontFamily: this.css('fontFamily'),
                    fontSize: this.css('fontSize'),
                    fontWeight: this.css('fontWeight'),
                    fontStyle: this.css('fontStyle'),
                    color: this.css('color'),
                    whiteSpace: this.css('whiteSpace'),
                    textDecoration: this.css('textDecoration'),
                    textTransform: this.css('textTransform'),
                    letterSpacing: this.css('letterSpacing'),
                    wordSpacing: this.css('wordSpacing')
                };
            }
            return this._textStyle;
        }
        setDimension(attr, attrMin, attrMax) {
            const styleMap = this._styleMap;
            const baseValue = this.parseUnit(styleMap[attr], attr);
            let value = Math.max(baseValue, this.parseUnit(styleMap[attrMin], attr));
            if (value === 0 && this.styleElement) {
                const element = this._element;
                switch (element.tagName) {
                    case 'IMG':
                    case 'INPUT':
                        if (element.type !== 'image') {
                            break;
                        }
                    case 'TD':
                    case 'TH':
                    case 'SVG':
                    case 'IFRAME':
                    case 'VIDEO':
                    case 'CANVAS':
                    case 'OBJECT':
                    case 'EMBED':
                        const size = $dom$1.getNamedItem(element, attr);
                        if (size !== '') {
                            value = this.parseUnit(size, attr);
                            if (value > 0) {
                                this.css(attr, $css$1.isPercent(size) ? size : size + 'px');
                            }
                        }
                        break;
                }
            }
            let maxValue = 0;
            if (baseValue > 0 && !this.imageElement) {
                if (styleMap[attrMax] === styleMap[attr]) {
                    delete styleMap[attrMax];
                }
                else {
                    maxValue = this.parseUnit(styleMap[attrMax], attr);
                    if (maxValue > 0 && maxValue <= baseValue && $css$1.isLength(styleMap[attr])) {
                        maxValue = 0;
                        styleMap[attr] = styleMap[attrMax];
                        delete this._styleMap[attrMax];
                    }
                }
            }
            return maxValue > 0 ? Math.min(value, maxValue) : value;
        }
        setBoxModel(dimension) {
            const bounds = dimension === 'box' ? this._box : this._linear;
            if (bounds) {
                bounds.width = this.bounds.width;
                if (this.plainText) {
                    bounds.height = bounds.bottom - bounds.top;
                }
                else {
                    bounds.height = this.bounds.height;
                    switch (dimension) {
                        case 'box':
                            bounds.width -= this.contentBoxWidth;
                            bounds.height -= this.contentBoxHeight;
                            break;
                        case 'linear':
                            bounds.width += Math.max(this.marginLeft, 0) + this.marginRight;
                            bounds.height += Math.max(this.marginTop, 0) + this.marginBottom;
                            break;
                    }
                }
                if (this._initial[dimension] === undefined) {
                    this._initial[dimension] = $dom$1.assignRect(bounds);
                }
            }
        }
        convertPosition(attr) {
            let value = 0;
            if (!this.positionStatic) {
                const unit = this.cssInitial(attr, true);
                if ($css$1.isLength(unit)) {
                    value = $util$4.convertFloat(this.convertPX(unit, attr === 'left' || attr === 'right' ? 'width' : 'height'));
                }
                else if ($css$1.isPercent(unit) && this.styleElement) {
                    value = $util$4.convertFloat(this.style[attr]);
                }
            }
            return value;
        }
        convertBorderWidth(index) {
            if (!this.plainText) {
                const value = this.css($css$1.BOX_BORDER[index][0]);
                if (value !== 'none') {
                    const width = this.css($css$1.BOX_BORDER[index][1]);
                    let result;
                    switch (width) {
                        case 'thin':
                        case 'medium':
                        case 'thick':
                            result = $util$4.convertFloat(this.style[$css$1.BOX_BORDER[index][1]]);
                            break;
                        default:
                            result = this.parseUnit(width, index === 1 || index === 3 ? 'width' : 'height');
                            break;
                    }
                    if (result > 0) {
                        return Math.max(Math.round(result), 1);
                    }
                }
            }
            return 0;
        }
        convertBox(attr, margin) {
            switch (this.display) {
                case 'table':
                    if (!margin && this.css('borderCollapse') === 'collapse') {
                        return 0;
                    }
                    break;
                case 'table-row':
                    return 0;
                case 'table-cell':
                    if (margin) {
                        switch (this.tagName) {
                            case 'TD':
                            case 'TH':
                                return 0;
                            default:
                                const actualParent = this.actualParent;
                                if (actualParent) {
                                    const [horizontal, vertical] = actualParent.css('borderSpacing').split(' ');
                                    switch (attr) {
                                        case 'marginTop':
                                        case 'marginBottom':
                                            return vertical ? this.parseUnit(vertical, 'height', false) : this.parseUnit(horizontal, 'width', false);
                                        case 'marginRight':
                                            if (actualParent.lastChild !== this) {
                                                return this.parseUnit(horizontal, 'width', false);
                                            }
                                        case 'marginLeft':
                                            return 0;
                                    }
                                }
                                break;
                        }
                        return 0;
                    }
                    break;
            }
            const result = this.parseUnit(this.css(attr));
            if (!margin) {
                let paddingStart = this.toFloat('paddingInlineStart');
                let paddingEnd = this.toFloat('paddingInlineEnd');
                if (paddingStart > 0 || paddingEnd > 0) {
                    if (this.css('writingMode') === 'vertical-rl') {
                        if (this.dir === 'rtl') {
                            if (attr !== 'paddingBottom') {
                                paddingStart = 0;
                            }
                            if (attr !== 'paddingTop') {
                                paddingEnd = 0;
                            }
                        }
                        else {
                            if (attr !== 'paddingTop') {
                                paddingStart = 0;
                            }
                            if (attr !== 'paddingBottom') {
                                paddingEnd = 0;
                            }
                        }
                    }
                    else {
                        if (this.dir === 'rtl') {
                            if (attr !== 'paddingRight') {
                                paddingStart = 0;
                            }
                            if (attr !== 'paddingLeft') {
                                paddingEnd = 0;
                            }
                        }
                        else {
                            if (attr !== 'paddingLeft') {
                                paddingStart = 0;
                            }
                            if (attr !== 'paddingRight') {
                                paddingEnd = 0;
                            }
                        }
                    }
                    return paddingStart + result + paddingEnd;
                }
            }
            return result;
        }
        set parent(value) {
            if (value) {
                if (value !== this._parent) {
                    if (this._parent) {
                        this._parent.remove(this);
                    }
                    this._parent = value;
                }
                if (!value.contains(this)) {
                    value.append(this);
                }
                if (this.depth === -1) {
                    this.depth = value.depth + 1;
                }
            }
        }
        get parent() {
            return this._parent;
        }
        get tagName() {
            let result = this._cached.tagName;
            if (result === undefined) {
                const element = this._element;
                if (element) {
                    result = element.nodeName.charAt(0) === '#' ? element.nodeName : element.tagName;
                }
                else {
                    result = '';
                }
                this._cached.tagName = result;
            }
            return result;
        }
        get element() {
            return this._element;
        }
        get elementId() {
            return this._element ? this._element.id : '';
        }
        get htmlElement() {
            let result = this._cached.htmlElement;
            if (result === undefined) {
                result = !this.plainText && this._element instanceof HTMLElement;
                this._cached.htmlElement = result;
            }
            return result;
        }
        get svgElement() {
            let result = this._cached.svgElement;
            if (result === undefined) {
                result = !this.htmlElement && !this.plainText && this._element instanceof SVGElement;
                this._cached.svgElement = result;
            }
            return result;
        }
        get styleElement() {
            return this.htmlElement || this.svgElement;
        }
        get naturalChild() {
            return true;
        }
        get naturalElement() {
            let result = this._cached.naturalElement;
            if (result === undefined) {
                result = this.naturalChild && this.styleElement && !this.pseudoElement;
                this._cached.naturalElement = result;
            }
            return result;
        }
        get pseudoElement() {
            return false;
        }
        get imageElement() {
            return this.tagName === 'IMG';
        }
        get flexElement() {
            let result = this._cached.flexElement;
            if (result === undefined) {
                result = this.display.endsWith('flex');
                this._cached.flexElement = result;
            }
            return result;
        }
        get gridElement() {
            let result = this._cached.gridElement;
            if (result === undefined) {
                result = this.display.endsWith('grid');
                this._cached.gridElement = result;
            }
            return result;
        }
        get textElement() {
            let result = this._cached.textElement;
            if (result === undefined) {
                result = this.plainText || this.inlineText;
                this._cached.textElement = result;
            }
            return result;
        }
        get tableElement() {
            let result = this._cached.tableElement;
            if (result === undefined) {
                result = this.tagName === 'TABLE' || this.display === 'table';
                this._cached.tableElement = result;
            }
            return result;
        }
        get inputElement() {
            let result = this._cached.inputElement;
            if (result === undefined) {
                switch (this.tagName) {
                    case 'INPUT':
                    case 'BUTTON':
                    case 'SELECT':
                    case 'TEXTAREA':
                        result = true;
                        break;
                    default:
                        result = false;
                        break;
                }
                this._cached.inputElement = result;
            }
            return result;
        }
        get layoutElement() {
            let result = this._cached.layoutElement;
            if (result === undefined) {
                result = this.flexElement || this.gridElement;
                this._cached.layoutElement = result;
            }
            return result;
        }
        get plainText() {
            return this.tagName === '#text';
        }
        get styleText() {
            return this.naturalElement && this.inlineText;
        }
        get lineBreak() {
            return this.tagName === 'BR';
        }
        get documentBody() {
            return this._element === document.body;
        }
        get initial() {
            return this._initial;
        }
        get bounds() {
            return this._bounds || $dom$1.newBoxRectDimension();
        }
        get linear() {
            if (this._linear === undefined && this._bounds) {
                if (this._element) {
                    const bounds = this._bounds;
                    this._linear = {
                        top: bounds.top - (this.marginTop > 0 ? this.marginTop : 0),
                        right: bounds.right + this.marginRight,
                        bottom: bounds.bottom + this.marginBottom,
                        left: bounds.left - (this.marginLeft > 0 ? this.marginLeft : 0),
                        width: 0,
                        height: 0
                    };
                }
                else {
                    this._linear = $dom$1.assignRect(this._bounds);
                }
                this.setBoxModel('linear');
            }
            return this._linear || $dom$1.newBoxRectDimension();
        }
        get box() {
            if (this._box === undefined && this._bounds) {
                if (this._element) {
                    const bounds = this._bounds;
                    this._box = {
                        top: bounds.top + (this.paddingTop + this.borderTopWidth),
                        right: bounds.right - (this.paddingRight + this.borderRightWidth),
                        bottom: bounds.bottom - (this.paddingBottom + this.borderBottomWidth),
                        left: bounds.left + (this.paddingLeft + this.borderLeftWidth),
                        width: 0,
                        height: 0
                    };
                }
                else {
                    this._box = $dom$1.assignRect(this._bounds);
                }
                this.setBoxModel('box');
            }
            return this._box || $dom$1.newBoxRectDimension();
        }
        get dataset() {
            if (this.styleElement) {
                return this._element.dataset;
            }
            else {
                if (this._dataset === undefined) {
                    this._dataset = {};
                }
                return this._dataset;
            }
        }
        get flexbox() {
            let result = this._cached.flexbox;
            if (result === undefined) {
                const actualParent = this.actualParent;
                const alignSelf = this.css('alignSelf');
                const justifySelf = this.css('justifySelf');
                const getFlexValue = (attr, initialValue, parent) => {
                    const value = (parent || this).css(attr);
                    if ($util$4.isNumber(value)) {
                        return parseFloat(value);
                    }
                    else if (value === 'inherit' && parent === undefined && actualParent) {
                        return getFlexValue(attr, initialValue, actualParent);
                    }
                    return initialValue;
                };
                result = {
                    alignSelf: alignSelf === 'auto' && actualParent && actualParent.has('alignItems') ? actualParent.css('alignItems') : alignSelf,
                    justifySelf: justifySelf === 'auto' && actualParent && actualParent.has('justifyItems') ? actualParent.css('justifyItems') : justifySelf,
                    basis: this.css('flexBasis'),
                    grow: getFlexValue('flexGrow', 0),
                    shrink: getFlexValue('flexShrink', 1),
                    order: this.toInt('order')
                };
                this._cached.flexbox = result;
            }
            return result;
        }
        get width() {
            let result = this._cached.width;
            if (result === undefined) {
                result = this.setDimension('width', 'minWidth', 'maxWidth');
                this._cached.width = result;
            }
            return result;
        }
        get height() {
            let result = this._cached.height;
            if (result === undefined) {
                result = this.setDimension('height', 'minHeight', 'maxHeight');
                this._cached.height = result;
            }
            return result;
        }
        get hasWidth() {
            return this.width > 0;
        }
        get hasHeight() {
            const value = this.css('height');
            if ($css$1.isPercent(value)) {
                if (this.pageFlow) {
                    const parent = this.actualParent;
                    if (parent && parent.hasHeight) {
                        return parseFloat(value) > 0;
                    }
                }
                return false;
            }
            return this.height > 0;
        }
        get lineHeight() {
            let result = this._cached.lineHeight;
            if (result === undefined) {
                result = 0;
                if (!this.imageElement && !this.svgElement) {
                    let hasOwnStyle = this.has('lineHeight');
                    let value = 0;
                    if (hasOwnStyle) {
                        const lineHeight = this.css('lineHeight');
                        if ($css$1.isPercent(lineHeight)) {
                            value = $util$4.convertFloat(this.style.lineHeight);
                        }
                        else {
                            value = $css$1.parseUnit(lineHeight, this.fontSize);
                            if (lineHeight.endsWith('px')) {
                                const fontSize = this.cssInitial('fontSize');
                                if (fontSize.endsWith('em')) {
                                    value *= parseFloat(fontSize);
                                }
                            }
                        }
                    }
                    else if (this.naturalChild) {
                        let current = this.actualParent;
                        while (current) {
                            if (current.lineHeight > 0) {
                                value = current.lineHeight;
                                break;
                            }
                            current = current.actualParent;
                        }
                        if (this.styleElement) {
                            const fontSize = this.cssInitial('fontSize');
                            if (fontSize.endsWith('em')) {
                                const emSize = parseFloat(fontSize);
                                if (emSize !== 1) {
                                    value *= emSize;
                                    this.css('lineHeight', $css$1.formatPX(value));
                                    hasOwnStyle = true;
                                }
                            }
                        }
                    }
                    if (hasOwnStyle || value > this.actualHeight || this.multiline || this.block && this.naturalChildren.some(node => node.textElement)) {
                        result = value;
                    }
                }
                this._cached.lineHeight = result;
            }
            return result;
        }
        get display() {
            return this.css('display');
        }
        get positionStatic() {
            let result = this._cached.positionStatic;
            if (result === undefined) {
                switch (this.css('position')) {
                    case 'fixed':
                    case 'absolute':
                        result = false;
                        break;
                    case 'sticky':
                    case 'relative':
                        result = !this.hasPX('top') && !this.hasPX('right') && !this.hasPX('bottom') && !this.hasPX('left');
                        if (result) {
                            this._cached.positionRelative = false;
                        }
                        break;
                    case 'inherit':
                        const element = this._element;
                        const position = element && element.parentElement ? $css$1.getInheritedStyle(element.parentElement, 'position') : '';
                        result = position !== '' && !(position === 'absolute' || position === 'fixed');
                        break;
                    default:
                        result = true;
                        break;
                }
                this._cached.positionStatic = result;
            }
            return result;
        }
        get positionRelative() {
            let result = this._cached.positionRelative;
            if (result === undefined) {
                const value = this.css('position');
                result = value === 'relative' || value === 'sticky';
                this._cached.positionRelative = result;
            }
            return result;
        }
        get positionAuto() {
            let result = this._cached.positionAuto;
            if (result === undefined) {
                if (this.pageFlow) {
                    result = false;
                }
                else {
                    const { top, right, bottom, left } = this._initial.iteration === -1 ? this._styleMap : this._initial.styleMap;
                    result = (!top || top === 'auto') &&
                        (!right || right === 'auto') &&
                        (!bottom || bottom === 'auto') &&
                        (!left || left === 'auto') &&
                        this.toFloat('opacity', true, 1) > 0;
                }
                this._cached.positionAuto = result;
            }
            return result;
        }
        get top() {
            let result = this._cached.top;
            if (result === undefined) {
                result = this.convertPosition('top');
                this._cached.top = result;
            }
            return result;
        }
        get right() {
            let result = this._cached.right;
            if (result === undefined) {
                result = this.convertPosition('right');
                this._cached.right = result;
            }
            return result;
        }
        get bottom() {
            let result = this._cached.bottom;
            if (result === undefined) {
                result = this.convertPosition('bottom');
                this._cached.bottom = result;
            }
            return result;
        }
        get left() {
            let result = this._cached.left;
            if (result === undefined) {
                result = this.convertPosition('left');
                this._cached.left = result;
            }
            return result;
        }
        get marginTop() {
            let result = this._cached.marginTop;
            if (result === undefined) {
                result = this.inlineStatic ? 0 : this.convertBox('marginTop', true);
                this._cached.marginTop = result;
            }
            return result;
        }
        get marginRight() {
            let result = this._cached.marginRight;
            if (result === undefined) {
                result = this.convertBox('marginRight', true);
                this._cached.marginRight = result;
            }
            return result;
        }
        get marginBottom() {
            let result = this._cached.marginBottom;
            if (result === undefined) {
                result = this.inlineStatic ? 0 : this.convertBox('marginBottom', true);
                this._cached.marginBottom = result;
            }
            return result;
        }
        get marginLeft() {
            let result = this._cached.marginLeft;
            if (result === undefined) {
                result = this.convertBox('marginLeft', true);
                this._cached.marginLeft = result;
            }
            return result;
        }
        get borderTopWidth() {
            let result = this._cached.borderTopWidth;
            if (result === undefined) {
                result = this.convertBorderWidth(0);
                this._cached.borderTopWidth = result;
            }
            return result;
        }
        get borderRightWidth() {
            let result = this._cached.borderRightWidth;
            if (result === undefined) {
                result = this.convertBorderWidth(1);
                this._cached.borderRightWidth = result;
            }
            return result;
        }
        get borderBottomWidth() {
            let result = this._cached.borderBottomWidth;
            if (result === undefined) {
                result = this.convertBorderWidth(2);
                this._cached.borderBottomWidth = result;
            }
            return result;
        }
        get borderLeftWidth() {
            let result = this._cached.borderLeftWidth;
            if (result === undefined) {
                result = this.convertBorderWidth(3);
                this._cached.borderLeftWidth = result;
            }
            return result;
        }
        get paddingTop() {
            let result = this._cached.paddingTop;
            if (result === undefined) {
                result = this.convertBox('paddingTop', false);
                this._cached.paddingTop = result;
            }
            return result;
        }
        get paddingRight() {
            let result = this._cached.paddingRight;
            if (result === undefined) {
                result = this.convertBox('paddingRight', false);
                this._cached.paddingRight = result;
            }
            return result;
        }
        get paddingBottom() {
            let result = this._cached.paddingBottom;
            if (result === undefined) {
                result = this.convertBox('paddingBottom', false);
                this._cached.paddingBottom = result;
            }
            return result;
        }
        get paddingLeft() {
            let result = this._cached.paddingLeft;
            if (result === undefined) {
                result = this.convertBox('paddingLeft', false);
                this._cached.paddingLeft = result;
            }
            return result;
        }
        get contentBox() {
            return this.css('boxSizing') !== 'border-box';
        }
        get contentBoxWidth() {
            let result = this._cached.contentBoxWidth;
            if (result === undefined) {
                result = this.tableElement && this.css('borderCollapse') === 'collapse' ? 0 : this.borderLeftWidth + this.paddingLeft + this.paddingRight + this.borderRightWidth;
                this._cached.contentBoxWidth = result;
            }
            return result;
        }
        get contentBoxHeight() {
            let result = this._cached.contentBoxHeight;
            if (result === undefined) {
                result = this.tableElement && this.css('borderCollapse') === 'collapse' ? 0 : this.borderTopWidth + this.paddingTop + this.paddingBottom + this.borderBottomWidth;
                this._cached.contentBoxHeight = result;
            }
            return result;
        }
        get inline() {
            let result = this._cached.inline;
            if (result === undefined) {
                const value = this.display;
                result = value === 'inline' || value === 'initial' && !$dom$1.ELEMENT_BLOCK.includes(this.tagName);
                this._cached.inline = result;
            }
            return result;
        }
        get inlineStatic() {
            let result = this._cached.inlineStatic;
            if (result === undefined) {
                result = this.inline && this.pageFlow && !this.floating && !this.imageElement;
                this._cached.inlineStatic = result;
            }
            return result;
        }
        get inlineHorizontal() {
            let result = this._cached.inlineHorizontal;
            if (result === undefined) {
                if (this.naturalElement) {
                    const value = this.display;
                    result = value.startsWith('inline-') || this.flexElement || this.floating || value.startsWith('table');
                }
                else {
                    result = this.plainText;
                }
                this._cached.inlineVertical = result;
            }
            return result;
        }
        get inlineVertical() {
            let result = this._cached.inlineVertical;
            if (result === undefined) {
                if (this.naturalElement) {
                    const value = this.display;
                    result = (value.startsWith('inline') || value === 'table-cell') && !this.floating && !this.plainText;
                }
                else {
                    result = false;
                }
                this._cached.inlineVertical = result;
            }
            return result;
        }
        set inlineText(value) {
            switch (this.tagName) {
                case 'INPUT':
                case 'IMG':
                case 'SELECT':
                case 'SVG':
                case 'BR':
                case 'HR':
                case 'TEXTAREA':
                    this._inlineText = false;
                    break;
                case 'BUTTON':
                    this._inlineText = this.textContent.trim() !== '';
                    break;
                default:
                    this._inlineText = value;
                    break;
            }
        }
        get inlineText() {
            return this._inlineText;
        }
        get block() {
            let result = this._cached.block;
            if (result === undefined) {
                switch (this.display) {
                    case 'block':
                    case 'flex':
                    case 'grid':
                    case 'list-item':
                        result = true;
                        break;
                    case 'initial':
                        result = $dom$1.ELEMENT_BLOCK.includes(this.tagName);
                        break;
                    case 'inline':
                        if (this.tagName === 'svg' && this.actualParent.htmlElement) {
                            result = !this.hasPX('width') && $util$4.convertFloat($dom$1.getNamedItem(this._element, 'width')) === 0;
                            break;
                        }
                    default:
                        result = false;
                        break;
                }
                this._cached.block = result;
            }
            return result;
        }
        get blockStatic() {
            let result = this._cached.blockStatic;
            if (result === undefined) {
                result = this.pageFlow && (this.block && !this.floating || this.blockDimension && this.cssInitial('width') === '100%' && !this.hasPX('maxWidth'));
                this._cached.blockStatic = result;
            }
            return result;
        }
        get blockDimension() {
            let result = this._cached.blockDimension;
            if (result === undefined) {
                const value = this.display;
                result = this.block || value.startsWith('inline-') || value === 'table' || this.imageElement || this.svgElement;
                this._cached.blockDimension = result;
            }
            return result;
        }
        get blockVertical() {
            let result = this._cached.blockVertical;
            if (result === undefined) {
                result = this.blockDimension && this.hasPX('height');
                this._cached.blockVertical = result;
            }
            return result;
        }
        get pageFlow() {
            let result = this._cached.pageFlow;
            if (result === undefined) {
                result = this.positionStatic || this.positionRelative;
                this._cached.pageFlow = result;
            }
            return result;
        }
        get inlineFlow() {
            let result = this._cached.inlineFlow;
            if (result === undefined) {
                const display = this.display;
                result = this.inline || display.startsWith('inline') || display === 'table-cell' || this.imageElement || this.floating;
                this._cached.inlineFlow = result;
            }
            return result;
        }
        get centerAligned() {
            let result = this._cached.centerAligned;
            if (result === undefined) {
                result = this.autoMargin.leftRight || this.textElement && this.blockStatic && this.cssInitial('textAlign') === 'center' || this.inlineStatic && this.cssAscend('textAlign', true) === 'center';
                this._cached.centerAligned = result;
            }
            return result;
        }
        get rightAligned() {
            let result = this._cached.rightAligned;
            if (result === undefined) {
                result = this.float === 'right' || this.autoMargin.left || !this.pageFlow && this.hasPX('right') || this.textElement && this.blockStatic && this.cssInitial('textAlign') === 'right';
                this._cached.rightAligned = result;
            }
            return result;
        }
        get bottomAligned() {
            let result = this._cached.bottomAligned;
            if (result === undefined) {
                result = !this.pageFlow && this.hasPX('bottom') && this.bottom >= 0;
                this._cached.bottomAligned = result;
            }
            return result;
        }
        get horizontalAligned() {
            let result = this._cached.horizontalAligned;
            if (result === undefined) {
                result = !this.blockStatic && !this.autoMargin.horizontal && !(this.blockDimension && this.css('width') === '100%');
                this._cached.horizontalAligned = result;
            }
            return result;
        }
        get autoMargin() {
            let result = this._cached.autoMargin;
            if (result === undefined) {
                if (!this.pageFlow || this.blockStatic || this.display === 'table') {
                    const styleMap = this._initial.iteration === -1 ? this._styleMap : this._initial.styleMap;
                    const left = styleMap.marginLeft === 'auto' && (this.pageFlow || this.hasPX('right'));
                    const right = styleMap.marginRight === 'auto' && (this.pageFlow || this.hasPX('left'));
                    const top = styleMap.marginTop === 'auto' && (this.pageFlow || this.hasPX('bottom'));
                    const bottom = styleMap.marginBottom === 'auto' && (this.pageFlow || this.hasPX('top'));
                    result = {
                        horizontal: left || right,
                        left: left && !right,
                        right: !left && right,
                        leftRight: left && right,
                        vertical: top || bottom,
                        top: top && !bottom,
                        bottom: !top && bottom,
                        topBottom: top && bottom
                    };
                }
                else {
                    result = {};
                }
                this._cached.autoMargin = result;
            }
            return result;
        }
        get floating() {
            let result = this._cached.floating;
            if (result === undefined) {
                if (this.pageFlow) {
                    result = this.cssAny('float', 'left', 'right');
                }
                else {
                    result = false;
                }
                this._cached.floating = result;
            }
            return result;
        }
        get float() {
            let result = this._cached.float;
            if (result === undefined) {
                result = this.css('float') || 'none';
                this._cached.float = result;
            }
            return result;
        }
        get zIndex() {
            return this.toInt('zIndex');
        }
        get textContent() {
            let result = this._cached.textContent;
            if (result === undefined) {
                result = !this.svgElement ? this._element.textContent : '';
                this._cached.textContent = result;
            }
            return result;
        }
        get src() {
            return this.htmlElement && this._element.src || '';
        }
        get overflow() {
            let result = this._cached.overflow;
            if (result === undefined) {
                result = 0;
                if (this.htmlElement && !this.inputElement && !this.imageElement && this.tagName !== 'HR' && !this.documentBody) {
                    const element = this._element;
                    const overflowX = this.css('overflowX');
                    const overflowY = this.css('overflowY');
                    if (this.hasHeight && (this.hasPX('height') || this.hasPX('maxHeight')) && (overflowY === 'scroll' || overflowY === 'auto' && element.clientHeight !== element.scrollHeight)) {
                        result |= 16 /* VERTICAL */;
                    }
                    if ((this.hasPX('width') || this.hasPX('maxWidth')) && (overflowX === 'scroll' || overflowX === 'auto' && element.clientWidth !== element.scrollWidth)) {
                        result |= 8 /* HORIZONTAL */;
                    }
                    if (overflowX === 'auto' || overflowX === 'hidden' || overflowX === 'overlay' || overflowY === 'auto' || overflowY === 'hidden' || overflowY === 'overlay') {
                        result |= 64 /* BLOCK */;
                    }
                }
                this._cached.overflow = result;
            }
            return result;
        }
        get overflowX() {
            return $util$4.hasBit(this.overflow, 8 /* HORIZONTAL */);
        }
        get overflowY() {
            return $util$4.hasBit(this.overflow, 16 /* VERTICAL */);
        }
        get baseline() {
            let result = this._cached.baseline;
            if (result === undefined) {
                result = this.pageFlow && !this.floating && this.cssAny('verticalAlign', 'baseline', 'initial', '0px', '0%');
                this._cached.baseline = result;
            }
            return result;
        }
        get verticalAlign() {
            let result = this._cached.verticalAlign;
            if (result === undefined) {
                result = this.css('verticalAlign');
                if ($css$1.isLength(result, true)) {
                    result = this.convertPX(result, 'height');
                }
                this._cached.verticalAlign = result;
            }
            return result;
        }
        set textBounds(value) {
            if (value) {
                this._textBounds = value;
            }
            else {
                this._textBounds = undefined;
            }
        }
        get textBounds() {
            if (this.naturalChild && this._textBounds === undefined) {
                this._textBounds = $session$1.actualTextRangeRect(this._element, this.sessionId);
            }
            return this._textBounds;
        }
        get multiline() {
            let result = this._cached.multiline;
            if (result === undefined) {
                if (this.plainText) {
                    result = $dom$1.getRangeClientRect(this._element).numberOfLines > 1;
                }
                else if (this.styleText && (this.inlineFlow || this.naturalElements.length === 0)) {
                    const textBounds = this.textBounds;
                    result = textBounds ? textBounds.numberOfLines > 1 : false;
                }
                else {
                    result = false;
                }
                this._cached.multiline = result;
            }
            return result;
        }
        get positiveAxis() {
            let result = this._cached.positiveAxis;
            if (result === undefined) {
                result = (!this.positionRelative || this.positionRelative && this.top >= 0 && this.left >= 0 && (this.right <= 0 || this.hasPX('left')) && (this.bottom <= 0 || this.hasPX('top'))) && this.marginTop >= 0 && this.marginLeft >= 0 && this.marginRight >= 0;
                this._cached.positiveAxis = result;
            }
            return result;
        }
        get backgroundColor() {
            let result = this._cached.backgroundColor;
            if (result === undefined) {
                result = this.css('backgroundColor');
                switch (result) {
                    case 'initial':
                    case 'rgba(0, 0, 0, 0)':
                    case 'transparent':
                        result = '';
                        break;
                    default:
                        if (result !== '' && this.pageFlow && !this.plainText && !this.inputElement && (this._initial.iteration === -1 || this.cssInitial('backgroundColor') === result)) {
                            let current = this.actualParent;
                            while (current && current.id !== 0) {
                                const color = current.cssInitial('backgroundColor', true);
                                if (color !== '') {
                                    if (color === result && current.backgroundColor === '') {
                                        result = '';
                                    }
                                    break;
                                }
                                current = current.actualParent;
                            }
                        }
                        break;
                }
                this._cached.backgroundColor = result;
            }
            return result;
        }
        get backgroundImage() {
            let result = this._cached.backgroundImage;
            if (result === undefined) {
                const value = this.css('backgroundImage');
                if (value !== '' && value !== 'none' && value !== 'initial') {
                    result = value;
                }
                else {
                    const match = CACHE_PATTERN.BACKGROUND.exec(this.css('background'));
                    result = match ? match[1] : '';
                }
                this._cached.backgroundImage = result;
            }
            return result;
        }
        get visibleStyle() {
            let result = this._cached.visibleStyle;
            if (result === undefined) {
                if (this.plainText) {
                    result = {
                        background: false,
                        borderWidth: false,
                        backgroundImage: false,
                        backgroundColor: false,
                        backgroundRepeat: false
                    };
                }
                else {
                    const borderWidth = this.borderTopWidth > 0 || this.borderRightWidth > 0 || this.borderBottomWidth > 0 || this.borderLeftWidth > 0;
                    const backgroundColor = this.backgroundColor !== '';
                    const backgroundImage = this.backgroundImage !== '';
                    result = {
                        background: borderWidth || backgroundImage || backgroundColor,
                        borderWidth,
                        backgroundImage,
                        backgroundColor,
                        backgroundRepeat: this.css('backgroundRepeat') !== 'no-repeat'
                    };
                }
                this._cached.visibleStyle = result;
            }
            return result;
        }
        get percentWidth() {
            let result = this._cached.percentWidth;
            if (result === undefined) {
                result = $css$1.isPercent(this.cssInitial('width', true));
                this._cached.percentWidth = result;
            }
            return result;
        }
        get percentHeight() {
            let result = this._cached.percentHeight;
            if (result === undefined) {
                result = $css$1.isPercent(this.cssInitial('height', true));
                this._cached.percentHeight = result;
            }
            return result;
        }
        get absoluteParent() {
            let result = this._cached.absoluteParent;
            if (result === undefined) {
                result = this.actualParent;
                if (!this.pageFlow) {
                    while (result && result.id !== 0) {
                        const position = result.cssInitial('position', false, true);
                        if (result.documentBody || position !== 'static' && position !== 'initial') {
                            break;
                        }
                        result = result.actualParent;
                    }
                }
                this._cached.absoluteParent = result;
            }
            return result;
        }
        set actualParent(value) {
            this._cached.actualParent = value;
        }
        get actualParent() {
            let result = this._cached.actualParent;
            if (result === undefined) {
                const element = this._element;
                result = element && element.parentElement && $session$1.getElementAsNode(element.parentElement, this.sessionId) || null;
                this._cached.actualParent = result;
            }
            return result;
        }
        get actualWidth() {
            let result = this._cached.actualWidth;
            if (result === undefined) {
                if (this.plainText) {
                    result = this.bounds.right - this.bounds.left;
                }
                else {
                    result = this.bounds.width;
                    const parent = this.actualParent;
                    if (parent && !parent.flexElement && this.display !== 'table-cell') {
                        const width = this.parseUnit(this.cssInitial('width', true));
                        if (width > 0) {
                            result = width;
                            const maxWidth = this.parseUnit(this.css('maxWidth'));
                            if (maxWidth > 0) {
                                result = Math.min(result, maxWidth);
                            }
                            if (this.contentBox && !this.tableElement) {
                                result += this.contentBoxWidth;
                            }
                        }
                    }
                }
                this._cached.actualWidth = result;
            }
            return result;
        }
        get actualHeight() {
            let result = this._cached.actualHeight;
            if (result === undefined) {
                result = this.bounds.height;
                if (!this.plainText) {
                    const parent = this.actualParent;
                    if (parent && !parent.flexElement && this.display !== 'table-cell') {
                        const height = this.parseUnit(this.cssInitial('height', true), 'height');
                        if (height > 0) {
                            result = height;
                            const maxHeight = this.parseUnit(this.css('maxHeight'));
                            if (maxHeight > 0) {
                                result = Math.min(result, maxHeight);
                            }
                            if (this.contentBox && !this.tableElement) {
                                result += this.contentBoxHeight;
                            }
                        }
                    }
                }
                this._cached.actualHeight = result;
            }
            return result;
        }
        get actualDimension() {
            return { width: this.actualWidth, height: this.actualHeight };
        }
        set naturalChildren(value) {
            this._naturalChildren = value;
        }
        get naturalChildren() {
            if (this._naturalChildren === undefined) {
                if (this.naturalElement) {
                    const sessionId = this.sessionId;
                    const children = [];
                    let i = 0;
                    this._element.childNodes.forEach((child) => {
                        const node = $session$1.getElementAsNode(child, sessionId);
                        if (node) {
                            node.childIndex = i++;
                            children.push(node);
                        }
                    });
                    this._naturalChildren = children;
                }
                else {
                    if (this._initial.iteration === -1) {
                        this.saveAsInitial();
                    }
                    this._naturalChildren = this._initial.children;
                }
            }
            return this._naturalChildren;
        }
        set naturalElements(value) {
            this._naturalElements = value;
        }
        get naturalElements() {
            if (this._naturalElements === undefined) {
                this._naturalElements = $util$4.filterArray(this.naturalChildren, node => node.naturalElement);
            }
            return this._naturalElements;
        }
        get firstChild() {
            return this.naturalElements[0] || null;
        }
        get lastChild() {
            const children = this.naturalElements;
            const length = children.length;
            return length ? children[length - 1] : null;
        }
        get firstStaticChild() {
            for (const node of this.naturalChildren) {
                if (node.pageFlow) {
                    return node;
                }
            }
            return null;
        }
        get lastStaticChild() {
            const children = this.naturalChildren;
            for (let i = children.length - 1; i >= 0; i--) {
                const node = children[i];
                if (node.pageFlow) {
                    return node;
                }
            }
            return null;
        }
        get previousSibling() {
            const parent = this.actualParent;
            if (parent) {
                return parent.naturalChildren[this.childIndex - 1] || null;
            }
            return null;
        }
        get nextSibling() {
            const parent = this.actualParent;
            if (parent) {
                return parent.naturalChildren[this.childIndex + 1] || null;
            }
            return null;
        }
        get previousElementSibling() {
            const parent = this.actualParent;
            if (parent) {
                const children = parent.naturalElements;
                const index = children.indexOf(this);
                if (index > 0) {
                    return children[index - 1];
                }
            }
            return null;
        }
        get nextElementSibling() {
            const parent = this.actualParent;
            if (parent) {
                const children = parent.naturalElements;
                const index = children.indexOf(this);
                if (index < children.length - 1) {
                    return children[index + 1];
                }
            }
            return null;
        }
        get attributes() {
            let result = this._cached.attributes;
            if (result === undefined) {
                result = {};
                if (this.styleElement) {
                    const attributes = this._element.attributes;
                    const length = attributes.length;
                    for (let i = 0; i < length; i++) {
                        const attr = attributes.item(i);
                        result[attr.name] = attr.value;
                    }
                }
                this._cached.attributes = result;
            }
            return result;
        }
        get fontSize() {
            if (this._fontSize === 0) {
                this._fontSize = this.naturalElement ? parseFloat(this.style.getPropertyValue('font-size')) : $css$1.parseUnit(this.css('fontSize'));
            }
            return this._fontSize || parseFloat($css$1.getStyle(document.body).getPropertyValue('font-size'));
        }
        set dir(value) {
            this._cached.dir = value;
        }
        get dir() {
            let result = this._cached.dir;
            if (result === undefined) {
                result = this.naturalElement ? this._element.dir : '';
                if (result === '') {
                    let current = this.actualParent;
                    while (current) {
                        result = current.dir;
                        if (result !== '') {
                            break;
                        }
                        current = current.actualParent;
                    }
                }
                this._cached.dir = result;
            }
            return result;
        }
        get center() {
            const bounds = this.bounds;
            return {
                x: (bounds.left + bounds.right) / 2,
                y: (bounds.top + bounds.bottom) / 2
            };
        }
        get extensions() {
            let result = this._cached.extensions;
            if (result === undefined) {
                result = this.dataset.use ? $util$4.spliceArray(this.dataset.use.split($regex$2.XML.SEPARATOR), value => value === '') : [];
                this._cached.extensions = result;
            }
            return result;
        }
    }

    const STRING_BASE = {
        EXT_DATA: 'mainData',
        TOP_BOTTOM: 'topBottom',
        BOTTOM_TOP: 'bottomTop',
        LEFT_RIGHT: 'leftRight',
        RIGHT_LEFT: 'rightLeft'
    };
    const CSS_SPACING = new Map([
        [2 /* MARGIN_TOP */, 'marginTop'],
        [4 /* MARGIN_RIGHT */, 'marginRight'],
        [8 /* MARGIN_BOTTOM */, 'marginBottom'],
        [16 /* MARGIN_LEFT */, 'marginLeft'],
        [32 /* PADDING_TOP */, 'paddingTop'],
        [64 /* PADDING_RIGHT */, 'paddingRight'],
        [128 /* PADDING_BOTTOM */, 'paddingBottom'],
        [256 /* PADDING_LEFT */, 'paddingLeft']
    ]);
    const EXT_NAME = {
        ACCESSIBILITY: 'squared.accessibility',
        CSS_GRID: 'squared.css-grid',
        FLEXBOX: 'squared.flexbox',
        GRID: 'squared.grid',
        LIST: 'squared.list',
        RELATIVE: 'squared.relative',
        SPRITE: 'squared.sprite',
        TABLE: 'squared.table',
        VERTICAL_ALIGN: 'squared.verticalalign',
        WHITESPACE: 'squared.whitespace'
    };

    var constant = /*#__PURE__*/Object.freeze({
        __proto__: null,
        STRING_BASE: STRING_BASE,
        CSS_SPACING: CSS_SPACING,
        EXT_NAME: EXT_NAME
    });

    var APP_SECTION;
    (function (APP_SECTION) {
        APP_SECTION[APP_SECTION["DOM_TRAVERSE"] = 2] = "DOM_TRAVERSE";
        APP_SECTION[APP_SECTION["EXTENSION"] = 4] = "EXTENSION";
        APP_SECTION[APP_SECTION["RENDER"] = 8] = "RENDER";
        APP_SECTION[APP_SECTION["ALL"] = 14] = "ALL";
    })(APP_SECTION || (APP_SECTION = {}));
    var NODE_RESOURCE;
    (function (NODE_RESOURCE) {
        NODE_RESOURCE[NODE_RESOURCE["BOX_STYLE"] = 2] = "BOX_STYLE";
        NODE_RESOURCE[NODE_RESOURCE["BOX_SPACING"] = 4] = "BOX_SPACING";
        NODE_RESOURCE[NODE_RESOURCE["FONT_STYLE"] = 8] = "FONT_STYLE";
        NODE_RESOURCE[NODE_RESOURCE["VALUE_STRING"] = 16] = "VALUE_STRING";
        NODE_RESOURCE[NODE_RESOURCE["IMAGE_SOURCE"] = 32] = "IMAGE_SOURCE";
        NODE_RESOURCE[NODE_RESOURCE["ASSET"] = 56] = "ASSET";
        NODE_RESOURCE[NODE_RESOURCE["ALL"] = 126] = "ALL";
    })(NODE_RESOURCE || (NODE_RESOURCE = {}));
    var NODE_PROCEDURE;
    (function (NODE_PROCEDURE) {
        NODE_PROCEDURE[NODE_PROCEDURE["CONSTRAINT"] = 2] = "CONSTRAINT";
        NODE_PROCEDURE[NODE_PROCEDURE["LAYOUT"] = 4] = "LAYOUT";
        NODE_PROCEDURE[NODE_PROCEDURE["ALIGNMENT"] = 8] = "ALIGNMENT";
        NODE_PROCEDURE[NODE_PROCEDURE["ACCESSIBILITY"] = 16] = "ACCESSIBILITY";
        NODE_PROCEDURE[NODE_PROCEDURE["LOCALIZATION"] = 32] = "LOCALIZATION";
        NODE_PROCEDURE[NODE_PROCEDURE["CUSTOMIZATION"] = 64] = "CUSTOMIZATION";
        NODE_PROCEDURE[NODE_PROCEDURE["ALL"] = 126] = "ALL";
    })(NODE_PROCEDURE || (NODE_PROCEDURE = {}));

    var enumeration = /*#__PURE__*/Object.freeze({
        __proto__: null,
        get APP_SECTION () { return APP_SECTION; },
        get NODE_RESOURCE () { return NODE_RESOURCE; },
        get NODE_PROCEDURE () { return NODE_PROCEDURE; }
    });

    const { css: $css$2, dom: $dom$2, math: $math, session: $session$2, util: $util$5 } = squared.lib;
    const CSS_SPACING_KEYS = Array.from(CSS_SPACING.keys());
    const INHERIT_ALIGNMENT = ['position', 'display', 'verticalAlign', 'float', 'clear', 'zIndex'];
    const canCascadeChildren = (node) => node.naturalElements.length && !node.layoutElement && !node.tableElement;
    class NodeUI extends Node {
        constructor() {
            super(...arguments);
            this.alignmentType = 0;
            this.baselineActive = false;
            this.baselineAltered = false;
            this.positioned = false;
            this.rendered = false;
            this.excluded = false;
            this.controlId = '';
            this.floatContainer = false;
            this.containerIndex = Number.POSITIVE_INFINITY;
            this.lineBreakLeading = false;
            this.lineBreakTrailing = false;
            this._excludeSection = 0;
            this._excludeProcedure = 0;
            this._excludeResource = 0;
            this._visible = true;
            this._locked = {};
        }
        static outerRegion(node) {
            let top = Number.POSITIVE_INFINITY;
            let right = Number.NEGATIVE_INFINITY;
            let bottom = Number.NEGATIVE_INFINITY;
            let left = Number.POSITIVE_INFINITY;
            node.each((item) => {
                let actualTop;
                let actualRight;
                let actualBottom;
                let actualLeft;
                if (item.companion) {
                    actualTop = item.actualRect('top');
                    actualRight = item.actualRect('right');
                    actualBottom = item.actualRect('bottom');
                    actualLeft = item.actualRect('left');
                }
                else {
                    ({ top: actualTop, right: actualRight, bottom: actualBottom, left: actualLeft } = item.linear);
                }
                if (actualTop < top) {
                    top = actualTop;
                }
                if (actualRight > right) {
                    right = actualRight;
                }
                if (actualBottom > bottom) {
                    bottom = actualBottom;
                }
                if (actualLeft < left) {
                    left = actualLeft;
                }
            });
            return {
                top,
                right,
                bottom,
                left
            };
        }
        static baseline(list, text = false) {
            list = $util$5.filterArray(list, item => {
                if ((item.baseline || $css$2.isLength(item.verticalAlign)) && (!text || item.textElement)) {
                    return !item.floating && !item.baselineAltered && (item.naturalChild && item.length === 0 || !item.layoutVertical && item.every(child => child.baseline && !child.multiline));
                }
                return false;
            });
            if (list.length > 1) {
                list.sort((a, b) => {
                    if (a.length && b.length === 0) {
                        return 1;
                    }
                    else if (b.length && a.length === 0) {
                        return -1;
                    }
                    let heightA = a.baselineHeight;
                    let heightB = b.baselineHeight;
                    if (a.marginTop !== 0) {
                        if (a.imageElement || heightA >= heightB || a.marginTop < 0) {
                            heightA += a.marginTop;
                        }
                        else {
                            return a.marginTop > ((heightB - heightA) / 2) ? -1 : 1;
                        }
                    }
                    if (b.marginTop !== 0) {
                        if (b.imageElement || heightB >= heightA || b.marginTop < 0) {
                            heightB += b.marginTop;
                        }
                        else {
                            return b.marginTop > ((heightA - heightB) / 2) ? 1 : -1;
                        }
                    }
                    if (!$math.isEqual(heightA, heightB)) {
                        return heightA > heightB ? -1 : 1;
                    }
                    else {
                        if (a.textElement && b.textElement) {
                            if (!a.plainText && b.plainText) {
                                return -1;
                            }
                            else if (a.plainText && !b.plainText) {
                                return 1;
                            }
                        }
                        else if (a.inputElement && b.inputElement && a.containerType !== b.containerType) {
                            return a.containerType > b.containerType ? -1 : 1;
                        }
                        if (a.bounds.bottom > b.bounds.bottom) {
                            return -1;
                        }
                        else if (a.bounds.bottom < b.bounds.bottom) {
                            return 1;
                        }
                    }
                    return 0;
                });
            }
            return list.shift() || null;
        }
        static linearData(list, clearOnly = false) {
            const floated = new Set();
            const cleared = new Map();
            let linearX = false;
            let linearY = false;
            if (list.length > 1) {
                const nodes = [];
                const floating = new Set();
                const clearable = {};
                for (const node of list) {
                    if (node.pageFlow) {
                        if (floating.size) {
                            const previousFloat = [];
                            const clear = node.css('clear');
                            switch (clear) {
                                case 'left':
                                    previousFloat.push(clearable.left);
                                    break;
                                case 'right':
                                    previousFloat.push(clearable.right);
                                    break;
                                case 'both':
                                    previousFloat.push(clearable.left, clearable.right);
                                    break;
                            }
                            for (const item of previousFloat) {
                                if (item) {
                                    const float = item.float;
                                    if (floating.has(float) && !node.floating && $util$5.aboveRange(node.linear.top, item.linear.bottom)) {
                                        floating.delete(float);
                                        clearable[float] = undefined;
                                    }
                                }
                            }
                            if (clear === 'both') {
                                cleared.set(node, floating.size === 2 ? 'both' : floating.values().next().value);
                                floating.clear();
                                clearable.left = undefined;
                                clearable.right = undefined;
                            }
                            else if (floating.has(clear)) {
                                cleared.set(node, clear);
                                floating.delete(clear);
                                clearable[clear] = undefined;
                            }
                        }
                        if (node.floating) {
                            const float = node.float;
                            floating.add(float);
                            floated.add(float);
                            clearable[float] = node;
                        }
                        nodes.push(node);
                    }
                    else if (node.positionAuto) {
                        nodes.push(node);
                    }
                }
                const length = nodes.length;
                if (length) {
                    if (!clearOnly) {
                        const siblings = [nodes[0]];
                        let x = 1;
                        let y = 1;
                        for (let i = 1; i < length; i++) {
                            if (nodes[i].alignedVertically(siblings, cleared)) {
                                y++;
                            }
                            else {
                                x++;
                            }
                            siblings.push(nodes[i]);
                        }
                        linearX = x === length;
                        linearY = y === length;
                        if (linearX && floated.size) {
                            let boxLeft = Number.POSITIVE_INFINITY;
                            let boxRight = Number.NEGATIVE_INFINITY;
                            let floatLeft = Number.NEGATIVE_INFINITY;
                            let floatRight = Number.POSITIVE_INFINITY;
                            for (const node of nodes) {
                                const { left, right } = node.linear;
                                boxLeft = Math.min(boxLeft, left);
                                boxRight = Math.max(boxRight, right);
                                if (node.floating) {
                                    if (node.float === 'left') {
                                        floatLeft = Math.max(floatLeft, right);
                                    }
                                    else {
                                        floatRight = Math.min(floatRight, left);
                                    }
                                }
                            }
                            for (let i = 0, j = 0, k = 0, l = 0, m = 0; i < length; i++) {
                                const item = nodes[i];
                                const { left, right } = item.linear;
                                if (Math.floor(left) <= boxLeft) {
                                    j++;
                                }
                                if (Math.ceil(right) >= boxRight) {
                                    k++;
                                }
                                if (!item.floating) {
                                    if (left === floatLeft) {
                                        l++;
                                    }
                                    if (right === floatRight) {
                                        m++;
                                    }
                                }
                                if (i === 0) {
                                    continue;
                                }
                                if (j === 2 || k === 2 || l === 2 || m === 2) {
                                    linearX = false;
                                    break;
                                }
                                const previous = nodes[i - 1];
                                if ($util$5.withinRange(left, previous.linear.left) || previous.floating && $util$5.aboveRange(item.linear.top, previous.linear.bottom)) {
                                    linearX = false;
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            else if (list.length) {
                linearY = list[0].blockStatic;
                linearX = !linearY;
            }
            return {
                linearX,
                linearY,
                cleared,
                floated
            };
        }
        static partitionRows(list) {
            const parent = list[0].actualParent;
            const cleared = parent && parent.floatContainer ? NodeUI.linearData(parent.naturalElements, true).cleared : undefined;
            const result = [];
            let row = [];
            let siblings = [];
            const length = list.length;
            for (let i = 0; i < length; i++) {
                const node = list[i];
                let active = node;
                if (!node.naturalChild) {
                    if (node.nodeGroup) {
                        if (row.length) {
                            result.push(row);
                        }
                        result.push([node]);
                        row = [];
                        siblings.length = 0;
                        continue;
                    }
                    let current = node.innerWrapped;
                    while (current) {
                        if (current.naturalChild) {
                            active = current;
                            break;
                        }
                        current = current.innerWrapped;
                    }
                }
                if (row.length === 0) {
                    row.push(node);
                    siblings.push(active);
                }
                else {
                    if (active.alignedVertically(siblings, cleared)) {
                        if (row.length) {
                            result.push(row);
                        }
                        row = [node];
                        siblings = [active];
                    }
                    else {
                        row.push(node);
                        siblings.push(active);
                    }
                }
            }
            if (row.length) {
                result.push(row);
            }
            return result;
        }
        is(containerType) {
            return this.containerType === containerType;
        }
        of(containerType, ...alignmentType) {
            return this.containerType === containerType && alignmentType.some(value => this.hasAlign(value));
        }
        attr(name, attr, value, overwrite = true) {
            let obj = this['__' + name];
            if (value) {
                if (obj === undefined) {
                    if (!this._namespaces.includes(name)) {
                        this._namespaces.push(name);
                    }
                    obj = {};
                    this['__' + name] = obj;
                }
                if (!overwrite && obj[attr]) {
                    return '';
                }
                obj[attr] = value.toString();
                return value;
            }
            else {
                return obj && obj[attr] || '';
            }
        }
        unsafe(name, value) {
            if (value !== undefined) {
                this['_' + name] = value;
            }
            else {
                return this['_' + name];
            }
        }
        unset(name) {
            delete this['_' + name];
        }
        namespace(name) {
            return this['__' + name] || {};
        }
        delete(name, ...attrs) {
            const obj = this['__' + name];
            if (obj) {
                for (const attr of attrs) {
                    if (attr.indexOf('*') !== -1) {
                        for (const [key] of $util$5.searchObject(obj, attr)) {
                            delete obj[key];
                        }
                    }
                    else {
                        delete obj[attr];
                    }
                }
            }
        }
        apply(options) {
            for (const name in options) {
                const obj = options[name];
                if (typeof obj === 'object') {
                    for (const attr in obj) {
                        this.attr(name, attr, obj[attr]);
                    }
                    delete options[name];
                }
            }
        }
        lockAttr(name, attr) {
            let locked = this._locked[name];
            if (locked === undefined) {
                locked = {};
                this._locked[name] = locked;
            }
            locked[attr] = true;
        }
        lockedAttr(name, attr) {
            const locked = this._locked[name];
            return locked && locked[attr] || false;
        }
        render(parent) {
            this.renderParent = parent;
            this.rendered = true;
        }
        renderEach(predicate) {
            const renderChildren = this.renderChildren;
            const length = renderChildren.length;
            for (let i = 0; i < length; i++) {
                const item = renderChildren[i];
                if (item.visible) {
                    predicate(item, i, renderChildren);
                }
            }
            return this;
        }
        renderFilter(predicate) {
            return $util$5.filterArray(this.renderChildren, predicate);
        }
        hide(invisible) {
            const renderParent = this.renderParent;
            if (renderParent) {
                const renderTemplates = renderParent.renderTemplates;
                if (renderTemplates) {
                    const index = renderParent.renderChildren.findIndex(node => node === this);
                    if (index !== -1) {
                        const template = renderTemplates[index];
                        if (template && template.node === this) {
                            renderTemplates[index] = null;
                        }
                    }
                }
            }
            this.rendered = true;
            this.visible = false;
        }
        inherit(node, ...modules) {
            for (const name of modules) {
                switch (name) {
                    case 'base':
                        this._documentParent = node.documentParent;
                        this._bounds = $dom$2.assignRect(node.bounds);
                        this._linear = $dom$2.assignRect(node.linear);
                        this._box = $dom$2.assignRect(node.box);
                        this._boxReset = $dom$2.newBoxModel();
                        this._boxAdjustment = $dom$2.newBoxModel();
                        if (this.depth === -1) {
                            this.depth = node.depth;
                        }
                        const actualParent = node.actualParent;
                        if (actualParent) {
                            this.actualParent = actualParent;
                            this.dir = actualParent.dir;
                        }
                        break;
                    case 'initial': {
                        $util$5.cloneObject(node.unsafe('initial'), this.initial);
                        break;
                    }
                    case 'alignment': {
                        const nodeStyleMap = node.unsafe('initial').styleMap;
                        const styleMap = this._styleMap;
                        const initialStyleMap = this._initial.styleMap;
                        this.positionAuto = node.positionAuto;
                        for (const attr of INHERIT_ALIGNMENT) {
                            styleMap[attr] = node.css(attr);
                            initialStyleMap[attr] = nodeStyleMap[attr];
                        }
                        if (!this.positionStatic) {
                            for (const attr of $css$2.BOX_POSITION) {
                                if (node.hasPX(attr)) {
                                    styleMap[attr] = node.css(attr);
                                }
                                initialStyleMap[attr] = nodeStyleMap[attr];
                            }
                        }
                        if (node.autoMargin.horizontal || node.autoMargin.vertical) {
                            for (const attr of $css$2.BOX_MARGIN) {
                                if (node.cssInitial(attr) === 'auto') {
                                    styleMap[attr] = 'auto';
                                    initialStyleMap[attr] = 'auto';
                                }
                            }
                        }
                        break;
                    }
                    case 'styleMap':
                        $util$5.assignEmptyProperty(this._styleMap, node.unsafe('styleMap'));
                        break;
                    case 'textStyle':
                        this.cssApply(node.getTextStyle());
                        this.fontSize = node.fontSize;
                        break;
                    case 'boxStyle':
                        const { backgroundColor, backgroundImage } = node;
                        this.cssApply({
                            backgroundColor,
                            backgroundImage,
                            backgroundRepeat: node.css('backgroundRepeat'),
                            backgroundSize: node.css('backgroundSize'),
                            backgroundPositionX: node.css('backgroundPositionX'),
                            backgroundPositionY: node.css('backgroundPositionY'),
                            backgroundClip: node.css('backgroundClip'),
                            border: 'initial',
                            borderRadius: 'initial',
                            borderTopWidth: node.css('borderTopWidth'),
                            borderBottomWidth: node.css('borderBottomWidth'),
                            borderRightWidth: node.css('borderRightWidth'),
                            borderLeftWidth: node.css('borderLeftWidth'),
                            borderTopColor: node.css('borderTopColor'),
                            borderBottomColor: node.css('borderBottomColor'),
                            borderRightColor: node.css('borderRightColor'),
                            borderLeftColor: node.css('borderLeftColor'),
                            borderTopStyle: node.css('borderTopStyle'),
                            borderBottomStyle: node.css('borderBottomStyle'),
                            borderRightStyle: node.css('borderRightStyle'),
                            borderLeftStyle: node.css('borderLeftStyle'),
                            borderTopLeftRadius: node.css('borderTopLeftRadius'),
                            borderTopRightRadius: node.css('borderTopRightRadius'),
                            borderBottomRightRadius: node.css('borderBottomRightRadius'),
                            borderBottomLeftRadius: node.css('borderBottomLeftRadius')
                        }, true);
                        this.setCacheValue('backgroundColor', backgroundColor);
                        this.setCacheValue('backgroundImage', backgroundImage);
                        node.cssApply({
                            borderTopWidth: '0px',
                            borderBottomWidth: '0px',
                            borderRightWidth: '0px',
                            borderLeftWidth: '0px',
                            backgroundColor: 'transparent',
                            backgroundImage: 'none',
                            border: '0px none solid',
                            borderRadius: '0px'
                        }, true);
                        node.setCacheValue('backgroundColor', '');
                        node.setCacheValue('backgroundImage', '');
                        node.resetBox(30 /* MARGIN */ | 480 /* PADDING */, this);
                        break;
                }
            }
        }
        addAlign(value) {
            if (!this.hasAlign(value)) {
                this.alignmentType |= value;
            }
        }
        removeAlign(value) {
            if (this.hasAlign(value)) {
                this.alignmentType ^= value;
            }
        }
        hasAlign(value) {
            return $util$5.hasBit(this.alignmentType, value);
        }
        hasResource(value) {
            return !$util$5.hasBit(this.excludeResource, value);
        }
        hasProcedure(value) {
            return !$util$5.hasBit(this.excludeProcedure, value);
        }
        hasSection(value) {
            return !$util$5.hasBit(this.excludeSection, value);
        }
        exclude(resource = 0, procedure = 0, section = 0) {
            if (resource > 0 && !$util$5.hasBit(this._excludeResource, resource)) {
                this._excludeResource |= resource;
            }
            if (procedure > 0 && !$util$5.hasBit(this._excludeProcedure, procedure)) {
                this._excludeProcedure |= procedure;
            }
            if (section > 0 && !$util$5.hasBit(this._excludeSection, section)) {
                this._excludeSection |= section;
            }
        }
        setExclusions() {
            if (this.styleElement) {
                const parent = this.actualParent;
                const parseExclusions = (attr, enumeration) => {
                    let exclude = this.dataset[attr] || '';
                    let offset = 0;
                    if (parent && parent.dataset[attr + 'Child']) {
                        exclude += (exclude !== '' ? '|' : '') + parent.dataset[attr + 'Child'];
                    }
                    if (exclude !== '') {
                        for (let name of exclude.split('|')) {
                            name = name.trim().toUpperCase();
                            if (enumeration[name] && !$util$5.hasBit(offset, enumeration[name])) {
                                offset |= enumeration[name];
                            }
                        }
                    }
                    return offset;
                };
                this.exclude(parseExclusions('excludeResource', NODE_RESOURCE), parseExclusions('excludeProcedure', NODE_PROCEDURE), parseExclusions('excludeSection', APP_SECTION));
            }
        }
        appendTry(node, replacement, append = true) {
            let valid = false;
            const children = this.children;
            const length = children.length;
            for (let i = 0; i < length; i++) {
                if (children[i] === node) {
                    children[i] = replacement;
                    replacement.parent = this;
                    replacement.containerIndex = node.containerIndex;
                    valid = true;
                    break;
                }
            }
            if (!valid && append) {
                replacement.parent = this;
                valid = true;
            }
            return valid;
        }
        sort(predicate) {
            if (predicate) {
                super.sort(predicate);
            }
            else {
                this.children.sort((a, b) => a.containerIndex < b.containerIndex ? -1 : 1);
            }
            return this;
        }
        alignedVertically(siblings, cleared, horizontal) {
            if (this.lineBreak) {
                return 2 /* LINEBREAK */;
            }
            else if (this.pageFlow || this.positionAuto) {
                const isBlockWrap = (node) => node.blockVertical || node.percentWidth;
                const checkBlockDimension = (previous) => $util$5.aboveRange(this.linear.top, previous.linear.bottom) && (isBlockWrap(this) || isBlockWrap(previous) || this.float !== previous.float);
                if ($util$5.isArray(siblings)) {
                    if (cleared && cleared.has(this)) {
                        return 5 /* FLOAT_CLEAR */;
                    }
                    else {
                        const lastSibling = siblings[siblings.length - 1];
                        if (this.floating && lastSibling.floating) {
                            if (horizontal && this.float === lastSibling.float) {
                                return 0 /* HORIZONTAL */;
                            }
                            else if ($util$5.aboveRange(this.linear.top, lastSibling.linear.bottom)) {
                                return 4 /* FLOAT_WRAP */;
                            }
                            else if (horizontal && cleared && cleared.size && !siblings.some((item, index) => index > 0 && cleared.get(item) === this.float)) {
                                return 0 /* HORIZONTAL */;
                            }
                        }
                        else if (horizontal === false && this.floating && lastSibling.blockStatic) {
                            return 0 /* HORIZONTAL */;
                        }
                        else if (horizontal !== undefined) {
                            if (!this.display.startsWith('inline-')) {
                                const { top, bottom } = this.linear;
                                if (this.textElement && cleared && cleared.size && siblings.some(item => cleared.has(item)) && siblings.some(item => top < item.linear.top && bottom > item.linear.bottom)) {
                                    return 7 /* FLOAT_INTERSECT */;
                                }
                                else if (siblings[0].float === 'right') {
                                    if (siblings.length > 1) {
                                        let actualTop = top;
                                        if (this.multiline) {
                                            if (this.plainText) {
                                                actualTop = bottom;
                                            }
                                            else if (this.styleText) {
                                                const textBounds = this.textBounds;
                                                if (textBounds && textBounds.top > top) {
                                                    actualTop = textBounds.top;
                                                }
                                            }
                                        }
                                        let maxBottom = Number.NEGATIVE_INFINITY;
                                        for (const item of siblings) {
                                            if (item.float === 'right' && item.bounds.bottom > maxBottom) {
                                                maxBottom = item.bounds.bottom;
                                            }
                                        }
                                        if ($util$5.belowRange(actualTop, maxBottom)) {
                                            return horizontal ? 0 /* HORIZONTAL */ : 6 /* FLOAT_BLOCK */;
                                        }
                                        else {
                                            return horizontal ? 6 /* FLOAT_BLOCK */ : 0 /* HORIZONTAL */;
                                        }
                                    }
                                    else if (!horizontal) {
                                        return 6 /* FLOAT_BLOCK */;
                                    }
                                }
                            }
                        }
                        if (this.blockDimension && checkBlockDimension(lastSibling)) {
                            return 3 /* INLINE_WRAP */;
                        }
                    }
                }
                if (this.blockDimension && this.css('width') === '100%' && !this.hasPX('maxWidth')) {
                    return 1 /* VERTICAL */;
                }
                const parent = this.actualParent || this.documentParent;
                const blockStatic = this.blockStatic || this.display === 'table';
                for (const previous of this.siblingsLeading) {
                    if (previous.lineBreak) {
                        return 2 /* LINEBREAK */;
                    }
                    else if (cleared && cleared.get(previous) === 'both' && (!$util$5.isArray(siblings) || siblings[0] !== previous)) {
                        return 5 /* FLOAT_CLEAR */;
                    }
                    else if (blockStatic && (!previous.floating || !previous.rightAligned && $util$5.withinRange(previous.linear.right, parent.box.right) || cleared && cleared.has(previous)) ||
                        previous.blockStatic ||
                        previous.autoMargin.leftRight ||
                        previous.float === 'left' && this.autoMargin.right ||
                        previous.float === 'right' && this.autoMargin.left) {
                        return 1 /* VERTICAL */;
                    }
                    else if (previous.floating && blockStatic && this.some(item => item.floating && $util$5.aboveRange(item.linear.top, previous.linear.bottom))) {
                        return 6 /* FLOAT_BLOCK */;
                    }
                    else if (this.blockDimension && checkBlockDimension(previous)) {
                        return 3 /* INLINE_WRAP */;
                    }
                }
            }
            return 0 /* HORIZONTAL */;
        }
        previousSiblings(options = {}) {
            const floating = options.floating;
            const pageFlow = options.pageFlow;
            const lineBreak = options.lineBreak;
            const excluded = options.excluded;
            const result = [];
            let element = this.element;
            if (element) {
                element = element.previousSibling;
            }
            else {
                const node = this.firstChild;
                if (node) {
                    element = node.element;
                    if (element) {
                        element = element.previousSibling;
                    }
                }
            }
            while (element) {
                const node = $session$2.getElementAsNode(element, this.sessionId);
                if (node) {
                    if (lineBreak !== false && node.lineBreak || excluded !== false && node.excluded && !node.lineBreak) {
                        result.push(node);
                    }
                    else if (node.pageFlow && !node.excluded) {
                        if (pageFlow === false) {
                            break;
                        }
                        result.push(node);
                        if (floating !== false || !node.floating && (node.visible || node.rendered) && node.display !== 'none') {
                            break;
                        }
                    }
                }
                element = element.previousSibling;
            }
            return result;
        }
        nextSiblings(options = {}) {
            const floating = options.floating;
            const pageFlow = options.pageFlow;
            const lineBreak = options.lineBreak;
            const excluded = options.excluded;
            const result = [];
            let element = this._element;
            if (element) {
                element = element.nextSibling;
            }
            else {
                const node = this.lastChild;
                if (node) {
                    element = node.element;
                    if (element) {
                        element = element.nextSibling;
                    }
                }
            }
            while (element) {
                const node = $session$2.getElementAsNode(element, this.sessionId);
                if (node) {
                    if (lineBreak !== false && node.lineBreak || excluded !== false && node.excluded && !node.lineBreak) {
                        result.push(node);
                    }
                    else if (node.pageFlow && !node.excluded) {
                        if (pageFlow === false) {
                            break;
                        }
                        result.push(node);
                        if (floating !== false || !node.floating && (node.visible || node.rendered) && node.display !== 'none') {
                            break;
                        }
                    }
                }
                element = element.nextSibling;
            }
            return result;
        }
        modifyBox(region, offset, negative = true) {
            if (offset !== 0) {
                const attr = CSS_SPACING.get(region);
                if (attr) {
                    if (offset === undefined) {
                        if (this._boxReset === undefined) {
                            this._boxReset = $dom$2.newBoxModel();
                        }
                        this._boxReset[attr] = 1;
                    }
                    else {
                        if (this._boxAdjustment === undefined) {
                            this._boxAdjustment = $dom$2.newBoxModel();
                        }
                        if (!negative) {
                            if (this[attr] + this._boxAdjustment[attr] + offset <= 0) {
                                if (this._boxReset === undefined) {
                                    this._boxReset = $dom$2.newBoxModel();
                                }
                                this._boxReset[attr] = 1;
                                this._boxAdjustment[attr] = 0;
                            }
                            else {
                                this._boxAdjustment[attr] += offset;
                            }
                        }
                        else {
                            this._boxAdjustment[attr] += offset;
                        }
                    }
                    if (this._boxRegister) {
                        const nodes = this._boxRegister[region];
                        if (nodes) {
                            for (const node of nodes) {
                                node.modifyBox(region, offset, negative);
                            }
                        }
                    }
                }
            }
        }
        getBox(region) {
            const attr = CSS_SPACING.get(region);
            return attr ? [this._boxReset ? this._boxReset[attr] : 0, this._boxAdjustment ? this._boxAdjustment[attr] : 0] : [0, 0];
        }
        resetBox(region, node) {
            if (this._boxReset === undefined) {
                this._boxReset = $dom$2.newBoxModel();
            }
            const boxReset = this._boxReset;
            const applyReset = (attrs, start) => {
                for (let i = 0; i < 4; i++) {
                    if (boxReset[attrs[i]] === 0) {
                        boxReset[attrs[i]] = 1;
                        if (node) {
                            const key = CSS_SPACING_KEYS[i + start];
                            const attr = CSS_SPACING.get(key);
                            const value = this[attr];
                            if (value !== 0) {
                                if (!node.naturalChild && node[attr] === 0) {
                                    node.css(attr, $css$2.formatPX(value), true);
                                }
                                else {
                                    node.modifyBox(key, value);
                                }
                                this.registerBox(key, node);
                            }
                        }
                    }
                }
            };
            if ($util$5.hasBit(region, 30 /* MARGIN */)) {
                applyReset($css$2.BOX_MARGIN, 0);
            }
            if ($util$5.hasBit(region, 480 /* PADDING */)) {
                applyReset($css$2.BOX_PADDING, 4);
            }
        }
        transferBox(region, node) {
            if (this._boxAdjustment === undefined) {
                this._boxAdjustment = $dom$2.newBoxModel();
            }
            const boxAdjustment = this._boxAdjustment;
            if (boxAdjustment) {
                const applyReset = (attrs, start) => {
                    for (let i = 0; i < 4; i++) {
                        const value = boxAdjustment[attrs[i]];
                        if (value > 0) {
                            const key = CSS_SPACING_KEYS[i + start];
                            node.modifyBox(key, value, false);
                            this.registerBox(key, node);
                            boxAdjustment[attrs[i]] = 0;
                        }
                    }
                };
                if ($util$5.hasBit(region, 30 /* MARGIN */)) {
                    applyReset($css$2.BOX_MARGIN, 0);
                }
                if ($util$5.hasBit(region, 480 /* PADDING */)) {
                    applyReset($css$2.BOX_PADDING, 4);
                }
            }
        }
        registerBox(region, node) {
            if (this._boxRegister === undefined) {
                this._boxRegister = {};
            }
            const register = this._boxRegister;
            if (register[region] === undefined) {
                register[region] = new Set();
            }
            if (node) {
                register[region].add(node);
            }
            return register[region];
        }
        actualRect(direction, dimension = 'linear') {
            const value = this[dimension][direction];
            if (this.inputElement) {
                const companion = this.companion;
                switch (direction) {
                    case 'top':
                    case 'left':
                        if (companion && !companion.visible && companion[dimension][direction] < value) {
                            return companion[dimension][direction];
                        }
                        break;
                    case 'right':
                    case 'bottom':
                        if (companion && !companion.visible && companion[dimension][direction] > value) {
                            return companion[dimension][direction];
                        }
                        break;
                    default:
                        return NaN;
                }
            }
            return value;
        }
        actualPadding(attr, value) {
            let node = this;
            while (!node.naturalChild) {
                const innerWrapped = node.innerWrapped;
                if (innerWrapped) {
                    node = innerWrapped;
                    if (node.naturalChild && node.getBox(attr === 'paddingTop' ? 32 /* PADDING_TOP */ : 128 /* PADDING_BOTTOM */)[0] !== 1) {
                        return value;
                    }
                }
                else {
                    return value;
                }
            }
            let reset = false;
            if (canCascadeChildren(node)) {
                function cascade(children) {
                    let valid = false;
                    for (const item of children) {
                        if (item.blockStatic) {
                            return false;
                        }
                        else if (item.inlineStatic) {
                            if (item.has('lineHeight') && item.lineHeight > item.bounds.height) {
                                return false;
                            }
                            else if (item[attr] >= value) {
                                valid = true;
                            }
                            else if (canCascadeChildren(item)) {
                                if (!cascade(item.naturalElements)) {
                                    return false;
                                }
                                else {
                                    valid = true;
                                }
                            }
                        }
                    }
                    return valid;
                }
                reset = cascade(node.naturalElements);
            }
            return reset ? 0 : value;
        }
        cloneBase(node) {
            node.localSettings = this.localSettings;
            node.alignmentType = this.alignmentType;
            node.containerName = this.containerName;
            node.depth = this.depth;
            node.visible = this.visible;
            node.excluded = this.excluded;
            node.rendered = this.rendered;
            node.childIndex = this.childIndex;
            node.containerIndex = this.containerIndex;
            node.inlineText = this.inlineText;
            node.lineBreakLeading = this.lineBreakLeading;
            node.lineBreakTrailing = this.lineBreakTrailing;
            node.actualParent = this.actualParent;
            node.documentParent = this.documentParent;
            node.documentRoot = this.documentRoot;
            node.renderParent = this.renderParent;
            if (this.length) {
                node.retain(this.duplicate());
            }
            node.inherit(this, 'initial', 'base', 'alignment', 'styleMap', 'textStyle');
            Object.assign(node.unsafe('cached'), this._cached);
        }
        css(attr, value, cache = false) {
            if (arguments.length >= 2) {
                if (value) {
                    this._styleMap[attr] = value;
                }
                else {
                    delete this._styleMap[attr];
                }
                if (cache) {
                    this.unsetCache(attr);
                }
            }
            return this._styleMap[attr] || this.styleElement && this.style[attr] || '';
        }
        cssApply(values, cache = false) {
            Object.assign(this._styleMap, values);
            if (cache) {
                for (const attr in values) {
                    this.unsetCache(attr);
                }
            }
            return this;
        }
        cssSet(attr, value, cache = true) {
            return super.css(attr, value, cache);
        }
        setCacheValue(attr, value) {
            this._cached[attr] = value;
        }
        get element() {
            let element = this._element;
            if (element === null) {
                let current = this.innerWrapped;
                while (current) {
                    element = current.unsafe('element');
                    if (element) {
                        break;
                    }
                    current = current.innerWrapped;
                }
            }
            return element;
        }
        get naturalChild() {
            return this._element !== null && this._element.parentElement !== null;
        }
        get pseudoElement() {
            return this._element !== null && this._element.className === '__squared.pseudo';
        }
        set documentParent(value) {
            this._documentParent = value;
        }
        get documentParent() {
            return (this._documentParent || this.absoluteParent || this.actualParent || this.parent || this);
        }
        set containerName(value) {
            this._cached.containerName = value.toUpperCase();
        }
        get containerName() {
            let result = this._cached.containerName;
            if (result === undefined) {
                result = '';
                const element = this.element;
                if (element) {
                    if ($dom$2.isTextNode(element)) {
                        result = 'PLAINTEXT';
                    }
                    else if (element.tagName === 'INPUT') {
                        result = 'INPUT_' + element.type.toUpperCase();
                    }
                    else {
                        result = element.tagName.toUpperCase();
                    }
                }
                this._cached.containerName = result;
            }
            return result;
        }
        get excludeSection() {
            return this._excludeSection;
        }
        get excludeProcedure() {
            return this._excludeProcedure;
        }
        get excludeResource() {
            return this._excludeResource;
        }
        get layoutHorizontal() {
            return this.hasAlign(8 /* HORIZONTAL */);
        }
        get layoutVertical() {
            return this.hasAlign(16 /* VERTICAL */);
        }
        get nodeGroup() {
            return false;
        }
        set renderAs(value) {
            if (!this.rendered && value && !value.rendered) {
                this._renderAs = value;
            }
        }
        get renderAs() {
            return this._renderAs;
        }
        get blockStatic() {
            return super.blockStatic || this.hasAlign(64 /* BLOCK */) && !this.floating;
        }
        get rightAligned() {
            return super.rightAligned || this.hasAlign(2048 /* RIGHT */);
        }
        set positionAuto(value) {
            this._cached.positionAuto = value;
        }
        get positionAuto() {
            return super.positionAuto;
        }
        set flexbox(value) {
            this._cached.flexbox = value;
        }
        get flexbox() {
            return super.flexbox;
        }
        set contentBoxWidth(value) {
            this._cached.contentBoxWidth = value;
        }
        get contentBoxWidth() {
            return super.contentBoxWidth;
        }
        set contentBoxHeight(value) {
            this._cached.contentBoxHeight = value;
        }
        get contentBoxHeight() {
            return super.contentBoxHeight;
        }
        set textContent(value) {
            this._cached.textContent = value;
        }
        get textContent() {
            let result = this._cached.textContent;
            if (result === undefined) {
                result = this.naturalChild && this._element ? this._element.textContent : '';
                this._cached.textContent = result;
            }
            return result;
        }
        set overflow(value) {
            if (value === 0 || value === 16 /* VERTICAL */ || value === 8 /* HORIZONTAL */ || value === (8 /* HORIZONTAL */ | 16 /* VERTICAL */)) {
                if ($util$5.hasBit(this.overflow, 64 /* BLOCK */)) {
                    value |= 64 /* BLOCK */;
                }
                this._cached.overflow = value;
            }
        }
        get overflow() {
            return super.overflow;
        }
        set baseline(value) {
            this._cached.baseline = value;
        }
        get baseline() {
            return super.baseline;
        }
        set multiline(value) {
            this._cached.multiline = value;
        }
        get multiline() {
            return super.multiline;
        }
        set visible(value) {
            this._visible = value;
        }
        get visible() {
            return this._visible;
        }
        set controlName(value) {
            if (!this.rendered || this._controlName === undefined) {
                this._controlName = value;
            }
        }
        get controlName() {
            return this._controlName || '';
        }
        set siblingsLeading(value) {
            this._siblingsLeading = value;
        }
        get siblingsLeading() {
            if (this._siblingsLeading === undefined) {
                this._siblingsLeading = this.previousSiblings();
            }
            return this._siblingsLeading;
        }
        set siblingsTrailing(value) {
            this._siblingsTrailing = value;
        }
        get siblingsTrailing() {
            if (this._siblingsTrailing === undefined) {
                this._siblingsTrailing = this.nextSiblings();
            }
            return this._siblingsTrailing;
        }
        get previousSibling() {
            const parent = this.actualParent;
            if (parent) {
                const children = parent.naturalChildren;
                const index = children.indexOf(this);
                if (index !== -1) {
                    for (let i = index - 1; i >= 0; i--) {
                        const node = children[i];
                        if (node && (!node.excluded || node.lineBreak)) {
                            return node;
                        }
                    }
                }
            }
            return null;
        }
        get nextSibling() {
            const parent = this.actualParent;
            if (parent) {
                const children = parent.naturalChildren;
                const index = children.indexOf(this);
                if (index !== -1) {
                    const length = children.length;
                    for (let i = index + 1; i < length; i++) {
                        const node = children[i];
                        if (node && (!node.excluded || node.lineBreak)) {
                            return node;
                        }
                    }
                }
            }
            return null;
        }
        get firstChild() {
            return this.naturalChildren[0] || null;
        }
        get lastChild() {
            const children = this.naturalChildren;
            return children[children.length - 1] || null;
        }
        get onlyChild() {
            if (this.renderParent) {
                return this.renderParent.length === 1;
            }
            else {
                const parent = this.parent;
                if (parent && parent.id !== 0) {
                    return parent.length === 1;
                }
            }
            return false;
        }
        get textEmpty() {
            let result = this._cached.textEmpty;
            if (result === undefined) {
                result = this.styleElement && (this.textContent === '' || !this.preserveWhiteSpace && !this.pseudoElement && this.textContent.trim() === '') && !this.imageElement && !this.svgElement && this.tagName !== 'HR';
                this._cached.textEmpty = result;
            }
            return result;
        }
        get preserveWhiteSpace() {
            let result = this._cached.whiteSpace;
            if (result === undefined) {
                result = this.cssAny('whiteSpace', 'pre', 'pre-wrap');
                this._cached.whiteSpace = result;
            }
            return result;
        }
        set fontSize(value) {
            this._fontSize = value;
        }
        get fontSize() {
            return super.fontSize;
        }
    }

    const $util$6 = squared.lib.util;
    class LayoutUI extends squared.lib.base.Container {
        constructor(parent, node, containerType = 0, alignmentType = 0, children) {
            super(children);
            this.parent = parent;
            this.node = node;
            this.containerType = containerType;
            this.alignmentType = alignmentType;
            this.rowCount = 0;
            this.columnCount = 0;
            this.renderType = 0;
            this.renderIndex = -1;
            this.itemCount = 0;
            if (children && children.length) {
                this.init();
            }
        }
        init() {
            const children = this.children;
            const length = children.length;
            if (length) {
                if (length > 1) {
                    const linearData = NodeUI.linearData(children);
                    this._floated = linearData.floated;
                    this._cleared = linearData.cleared;
                    this._linearX = linearData.linearX;
                    this._linearY = linearData.linearY;
                }
                else {
                    this._linearY = children[0].blockStatic;
                    this._linearX = !this._linearY;
                }
                let A = 0;
                let B = 0;
                for (let i = 0; i < length; i++) {
                    const item = children[i];
                    if (item.floating) {
                        A++;
                    }
                    else {
                        A = Number.POSITIVE_INFINITY;
                    }
                    if (item.rightAligned) {
                        B++;
                    }
                    else {
                        B = Number.POSITIVE_INFINITY;
                    }
                    if (A === Number.POSITIVE_INFINITY && B === Number.POSITIVE_INFINITY) {
                        break;
                    }
                }
                if (A === length || this._floated && this._floated.size === 2) {
                    this.add(512 /* FLOAT */);
                    if (this.some(node => node.blockStatic)) {
                        this.add(64 /* BLOCK */);
                    }
                }
                if (B === length) {
                    this.add(2048 /* RIGHT */);
                }
                this.itemCount = length;
            }
        }
        setType(value) {
            this.setContainerType(value.containerType, value.alignmentType);
        }
        setContainerType(containerType, alignmentType) {
            this.containerType = containerType;
            if (alignmentType) {
                this.add(alignmentType);
            }
        }
        hasAlign(value) {
            return $util$6.hasBit(this.alignmentType, value);
        }
        add(value) {
            if (!$util$6.hasBit(this.alignmentType, value)) {
                this.alignmentType |= value;
            }
            return this.alignmentType;
        }
        delete(value) {
            if ($util$6.hasBit(this.alignmentType, value)) {
                this.alignmentType ^= value;
            }
            return this.alignmentType;
        }
        retain(list) {
            super.retain(list);
            this.init();
            return this;
        }
        get linearX() {
            return this._linearX !== undefined ? this._linearX : true;
        }
        get linearY() {
            return this._linearY !== undefined ? this._linearY : false;
        }
        get floated() {
            return this._floated || new Set();
        }
        get cleared() {
            return this._cleared || new Map();
        }
        get singleRowAligned() {
            if (this._singleRow === undefined) {
                const length = this.length;
                if (length) {
                    this._singleRow = true;
                    if (length > 1) {
                        let previousBottom = Number.POSITIVE_INFINITY;
                        for (const node of this.children) {
                            if (node.multiline || node.blockStatic) {
                                this._singleRow = false;
                                break;
                            }
                            else {
                                if ($util$6.aboveRange(node.linear.top, previousBottom)) {
                                    this._singleRow = false;
                                    break;
                                }
                                previousBottom = node.linear.bottom;
                            }
                        }
                    }
                }
                else {
                    return false;
                }
            }
            return this._singleRow;
        }
        get unknownAligned() {
            return this.length > 1 && !this.linearX && !this.linearY;
        }
        get visible() {
            return this.filter(node => node.visible);
        }
    }

    const { css: $css$3, dom: $dom$3, regex: $regex$3, session: $session$3, util: $util$7, xml: $xml } = squared.lib;
    const CACHE_PATTERN$1 = {};
    let NodeConstructor$1;
    function createPseudoElement(parent, tagName = 'span', index = -1) {
        const element = document.createElement(tagName);
        element.className = '__squared.pseudo';
        element.style.setProperty('display', 'none');
        if (index >= 0 && index < parent.childNodes.length) {
            parent.insertBefore(element, parent.childNodes[index]);
        }
        else {
            parent.appendChild(element);
        }
        return element;
    }
    class ApplicationUI extends Application {
        constructor(framework, nodeConstructor, ControllerConstructor, ResourceConstructor, ExtensionManagerConstructor) {
            super(framework, nodeConstructor, ControllerConstructor, ResourceConstructor, ExtensionManagerConstructor);
            this.session = {
                cache: new NodeList(),
                excluded: new NodeList(),
                extensionMap: new Map(),
                active: [],
                documentRoot: [],
                targetQueue: new Map()
            };
            this.builtInExtensions = {};
            this.extensions = [];
            this._layouts = [];
            NodeConstructor$1 = nodeConstructor;
            this._localSettings = this.controllerHandler.localSettings;
            this._excluded = this._localSettings.unsupported.excluded;
        }
        static prioritizeExtensions(element, extensions) {
            if (element.dataset.use) {
                const included = element.dataset.use.split($regex$3.XML.SEPARATOR);
                const result = [];
                const untagged = [];
                for (const ext of extensions) {
                    const index = included.indexOf(ext.name);
                    if (index !== -1) {
                        result[index] = ext;
                    }
                    else {
                        untagged.push(ext);
                    }
                }
                if (result.length) {
                    return $util$7.spliceArray(result, item => item === undefined).concat(untagged);
                }
            }
            return extensions;
        }
        finalize() {
            const controller = this.controllerHandler;
            for (const [node, template] of this.session.targetQueue.entries()) {
                const target = node.dataset.target;
                if (target) {
                    const parent = this.resolveTarget(target);
                    if (parent) {
                        node.render(parent);
                        this.addLayoutTemplate(parent, node, template);
                    }
                    else if (node.renderParent === undefined) {
                        this.session.cache.remove(node);
                    }
                }
            }
            const rendered = this.rendered;
            for (const node of rendered) {
                if (node.hasProcedure(NODE_PROCEDURE.LAYOUT)) {
                    node.setLayout();
                }
                if (node.hasProcedure(NODE_PROCEDURE.ALIGNMENT)) {
                    node.setAlignment();
                }
            }
            controller.optimize(rendered);
            for (const ext of this.extensions) {
                for (const node of ext.subscribers) {
                    ext.postOptimize(node);
                }
            }
            for (const node of this.rendered) {
                if (node.hasResource(NODE_RESOURCE.BOX_SPACING)) {
                    node.setBoxSpacing();
                }
            }
            for (const ext of this.extensions) {
                ext.beforeCascade();
            }
            const baseTemplate = this._localSettings.layout.baseTemplate;
            for (const layout of this.session.documentRoot) {
                const node = layout.node;
                if (node.documentRoot && node.renderChildren.length === 0 && !node.inlineText && node.naturalChildren.every(item => item.documentRoot)) {
                    continue;
                }
                const parent = node.renderParent;
                if (parent && parent.renderTemplates) {
                    this.saveDocument(layout.layoutName, baseTemplate + controller.cascadeDocument(parent.renderTemplates, 0), node.dataset.pathname, !!node.renderExtension && node.renderExtension.some(item => item.documentBase) ? 0 : undefined);
                }
            }
            const layouts = this._layouts;
            this.resourceHandler.finalize(layouts);
            controller.finalize(layouts);
            for (const ext of this.extensions) {
                ext.afterFinalize();
            }
            $dom$3.removeElementsByClassName('__squared.pseudo');
            this.closed = true;
        }
        copyToDisk(directory, callback) {
            super.copyToDisk(directory, callback, this.layouts);
        }
        appendToArchive(pathname) {
            super.appendToArchive(pathname, this.layouts);
        }
        saveToArchive(filename) {
            super.saveToArchive(filename, this.layouts);
        }
        reset() {
            super.reset();
            for (const element of this.rootElements) {
                element.dataset.iteration = '';
            }
            const session = this.session;
            session.cache.reset();
            session.excluded.reset();
            session.extensionMap.clear();
            session.documentRoot.length = 0;
            session.targetQueue.clear();
            this._layouts.length = 0;
        }
        conditionElement(element) {
            if (!this._excluded.has(element.tagName)) {
                if (this.controllerHandler.visibleElement(element) || this._cascadeAll || element.dataset.use && element.dataset.use.split($regex$3.XML.SEPARATOR).some(value => !!this.extensionManager.retrieve(value))) {
                    return true;
                }
                else {
                    switch ($css$3.getStyle(element).position) {
                        case 'absolute':
                        case 'fixed':
                            return false;
                    }
                    let current = element.parentElement;
                    while (current) {
                        if ($css$3.getStyle(current).display === 'none') {
                            return false;
                        }
                        current = current.parentElement;
                    }
                    const controller = this.controllerHandler;
                    const children = element.children;
                    const length = children.length;
                    for (let i = 0; i < length; i++) {
                        if (controller.visibleElement(children[i])) {
                            return true;
                        }
                    }
                    return false;
                }
            }
            return false;
        }
        insertNode(element, parent) {
            if ($dom$3.isTextNode(element)) {
                if ($xml.isPlainText(element.textContent) || parent && parent.preserveWhiteSpace && (parent.tagName !== 'PRE' || parent.element.children.length === 0)) {
                    this.controllerHandler.applyDefaultStyles(element);
                    const node = this.createNode(element, false);
                    if (parent) {
                        node.cssApply(parent.getTextStyle());
                        node.fontSize = parent.fontSize;
                    }
                    return node;
                }
            }
            else if (this.conditionElement(element)) {
                this.controllerHandler.applyDefaultStyles(element);
                return this.createNode(element, false);
            }
            else {
                const node = this.createNode(element, false);
                node.visible = false;
                node.excluded = true;
                return node;
            }
            return undefined;
        }
        saveDocument(filename, content, pathname, index) {
            if ($util$7.isString(content)) {
                const layout = {
                    pathname: pathname ? $util$7.trimString(pathname, '/') : this._localSettings.layout.pathName,
                    filename,
                    content,
                    index
                };
                const layouts = this._layouts;
                if (index !== undefined && index >= 0 && index < layouts.length) {
                    layouts.splice(index, 0, layout);
                }
                else {
                    layouts.push(layout);
                }
            }
        }
        renderNode(layout) {
            return layout.itemCount === 0 ? this.controllerHandler.renderNode(layout) : this.controllerHandler.renderNodeGroup(layout);
        }
        addLayout(layout) {
            if ($util$7.hasBit(layout.renderType, 512 /* FLOAT */)) {
                if ($util$7.hasBit(layout.renderType, 8 /* HORIZONTAL */)) {
                    layout = this.processFloatHorizontal(layout);
                }
                else if ($util$7.hasBit(layout.renderType, 16 /* VERTICAL */)) {
                    layout = this.processFloatVertical(layout);
                }
            }
            if (layout.containerType !== 0) {
                const template = this.renderNode(layout);
                if (template) {
                    return this.addLayoutTemplate(template.parent || layout.parent, layout.node, template, layout.renderIndex);
                }
            }
            return false;
        }
        addLayoutTemplate(parent, node, template, index = -1) {
            if (template) {
                if (!node.renderExclude) {
                    if (node.renderParent) {
                        const renderChildren = parent.renderChildren;
                        if (parent.renderTemplates === undefined) {
                            parent.renderTemplates = [];
                        }
                        if (index >= 0 && index < renderChildren.length) {
                            renderChildren.splice(index, 0, node);
                            parent.renderTemplates.splice(index, 0, template);
                        }
                        else {
                            renderChildren.push(node);
                            parent.renderTemplates.push(template);
                        }
                    }
                    else {
                        this.session.targetQueue.set(node, template);
                    }
                }
                else {
                    node.hide();
                    node.excluded = true;
                }
                return true;
            }
            return false;
        }
        createNode(element, append = true, parent, children) {
            const processing = this.processing;
            const node = new NodeConstructor$1(this.nextId, processing.sessionId, element, this.controllerHandler.afterInsertNode);
            if (parent) {
                node.depth = parent.depth + 1;
            }
            if (element === undefined && parent && parent.naturalElement) {
                node.actualParent = parent;
            }
            if (children) {
                for (const item of children) {
                    item.parent = node;
                }
            }
            if (append) {
                processing.cache.append(node, children !== undefined);
            }
            return node;
        }
        createCache(documentRoot) {
            const node = this.createRootNode(documentRoot);
            if (node) {
                const parent = node.parent;
                if (node.documentBody) {
                    parent.visible = false;
                    parent.exclude(NODE_RESOURCE.ASSET, NODE_PROCEDURE.ALL, APP_SECTION.EXTENSION);
                    this.processing.cache.append(parent);
                }
                node.documentParent = parent;
                const controller = this.controllerHandler;
                const CACHE = this.processing.cache;
                const preAlignment = {};
                const direction = new Set();
                let resetBounds = false;
                function saveAlignment(element, id, attr, value, restoreValue) {
                    if (preAlignment[id] === undefined) {
                        preAlignment[id] = {};
                    }
                    preAlignment[id][attr] = restoreValue;
                    element.style.setProperty(attr, value);
                }
                for (const item of CACHE) {
                    if (item.styleElement) {
                        const element = item.element;
                        if (item.length) {
                            const textAlign = item.cssInitial('textAlign');
                            switch (textAlign) {
                                case 'center':
                                case 'right':
                                case 'end':
                                    saveAlignment(element, item.id, 'text-align', 'left', textAlign);
                                    break;
                            }
                        }
                        if (item.positionRelative) {
                            for (const attr of $css$3.BOX_POSITION) {
                                if (item.hasPX(attr)) {
                                    saveAlignment(element, item.id, attr, 'auto', item.css(attr));
                                    resetBounds = true;
                                }
                            }
                        }
                        if (item.dir === 'rtl') {
                            element.dir = 'ltr';
                            direction.add(element);
                        }
                    }
                }
                if (!resetBounds && direction.size) {
                    resetBounds = true;
                }
                for (const item of this.processing.excluded) {
                    if (!item.pageFlow) {
                        item.cssTry('display', 'none');
                    }
                }
                node.parent.setBounds();
                const pseudoElements = [];
                for (const item of CACHE) {
                    if (!item.pseudoElement) {
                        item.setBounds(preAlignment[item.id] === undefined && !resetBounds);
                        if (node.styleText) {
                            item.textBounds = $dom$3.getRangeClientRect(node.element);
                        }
                    }
                    else {
                        pseudoElements.push(item);
                    }
                }
                if (pseudoElements.length) {
                    const pseudoMap = new Map();
                    for (const item of pseudoElements) {
                        const element = item.actualParent.element;
                        let id = element.id;
                        let styleElement;
                        if (item.pageFlow) {
                            if (id === '') {
                                id = '__squared_' + Math.round(Math.random() * new Date().getTime());
                                element.id = id;
                            }
                            styleElement = $css$3.insertStyleSheetRule(`#${id + NodeUI.getPseudoElt(item)} { display: none !important; }`);
                        }
                        if (item.cssTry('display', item.display)) {
                            pseudoMap.set(item, { id, styleElement });
                        }
                    }
                    for (const item of pseudoElements) {
                        const data = pseudoMap.get(item);
                        if (data) {
                            item.setBounds(false);
                        }
                    }
                    for (const item of pseudoElements) {
                        const data = pseudoMap.get(item);
                        if (data) {
                            if (data.id.startsWith('__squared_')) {
                                const element = item.actualParent.element;
                                element.id = '';
                            }
                            if (data.styleElement) {
                                document.head.removeChild(data.styleElement);
                            }
                            item.cssFinally('display');
                        }
                    }
                }
                for (const item of this.processing.excluded) {
                    if (!item.lineBreak) {
                        item.setBounds();
                        item.saveAsInitial();
                    }
                    if (!item.pageFlow) {
                        item.cssFinally('display');
                    }
                }
                for (const item of CACHE) {
                    if (item.styleElement) {
                        const element = item.element;
                        const reset = preAlignment[item.id];
                        if (reset) {
                            for (const attr in reset) {
                                element.style.setProperty(attr, reset[attr]);
                            }
                        }
                        if (direction.has(element)) {
                            element.dir = 'rtl';
                        }
                    }
                    item.saveAsInitial();
                }
                controller.evaluateNonStatic(node, CACHE);
                controller.sortInitialCache(CACHE);
                return true;
            }
            return false;
        }
        afterCreateCache(element) {
            const dataset = element.dataset;
            const filename = dataset.filename && dataset.filename.replace(new RegExp(`\.${this._localSettings.layout.fileExtension}$`), '') || element.id || 'document_' + this.length;
            const iteration = (dataset.iteration ? $util$7.convertInt(dataset.iteration) : -1) + 1;
            dataset.iteration = iteration.toString();
            dataset.layoutName = $util$7.convertWord(iteration > 1 ? filename + '_' + iteration : filename, true);
            this.setBaseLayout(dataset.layoutName);
            this.setConstraints();
            this.setResources();
        }
        resolveTarget(target) {
            for (const parent of this.processing.cache) {
                if (parent.elementId === target || parent.controlId === target) {
                    return parent;
                }
            }
            for (const parent of this.session.cache) {
                if (parent.elementId === target || parent.controlId === target) {
                    return parent;
                }
            }
            return undefined;
        }
        toString() {
            const layouts = this._layouts;
            return layouts.length ? layouts[0].content : '';
        }
        cascadeParentNode(parentElement, depth = 0) {
            const node = this.insertNode(parentElement);
            if (node) {
                node.depth = depth;
                if (depth === 0) {
                    this.processing.cache.append(node);
                    const extensionManager = this.extensionManager;
                    for (const name of node.extensions) {
                        const ext = extensionManager.retrieve(name);
                        if (ext && ext.cascadeAll) {
                            this._cascadeAll = true;
                            break;
                        }
                    }
                }
                const controller = this.controllerHandler;
                if (controller.preventNodeCascade(parentElement)) {
                    return node;
                }
                const sessionId = this.processing.sessionId;
                const beforeElement = this.createPseduoElement(parentElement, '::before', sessionId);
                const afterElement = this.createPseduoElement(parentElement, '::after', sessionId);
                const childNodes = parentElement.childNodes;
                const length = childNodes.length;
                const children = new Array(length);
                const elements = new Array(parentElement.childElementCount);
                let inlineText = true;
                let j = 0;
                let k = 0;
                for (let i = 0; i < length; i++) {
                    const element = childNodes[i];
                    let child;
                    if (element === beforeElement) {
                        child = this.insertNode(beforeElement);
                        if (child) {
                            node.innerBefore = child;
                            if (!child.textEmpty) {
                                child.inlineText = true;
                            }
                            inlineText = false;
                        }
                    }
                    else if (element === afterElement) {
                        child = this.insertNode(afterElement);
                        if (child) {
                            node.innerAfter = child;
                            if (!child.textEmpty) {
                                child.inlineText = true;
                            }
                            inlineText = false;
                        }
                    }
                    else if (element.nodeName.charAt(0) === '#') {
                        if ($dom$3.isTextNode(element)) {
                            child = this.insertNode(element, node);
                        }
                    }
                    else if (controller.includeElement(element)) {
                        ApplicationUI.prioritizeExtensions(element, this.extensions).some(item => item.init(element));
                        if (!this.rootElements.has(element)) {
                            child = this.cascadeParentNode(element, depth + 1);
                            if (child && (!child.excluded || child.tagName === 'WBR')) {
                                inlineText = false;
                            }
                        }
                        else {
                            child = this.insertNode(element);
                            if (child) {
                                child.documentRoot = true;
                                child.visible = false;
                                child.excluded = true;
                            }
                            inlineText = false;
                        }
                        if (child) {
                            elements[k++] = child;
                        }
                    }
                    if (child) {
                        child.childIndex = j;
                        children[j++] = child;
                    }
                }
                children.length = j;
                elements.length = k;
                node.naturalChildren = children;
                node.naturalElements = elements;
                this.cacheNodeChildren(node, children, inlineText);
                if (this.userSettings.createQuerySelectorMap && k > 0) {
                    node.queryMap = this.createQueryMap(elements, k);
                }
            }
            return node;
        }
        cacheNodeChildren(node, children, inlineText) {
            const length = children.length;
            if (length) {
                const CACHE = this.processing.cache;
                let siblingsLeading = [];
                let siblingsTrailing = [];
                if (length > 1) {
                    let trailing = children[0];
                    let floating = false;
                    for (let i = 0, j = 0; i < length; i++) {
                        const child = children[i];
                        if (child.excluded) {
                            this.processing.excluded.append(child);
                        }
                        else if (!child.plainText || !inlineText) {
                            child.containerIndex = j++;
                            child.parent = node;
                            CACHE.append(child);
                        }
                        if (child.pageFlow) {
                            if (child.floating) {
                                floating = true;
                            }
                            if (i > 0) {
                                siblingsTrailing.push(child);
                                if (child.lineBreak) {
                                    children[i - 1].lineBreakTrailing = true;
                                }
                            }
                            if (!child.excluded) {
                                child.siblingsLeading = siblingsLeading;
                                trailing.siblingsTrailing = siblingsTrailing;
                                siblingsLeading = [];
                                siblingsTrailing = [];
                                trailing = child;
                            }
                            if (i < length - 1) {
                                siblingsLeading.push(child);
                                if (child.lineBreak) {
                                    children[i + 1].lineBreakLeading = true;
                                }
                            }
                        }
                        child.actualParent = node;
                    }
                    trailing.siblingsTrailing = siblingsTrailing;
                    node.floatContainer = floating;
                }
                else {
                    const child = children[0];
                    if (child.excluded) {
                        this.processing.excluded.append(child);
                    }
                    else if (!child.plainText) {
                        child.siblingsLeading = siblingsLeading;
                        child.siblingsTrailing = siblingsTrailing;
                        child.parent = node;
                        child.containerIndex = 0;
                        CACHE.append(child);
                    }
                    child.actualParent = node;
                }
            }
            else {
                inlineText = !node.textEmpty;
            }
            node.inlineText = inlineText;
        }
        createPseduoElement(element, pseudoElt, sessionId) {
            let styleMap = $session$3.getElementCache(element, 'styleMap' + pseudoElt, sessionId);
            let nested = 0;
            if (element.tagName === 'Q') {
                if (styleMap === undefined) {
                    styleMap = {};
                    $session$3.setElementCache(element, 'styleMap' + pseudoElt, sessionId, styleMap);
                }
                if (!styleMap.content) {
                    styleMap.content = $css$3.getStyle(element, pseudoElt).getPropertyValue('content') || (pseudoElt === '::before' ? 'open-quote' : 'close-quote');
                }
                if (styleMap.content.endsWith('-quote')) {
                    let current = element.parentElement;
                    while (current && current.tagName === 'Q') {
                        nested++;
                        current = current.parentElement;
                    }
                }
            }
            if (styleMap) {
                let value = styleMap.content;
                if (value) {
                    if ($util$7.trimString(value, '"').trim() === '' && $util$7.convertFloat(styleMap.width) === 0 && $util$7.convertFloat(styleMap.height) === 0 && (styleMap.position === 'absolute' || styleMap.position === 'fixed' || styleMap.clear && styleMap.clear !== 'none')) {
                        let valid = true;
                        for (const attr in styleMap) {
                            if (/(Width|Height)$/.test(attr)) {
                                const dimension = styleMap[attr];
                                if ($css$3.isLength(dimension, true) && $util$7.convertFloat(dimension) !== 0) {
                                    valid = false;
                                    break;
                                }
                            }
                        }
                        if (valid) {
                            return undefined;
                        }
                    }
                    if (value === 'inherit') {
                        let current = element;
                        while (current) {
                            value = $css$3.getStyle(current).getPropertyValue('content');
                            if (value !== 'inherit') {
                                break;
                            }
                            current = current.parentElement;
                        }
                    }
                    const style = $css$3.getStyle(element);
                    if (styleMap.fontFamily === undefined) {
                        styleMap.fontFamily = style.getPropertyValue('font-family');
                    }
                    if (styleMap.fontSize === undefined) {
                        styleMap.fontSize = style.getPropertyValue('font-size');
                    }
                    if (styleMap.fontWeight === undefined) {
                        styleMap.fontWeight = style.getPropertyValue('font-weight');
                    }
                    if (styleMap.color === undefined) {
                        styleMap.color = style.getPropertyValue('color');
                    }
                    if (styleMap.display === undefined) {
                        styleMap.display = 'inline';
                    }
                    let tagName = styleMap.display.startsWith('inline') ? 'span' : 'div';
                    let content = '';
                    switch (value) {
                        case 'normal':
                        case 'none':
                        case 'initial':
                        case 'inherit':
                        case 'no-open-quote':
                        case 'no-close-quote':
                        case '""':
                            break;
                        case 'open-quote':
                            if (pseudoElt === '::before') {
                                content = nested % 2 === 0 ? '“' : "‘";
                            }
                            break;
                        case 'close-quote':
                            if (pseudoElt === '::after') {
                                content = nested % 2 === 0 ? '”' : "’";
                            }
                            break;
                        default:
                            if (value.startsWith('url(')) {
                                content = $css$3.resolveURL(value);
                                const format = $util$7.fromLastIndexOf(content, '.').toLowerCase();
                                const imageFormat = this._localSettings.supported.imageFormat;
                                if (imageFormat === '*' || imageFormat.includes(format)) {
                                    tagName = 'img';
                                }
                                else {
                                    content = '';
                                }
                            }
                            else {
                                if (CACHE_PATTERN$1.COUNTER) {
                                    CACHE_PATTERN$1.COUNTER.lastIndex = 0;
                                }
                                else {
                                    CACHE_PATTERN$1.COUNTER = /\s*(?:attr\(([^)]+)\)|(counter)\(([^,)]+)(?:, ([a-z\-]+))?\)|(counters)\(([^,]+), "([^"]*)"(?:, ([a-z\-]+))?\)|"([^"]+)")\s*/g;
                                    CACHE_PATTERN$1.COUNTER_VALUE = /\s*([^\-\d][^\-\d]?[^ ]*) (-?\d+)\s*/g;
                                }
                                let found = false;
                                let match;
                                while ((match = CACHE_PATTERN$1.COUNTER.exec(value)) !== null) {
                                    if (match[1]) {
                                        content += $dom$3.getNamedItem(element, match[1].trim());
                                    }
                                    else if (match[2] || match[5]) {
                                        const counterType = match[2] === 'counter';
                                        let counterName;
                                        let styleName;
                                        if (counterType) {
                                            counterName = match[3];
                                            styleName = match[4] || 'decimal';
                                        }
                                        else {
                                            counterName = match[6];
                                            styleName = match[8] || 'decimal';
                                        }
                                        function getCounterValue(name) {
                                            if (name !== 'none') {
                                                CACHE_PATTERN$1.COUNTER_VALUE.lastIndex = 0;
                                                let counterMatch;
                                                while ((counterMatch = CACHE_PATTERN$1.COUNTER_VALUE.exec(name)) !== null) {
                                                    if (counterMatch[1] === counterName) {
                                                        return parseInt(counterMatch[2]);
                                                    }
                                                }
                                            }
                                            return undefined;
                                        }
                                        const getIncrementValue = (parent) => {
                                            const pseduoStyle = $session$3.getElementCache(parent, 'styleMap' + pseudoElt, sessionId);
                                            if (pseduoStyle && pseduoStyle.counterIncrement) {
                                                return getCounterValue(pseduoStyle.counterIncrement);
                                            }
                                            return undefined;
                                        };
                                        const initalValue = (getIncrementValue(element) || 0) + (getCounterValue(style.getPropertyValue('counter-reset')) || 0);
                                        const subcounter = [];
                                        let current = element;
                                        let counter = initalValue;
                                        let ascending = false;
                                        let lastResetElement;
                                        function incrementCounter(increment, pseudo) {
                                            if (subcounter.length === 0) {
                                                counter += increment;
                                            }
                                            else if (ascending || pseudo) {
                                                subcounter[subcounter.length - 1] += increment;
                                            }
                                        }
                                        function cascadeSibling(sibling) {
                                            if (getCounterValue($css$3.getStyle(sibling).getPropertyValue('counter-reset')) === undefined) {
                                                const children = sibling.children;
                                                const length = children.length;
                                                for (let i = 0; i < length; i++) {
                                                    const child = children[i];
                                                    if (child.className !== '__squared.pseudo') {
                                                        let increment = getIncrementValue(child);
                                                        if (increment) {
                                                            incrementCounter(increment, true);
                                                        }
                                                        const childStyle = $css$3.getStyle(child);
                                                        increment = getCounterValue(childStyle.getPropertyValue('counter-increment'));
                                                        if (increment) {
                                                            incrementCounter(increment, false);
                                                        }
                                                        increment = getCounterValue(childStyle.getPropertyValue('counter-reset'));
                                                        if (increment !== undefined) {
                                                            return;
                                                        }
                                                        cascadeSibling(child);
                                                    }
                                                }
                                            }
                                        }
                                        do {
                                            ascending = false;
                                            if (current.previousElementSibling) {
                                                current = current.previousElementSibling;
                                                cascadeSibling(current);
                                            }
                                            else if (current.parentElement) {
                                                current = current.parentElement;
                                                ascending = true;
                                            }
                                            else {
                                                break;
                                            }
                                            if (current.className !== '__squared.pseudo') {
                                                const pesudoIncrement = getIncrementValue(current);
                                                if (pesudoIncrement) {
                                                    incrementCounter(pesudoIncrement, true);
                                                }
                                                const currentStyle = $css$3.getStyle(current);
                                                const counterIncrement = getCounterValue(currentStyle.getPropertyValue('counter-increment')) || 0;
                                                if (counterIncrement) {
                                                    incrementCounter(counterIncrement, false);
                                                }
                                                const counterReset = getCounterValue(currentStyle.getPropertyValue('counter-reset'));
                                                if (counterReset !== undefined) {
                                                    if (lastResetElement === undefined) {
                                                        counter += counterReset;
                                                    }
                                                    lastResetElement = current;
                                                    if (counterType) {
                                                        break;
                                                    }
                                                    else if (ascending) {
                                                        subcounter.push((pesudoIncrement || 0) + counterReset);
                                                    }
                                                }
                                            }
                                        } while (true);
                                        if (lastResetElement) {
                                            if (!counterType && subcounter.length > 1) {
                                                subcounter.reverse();
                                                subcounter.splice(1, 1);
                                                for (const leading of subcounter) {
                                                    content += $css$3.convertListStyle(styleName, leading, true) + match[7];
                                                }
                                            }
                                        }
                                        else {
                                            counter = initalValue;
                                        }
                                        content += $css$3.convertListStyle(styleName, counter, true);
                                    }
                                    else if (match[9]) {
                                        content += match[9];
                                    }
                                    found = true;
                                }
                                if (!found) {
                                    content = value;
                                }
                            }
                            break;
                    }
                    if (content || value === '""') {
                        const pseudoElement = createPseudoElement(element, tagName, pseudoElt === '::before' ? 0 : -1);
                        if (tagName === 'img') {
                            pseudoElement.src = content;
                            const image = this.resourceHandler.getImage(content);
                            if (image) {
                                if (styleMap.width === undefined) {
                                    if (image.width > 0) {
                                        styleMap.width = $css$3.formatPX(image.width);
                                    }
                                }
                                if (styleMap.height === undefined) {
                                    if (image.height > 0) {
                                        styleMap.height = $css$3.formatPX(image.height);
                                    }
                                }
                            }
                        }
                        else if (value !== '""') {
                            pseudoElement.innerText = content;
                        }
                        for (const attr in styleMap) {
                            if (attr !== 'display') {
                                pseudoElement.style[attr] = styleMap[attr];
                            }
                        }
                        $session$3.setElementCache(pseudoElement, 'pseudoElement', sessionId, pseudoElt);
                        $session$3.setElementCache(pseudoElement, 'styleMap', sessionId, styleMap);
                        return pseudoElement;
                    }
                }
            }
            return undefined;
        }
        setBaseLayout(layoutName) {
            const { processing, session } = this;
            const CACHE = processing.cache;
            const documentRoot = processing.node;
            const extensionMap = this.session.extensionMap;
            const mapY = new Map();
            let extensions = $util$7.filterArray(this.extensions, item => !item.eventOnly);
            function setMapY(depth, id, node) {
                const index = mapY.get(depth) || new Map();
                mapY.set(depth, index.set(id, node));
            }
            function deleteMapY(id) {
                for (const mapNode of mapY.values()) {
                    for (const node of mapNode.values()) {
                        if (node.id === id) {
                            mapNode.delete(node.id);
                            return;
                        }
                    }
                }
            }
            setMapY(-1, 0, documentRoot.parent);
            let maxDepth = 0;
            for (const node of CACHE) {
                if (node.visible && node.length) {
                    const depth = node.depth;
                    setMapY(depth, node.id, node);
                    maxDepth = Math.max(depth, maxDepth);
                }
            }
            for (let i = 0; i < maxDepth; i++) {
                mapY.set((i * -1) - 2, new Map());
            }
            CACHE.afterAppend = (node) => {
                const id = node.id;
                deleteMapY(id);
                setMapY((node.depth * -1) - 2, id, node);
                for (const item of node.cascade()) {
                    const itemId = item.id;
                    deleteMapY(itemId);
                    setMapY((item.depth * -1) - 2, itemId, item);
                }
            };
            for (const ext of this.extensions) {
                ext.beforeBaseLayout();
            }
            for (const depth of mapY.values()) {
                for (const parent of depth.values()) {
                    if (parent.length === 0) {
                        continue;
                    }
                    const floatContainer = parent.floatContainer;
                    const renderExtension = parent.renderExtension;
                    const axisY = parent.duplicate();
                    const length = axisY.length;
                    let cleared;
                    if (floatContainer) {
                        cleared = NodeUI.linearData(parent.naturalElements, true).cleared;
                    }
                    for (let k = 0; k < length; k++) {
                        let nodeY = axisY[k];
                        if (nodeY.rendered || !nodeY.visible || nodeY.naturalElement && !nodeY.documentRoot && this.rootElements.has(nodeY.element)) {
                            continue;
                        }
                        let parentY = nodeY.parent;
                        if (length > 1 && k < length - 1 && nodeY.pageFlow && !nodeY.nodeGroup && (parentY.alignmentType === 0 || parentY.hasAlign(2 /* UNKNOWN */) || nodeY.hasAlign(8192 /* EXTENDABLE */)) && !parentY.hasAlign(4 /* AUTO_LAYOUT */) && nodeY.hasSection(APP_SECTION.DOM_TRAVERSE)) {
                            const horizontal = [];
                            const vertical = [];
                            let extended = false;
                            function checkHorizontal(node) {
                                if (vertical.length || extended) {
                                    return false;
                                }
                                horizontal.push(node);
                                return true;
                            }
                            function checkVertical(node) {
                                if (horizontal.length) {
                                    return false;
                                }
                                vertical.push(node);
                                return true;
                            }
                            let l = k;
                            let m = 0;
                            if (nodeY.hasAlign(8192 /* EXTENDABLE */) && parentY.layoutVertical) {
                                horizontal.push(nodeY);
                                l++;
                                m++;
                            }
                            traverse: {
                                let floatActive;
                                let floatCleared;
                                if (floatContainer) {
                                    floatActive = new Set();
                                    floatCleared = new Map();
                                }
                                for (; l < length; l++, m++) {
                                    const item = axisY[l];
                                    if (item.pageFlow) {
                                        if (floatContainer) {
                                            if (floatActive.size) {
                                                const float = cleared.get(item);
                                                if (float) {
                                                    if (float === 'both') {
                                                        floatActive.clear();
                                                    }
                                                    else {
                                                        floatActive.delete(float);
                                                    }
                                                    floatCleared.set(item, float);
                                                }
                                            }
                                            if (item.floating) {
                                                floatActive.add(item.float);
                                            }
                                        }
                                        if (m === 0) {
                                            const next = item.siblingsTrailing[0];
                                            if (next) {
                                                if (!item.horizontalAligned || next.alignedVertically([item])) {
                                                    vertical.push(item);
                                                }
                                                else {
                                                    horizontal.push(item);
                                                }
                                                continue;
                                            }
                                        }
                                        const previous = item.siblingsLeading[0];
                                        if (previous) {
                                            if (floatContainer) {
                                                const status = item.alignedVertically(horizontal.length ? horizontal : vertical, cleared, horizontal.length > 0);
                                                if (status > 0) {
                                                    if (horizontal.length) {
                                                        if (status !== 7 /* FLOAT_INTERSECT */ && status !== 6 /* FLOAT_BLOCK */ && floatActive.size && floatCleared.get(item) !== 'both' && !item.siblingsLeading.some((node) => node.lineBreak && !cleared.has(node))) {
                                                            if (!item.floating || previous.floating && !$util$7.aboveRange(item.linear.top, previous.linear.bottom)) {
                                                                if (floatCleared.has(item)) {
                                                                    if (!item.floating) {
                                                                        item.addAlign(8192 /* EXTENDABLE */);
                                                                        horizontal.push(item);
                                                                        extended = true;
                                                                        continue;
                                                                    }
                                                                    break traverse;
                                                                }
                                                                else {
                                                                    let floatBottom = Number.NEGATIVE_INFINITY;
                                                                    if (!item.floating) {
                                                                        $util$7.captureMap(horizontal, node => node.floating, node => floatBottom = Math.max(floatBottom, node.linear.bottom));
                                                                    }
                                                                    if (!item.floating && !$util$7.aboveRange(item.linear.top, floatBottom) || item.floating && floatActive.has(item.float)) {
                                                                        horizontal.push(item);
                                                                        if (!item.floating && $util$7.aboveRange(item.linear.bottom, floatBottom)) {
                                                                            break traverse;
                                                                        }
                                                                        else {
                                                                            continue;
                                                                        }
                                                                    }
                                                                }
                                                            }
                                                        }
                                                        break traverse;
                                                    }
                                                    if (!checkVertical(item)) {
                                                        break traverse;
                                                    }
                                                }
                                                else if (!checkHorizontal(item)) {
                                                    break traverse;
                                                }
                                            }
                                            else {
                                                if (item.alignedVertically()) {
                                                    if (!checkVertical(item)) {
                                                        break traverse;
                                                    }
                                                }
                                                else if (!checkHorizontal(item)) {
                                                    break traverse;
                                                }
                                            }
                                        }
                                        else {
                                            break traverse;
                                        }
                                    }
                                    else if (item.positionAuto) {
                                        const lengthA = vertical.length;
                                        if (lengthA) {
                                            if (vertical[lengthA - 1].blockStatic) {
                                                vertical.push(item);
                                            }
                                            break;
                                        }
                                        else {
                                            horizontal.push(item);
                                        }
                                    }
                                }
                            }
                            let layout;
                            let segEnd;
                            if (horizontal.length > 1) {
                                layout = this.controllerHandler.processTraverseHorizontal(new LayoutUI(parentY, nodeY, 0, 0, horizontal), axisY);
                                segEnd = horizontal[horizontal.length - 1];
                            }
                            else if (vertical.length > 1) {
                                layout = this.controllerHandler.processTraverseVertical(new LayoutUI(parentY, nodeY, 0, 0, vertical), axisY);
                                segEnd = vertical[vertical.length - 1];
                                if (segEnd.horizontalAligned && segEnd !== axisY[length - 1]) {
                                    segEnd.addAlign(8192 /* EXTENDABLE */);
                                }
                            }
                            if (layout && this.addLayout(layout)) {
                                if (segEnd === axisY[length - 1]) {
                                    parentY.removeAlign(2 /* UNKNOWN */);
                                }
                                parentY = nodeY.parent;
                            }
                        }
                        nodeY.removeAlign(8192 /* EXTENDABLE */);
                        if (k === length - 1) {
                            parentY.removeAlign(2 /* UNKNOWN */);
                        }
                        if (nodeY.renderAs && parentY.appendTry(nodeY, nodeY.renderAs, false)) {
                            nodeY.hide();
                            nodeY = nodeY.renderAs;
                            if (nodeY.positioned) {
                                parentY = nodeY.parent;
                            }
                        }
                        if (!nodeY.rendered && nodeY.hasSection(APP_SECTION.EXTENSION)) {
                            const descendant = extensionMap.get(nodeY.id);
                            let combined;
                            if (descendant) {
                                combined = renderExtension ? renderExtension.concat(descendant) : descendant;
                            }
                            else {
                                combined = renderExtension;
                            }
                            if (combined) {
                                let next = false;
                                for (const ext of combined) {
                                    const result = ext.processChild(nodeY, parentY);
                                    if (result) {
                                        const { output, renderAs, outputAs } = result;
                                        if (output) {
                                            this.addLayoutTemplate(result.parentAs || parentY, nodeY, output);
                                        }
                                        if (renderAs && outputAs) {
                                            this.addLayoutTemplate(parentY, renderAs, outputAs);
                                        }
                                        parentY = result.parent || parentY;
                                        next = result.next === true;
                                        if (result.complete || next) {
                                            break;
                                        }
                                    }
                                }
                                if (next) {
                                    continue;
                                }
                            }
                            if (nodeY.styleElement) {
                                const prioritized = ApplicationUI.prioritizeExtensions(nodeY.element, extensions);
                                let next = false;
                                function removeExtension(item) {
                                    const index = extensions.indexOf(item);
                                    if (index !== -1) {
                                        extensions = extensions.slice(0);
                                        extensions.splice(index, 1);
                                    }
                                }
                                for (const item of prioritized) {
                                    if (item.is(nodeY)) {
                                        if (item.removeIs) {
                                            removeExtension(item);
                                        }
                                        if (item.condition(nodeY, parentY) && (descendant === undefined || !descendant.includes(item))) {
                                            const result = item.processNode(nodeY, parentY);
                                            if (result) {
                                                const { output, renderAs, outputAs, include } = result;
                                                if (output) {
                                                    this.addLayoutTemplate(result.parentAs || parentY, nodeY, output);
                                                }
                                                if (renderAs && outputAs) {
                                                    this.addLayoutTemplate(parentY, renderAs, outputAs);
                                                }
                                                parentY = result.parent || parentY;
                                                if (output && include !== false || include) {
                                                    if (nodeY.renderExtension === undefined) {
                                                        nodeY.renderExtension = [];
                                                    }
                                                    nodeY.renderExtension.push(item);
                                                    item.subscribers.add(nodeY);
                                                }
                                                if (result.remove) {
                                                    removeExtension(item);
                                                }
                                                next = result.next === true;
                                                if (result.complete || next) {
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                                if (next) {
                                    continue;
                                }
                            }
                        }
                        if (!nodeY.rendered && nodeY.hasSection(APP_SECTION.RENDER)) {
                            let layout = this.createLayoutControl(parentY, nodeY);
                            if (layout.containerType === 0) {
                                const result = nodeY.length ? this.controllerHandler.processUnknownParent(layout) : this.controllerHandler.processUnknownChild(layout);
                                if (result.next) {
                                    continue;
                                }
                                layout = result.layout;
                            }
                            this.addLayout(layout);
                        }
                    }
                }
            }
            for (const node of CACHE) {
                if (node.documentRoot && node.renderParent) {
                    session.documentRoot.push({ node, layoutName: node === documentRoot ? layoutName : '' });
                }
            }
            CACHE.sort((a, b) => {
                if (a.depth === b.depth) {
                    if (a.nodeGroup && (b.length === 0 || b.naturalChild)) {
                        return -1;
                    }
                    else if (b.nodeGroup && (a.length === 0 || a.naturalChild)) {
                        return 1;
                    }
                    return 0;
                }
                return a.depth < b.depth ? -1 : 1;
            });
            session.cache.concat(CACHE.children);
            session.excluded.concat(processing.excluded.children);
            for (const ext of this.extensions) {
                for (const node of ext.subscribers) {
                    if (CACHE.contains(node)) {
                        ext.postBaseLayout(node);
                    }
                }
                ext.afterBaseLayout();
            }
        }
        setConstraints() {
            const CACHE = this.processing.cache;
            this.controllerHandler.setConstraints();
            for (const ext of this.extensions) {
                for (const node of ext.subscribers) {
                    if (CACHE.contains(node)) {
                        ext.postConstraints(node);
                    }
                }
                ext.afterConstraints();
            }
        }
        setResources() {
            const resource = this.resourceHandler;
            for (const node of this.processing.cache) {
                resource.setBoxStyle(node);
                resource.setFontStyle(node);
                resource.setValueString(node);
            }
            for (const ext of this.extensions) {
                ext.afterResources();
            }
        }
        processFloatHorizontal(layout) {
            const controller = this.controllerHandler;
            const layerIndex = [];
            const inlineAbove = [];
            const inlineBelow = [];
            const leftAbove = [];
            const rightAbove = [];
            let leftBelow;
            let rightBelow;
            let leftSub;
            let rightSub;
            let clearedFloat = 0;
            layout.each((node, index) => {
                if (index > 0) {
                    const cleared = layout.cleared.get(node);
                    if (cleared) {
                        switch (cleared) {
                            case 'left':
                                if (!$util$7.hasBit(clearedFloat, 2)) {
                                    clearedFloat |= 2;
                                }
                                break;
                            case 'right':
                                if (!$util$7.hasBit(clearedFloat, 4)) {
                                    clearedFloat |= 4;
                                }
                                break;
                            default:
                                clearedFloat = 6;
                                break;
                        }
                    }
                }
                if (clearedFloat === 0) {
                    if (node.float === 'right') {
                        rightAbove.push(node);
                    }
                    else if (node.float === 'left') {
                        leftAbove.push(node);
                    }
                    else if (leftAbove.length || rightAbove.length) {
                        let top = node.linear.top;
                        if (node.styleText) {
                            const textBounds = node.textBounds;
                            if (textBounds && textBounds.top > top) {
                                top = textBounds.top;
                            }
                        }
                        if (leftAbove.some(item => top >= item.linear.bottom) || rightAbove.some(item => top >= item.linear.bottom)) {
                            inlineBelow.push(node);
                        }
                        else {
                            inlineAbove.push(node);
                        }
                    }
                    else {
                        inlineAbove.push(node);
                    }
                }
                else if (node.float === 'right') {
                    if (clearedFloat === 4 || clearedFloat === 6) {
                        if (rightBelow === undefined) {
                            rightBelow = [];
                        }
                        rightBelow.push(node);
                    }
                    else {
                        rightAbove.push(node);
                    }
                }
                else if (node.float === 'left') {
                    if (clearedFloat === 2 || clearedFloat === 6) {
                        if (leftBelow === undefined) {
                            leftBelow = [];
                        }
                        leftBelow.push(node);
                    }
                    else {
                        leftAbove.push(node);
                    }
                }
                else if (clearedFloat === 6) {
                    inlineBelow.push(node);
                }
                else {
                    inlineAbove.push(node);
                }
            });
            if (leftAbove.length && leftBelow) {
                leftSub = [leftAbove, leftBelow];
            }
            else if (leftAbove.length) {
                leftSub = leftAbove;
            }
            if (rightAbove.length && rightBelow) {
                rightSub = [rightAbove, rightBelow];
            }
            else if (rightAbove.length) {
                rightSub = rightAbove;
            }
            const { containerType, alignmentType } = controller.containerTypeVertical;
            if (rightAbove.length + (rightBelow ? rightBelow.length : 0) === layout.length) {
                layout.add(2048 /* RIGHT */);
            }
            if (inlineBelow.length) {
                const { node, parent } = layout;
                if (inlineBelow.length > 1) {
                    inlineBelow[0].addAlign(8192 /* EXTENDABLE */);
                }
                inlineBelow.unshift(node);
                const wrapper = this.createNode(undefined, true, parent, inlineBelow);
                wrapper.containerName = node.containerName;
                wrapper.inherit(node, 'boxStyle');
                wrapper.innerWrapped = node;
                node.outerWrapper = wrapper;
                this.addLayout(new LayoutUI(parent, wrapper, containerType, alignmentType | (parent.blockStatic ? 64 /* BLOCK */ : 0), inlineBelow));
                layout.parent = wrapper;
            }
            if (inlineAbove.length) {
                layerIndex.push(inlineAbove);
            }
            if (leftSub) {
                layerIndex.push(leftSub);
            }
            if (rightSub) {
                layerIndex.push(rightSub);
            }
            layout.setType(controller.containerTypeVerticalMargin);
            layout.itemCount = layerIndex.length;
            layout.add(64 /* BLOCK */);
            for (const item of layerIndex) {
                let segments;
                let floatgroup;
                if (Array.isArray(item[0])) {
                    segments = item;
                    const node = layout.node;
                    let grouping = segments[0];
                    for (let i = 1; i < segments.length; i++) {
                        grouping = grouping.concat(segments[i]);
                    }
                    grouping.sort((a, b) => a.childIndex < b.childIndex ? -1 : 1);
                    if (node.layoutVertical) {
                        floatgroup = node;
                    }
                    else {
                        floatgroup = controller.createNodeGroup(grouping[0], grouping, node);
                        const group = new LayoutUI(node, floatgroup, containerType, alignmentType | (segments.some(seg => seg === rightSub || seg === rightAbove) ? 2048 /* RIGHT */ : 0));
                        group.itemCount = segments.length;
                        this.addLayout(group);
                    }
                }
                else {
                    segments = [item];
                }
                for (const seg of segments) {
                    const node = floatgroup || layout.node;
                    const target = controller.createNodeGroup(seg[0], seg, node, true);
                    const group = new LayoutUI(node, target, 0, 128 /* SEGMENTED */ | (seg === inlineAbove ? 256 /* COLUMN */ : 0), seg);
                    if (seg.length === 1) {
                        group.node.innerWrapped = seg[0];
                        seg[0].outerWrapper = group.node;
                        if (seg[0].percentWidth) {
                            group.setType(controller.containerTypePercent);
                        }
                        else {
                            group.setContainerType(containerType, alignmentType);
                        }
                    }
                    else if (group.linearY || group.unknownAligned) {
                        group.setContainerType(containerType, alignmentType | (group.unknownAligned ? 2 /* UNKNOWN */ : 0));
                    }
                    else {
                        controller.processLayoutHorizontal(group);
                    }
                    this.addLayout(group);
                    if (seg === inlineAbove) {
                        this.setFloatPadding(node, target, inlineAbove, leftAbove, rightAbove);
                    }
                }
            }
            return layout;
        }
        processFloatVertical(layout) {
            const controller = this.controllerHandler;
            const { containerType, alignmentType } = controller.containerTypeVertical;
            if (layout.containerType !== 0) {
                const node = layout.node;
                const parent = controller.createNodeGroup(node, [node], layout.parent);
                this.addLayout(new LayoutUI(parent, node, containerType, alignmentType, parent.children));
                layout.node = parent;
            }
            else {
                layout.containerType = containerType;
                layout.add(alignmentType);
            }
            const staticRows = [];
            const floatedRows = [];
            const current = [];
            const floated = [];
            let clearReset = false;
            let blockArea = false;
            let layoutVertical = true;
            for (const node of layout) {
                if (node.blockStatic && floated.length === 0) {
                    current.push(node);
                    blockArea = true;
                }
                else {
                    if (layout.cleared.has(node)) {
                        if (!node.floating) {
                            node.modifyBox(2 /* MARGIN_TOP */);
                            staticRows.push(current.slice(0));
                            floatedRows.push(floated.slice(0));
                            current.length = 0;
                            floated.length = 0;
                        }
                        else {
                            clearReset = true;
                        }
                    }
                    if (node.floating) {
                        if (blockArea) {
                            staticRows.push(current.slice(0));
                            floatedRows.push(null);
                            current.length = 0;
                            floated.length = 0;
                            blockArea = false;
                        }
                        floated.push(node);
                    }
                    else {
                        if (clearReset && !layout.cleared.has(node)) {
                            layoutVertical = false;
                        }
                        current.push(node);
                    }
                }
            }
            if (floated.length) {
                floatedRows.push(floated);
            }
            if (current.length) {
                staticRows.push(current);
            }
            if (!layoutVertical) {
                for (let i = 0; i < Math.max(floatedRows.length, staticRows.length); i++) {
                    const pageFlow = staticRows[i] || [];
                    if (floatedRows[i] === null && pageFlow.length) {
                        const layoutType = controller.containerTypeVertical;
                        layoutType.alignmentType |= 128 /* SEGMENTED */ | 64 /* BLOCK */;
                        this.addLayout(new LayoutUI(layout.node, controller.createNodeGroup(pageFlow[0], pageFlow, layout.node), layoutType.containerType, layoutType.alignmentType, pageFlow));
                    }
                    else {
                        const floating = floatedRows[i] || [];
                        if (pageFlow.length || floating.length) {
                            const verticalMargin = controller.containerTypeVerticalMargin;
                            const basegroup = controller.createNodeGroup(floating[0] || pageFlow[0], [], layout.node);
                            const layoutGroup = new LayoutUI(layout.node, basegroup, verticalMargin.containerType, verticalMargin.alignmentType);
                            const children = [];
                            let subgroup;
                            if (floating.length) {
                                const floatgroup = controller.createNodeGroup(floating[0], floating, basegroup);
                                layoutGroup.add(512 /* FLOAT */);
                                if (pageFlow.length === 0 && floating.every(item => item.float === 'right')) {
                                    layoutGroup.add(2048 /* RIGHT */);
                                }
                                children.push(floatgroup);
                            }
                            if (pageFlow.length) {
                                subgroup = controller.createNodeGroup(pageFlow[0], pageFlow, basegroup);
                                children.push(subgroup);
                            }
                            basegroup.init();
                            layoutGroup.itemCount = children.length;
                            this.addLayout(layoutGroup);
                            for (let node of children) {
                                if (!node.nodeGroup) {
                                    node = controller.createNodeGroup(node, [node], basegroup, true);
                                }
                                this.addLayout(new LayoutUI(basegroup, node, containerType, alignmentType | 128 /* SEGMENTED */ | 64 /* BLOCK */, node.children));
                            }
                            if (pageFlow.length && floating.length) {
                                const [leftAbove, rightAbove] = $util$7.partitionArray(floating, item => item.float !== 'right');
                                this.setFloatPadding(layout.node, subgroup, pageFlow, leftAbove, rightAbove);
                            }
                        }
                    }
                }
            }
            return layout;
        }
        setFloatPadding(parent, target, inlineAbove, leftAbove, rightAbove) {
            const requirePadding = (node) => node.textElement && (node.blockStatic || node.multiline);
            if (inlineAbove.some((child) => requirePadding(child) || child.blockStatic && child.cascadeSome((nested) => requirePadding(nested)))) {
                if (leftAbove.length) {
                    let floatPosition = Number.NEGATIVE_INFINITY;
                    let marginLeft = 0;
                    let invalid = 0;
                    let hasSpacing = false;
                    for (const child of leftAbove) {
                        const right = child.linear.right + (child.marginLeft < 0 ? child.marginLeft : 0);
                        if (right > floatPosition) {
                            floatPosition = right;
                            hasSpacing = child.marginRight > 0;
                        }
                    }
                    for (const child of inlineAbove) {
                        if (child.blockStatic) {
                            if (child.bounds.left > floatPosition) {
                                invalid++;
                            }
                            else {
                                marginLeft = Math.max(marginLeft, child.marginLeft);
                            }
                        }
                    }
                    if (invalid < inlineAbove.length) {
                        const offset = floatPosition - parent.box.left - marginLeft;
                        if (offset > 0) {
                            target.modifyBox(256 /* PADDING_LEFT */, offset + (!hasSpacing && target.cascadeSome(child => child.multiline) ? this._localSettings.deviations.textMarginBoundarySize : 0));
                        }
                    }
                }
                if (rightAbove.length) {
                    let floatPosition = Number.POSITIVE_INFINITY;
                    let marginRight = 0;
                    let invalid = 0;
                    let hasSpacing = false;
                    for (const child of rightAbove) {
                        const left = child.linear.left + (child.marginRight < 0 ? child.marginRight : 0);
                        if (left < floatPosition) {
                            floatPosition = left;
                            hasSpacing = child.marginLeft > 0;
                        }
                    }
                    for (const child of inlineAbove) {
                        if (child.blockStatic) {
                            if (child.bounds.right < floatPosition) {
                                invalid++;
                            }
                            else {
                                marginRight = Math.max(marginRight, child.marginRight);
                            }
                        }
                    }
                    if (invalid < inlineAbove.length) {
                        const offset = parent.box.right - floatPosition - marginRight;
                        if (offset > 0) {
                            target.modifyBox(64 /* PADDING_RIGHT */, offset + (!hasSpacing && target.cascadeSome(child => child.multiline) ? this._localSettings.deviations.textMarginBoundarySize : 0));
                        }
                    }
                }
            }
        }
        createLayoutControl(parent, node) {
            return new LayoutUI(parent, node, node.containerType, node.alignmentType, node.children);
        }
        get layouts() {
            return this._layouts.sort((a, b) => {
                if (a.index !== b.index) {
                    if (a.index === 0 || a.index !== undefined && a.index !== Number.POSITIVE_INFINITY && b.index === undefined || b.index === Number.POSITIVE_INFINITY) {
                        return -1;
                    }
                    else if (b.index === 0 || b.index !== undefined && b.index !== Number.POSITIVE_INFINITY && a.index === undefined || a.index === Number.POSITIVE_INFINITY) {
                        return 1;
                    }
                    else if (a.index !== undefined && b.index !== undefined) {
                        return a.index < b.index ? -1 : 1;
                    }
                }
                return 0;
            });
        }
        get rendered() {
            return this.session.cache.filter((node) => node.visible && node.renderParent !== undefined);
        }
        get nextId() {
            return this.processing.cache.nextId;
        }
        get length() {
            return this.session.documentRoot.length;
        }
    }

    const { client: $client, css: $css$4, dom: $dom$4, session: $session$4, util: $util$8, xml: $xml$1 } = squared.lib;
    const withinViewport = (rect) => !(rect.left < 0 && Math.abs(rect.left) >= rect.width || rect.top < 0 && Math.abs(rect.top) >= rect.height);
    class ControllerUI extends Controller {
        constructor() {
            super(...arguments);
            this._requireFormat = false;
            this._beforeOutside = {};
            this._beforeInside = {};
            this._afterInside = {};
            this._afterOutside = {};
        }
        reset() {
            this._requireFormat = false;
            this._beforeOutside = {};
            this._beforeInside = {};
            this._afterInside = {};
            this._afterOutside = {};
        }
        preventNodeCascade(element) {
            return this.localSettings.unsupported.cascade.has(element.tagName);
        }
        applyDefaultStyles(element) {
            const sessionId = this.sessionId;
            let styleMap;
            if ($dom$4.isTextNode(element)) {
                styleMap = {
                    position: 'static',
                    display: 'inline',
                    verticalAlign: 'baseline',
                    float: 'none',
                    clear: 'none'
                };
            }
            else {
                styleMap = $session$4.getElementCache(element, 'styleMap', sessionId) || {};
                function checkBorderAttribute(index) {
                    for (let i = 0; i < 4; i++) {
                        if (styleMap[$css$4.BOX_BORDER[i][index]]) {
                            return false;
                        }
                    }
                    return true;
                }
                const setBorderStyle = () => {
                    if (styleMap.border === undefined && checkBorderAttribute(0)) {
                        const inputBorderColor = this.localSettings.style.inputBorderColor;
                        styleMap.border = 'outset 1px ' + inputBorderColor;
                        for (let i = 0; i < 4; i++) {
                            styleMap[$css$4.BOX_BORDER[i][0]] = 'outset';
                            styleMap[$css$4.BOX_BORDER[i][1]] = '1px';
                            styleMap[$css$4.BOX_BORDER[i][2]] = inputBorderColor;
                        }
                        return true;
                    }
                    return false;
                };
                const setButtonStyle = (appliedBorder) => {
                    if (appliedBorder && (styleMap.backgroundColor === undefined || styleMap.backgroundColor === 'initial')) {
                        styleMap.backgroundColor = this.localSettings.style.inputBackgroundColor;
                    }
                    if (styleMap.textAlign === undefined) {
                        styleMap.textAlign = 'center';
                    }
                    if (styleMap.padding === undefined && !$css$4.BOX_PADDING.some(attr => !!styleMap[attr])) {
                        styleMap.paddingTop = '2px';
                        styleMap.paddingRight = '6px';
                        styleMap.paddingBottom = '3px';
                        styleMap.paddingLeft = '6px';
                    }
                };
                if ($client.isUserAgent(8 /* FIREFOX */)) {
                    switch (element.tagName) {
                        case 'INPUT':
                        case 'SELECT':
                        case 'BUTTON':
                        case 'TEXTAREA':
                            if (styleMap.display === undefined) {
                                styleMap.display = 'inline-block';
                            }
                            break;
                        case 'FIELDSET':
                            if (styleMap.display === undefined) {
                                styleMap.display = 'block';
                            }
                            break;
                    }
                }
                switch (element.tagName) {
                    case 'INPUT': {
                        const type = element.type;
                        switch (type) {
                            case 'radio':
                            case 'checkbox':
                                break;
                            case 'week':
                            case 'month':
                            case 'time':
                            case 'date':
                            case 'datetime-local':
                                styleMap.paddingTop = $css$4.formatPX($util$8.convertFloat(styleMap.paddingTop) + 1);
                                styleMap.paddingRight = $css$4.formatPX($util$8.convertFloat(styleMap.paddingRight) + 1);
                                styleMap.paddingBottom = $css$4.formatPX($util$8.convertFloat(styleMap.paddingBottom) + 1);
                                styleMap.paddingLeft = $css$4.formatPX($util$8.convertFloat(styleMap.paddingLeft) + 1);
                                break;
                            case 'image':
                                if (styleMap.verticalAlign === undefined) {
                                    styleMap.verticalAlign = 'text-bottom';
                                }
                                break;
                            default:
                                const result = setBorderStyle();
                                switch (type) {
                                    case 'file':
                                    case 'reset':
                                    case 'submit':
                                    case 'button':
                                        setButtonStyle(result);
                                        break;
                                }
                                break;
                        }
                        break;
                    }
                    case 'BUTTON':
                        setButtonStyle(setBorderStyle());
                        break;
                    case 'TEXTAREA':
                    case 'SELECT':
                        setBorderStyle();
                        break;
                    case 'BODY':
                        if (styleMap.backgroundColor === undefined || styleMap.backgroundColor === 'initial') {
                            styleMap.backgroundColor = 'rgb(255, 255, 255)';
                        }
                        break;
                    case 'FORM':
                        if (styleMap.marginTop === undefined) {
                            styleMap.marginTop = '0px';
                        }
                        break;
                    case 'LI':
                        if (styleMap.listStyleImage === undefined) {
                            const style = $css$4.getStyle(element);
                            styleMap.listStyleImage = style.getPropertyValue('list-style-image');
                        }
                        break;
                    case 'IFRAME':
                        if (styleMap.display === undefined) {
                            styleMap.display = 'block';
                        }
                    case 'IMG':
                        const setDimension = (attr, opposing) => {
                            if (styleMap[attr] === undefined || styleMap[attr] === 'auto') {
                                const match = new RegExp(`\\s+${attr}="([^"]+)"`).exec(element.outerHTML);
                                if (match) {
                                    if ($css$4.isLength(match[1])) {
                                        styleMap[attr] = match[1] + 'px';
                                    }
                                    else if ($css$4.isPercent(match[1])) {
                                        styleMap[attr] = match[1];
                                    }
                                }
                                else if (element.tagName === 'IFRAME') {
                                    if (attr === 'width') {
                                        styleMap.width = '300px';
                                    }
                                    else {
                                        styleMap.height = '150px';
                                    }
                                }
                                else if (styleMap[opposing] && $css$4.isLength(styleMap[opposing])) {
                                    const attrMax = 'max' + $util$8.capitalize(attr);
                                    if (styleMap[attrMax] === undefined || !$css$4.isPercent(attrMax)) {
                                        const image = this.application.resourceHandler.getImage(element.src);
                                        if (image && image.width > 0 && image.height > 0) {
                                            styleMap[attr] = $css$4.formatPX(image[attr] * parseFloat(styleMap[opposing]) / image[opposing]);
                                        }
                                    }
                                }
                            }
                        };
                        setDimension('width', 'height');
                        setDimension('height', 'width');
                        break;
                }
            }
            $session$4.setElementCache(element, 'styleMap', sessionId, styleMap);
        }
        addBeforeOutsideTemplate(id, value, format = true, index = -1) {
            if (this._beforeOutside[id] === undefined) {
                this._beforeOutside[id] = [];
            }
            if (index !== -1 && index < this._beforeOutside[id].length) {
                this._beforeOutside[id].splice(index, 0, value);
            }
            else {
                this._beforeOutside[id].push(value);
            }
            if (format) {
                this._requireFormat = true;
            }
        }
        addBeforeInsideTemplate(id, value, format = true, index = -1) {
            if (this._beforeInside[id] === undefined) {
                this._beforeInside[id] = [];
            }
            if (index !== -1 && index < this._beforeInside[id].length) {
                this._beforeInside[id].splice(index, 0, value);
            }
            else {
                this._beforeInside[id].push(value);
            }
            if (format) {
                this._requireFormat = true;
            }
        }
        addAfterInsideTemplate(id, value, format = true, index = -1) {
            if (this._afterInside[id] === undefined) {
                this._afterInside[id] = [];
            }
            if (index !== -1 && index < this._afterInside[id].length) {
                this._afterInside[id].splice(index, 0, value);
            }
            else {
                this._afterInside[id].push(value);
            }
            if (format) {
                this._requireFormat = true;
            }
        }
        addAfterOutsideTemplate(id, value, format = true, index = -1) {
            if (this._afterOutside[id] === undefined) {
                this._afterOutside[id] = [];
            }
            if (index !== -1 && index < this._afterOutside[id].length) {
                this._afterOutside[id].splice(index, 0, value);
            }
            else {
                this._afterOutside[id].push(value);
            }
            if (format) {
                this._requireFormat = true;
            }
        }
        getBeforeOutsideTemplate(id, depth = 0) {
            return this._beforeOutside[id] ? $xml$1.pushIndentArray(this._beforeOutside[id], depth) : '';
        }
        getBeforeInsideTemplate(id, depth = 0) {
            return this._beforeInside[id] ? $xml$1.pushIndentArray(this._beforeInside[id], depth) : '';
        }
        getAfterInsideTemplate(id, depth = 0) {
            return this._afterInside[id] ? $xml$1.pushIndentArray(this._afterInside[id], depth) : '';
        }
        getAfterOutsideTemplate(id, depth = 0) {
            return this._afterOutside[id] ? $xml$1.pushIndentArray(this._afterOutside[id], depth) : '';
        }
        hasAppendProcessing(id) {
            if (id === undefined) {
                return this._requireFormat;
            }
            return this._beforeOutside[id] !== undefined || this._beforeInside[id] !== undefined || this._afterInside[id] !== undefined || this._afterOutside[id] !== undefined;
        }
        includeElement(element) {
            return !(this.localSettings.unsupported.tagName.has(element.tagName) || element.tagName === 'INPUT' && this.localSettings.unsupported.tagName.has(element.tagName + ':' + element.type)) || element.contentEditable === 'true';
        }
        visibleElement(element) {
            const rect = $session$4.actualClientRect(element, this.sessionId);
            if (withinViewport(rect)) {
                const style = $css$4.getStyle(element);
                if (rect.width > 0 && rect.height > 0) {
                    if (style.getPropertyValue('visibility') === 'visible') {
                        return true;
                    }
                    const position = style.getPropertyValue('position');
                    return position !== 'absolute' && position !== 'fixed';
                }
                return element.tagName === 'IMG' && style.getPropertyValue('display') !== 'none' ||
                    rect.width > 0 && style.getPropertyValue('float') !== 'none' ||
                    style.getPropertyValue('clear') !== 'none' ||
                    style.getPropertyValue('display') === 'block' && (parseInt(style.getPropertyValue('margin-top')) !== 0 || parseInt(style.getPropertyValue('margin-bottom')) !== 0) ||
                    element.className === '__squared.pseudo';
            }
            return false;
        }
        evaluateNonStatic(documentRoot, cache) {
            const altered = new Set();
            for (const node of cache) {
                if (!node.documentRoot) {
                    const actualParent = node.parent;
                    const absoluteParent = node.absoluteParent;
                    let parent;
                    switch (node.css('position')) {
                        case 'relative':
                            if (node === actualParent.lastChild) {
                                const box = actualParent.box;
                                let valid = false;
                                if (node.outsideX(box)) {
                                    if (!actualParent.hasPX('width') || actualParent.css('overflowX') === 'hidden') {
                                        continue;
                                    }
                                    valid = true;
                                }
                                if (node.outsideY(box)) {
                                    if (!actualParent.hasHeight && !actualParent.hasPX('height') || actualParent.css('overflowY') === 'hidden') {
                                        continue;
                                    }
                                    valid = true;
                                }
                                if (valid) {
                                    parent = actualParent.actualParent;
                                    do {
                                        if (node.withinX(parent.box) && node.withinY(parent.box) || parent.css('overflow') === 'hidden') {
                                            break;
                                        }
                                        parent = actualParent.actualParent;
                                    } while (parent && parent !== documentRoot);
                                    if (parent) {
                                        node.css('position', 'absolute', true);
                                        node.setBounds(false);
                                    }
                                }
                            }
                            break;
                        case 'fixed':
                            if (!node.positionAuto) {
                                parent = documentRoot;
                                break;
                            }
                        case 'absolute':
                            if (absoluteParent) {
                                parent = absoluteParent;
                                if (node.positionAuto) {
                                    if (!node.siblingsLeading.some(item => item.multiline || item.excluded && !item.blockStatic)) {
                                        node.cssApply({ display: 'inline-block', verticalAlign: 'top' }, true);
                                    }
                                    else {
                                        node.positionAuto = false;
                                    }
                                    parent = actualParent;
                                }
                                else if (this.userSettings.supportNegativeLeftTop) {
                                    const box = parent.box;
                                    let outside = false;
                                    while (parent && parent !== documentRoot) {
                                        if (!outside) {
                                            const overflowX = parent.css('overflowX') === 'hidden';
                                            const overflowY = parent.css('overflowY') === 'hidden';
                                            if (overflowX && overflowY || node.cssInitial('top') === '0px' || node.cssInitial('right') === '0px' || node.cssInitial('bottom') === '0px' || node.cssInitial('left') === '0px') {
                                                break;
                                            }
                                            else {
                                                const outsideX = !overflowX && node.outsideX(box);
                                                const outsideY = !overflowY && node.outsideY(box);
                                                if (!overflowY && node.linear.top < Math.floor(box.top) && (node.top < 0 || node.marginTop < 0)) {
                                                    outside = true;
                                                }
                                                else if (outsideX && !node.hasPX('left') && node.right > 0 || outsideY && !node.hasPX('top') && node.bottom !== 0) {
                                                    outside = true;
                                                }
                                                else if (outsideX && outsideY && (!parent.pageFlow || parent.actualParent && parent.actualParent.documentBody) && (node.top > 0 || node.left > 0)) {
                                                    outside = true;
                                                }
                                                else if (!overflowX && node.outsideX(parent.linear) && !node.pseudoElement && (node.left < 0 || node.marginLeft < 0 || !node.hasPX('left') && node.right < 0 && node.linear.left >= parent.linear.right)) {
                                                    outside = true;
                                                }
                                                else if (!overflowX && !overflowY && !node.intersectX(box) && !node.intersectY(box)) {
                                                    outside = true;
                                                }
                                                else {
                                                    break;
                                                }
                                            }
                                        }
                                        else if (parent.layoutElement) {
                                            parent = absoluteParent;
                                            break;
                                        }
                                        else if (node.withinX(box) && node.withinY(box)) {
                                            break;
                                        }
                                        parent = parent.actualParent;
                                    }
                                }
                            }
                            break;
                    }
                    if (parent === undefined) {
                        parent = !node.pageFlow ? documentRoot : actualParent;
                    }
                    if (parent !== actualParent) {
                        if (absoluteParent && absoluteParent.positionRelative && parent !== absoluteParent) {
                            const { left, right, top, bottom } = absoluteParent;
                            const bounds = node.bounds;
                            if (left !== 0) {
                                bounds.left += left;
                                bounds.right += left;
                            }
                            else if (!absoluteParent.hasPX('left') && right !== 0) {
                                bounds.left -= right;
                                bounds.right -= right;
                            }
                            if (top !== 0) {
                                bounds.top += top;
                                bounds.bottom += top;
                            }
                            else if (!absoluteParent.hasPX('top') && bottom !== 0) {
                                bounds.top -= bottom;
                                bounds.bottom -= bottom;
                            }
                            node.unset('box');
                            node.unset('linear');
                        }
                        let opacity = node.toFloat('opacity', false, 1);
                        let current = actualParent;
                        while (current && current !== parent) {
                            opacity *= current.toFloat('opacity', false, 1);
                            current = current.actualParent;
                        }
                        node.css('opacity', opacity.toString());
                        node.parent = parent;
                        node.containerIndex = Number.POSITIVE_INFINITY;
                        altered.add(parent);
                    }
                    node.documentParent = parent;
                }
            }
            for (const node of altered) {
                const layers = [];
                let maxIndex = -1;
                node.each((item) => {
                    if (item.containerIndex === Number.POSITIVE_INFINITY) {
                        for (const adjacent of node.children) {
                            let valid = adjacent.naturalElements.includes(item);
                            if (!valid) {
                                const nested = adjacent.cascade();
                                valid = item.ascend(child => nested.includes(child)).length > 0;
                            }
                            if (valid) {
                                const index = adjacent.containerIndex + (item.zIndex >= 0 || adjacent !== item.actualParent ? 1 : 0);
                                if (layers[index] === undefined) {
                                    layers[index] = [];
                                }
                                layers[index].push(item);
                                break;
                            }
                        }
                    }
                    else if (item.containerIndex > maxIndex) {
                        maxIndex = item.containerIndex;
                    }
                });
                const length = layers.length;
                if (length) {
                    const children = node.children;
                    for (let j = 0, k = 0, l = 1; j < length; j++, k++) {
                        const order = layers[j];
                        if (order) {
                            order.sort((a, b) => {
                                if (a.parent === b.parent) {
                                    if (a.zIndex === b.zIndex) {
                                        return a.id < b.id ? -1 : 1;
                                    }
                                    return a.zIndex < b.zIndex ? -1 : 1;
                                }
                                return 0;
                            });
                            for (const item of order) {
                                item.containerIndex = maxIndex + l++;
                            }
                            for (let m = 0; m < children.length; m++) {
                                if (order.includes(children[m])) {
                                    children[m] = undefined;
                                }
                            }
                            children.splice(k, 0, ...order);
                            k += order.length;
                        }
                    }
                    node.retain($util$8.flatArray(children));
                }
            }
        }
        sortInitialCache(cache) {
            cache.sort((a, b) => {
                if (a.depth !== b.depth) {
                    return a.depth < b.depth ? -1 : 1;
                }
                else {
                    const parentA = a.documentParent;
                    const parentB = b.documentParent;
                    if (parentA !== parentB) {
                        if (parentA.depth !== parentA.depth) {
                            return parentA.depth < parentA.depth ? -1 : 1;
                        }
                        else if (parentA.actualParent === parentB.actualParent) {
                            return parentA.childIndex < parentB.childIndex ? -1 : 1;
                        }
                        return parentA.id < parentB.id ? -1 : 1;
                    }
                }
                return 0;
            });
        }
        cascadeDocument(templates, depth) {
            const indent = depth > 0 ? '\t'.repeat(depth) : '';
            const showAttributes = this.userSettings.showAttributes;
            let output = '';
            for (const item of templates) {
                if (item) {
                    const node = item.node;
                    switch (item.type) {
                        case 1 /* XML */: {
                            const { controlName, attributes } = item;
                            const { id, renderTemplates } = node;
                            const renderDepth = depth + 1;
                            const beforeInside = this.getBeforeInsideTemplate(id, renderDepth);
                            const afterInside = this.getAfterInsideTemplate(id, renderDepth);
                            let template = indent + `<${controlName + (depth === 0 ? '{#0}' : '') + (showAttributes ? (attributes ? $xml$1.pushIndent(attributes, renderDepth) : node.extractAttributes(renderDepth)) : '')}`;
                            if (renderTemplates || beforeInside !== '' || afterInside !== '') {
                                template += '>\n' +
                                    beforeInside +
                                    (renderTemplates ? this.cascadeDocument(this.sortRenderPosition(node, renderTemplates), renderDepth) : '') +
                                    afterInside +
                                    indent + `</${controlName}>\n`;
                            }
                            else {
                                template += ' />\n';
                            }
                            output += this.getBeforeOutsideTemplate(id, depth) + template + this.getAfterOutsideTemplate(id, depth);
                            break;
                        }
                        case 2 /* INCLUDE */: {
                            const content = item.content;
                            if (content) {
                                output += $xml$1.pushIndent(content, depth);
                            }
                            break;
                        }
                    }
                }
            }
            return output;
        }
        getEnclosingXmlTag(controlName, attributes, content) {
            return '<' + controlName + (attributes || '') + (content ? '>\n' + content + '</' + controlName + '>\n' : ' />\n');
        }
        get generateSessionId() {
            return new Date().getTime().toString();
        }
    }

    const { css: $css$5, util: $util$9, } = squared.lib;
    class ExtensionUI extends Extension {
        constructor(name, framework, options, tagNames = []) {
            super(name, framework, options);
            this.eventOnly = false;
            this.documentBase = false;
            this.cascadeAll = false;
            this.removeIs = false;
            this.tagNames = tagNames;
        }
        static findNestedElement(element, name) {
            if (element && $css$5.hasComputedStyle(element)) {
                const children = element.children;
                const length = children.length;
                for (let i = 0; i < length; i++) {
                    const item = children[i];
                    if ($util$9.includes(item.dataset.use, name)) {
                        return item;
                    }
                }
            }
            return null;
        }
        condition(node, parent) {
            if (node.styleElement) {
                return node.dataset.use ? this.included(node.element) : this.tagNames.length > 0;
            }
            return false;
        }
        is(node) {
            return node.styleElement ? this.tagNames.length === 0 || this.tagNames.includes(node.element.tagName) : false;
        }
        included(element) {
            return $util$9.includes(element.dataset.use, this.name);
        }
        init(element) {
            return false;
        }
        processNode(node, parent) {
            return undefined;
        }
        processChild(node, parent) {
            return undefined;
        }
        addDescendant(node) {
            const map = this.application.session.extensionMap;
            const id = node.id;
            const extensions = map.get(id) || [];
            if (!extensions.includes(this)) {
                extensions.push(this);
            }
            map.set(id, extensions);
        }
        postBaseLayout(node) { }
        postConstraints(node) { }
        postOptimize(node) { }
        afterBaseLayout() { }
        afterConstraints() { }
        afterResources() { }
        beforeBaseLayout() { }
        beforeCascade() { }
        afterFinalize() { }
        set application(value) {
            this._application = value;
            this.controller = value.controllerHandler;
            this.resource = value.resourceHandler;
        }
        get application() {
            return this._application;
        }
    }

    class FileUI extends File {
        get directory() {
            return this.resource.controllerSettings.directory;
        }
    }

    class NodeGroupUI extends NodeUI {
        init() {
            if (this.length) {
                for (const item of this.children) {
                    item.parent = this;
                }
                this.setBounds();
                this.saveAsInitial();
                const actualParent = this.actualParent;
                if (actualParent) {
                    this.dir = actualParent.dir;
                }
            }
        }
        setBounds() {
            if (this.length) {
                const bounds = NodeUI.outerRegion(this);
                bounds.width = bounds.right - bounds.left;
                bounds.height = bounds.bottom - bounds.top;
                this._bounds = bounds;
            }
        }
        previousSiblings(options) {
            const node = this._initial.children[0];
            return node ? node.previousSiblings(options) : [];
        }
        nextSiblings(options) {
            const children = this._initial.children;
            const node = children[children.length - 1];
            return node ? node.nextSiblings(options) : [];
        }
        get block() {
            if (this._cached.block === undefined) {
                this._cached.block = this.some(node => node.block);
            }
            return this._cached.block;
        }
        get blockStatic() {
            if (this._cached.blockStatic === undefined) {
                const documentParent = this.documentParent;
                const value = (this.naturalChildren.length && this.naturalChildren[0].blockStatic ||
                    this.actualWidth === documentParent.actualWidth && !this.some(node => node.plainText || node.naturalElement && node.rightAligned) ||
                    this.layoutVertical && this.some(node => node.blockStatic || node.rightAligned) ||
                    documentParent.blockStatic && (documentParent.layoutVertical || this.hasAlign(256 /* COLUMN */)));
                if (value || this.containerType !== 0) {
                    this._cached.blockStatic = value;
                }
            }
            return this._cached.blockStatic || this.hasAlign(64 /* BLOCK */);
        }
        get blockDimension() {
            if (this._cached.blockDimension === undefined) {
                this._cached.blockDimension = this.some(node => node.blockDimension);
            }
            return this._cached.blockDimension;
        }
        get inline() {
            if (this._cached.inline === undefined) {
                this._cached.inline = this.every(node => node.inline);
            }
            return this._cached.inline;
        }
        get inlineStatic() {
            if (this._cached.inlineStatic === undefined) {
                this._cached.inlineStatic = this.every(node => node.inlineStatic);
            }
            return this._cached.inlineStatic;
        }
        get inlineVertical() {
            if (this._cached.inlineVertical === undefined) {
                this._cached.inlineVertical = this.every(node => node.inlineVertical);
            }
            return this._cached.inlineVertical;
        }
        get inlineFlow() {
            if (this._cached.inlineStatic === undefined) {
                this._cached.inlineStatic = this.inlineStatic || this.hasAlign(128 /* SEGMENTED */);
            }
            return this._cached.inlineStatic;
        }
        get pageFlow() {
            if (this._cached.pageFlow === undefined) {
                this._cached.pageFlow = !this.cssAny('position', 'absolute', 'fixed');
            }
            return this._cached.pageFlow;
        }
        set baseline(value) {
            this._cached.baseline = value;
        }
        get baseline() {
            if (this._cached.baseline === undefined) {
                const value = this.cssInitial('verticalAlign', true);
                this._cached.baseline = value !== '' ? value === 'baseline'
                    : this.layoutHorizontal && this.every(node => node.baseline);
            }
            return this._cached.baseline;
        }
        get float() {
            if (this._cached.float === undefined) {
                this._cached.float = !this.floating ? 'none'
                    : this.hasAlign(2048 /* RIGHT */) ? 'right' : 'left';
            }
            return this._cached.float;
        }
        get floating() {
            if (this._cached.floating === undefined) {
                this._cached.floating = this.every(node => node.floating);
            }
            return this._cached.floating;
        }
        get display() {
            return (super.display ||
                this.some(node => node.blockStatic) ? 'block'
                : this.blockDimension ? 'inline-block' : 'inline');
        }
        get firstChild() {
            return this.children[0] || null;
        }
        get lastChild() {
            const children = this.children;
            return children[children.length - 1] || null;
        }
        get tagName() {
            return '';
        }
        get plainText() {
            return false;
        }
        get styleText() {
            return false;
        }
        get multiline() {
            return false;
        }
        get nodeGroup() {
            return true;
        }
        get naturalChild() {
            return false;
        }
        get naturalElement() {
            return false;
        }
        get pseudoElement() {
            return false;
        }
        get previousSibling() {
            return null;
        }
        get nextSibling() {
            return null;
        }
        get previousElementSibling() {
            return null;
        }
        get nextElementSibling() {
            return null;
        }
    }

    const { client: $client$1, color: $color, css: $css$6, math: $math$1, regex: $regex$4, session: $session$5, util: $util$a } = squared.lib;
    const STRING_SPACE = '&#160;';
    const STRING_COLORSTOP = `(rgba?\\(\\d+, \\d+, \\d+(?:, [\\d.]+)?\\)|#[A-Za-z\\d]{3,8}|[a-z]+)\\s*(${$regex$4.STRING.LENGTH_PERCENTAGE}|${$regex$4.STRING.CSS_ANGLE}|(?:${$regex$4.STRING.CSS_CALC}(?=,)|${$regex$4.STRING.CSS_CALC}))?,?\\s*`;
    const REGEXP_BACKGROUNDIMAGE = new RegExp(`(?:initial|url\\([^)]+\\)|(repeating)?-?(linear|radial|conic)-gradient\\(((?:to [a-z ]+|(?:from )?-?[\\d.]+(?:deg|rad|turn|grad)|(?:circle|ellipse)?\\s*(?:closest-side|closest-corner|farthest-side|farthest-corner)?)?(?:\\s*(?:(?:-?[\\d.]+(?:[a-z%]+)?\\s*)+)?(?:at [\\w %]+)?)?),?\\s*((?:${STRING_COLORSTOP})+)\\))`, 'g');
    let REGEXP_COLORSTOP;
    function parseColorStops(node, gradient, value) {
        if (REGEXP_COLORSTOP) {
            REGEXP_COLORSTOP.lastIndex = 0;
        }
        else {
            REGEXP_COLORSTOP = new RegExp(STRING_COLORSTOP, 'g');
        }
        const item = gradient;
        const repeating = item.repeating === true;
        let extent = 1;
        let size;
        if (repeating && gradient.type === 'radial') {
            extent = item.radiusExtent / item.radius;
            size = item.radius;
        }
        else {
            size = item.horizontal ? gradient.dimension.width : gradient.dimension.height;
        }
        const result = [];
        let match;
        let previousOffset = 0;
        while ((match = REGEXP_COLORSTOP.exec(value)) !== null) {
            const color = $color.parseColor(match[1], 1, true);
            if (color) {
                let offset = -1;
                if (gradient.type === 'conic') {
                    if (match[3] && match[4]) {
                        offset = $css$6.convertAngle(match[3], match[4]) / 360;
                    }
                }
                else if (match[2]) {
                    if ($css$6.isPercent(match[2])) {
                        offset = parseFloat(match[2]) / 100;
                    }
                    else {
                        if ($css$6.isLength(match[2])) {
                            offset = node.parseUnit(match[2], item.horizontal ? 'width' : 'height', false) / size;
                        }
                        else if ($css$6.isCalc(match[2])) {
                            offset = $css$6.calculate(match[6], size, node.fontSize) / size;
                        }
                    }
                    if (repeating && offset !== -1) {
                        offset *= extent;
                    }
                }
                if (result.length === 0) {
                    if (offset === -1) {
                        offset = 0;
                    }
                    else if (offset > 0) {
                        result.push({ color, offset: 0 });
                    }
                }
                if (offset !== -1) {
                    offset = Math.max(previousOffset, offset);
                    previousOffset = offset;
                }
                result.push({ color, offset });
            }
        }
        const length = result.length;
        const lastStop = result[length - 1];
        if (lastStop.offset === -1) {
            lastStop.offset = 1;
        }
        let percent = 0;
        for (let i = 0; i < length; i++) {
            const stop = result[i];
            if (stop.offset === -1) {
                if (i === 0) {
                    stop.offset = 0;
                }
                else {
                    for (let j = i + 1, k = 2; j < length - 1; j++, k++) {
                        if (result[j].offset !== -1) {
                            stop.offset = (percent + result[j].offset) / k;
                            break;
                        }
                    }
                    if (stop.offset === -1) {
                        stop.offset = percent + lastStop.offset / (length - 1);
                    }
                }
            }
            percent = stop.offset;
        }
        if (repeating) {
            if (percent < 100) {
                complete: {
                    const original = result.slice(0);
                    let basePercent = percent;
                    while (percent < 100) {
                        for (let i = 0; i < length; i++) {
                            percent = Math.min(basePercent + original[i].offset, 1);
                            result.push(Object.assign(Object.assign({}, original[i]), { offset: percent }));
                            if (percent === 1) {
                                break complete;
                            }
                        }
                        basePercent = percent;
                    }
                }
            }
        }
        else if (percent < 1) {
            result.push(Object.assign(Object.assign({}, result[length - 1]), { offset: 1 }));
        }
        return result;
    }
    function parseAngle(value, fallback = 0) {
        if (value) {
            let degree = $css$6.parseAngle(value.trim());
            if (degree < 0) {
                degree += 360;
            }
            return degree;
        }
        return fallback;
    }
    function replaceWhiteSpace(parent, node, value) {
        value = value.replace(/\u00A0/g, STRING_SPACE);
        switch (node.css('whiteSpace')) {
            case 'nowrap':
                value = value.replace(/\n/g, ' ');
                break;
            case 'pre':
            case 'pre-wrap':
                if (!parent.layoutVertical) {
                    value = value.replace(/^\s*?\n/, '');
                }
                value = value
                    .replace(/\n/g, '\\n')
                    .replace(/ /g, STRING_SPACE);
                break;
            case 'pre-line':
                value = value
                    .replace(/\n/g, '\\n')
                    .replace(/[ ]+/g, ' ');
                break;
            default:
                const { previousSibling, nextSibling } = node;
                if (previousSibling && (previousSibling.lineBreak || previousSibling.blockStatic) || node.onlyChild && node.htmlElement) {
                    value = value.replace($regex$4.CHAR.LEADINGSPACE, '');
                }
                if (nextSibling && (nextSibling.lineBreak || nextSibling.blockStatic) || node.onlyChild && node.htmlElement) {
                    value = value.replace($regex$4.CHAR.TRAILINGSPACE, '');
                }
                return [value, false];
        }
        return [value, true];
    }
    function getBackgroundSize(node, index, value) {
        if (value) {
            const sizes = value.split($regex$4.XML.SEPARATOR);
            return ResourceUI.getBackgroundSize(node, sizes[index % sizes.length]);
        }
        return undefined;
    }
    function getGradientPosition(value) {
        if (value) {
            return value.indexOf('at ') !== -1 ? /(.+?)?\s*at (.+?)\s*$/.exec(value) : [value, value];
        }
        return null;
    }
    class ResourceUI extends Resource {
        static generateId(section, name, start = 1) {
            const prefix = name;
            let i = start;
            if (start === 1) {
                name += '_' + i;
            }
            const previous = this.ASSETS.ids.get(section) || [];
            do {
                if (!previous.includes(name)) {
                    previous.push(name);
                    break;
                }
                else {
                    name = prefix + '_' + ++i;
                }
            } while (true);
            this.ASSETS.ids.set(section, previous);
            return name;
        }
        static insertStoredAsset(asset, name, value) {
            const stored = ResourceUI.STORED[asset];
            if (stored && $util$a.hasValue(value)) {
                let result = this.getStoredName(asset, value);
                if (result === '') {
                    if ($util$a.isNumber(name)) {
                        name = '__' + name;
                    }
                    let i = 0;
                    do {
                        result = name;
                        if (i > 0) {
                            result += '_' + i;
                        }
                        if (!stored.has(result)) {
                            stored.set(result, value);
                        }
                        i++;
                    } while (stored.has(result) && stored.get(result) !== value);
                }
                return result;
            }
            return '';
        }
        static getOptionArray(element, showDisabled = false) {
            const stringArray = [];
            let numberArray = true;
            const children = element.children;
            const length = children.length;
            for (let i = 0; i < length; i++) {
                const item = children[i];
                if (!showDisabled && item.disabled) {
                    continue;
                }
                const value = item.text.trim() || item.value.trim();
                if (value !== '') {
                    if (numberArray && !$util$a.isNumber(value)) {
                        numberArray = false;
                    }
                    stringArray.push(value);
                }
            }
            return numberArray ? [undefined, stringArray] : [stringArray];
        }
        static isBackgroundVisible(object) {
            return object !== undefined && (!!object.backgroundImage || !!object.borderTop || !!object.borderRight || !!object.borderBottom || !!object.borderLeft);
        }
        static parseBackgroundImage(node) {
            const backgroundImage = node.backgroundImage;
            if (backgroundImage !== '') {
                REGEXP_BACKGROUNDIMAGE.lastIndex = 0;
                const images = [];
                let match;
                let i = 0;
                while ((match = REGEXP_BACKGROUNDIMAGE.exec(backgroundImage)) !== null) {
                    if (match[0] === 'initial' || match[0].startsWith('url')) {
                        images.push(match[0]);
                    }
                    else {
                        const repeating = match[1] === 'repeating';
                        const type = match[2];
                        const direction = match[3];
                        const imageDimension = getBackgroundSize(node, i, node.css('backgroundSize'));
                        const dimension = imageDimension || node.actualDimension;
                        let gradient;
                        switch (type) {
                            case 'conic': {
                                const position = getGradientPosition(direction);
                                const conic = {
                                    type,
                                    dimension,
                                    angle: parseAngle(direction)
                                };
                                conic.center = $css$6.getBackgroundPosition(position && position[2] || 'center', dimension, node.fontSize, imageDimension);
                                conic.colorStops = parseColorStops(node, conic, match[4]);
                                gradient = conic;
                                break;
                            }
                            case 'radial': {
                                const { width, height } = dimension;
                                const position = getGradientPosition(direction);
                                const radial = {
                                    type,
                                    repeating,
                                    horizontal: node.actualWidth <= node.actualHeight,
                                    dimension
                                };
                                const center = $css$6.getBackgroundPosition(position && position[2] || 'center', dimension, node.fontSize, imageDimension);
                                const { left, top } = center;
                                radial.center = center;
                                radial.closestCorner = Number.POSITIVE_INFINITY;
                                radial.farthestCorner = Number.NEGATIVE_INFINITY;
                                let shape = 'ellipse';
                                if (position) {
                                    const radius = position[1] && position[1].trim();
                                    if (radius) {
                                        if (radius.startsWith('circle')) {
                                            shape = 'circle';
                                        }
                                        else {
                                            const radiusXY = radius.split(' ');
                                            let minRadius = Number.POSITIVE_INFINITY;
                                            const length = radiusXY.length;
                                            for (let j = 0; j < length; j++) {
                                                const axisRadius = node.parseUnit(radiusXY[j], j === 0 ? 'width' : 'height', false);
                                                if (axisRadius < minRadius) {
                                                    minRadius = axisRadius;
                                                }
                                            }
                                            radial.radius = minRadius;
                                            radial.radiusExtent = minRadius;
                                            if (length === 1 || radiusXY[0] === radiusXY[1]) {
                                                shape = 'circle';
                                            }
                                        }
                                    }
                                }
                                radial.shape = shape;
                                for (const corner of [[0, 0], [width, 0], [width, height], [0, height]]) {
                                    const length = Math.round(Math.sqrt(Math.pow(Math.abs(corner[0] - left), 2) + Math.pow(Math.abs(corner[1] - top), 2)));
                                    if (length < radial.closestCorner) {
                                        radial.closestCorner = length;
                                    }
                                    if (length > radial.farthestCorner) {
                                        radial.farthestCorner = length;
                                    }
                                }
                                radial.closestSide = top;
                                radial.farthestSide = top;
                                for (const side of [width - left, height - top, left]) {
                                    if (side < radial.closestSide) {
                                        radial.closestSide = side;
                                    }
                                    if (side > radial.farthestSide) {
                                        radial.farthestSide = side;
                                    }
                                }
                                if (!radial.radius && !radial.radiusExtent) {
                                    radial.radius = radial.farthestCorner;
                                    const extent = position && position[1] ? position[1].split(' ').pop() : '';
                                    switch (extent) {
                                        case 'closest-corner':
                                        case 'closest-side':
                                        case 'farthest-side':
                                            const length = radial[$util$a.convertCamelCase(extent)];
                                            if (repeating) {
                                                radial.radiusExtent = length;
                                            }
                                            else {
                                                radial.radius = length;
                                            }
                                            break;
                                        default:
                                            radial.radiusExtent = radial.farthestCorner;
                                            break;
                                    }
                                }
                                radial.colorStops = parseColorStops(node, radial, match[4]);
                                gradient = radial;
                                break;
                            }
                            case 'linear': {
                                const { width, height } = dimension;
                                let angle = 180;
                                switch (direction) {
                                    case 'to top':
                                        angle = 360;
                                        break;
                                    case 'to right top':
                                        angle = 45;
                                        break;
                                    case 'to right':
                                        angle = 90;
                                        break;
                                    case 'to right bottom':
                                        angle = 135;
                                        break;
                                    case 'to bottom':
                                        break;
                                    case 'to left bottom':
                                        angle = 225;
                                        break;
                                    case 'to left':
                                        angle = 270;
                                        break;
                                    case 'to left top':
                                        angle = 315;
                                        break;
                                    default:
                                        if (direction) {
                                            angle = parseAngle(direction, 180) || 360;
                                        }
                                        break;
                                }
                                const linear = {
                                    type,
                                    repeating,
                                    horizontal: angle >= 45 && angle <= 135 || angle >= 225 && angle <= 315,
                                    dimension,
                                    angle
                                };
                                linear.colorStops = parseColorStops(node, linear, match[4]);
                                let x = $math$1.truncateFraction($math$1.offsetAngleX(angle, width));
                                let y = $math$1.truncateFraction($math$1.offsetAngleY(angle, height));
                                if (x !== width && y !== height && !$math$1.isEqual(Math.abs(x), Math.abs(y))) {
                                    let opposite;
                                    if (angle <= 90) {
                                        opposite = $math$1.relativeAngle({ x: 0, y: height }, { x: width, y: 0 });
                                    }
                                    else if (angle <= 180) {
                                        opposite = $math$1.relativeAngle({ x: 0, y: 0 }, { x: width, y: height });
                                    }
                                    else if (angle <= 270) {
                                        opposite = $math$1.relativeAngle({ x: 0, y: 0 }, { x: -width, y: height });
                                    }
                                    else {
                                        opposite = $math$1.relativeAngle({ x: 0, y: height }, { x: -width, y: 0 });
                                    }
                                    const a = Math.abs(opposite - angle);
                                    x = $math$1.truncateFraction($math$1.offsetAngleX(angle, $math$1.triangulate(a, 90 - a, Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2)))[1]));
                                    y = $math$1.truncateFraction($math$1.offsetAngleY(angle, $math$1.triangulate(90, 90 - angle, x)[0]));
                                }
                                linear.angleExtent = { x, y };
                                gradient = linear;
                                break;
                            }
                        }
                        images.push(gradient || 'initial');
                    }
                    i++;
                }
                if (images.length) {
                    return images;
                }
            }
            return undefined;
        }
        static getBackgroundSize(node, value) {
            let width = 0;
            let height = 0;
            switch (value) {
                case '':
                case 'cover':
                case 'contain':
                case '100% 100%':
                case 'auto':
                case 'auto auto':
                case 'initial':
                    return undefined;
                default:
                    const dimensions = value.split(' ');
                    const length = dimensions.length;
                    if (length === 1) {
                        dimensions[1] = dimensions[0];
                    }
                    for (let i = 0; i < length; i++) {
                        let size = dimensions[i];
                        if (size === 'auto') {
                            size = '100%';
                        }
                        if (i === 0) {
                            width = node.parseUnit(size, 'width', false);
                        }
                        else {
                            height = node.parseUnit(size, 'height', false);
                        }
                    }
                    break;
            }
            return width > 0 && height > 0 ? { width: Math.round(width), height: Math.round(height) } : undefined;
        }
        static isInheritedStyle(node, attr) {
            if (node.styleElement) {
                const parent = node.actualParent;
                if (parent && node.cssInitial(attr) === '') {
                    return node.style[attr] === parent.style[attr];
                }
            }
            return false;
        }
        static hasLineBreak(node, lineBreak = false, trim = false) {
            if (node.naturalElements.length) {
                return node.naturalElements.some(item => item.lineBreak);
            }
            else if (!lineBreak && node.naturalChild) {
                const element = node.element;
                let value = element.textContent;
                if (trim) {
                    value = value.trim();
                }
                if (/\n/.test(value)) {
                    if (node.plainText && $css$6.isParentStyle(element, 'whiteSpace', 'pre', 'pre-wrap')) {
                        return true;
                    }
                    return node.css('whiteSpace').startsWith('pre');
                }
            }
            return false;
        }
        static getStoredName(asset, value) {
            if (ResourceUI.STORED[asset]) {
                for (const [name, data] of ResourceUI.STORED[asset].entries()) {
                    if ($util$a.isEqual(value, data)) {
                        return name;
                    }
                }
            }
            return '';
        }
        finalize(layouts) { }
        reset() {
            super.reset();
            for (const name in ResourceUI.STORED) {
                ResourceUI.STORED[name].clear();
            }
        }
        writeRawImage(filename, base64) {
            if (this.fileHandler) {
                this.fileHandler.addAsset({
                    pathname: this.controllerSettings.directory.image,
                    filename,
                    base64
                });
            }
        }
        setBoxStyle(node) {
            if (node.styleElement || node.visibleStyle.background) {
                const boxStyle = {
                    backgroundSize: node.css('backgroundSize'),
                    backgroundRepeat: node.css('backgroundRepeat'),
                    backgroundPositionX: node.css('backgroundPositionX'),
                    backgroundPositionY: node.css('backgroundPositionY')
                };
                function setBorderStyle(attr, border) {
                    const style = node.css(border[0]) || 'none';
                    let width = $css$6.formatPX(attr !== 'outline' ? node[border[1]] : $util$a.convertFloat(node.style[border[1]]));
                    let color = node.css(border[2]) || 'initial';
                    switch (color) {
                        case 'initial':
                            color = 'rgb(0, 0, 0)';
                            break;
                        case 'inherit':
                        case 'currentcolor':
                            color = $css$6.getInheritedStyle(node.element, border[2]);
                            break;
                    }
                    if (width !== '0px' && style !== 'none') {
                        if (width === '2px' && (style === 'inset' || style === 'outset')) {
                            width = '1px';
                        }
                        const borderColor = $color.parseColor(color, 1, true);
                        if (borderColor) {
                            boxStyle[attr] = {
                                width,
                                style,
                                color: borderColor
                            };
                        }
                    }
                }
                function setBackgroundOffset(attr) {
                    switch (node.css(attr)) {
                        case 'border-box':
                            return true;
                        case 'padding-box':
                            boxStyle[attr] = {
                                top: node.borderTopWidth,
                                right: node.borderRightWidth,
                                bottom: node.borderBottomWidth,
                                left: node.borderLeftWidth
                            };
                            break;
                        case 'content-box':
                            boxStyle[attr] = {
                                top: node.borderTopWidth + node.paddingTop,
                                right: node.borderRightWidth + node.paddingRight,
                                bottom: node.borderBottomWidth + node.paddingBottom,
                                left: node.borderLeftWidth + node.paddingLeft
                            };
                            break;
                    }
                    return false;
                }
                if (setBackgroundOffset('backgroundClip') && node.has('backgroundOrigin')) {
                    setBackgroundOffset('backgroundOrigin');
                }
                if (node.css('borderRadius') !== '0px') {
                    const [A, B] = node.css('borderTopLeftRadius').split(' ');
                    const [C, D] = node.css('borderTopRightRadius').split(' ');
                    const [E, F] = node.css('borderBottomRightRadius').split(' ');
                    const [G, H] = node.css('borderBottomLeftRadius').split(' ');
                    const borderRadius = !B && !D && !F && !H ? [A, C, E, G] : [A, B || A, C, D || C, E, F || E, G, H || G];
                    const horizontal = node.actualWidth >= node.actualHeight;
                    if (borderRadius.every(radius => radius === borderRadius[0])) {
                        if (borderRadius[0] === '0px' || borderRadius[0] === '') {
                            borderRadius.length = 0;
                        }
                        else {
                            borderRadius.length = 1;
                        }
                    }
                    const length = borderRadius.length;
                    if (length) {
                        const dimension = horizontal ? 'width' : 'height';
                        for (let i = 0; i < length; i++) {
                            borderRadius[i] = node.convertPX(borderRadius[i], dimension, false);
                        }
                        boxStyle.borderRadius = borderRadius;
                    }
                }
                if (!node.css('border').startsWith('0px none')) {
                    setBorderStyle('borderTop', $css$6.BOX_BORDER[0]);
                    setBorderStyle('borderRight', $css$6.BOX_BORDER[1]);
                    setBorderStyle('borderBottom', $css$6.BOX_BORDER[2]);
                    setBorderStyle('borderLeft', $css$6.BOX_BORDER[3]);
                }
                setBorderStyle('outline', $css$6.BOX_BORDER[4]);
                if (node.hasResource(NODE_RESOURCE.IMAGE_SOURCE)) {
                    boxStyle.backgroundImage = ResourceUI.parseBackgroundImage(node);
                }
                let backgroundColor = node.backgroundColor;
                if (backgroundColor === '' && !node.documentParent.visible) {
                    backgroundColor = node.css('backgroundColor');
                }
                if (backgroundColor !== '') {
                    const color = $color.parseColor(backgroundColor);
                    boxStyle.backgroundColor = color ? color.valueAsRGBA : '';
                }
                node.data(ResourceUI.KEY_NAME, 'boxStyle', boxStyle);
            }
        }
        setFontStyle(node) {
            if (((node.textElement || node.inlineText) && (!node.textEmpty || node.visibleStyle.background) || node.inputElement) && node.visible) {
                const color = $color.parseColor(node.css('color'));
                let fontWeight = node.css('fontWeight');
                if (!$util$a.isNumber(fontWeight)) {
                    switch (fontWeight) {
                        case 'lighter':
                            fontWeight = '200';
                            break;
                        case 'bold':
                            fontWeight = '700';
                            break;
                        case 'bolder':
                            fontWeight = '900';
                            break;
                        default:
                            fontWeight = '400';
                            break;
                    }
                }
                node.data(ResourceUI.KEY_NAME, 'fontStyle', {
                    fontFamily: node.css('fontFamily').trim(),
                    fontStyle: node.css('fontStyle'),
                    fontSize: $css$6.formatPX(node.fontSize),
                    fontWeight,
                    color: color ? color.valueAsRGBA : ''
                });
            }
        }
        setValueString(node) {
            if (node.visible && !node.svgElement) {
                const renderParent = node.renderParent;
                if (renderParent) {
                    const element = node.element;
                    if (element) {
                        let key = '';
                        let value = '';
                        let hint = '';
                        let trimming = false;
                        let inlined = false;
                        switch (element.tagName) {
                            case 'INPUT':
                                value = element.value;
                                switch (element.type) {
                                    case 'radio':
                                    case 'checkbox':
                                        const companion = node.companion;
                                        if (companion && !companion.visible) {
                                            value = companion.textContent.trim();
                                        }
                                        break;
                                    case 'submit':
                                        if (value === '' && !node.visibleStyle.backgroundImage) {
                                            value = 'Submit';
                                        }
                                        break;
                                    case 'time':
                                        if (value === '') {
                                            hint = '--:-- --';
                                        }
                                        break;
                                    case 'date':
                                    case 'datetime-local':
                                        if (value === '') {
                                            switch ((new Intl.DateTimeFormat()).resolvedOptions().locale) {
                                                case 'en-US':
                                                    hint = 'mm/dd/yyyy';
                                                    break;
                                                default:
                                                    hint = 'dd/mm/yyyy';
                                                    break;
                                            }
                                            if (element.type === 'datetime-local') {
                                                hint += ' --:-- --';
                                            }
                                        }
                                        break;
                                    case 'week':
                                        if (value === '') {
                                            hint = 'Week: --, ----';
                                        }
                                        break;
                                    case 'month':
                                        if (value === '') {
                                            hint = '--------- ----';
                                        }
                                        break;
                                    case 'url':
                                    case 'email':
                                    case 'search':
                                    case 'number':
                                    case 'tel':
                                        if (value === '') {
                                            hint = element.placeholder;
                                        }
                                        break;
                                    case 'file':
                                        value = $client$1.isUserAgent(8 /* FIREFOX */) ? 'Browse...' : 'Choose File';
                                        break;
                                }
                                break;
                            case 'TEXTAREA':
                                value = element.value;
                                break;
                            case 'IFRAME':
                                value = element.src;
                                break;
                            default:
                                const textContent = node.textContent;
                                if (node.plainText || node.pseudoElement) {
                                    key = textContent.trim();
                                    [value] = replaceWhiteSpace(renderParent, node, textContent.replace(/&/g, '&amp;'));
                                    inlined = true;
                                    trimming = !node.actualParent.preserveWhiteSpace;
                                }
                                else if (node.inlineText) {
                                    key = textContent.trim();
                                    [value, inlined] = replaceWhiteSpace(renderParent, node, this.removeExcludedFromText(element, node.sessionId));
                                    trimming = true;
                                }
                                else if (node.naturalElements.length === 0 && textContent && textContent.trim() === '' && !node.hasPX('height') && ResourceUI.isBackgroundVisible(node.data(ResourceUI.KEY_NAME, 'boxStyle'))) {
                                    value = textContent;
                                }
                                break;
                        }
                        if (value !== '') {
                            if (trimming) {
                                const previousSibling = node.siblingsLeading[0];
                                let previousSpaceEnd = false;
                                if (value.length > 1) {
                                    if (previousSibling === undefined || previousSibling.multiline || previousSibling.lineBreak || previousSibling.plainText && $regex$4.CHAR.TRAILINGSPACE.test(previousSibling.textContent)) {
                                        value = value.replace($regex$4.CHAR.LEADINGSPACE, '');
                                    }
                                    else if (previousSibling.naturalElement) {
                                        const textContent = previousSibling.textContent;
                                        if (textContent.length) {
                                            previousSpaceEnd = textContent.charCodeAt(textContent.length - 1) === 32;
                                        }
                                    }
                                }
                                if (inlined) {
                                    const trailingSpace = !node.lineBreakTrailing && $regex$4.CHAR.TRAILINGSPACE.test(value);
                                    if (previousSibling && $regex$4.CHAR.LEADINGSPACE.test(value) && !previousSibling.block && !previousSibling.lineBreak && !previousSpaceEnd) {
                                        value = STRING_SPACE + value.trim();
                                    }
                                    else {
                                        value = value.trim();
                                    }
                                    if (trailingSpace) {
                                        const nextSibling = node.siblingsTrailing.find(item => !item.excluded || item.lineBreak);
                                        if (nextSibling && !nextSibling.blockStatic) {
                                            value += STRING_SPACE;
                                        }
                                    }
                                }
                                else if (value.trim() !== '') {
                                    value = value.replace($regex$4.CHAR.LEADINGSPACE, previousSibling && (previousSibling.block ||
                                        previousSibling.lineBreak ||
                                        previousSpaceEnd && previousSibling.htmlElement && previousSibling.textContent.length > 1 ||
                                        node.multiline && ResourceUI.hasLineBreak(node)) ? '' : STRING_SPACE);
                                    value = value.replace($regex$4.CHAR.TRAILINGSPACE, node.display === 'table-cell' || node.lineBreakTrailing || node.blockStatic ? '' : STRING_SPACE);
                                }
                                else if (!node.inlineText) {
                                    return;
                                }
                            }
                            if (value !== '') {
                                node.data(ResourceUI.KEY_NAME, 'valueString', { key, value });
                            }
                        }
                        if (hint !== '') {
                            node.data(ResourceUI.KEY_NAME, 'hintString', hint);
                        }
                    }
                    else if (node.inlineText) {
                        const value = node.textContent;
                        if (value) {
                            node.data(ResourceUI.KEY_NAME, 'valueString', { key: value, value });
                        }
                    }
                }
            }
        }
        removeExcludedFromText(element, sessionId) {
            const attr = element.children.length || element.tagName === 'CODE' ? 'innerHTML' : 'textContent';
            let value = element[attr] || '';
            const children = element.childNodes;
            const length = children.length;
            for (let i = 0; i < length; i++) {
                const child = children[i];
                const item = $session$5.getElementAsNode(child, sessionId);
                if (item === undefined || !item.textElement || !item.pageFlow || item.positioned || item.pseudoElement || item.excluded || item.dataset.target) {
                    if (item) {
                        if (item.htmlElement && attr === 'innerHTML') {
                            if (item.lineBreak) {
                                value = value.replace(new RegExp(`\\s*${item.element.outerHTML}\\s*`), '\\n');
                            }
                            else {
                                value = value.replace(item.element.outerHTML, item.pageFlow && item.textContent.trim() !== '' ? STRING_SPACE : '');
                            }
                            continue;
                        }
                        else if ($util$a.isString(item[attr])) {
                            value = value.replace(item[attr], '');
                            continue;
                        }
                    }
                    else if (child instanceof HTMLElement) {
                        const position = getComputedStyle(child).getPropertyValue('position');
                        value = value.replace(child.outerHTML, position !== 'absolute' && position !== 'fixed' && child.textContent.trim() !== '' ? STRING_SPACE : '');
                    }
                    if (i === 0) {
                        value = $util$a.trimStart(value, ' ');
                    }
                    else if (i === length - 1) {
                        value = $util$a.trimEnd(value, ' ');
                    }
                }
            }
            if (attr === 'innerHTML') {
                value = value.replace($regex$4.ESCAPE.ENTITY, (match, capture) => String.fromCharCode(parseInt(capture)));
            }
            return value;
        }
    }
    ResourceUI.KEY_NAME = 'squared.resource';
    ResourceUI.STORED = {
        strings: new Map(),
        arrays: new Map(),
        fonts: new Map(),
        colors: new Map(),
        images: new Map()
    };

    class Accessibility extends ExtensionUI {
        constructor() {
            super(...arguments);
            this.options = {
                showLabel: false
            };
        }
        beforeBaseLayout() {
            for (const node of this.application.processing.cache) {
                if (node.inputElement && node.hasProcedure(NODE_PROCEDURE.ACCESSIBILITY)) {
                    switch (node.containerName) {
                        case 'INPUT_IMAGE':
                            node.extracted = [node];
                            break;
                        case 'INPUT_RADIO':
                        case 'INPUT_CHECKBOX':
                            const element = node.element;
                            [node.nextSibling, node.previousSibling].some((sibling) => {
                                if (sibling && sibling.visible && sibling.pageFlow && !sibling.visibleStyle.backgroundImage) {
                                    const labelElement = sibling.element;
                                    const labelParent = sibling.documentParent.tagName === 'LABEL' ? sibling.documentParent : undefined;
                                    if (element.id === labelElement.htmlFor && element.id) {
                                        node.companion = sibling;
                                    }
                                    else if (sibling.textElement && labelParent) {
                                        node.companion = sibling;
                                        labelParent.renderAs = node;
                                    }
                                    else if (sibling.plainText) {
                                        node.companion = sibling;
                                    }
                                    if (node.companion) {
                                        if (!this.options.showLabel) {
                                            sibling.hide();
                                        }
                                        return true;
                                    }
                                }
                                return false;
                            });
                            break;
                        case 'BUTTON':
                            if (node.length) {
                                const extracted = node.filter((item) => !item.textElement);
                                if (extracted.length) {
                                    node.extracted = extracted;
                                }
                                node.clear();
                            }
                            break;
                    }
                }
            }
        }
    }

    const { css: $css$7, regex: $regex$5, util: $util$b } = squared.lib;
    const STRING_UNIT = '[\\d.]+[a-z%]+|auto|max-content|min-content';
    const STRING_MINMAX = 'minmax\\(([^,]+), ([^)]+)\\)';
    const STRING_FIT_CONTENT = 'fit-content\\(([\\d.]+[a-z%]+)\\)';
    const STRING_NAMED = '\\[([\\w\\-\\s]+)\\]';
    const CACHE_PATTERN$2 = {};
    function repeatUnit(data, dimension) {
        const repeat = data.repeat;
        const unitPX = [];
        const unitRepeat = [];
        const lengthA = dimension.length;
        for (let i = 0; i < lengthA; i++) {
            if (repeat[i]) {
                unitRepeat.push(dimension[i]);
            }
            else {
                unitPX.push(dimension[i]);
            }
        }
        const lengthB = data.length;
        const lengthC = lengthB - unitPX.length;
        const result = new Array(lengthB);
        for (let i = 0; i < lengthB; i++) {
            if (repeat[i]) {
                for (let j = 0, k = 0; j < lengthC; i++, j++, k++) {
                    if (k === unitRepeat.length) {
                        k = 0;
                    }
                    result[i] = unitRepeat[k];
                }
                break;
            }
            else {
                result[i] = unitPX.shift();
            }
        }
        return result;
    }
    function getColumnTotal(rows) {
        let value = 0;
        for (const row of rows) {
            if (row) {
                value++;
            }
        }
        return value;
    }
    const convertLength = (node, value) => $css$7.isLength(value) ? node.convertPX(value) : value;
    class CssGrid extends ExtensionUI {
        static createDataAttribute(alignItems, alignContent, justifyItems, justifyContent) {
            return {
                children: [],
                rowData: [],
                rowHeight: undefined,
                rowWeight: undefined,
                rowSpanMultiple: [],
                templateAreas: {},
                row: CssGrid.createDataRowAttribute(),
                column: CssGrid.createDataRowAttribute(),
                emptyRows: [],
                alignItems,
                alignContent,
                justifyItems,
                justifyContent
            };
        }
        static createDataRowAttribute() {
            return {
                length: 0,
                gap: 0,
                unit: [],
                unitMin: [],
                unitTotal: [],
                repeat: [],
                auto: [],
                autoFill: false,
                autoFit: false,
                name: {},
                normal: true
            };
        }
        is(node) {
            return node.gridElement;
        }
        condition(node) {
            return node.length > 0;
        }
        processNode(node) {
            if (CACHE_PATTERN$2.UNIT === undefined) {
                CACHE_PATTERN$2.UNIT = new RegExp(`^(${STRING_UNIT})$`);
                CACHE_PATTERN$2.NAMED = new RegExp(`\\s*(repeat\\((auto-fit|auto-fill|\\d+), (.+)\\)|${STRING_NAMED}|${STRING_MINMAX}|${STRING_FIT_CONTENT}|${STRING_UNIT})\\s*`, 'g');
                CACHE_PATTERN$2.REPEAT = new RegExp(`\\s*(${STRING_NAMED}|${STRING_MINMAX}|${STRING_FIT_CONTENT}|${STRING_UNIT})\\s*`, 'g');
                CACHE_PATTERN$2.STARTEND = /^([\w\-]+)-(start|end)$/;
            }
            const mainData = CssGrid.createDataAttribute(node.css('alignItems'), node.css('alignContent'), node.css('justifyItems'), node.css('justifyContent'));
            const gridAutoFlow = node.css('gridAutoFlow');
            const horizontal = gridAutoFlow.indexOf('column') === -1;
            const dense = gridAutoFlow.indexOf('dense') !== -1;
            const rowData = [];
            const cellsPerRow = [];
            const layout = [];
            let rowInvalid = {};
            mainData.row.gap = node.parseUnit(node.css('rowGap'), 'height', false);
            mainData.column.gap = node.parseUnit(node.css('columnGap'), 'width', false);
            function setDataRows(item, placement) {
                if (placement.every(value => value > 0)) {
                    for (let i = placement[horizontal ? 0 : 1] - 1; i < placement[horizontal ? 2 : 3] - 1; i++) {
                        let data = rowData[i];
                        if (data === undefined) {
                            data = [];
                            rowData[i] = data;
                        }
                        for (let j = placement[horizontal ? 1 : 0] - 1; j < placement[horizontal ? 3 : 2] - 1; j++) {
                            if (cellsPerRow[i] === undefined) {
                                cellsPerRow[i] = 0;
                            }
                            if (data[j] === undefined) {
                                data[j] = [];
                                cellsPerRow[i]++;
                            }
                            data[j].push(item);
                        }
                    }
                    return true;
                }
                return false;
            }
            [node.cssInitial('gridTemplateRows', true), node.cssInitial('gridTemplateColumns', true), node.css('gridAutoRows'), node.css('gridAutoColumns')].forEach((value, index) => {
                if (value && value !== 'none' && value !== 'auto') {
                    CACHE_PATTERN$2.NAMED.lastIndex = 0;
                    const data = index === 0 ? mainData.row : mainData.column;
                    const { name, repeat, unit, unitMin } = data;
                    let match;
                    let i = 1;
                    while ((match = CACHE_PATTERN$2.NAMED.exec(value)) !== null) {
                        if (index < 2) {
                            if (match[1].startsWith('repeat')) {
                                let iterations = 1;
                                switch (match[2]) {
                                    case 'auto-fit':
                                        data.autoFit = true;
                                        break;
                                    case 'auto-fill':
                                        data.autoFill = true;
                                        break;
                                    default:
                                        iterations = $util$b.convertInt(match[2]);
                                        break;
                                }
                                if (iterations > 0) {
                                    if (CACHE_PATTERN$2.CELL_UNIT === undefined) {
                                        CACHE_PATTERN$2.CELL_UNIT = new RegExp('[\\d.]+[a-z%]+|auto|max-content|min-content');
                                        CACHE_PATTERN$2.CELL_MINMAX = new RegExp('minmax\\(([^,]+), ([^)]+)\\)');
                                        CACHE_PATTERN$2.CELL_FIT_CONTENT = new RegExp('fit-content\\(([\\d.]+[a-z%]+)\\)');
                                        CACHE_PATTERN$2.CELL_NAMED = new RegExp('\\[([\\w\\-\\s]+)\\]');
                                    }
                                    else {
                                        CACHE_PATTERN$2.REPEAT.lastIndex = 0;
                                    }
                                    const repeating = [];
                                    let subMatch;
                                    while ((subMatch = CACHE_PATTERN$2.REPEAT.exec(match[3])) !== null) {
                                        const subPattern = subMatch[1];
                                        let namedMatch;
                                        if ((namedMatch = CACHE_PATTERN$2.CELL_NAMED.exec(subPattern)) !== null) {
                                            const subName = namedMatch[1];
                                            if (name[subName] === undefined) {
                                                name[subName] = [];
                                            }
                                            repeating.push({ name: subName });
                                        }
                                        else if ((namedMatch = CACHE_PATTERN$2.CELL_MINMAX.exec(subPattern)) !== null) {
                                            repeating.push({ unit: convertLength(node, namedMatch[2]), unitMin: convertLength(node, namedMatch[1]) });
                                        }
                                        else if ((namedMatch = CACHE_PATTERN$2.CELL_FIT_CONTENT.exec(subPattern)) !== null) {
                                            repeating.push({ unit: convertLength(node, namedMatch[1]), unitMin: '0px' });
                                        }
                                        else if ((namedMatch = CACHE_PATTERN$2.CELL_UNIT.exec(subPattern)) !== null) {
                                            repeating.push({ unit: convertLength(node, namedMatch[0]) });
                                        }
                                    }
                                    if (repeating.length) {
                                        for (let j = 0; j < iterations; j++) {
                                            for (const item of repeating) {
                                                if (item.name) {
                                                    name[item.name].push(i);
                                                }
                                                else if (item.unit) {
                                                    unit.push(item.unit);
                                                    unitMin.push(item.unitMin || '');
                                                    repeat.push(true);
                                                    i++;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            else if (match[1].charAt(0) === '[') {
                                if (name[match[4]] === undefined) {
                                    name[match[4]] = [];
                                }
                                name[match[4]].push(i);
                            }
                            else if (match[1].startsWith('minmax')) {
                                unit.push(convertLength(node, match[6]));
                                unitMin.push(convertLength(node, match[5]));
                                repeat.push(false);
                                i++;
                            }
                            else if (match[1].startsWith('fit-content')) {
                                unit.push(convertLength(node, match[7]));
                                unitMin.push('0px');
                                repeat.push(false);
                                i++;
                            }
                            else if (CACHE_PATTERN$2.UNIT.test(match[1])) {
                                unit.push(match[1] === 'auto' ? 'auto' : convertLength(node, match[1]));
                                unitMin.push('');
                                repeat.push(false);
                                i++;
                            }
                        }
                        else {
                            (index === 2 ? mainData.row : mainData.column).auto.push(node.convertPX(match[1]));
                        }
                    }
                }
            });
            if (horizontal) {
                node.sort((a, b) => {
                    const { left, top } = a.linear;
                    const { left: leftB, top: topB } = b.linear;
                    if (!$util$b.withinRange(top, topB)) {
                        return top < topB ? -1 : 1;
                    }
                    else if (!$util$b.withinRange(left, leftB)) {
                        return left < leftB ? -1 : 1;
                    }
                    return 0;
                });
            }
            else {
                node.sort((a, b) => {
                    const { left, top } = a.linear;
                    const { left: leftB, top: topB } = b.linear;
                    if (!$util$b.withinRange(left, leftB)) {
                        return left < leftB ? -1 : 1;
                    }
                    else if (!$util$b.withinRange(top, topB)) {
                        return top < topB ? -1 : 1;
                    }
                    return 0;
                });
            }
            if (!node.has('gridTemplateAreas') && node.every(item => item.css('gridRowStart') === 'auto' && item.css('gridColumnStart') === 'auto')) {
                let directionA;
                let directionB;
                let indexA;
                let indexB;
                let indexC;
                if (horizontal) {
                    directionA = 'top';
                    directionB = 'bottom';
                    indexA = 2;
                    indexB = 1;
                    indexC = 3;
                }
                else {
                    directionA = 'left';
                    directionB = 'right';
                    indexA = 3;
                    indexB = 0;
                    indexC = 2;
                }
                let row = 0;
                let column = 0;
                let columnMax = 0;
                let previous;
                node.each((item, index) => {
                    if (previous === undefined || item.linear[directionA] >= previous.linear[directionB] || column > 0 && column === columnMax) {
                        columnMax = Math.max(column, columnMax);
                        row++;
                        column = 1;
                    }
                    const rowEnd = item.css('gridRowEnd');
                    const columnEnd = item.css('gridColumnEnd');
                    let rowSpan = 1;
                    let columnSpan = 1;
                    if (rowEnd.startsWith('span')) {
                        rowSpan = parseInt(rowEnd.split(' ')[1]);
                    }
                    else if ($util$b.isNumber(rowEnd)) {
                        rowSpan = parseInt(rowEnd) - row;
                    }
                    if (columnEnd.startsWith('span')) {
                        columnSpan = parseInt(columnEnd.split(' ')[1]);
                    }
                    else if ($util$b.isNumber(columnEnd)) {
                        columnSpan = parseInt(columnEnd) - column;
                    }
                    if (column === 1 && columnMax > 0) {
                        let valid = false;
                        do {
                            const available = new Array(columnMax - 1).fill(1);
                            for (const cell of layout) {
                                const placement = cell.placement;
                                if (placement[indexA] > row) {
                                    for (let i = placement[indexB]; i < placement[indexC]; i++) {
                                        available[i - 1] = 0;
                                    }
                                }
                            }
                            for (let i = 0, j = 0, k = 0; i < available.length; i++) {
                                if (available[i]) {
                                    if (j === 0) {
                                        k = i;
                                    }
                                    if (++j === columnSpan) {
                                        column = k + 1;
                                        valid = true;
                                        break;
                                    }
                                }
                                else {
                                    j = 0;
                                }
                            }
                            if (!valid) {
                                mainData.emptyRows[row - 1] = available;
                                row++;
                            }
                        } while (!valid);
                    }
                    layout[index] = {
                        placement: horizontal ? [row, column, row + rowSpan, column + columnSpan] : [column, row, column + columnSpan, row + rowSpan],
                        rowSpan,
                        columnSpan
                    };
                    column += columnSpan;
                    previous = item;
                });
            }
            else {
                node.css('gridTemplateAreas').split(/"[\s\n]+"/).forEach((template, i) => {
                    if (template !== 'none') {
                        const templateAreas = mainData.templateAreas;
                        $util$b.trimString(template.trim(), '"').split($regex$5.CHAR.SPACE).forEach((area, j) => {
                            if (area.charAt(0) !== '.') {
                                const templateArea = templateAreas[area];
                                if (templateArea) {
                                    templateArea.rowSpan = (i - templateArea.rowStart) + 1;
                                    templateArea.columnSpan = (j - templateArea.columnStart) + 1;
                                }
                                else {
                                    templateAreas[area] = {
                                        rowStart: i,
                                        rowSpan: 1,
                                        columnStart: j,
                                        columnSpan: 1
                                    };
                                }
                            }
                        });
                    }
                });
                node.each((item, index) => {
                    const templateAreas = mainData.templateAreas;
                    const positions = [
                        item.css('gridRowStart'),
                        item.css('gridColumnStart'),
                        item.css('gridRowEnd'),
                        item.css('gridColumnEnd')
                    ];
                    const placement = [];
                    let rowSpan = 1;
                    let columnSpan = 1;
                    if (Object.keys(templateAreas).length) {
                        for (let i = 0; i < 4; i++) {
                            const name = positions[i];
                            let template = templateAreas[name];
                            if (template) {
                                switch (i) {
                                    case 0:
                                        placement[0] = template.rowStart + 1;
                                        break;
                                    case 1:
                                        placement[1] = template.columnStart + 1;
                                        break;
                                    case 2:
                                        placement[2] = template.rowStart + template.rowSpan + 1;
                                        break;
                                    case 3:
                                        placement[3] = template.columnStart + template.columnSpan + 1;
                                        break;
                                }
                            }
                            else {
                                const match = CACHE_PATTERN$2.STARTEND.exec(name);
                                if (match) {
                                    template = templateAreas[match[1]];
                                    if (template) {
                                        if (match[2] === 'start') {
                                            switch (i) {
                                                case 0:
                                                case 2:
                                                    placement[i] = template.rowStart + 1;
                                                    break;
                                                case 1:
                                                case 3:
                                                    placement[i] = template.columnStart + 1;
                                                    break;
                                            }
                                        }
                                        else {
                                            switch (i) {
                                                case 0:
                                                case 2:
                                                    placement[i] = template.rowStart + template.rowSpan + 1;
                                                    break;
                                                case 1:
                                                case 3:
                                                    placement[i] = template.columnStart + template.columnSpan + 1;
                                                    break;
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (!placement[0] || !placement[1] || !placement[2] || !placement[3]) {
                        function setPlacement(value, position) {
                            if ($util$b.isNumber(value)) {
                                placement[position] = parseInt(value);
                                return true;
                            }
                            else if (value.startsWith('span')) {
                                const span = parseInt(value.split(' ')[1]);
                                if (!placement[position - 2]) {
                                    if (position % 2 === 0) {
                                        rowSpan = span;
                                    }
                                    else {
                                        columnSpan = span;
                                    }
                                }
                                else {
                                    placement[position] = placement[position - 2] + span;
                                }
                                return true;
                            }
                            return false;
                        }
                        let rowStart;
                        let colStart;
                        for (let i = 0; i < 4; i++) {
                            const value = positions[i];
                            if (value !== 'auto' && !placement[i] && !setPlacement(value, i)) {
                                const data = mainData[i % 2 === 0 ? 'row' : 'column'];
                                const alias = value.split(' ');
                                if (alias.length === 1) {
                                    alias[1] = alias[0];
                                    alias[0] = '1';
                                }
                                else if ($util$b.isNumber(alias[0])) {
                                    if (i % 2 === 0) {
                                        if (rowStart) {
                                            rowSpan = parseInt(alias[0]) - parseInt(rowStart[0]);
                                        }
                                        else {
                                            rowStart = alias;
                                        }
                                    }
                                    else if (colStart) {
                                        columnSpan = parseInt(alias[0]) - parseInt(colStart[0]);
                                    }
                                    else {
                                        colStart = alias;
                                    }
                                }
                                const named = data.name[alias[1]];
                                if (named) {
                                    const nameIndex = parseInt(alias[0]);
                                    if (nameIndex <= named.length) {
                                        placement[i] = named[nameIndex - 1] + (alias[1] === positions[i - 2] ? 1 : 0);
                                    }
                                }
                            }
                            if (!placement[i]) {
                                setPlacement(value, i);
                            }
                        }
                    }
                    layout[index] = {
                        outerCoord: horizontal ? item.linear.top : item.linear.left,
                        placement,
                        rowSpan,
                        columnSpan
                    };
                });
            }
            {
                const data = horizontal ? mainData.column : mainData.row;
                const outerCoord = horizontal ? node.box.top : node.box.left;
                let unit = data.unit;
                let length = Math.max(1, unit.length);
                let outerCount = 0;
                for (const item of layout) {
                    if (item) {
                        const placement = item.placement;
                        if (placement.length) {
                            length = Math.max(length, horizontal ? item.columnSpan : item.rowSpan, placement[horizontal ? 1 : 0] || 0, (placement[horizontal ? 3 : 2] || 0) - 1);
                        }
                        if ($util$b.withinRange(item.outerCoord, outerCoord)) {
                            outerCount += horizontal ? item.columnSpan : item.rowSpan;
                        }
                    }
                }
                data.length = Math.max(length, outerCount);
                if (data.autoFill || data.autoFit) {
                    if (unit.length === 0) {
                        unit.push('auto');
                        data.unitMin.push('');
                        data.repeat.push(true);
                    }
                    unit = repeatUnit(data, unit);
                    data.unit = unit;
                    data.unitMin = repeatUnit(data, data.unitMin);
                }
                let percent = 1;
                let fr = 0;
                for (const px of unit) {
                    if ($css$7.isPercent(px)) {
                        percent -= parseFloat(px) / 100;
                    }
                    else if (px.endsWith('fr')) {
                        fr += parseFloat(px);
                    }
                }
                if (percent < 1 && fr > 0) {
                    const lengthA = unit.length;
                    for (let i = 0; i < lengthA; i++) {
                        const px = unit[i];
                        if (px.endsWith('fr')) {
                            unit[i] = percent * (parseFloat(px) / fr) + 'fr';
                        }
                    }
                }
                const rowEnd = mainData.row.unit.length + 1;
                const columnEnd = mainData.column.unit.length + 1;
                for (const cell of layout) {
                    const placement = cell.placement;
                    if (placement[2] < 0) {
                        if (rowEnd > 1) {
                            placement[2] += rowEnd + 1;
                        }
                        else {
                            placement[2] = undefined;
                        }
                    }
                    if (placement[3] < 0) {
                        if (columnEnd > 1) {
                            placement[3] += columnEnd + 1;
                        }
                        else {
                            placement[3] = undefined;
                        }
                    }
                }
            }
            node.each((item, index) => {
                const cell = layout[index];
                const placement = cell.placement;
                let ROW_SPAN;
                let COLUMN_SPAN;
                let COLUMN_COUNT;
                let rowA;
                let colA;
                let rowB;
                let colB;
                if (horizontal) {
                    ROW_SPAN = cell.rowSpan;
                    COLUMN_SPAN = cell.columnSpan;
                    COLUMN_COUNT = mainData.column.length;
                    rowA = 0;
                    colA = 1;
                    rowB = 2;
                    colB = 3;
                }
                else {
                    ROW_SPAN = cell.columnSpan;
                    COLUMN_SPAN = cell.rowSpan;
                    COLUMN_COUNT = mainData.row.length;
                    rowA = 1;
                    colA = 0;
                    rowB = 3;
                    colB = 2;
                }
                while (!placement[0] || !placement[1]) {
                    const PLACEMENT = placement.slice(0);
                    if (!PLACEMENT[rowA]) {
                        let length = rowData.length;
                        for (let i = 0, j = 0, k = -1; i < length; i++) {
                            if (!rowInvalid[i]) {
                                if (cellsPerRow[i] === undefined || cellsPerRow[i] < COLUMN_COUNT) {
                                    if (j === 0) {
                                        k = i;
                                        length = Math.max(length, i + ROW_SPAN);
                                    }
                                    if (++j === ROW_SPAN) {
                                        PLACEMENT[rowA] = k + 1;
                                        break;
                                    }
                                }
                                else {
                                    j = 0;
                                    k = -1;
                                    length = rowData.length;
                                }
                            }
                        }
                    }
                    if (!PLACEMENT[rowA]) {
                        placement[rowA] = rowData.length + 1;
                        if (!placement[colA]) {
                            placement[colA] = 1;
                        }
                    }
                    else if (!PLACEMENT[colA]) {
                        if (!PLACEMENT[rowB]) {
                            PLACEMENT[rowB] = PLACEMENT[rowA] + ROW_SPAN;
                        }
                        const available = [];
                        const l = PLACEMENT[rowA] - 1;
                        const m = PLACEMENT[rowB] - 1;
                        for (let i = l; i < m; i++) {
                            const data = rowData[i];
                            if (data === undefined) {
                                available.push([[0, -1]]);
                            }
                            else if (getColumnTotal(data) + COLUMN_SPAN <= COLUMN_COUNT) {
                                const range = [];
                                let span = 0;
                                for (let j = 0, k = -1; j < COLUMN_COUNT; j++) {
                                    if (data[j] === undefined) {
                                        if (k === -1) {
                                            k = j;
                                        }
                                        span++;
                                    }
                                    if (data[j] || j === COLUMN_COUNT - 1) {
                                        if (span >= COLUMN_SPAN) {
                                            range.push([k, k + span]);
                                        }
                                        k = -1;
                                        span = 0;
                                    }
                                }
                                if (range.length) {
                                    available.push(range);
                                }
                                else {
                                    break;
                                }
                            }
                            else {
                                break;
                            }
                        }
                        const lengthA = available.length;
                        if (lengthA) {
                            const data = available[0];
                            if (data[0][1] === -1) {
                                PLACEMENT[colA] = 1;
                            }
                            else if (lengthA === m - l) {
                                if (lengthA > 1) {
                                    found: {
                                        for (const outside of data) {
                                            for (let i = outside[0]; i < outside[1]; i++) {
                                                for (let j = 1; j < lengthA; j++) {
                                                    const lengthB = available[j].length;
                                                    for (let k = 0; k < lengthB; k++) {
                                                        const inside = available[j][k];
                                                        if (i >= inside[0] && (inside[1] === -1 || i + COLUMN_SPAN <= inside[1])) {
                                                            PLACEMENT[colA] = i + 1;
                                                            break found;
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                                else {
                                    PLACEMENT[colA] = data[0][0] + 1;
                                }
                            }
                        }
                    }
                    const ROW_A = PLACEMENT[rowA];
                    if (ROW_A && PLACEMENT[colA]) {
                        placement[rowA] = ROW_A;
                        placement[colA] = PLACEMENT[colA];
                    }
                    else if (ROW_A) {
                        rowInvalid[ROW_A - 1] = true;
                    }
                }
                if (!placement[rowB]) {
                    placement[rowB] = placement[rowA] + ROW_SPAN;
                }
                if (!placement[colB]) {
                    placement[colB] = placement[colA] + COLUMN_SPAN;
                }
                if (setDataRows(item, placement)) {
                    const rowStart = placement[0] - 1;
                    const rowSpan = placement[2] - placement[0];
                    if (rowSpan > 1) {
                        for (let i = rowStart; i < rowStart + rowSpan; i++) {
                            mainData.rowSpanMultiple[i] = true;
                        }
                    }
                    item.data(EXT_NAME.CSS_GRID, 'cellData', {
                        rowStart,
                        rowSpan,
                        columnStart: placement[1] - 1,
                        columnSpan: placement[3] - placement[1]
                    });
                    if (dense) {
                        rowInvalid = {};
                    }
                }
            });
            const lengthC = rowData.length;
            if (lengthC) {
                if (horizontal) {
                    mainData.rowData = rowData;
                }
                else {
                    for (let i = 0; i < lengthC; i++) {
                        const data = rowData[i];
                        const lengthD = data.length;
                        for (let j = 0; j < lengthD; j++) {
                            if (mainData.rowData[j] === undefined) {
                                mainData.rowData[j] = [];
                            }
                            mainData.rowData[j][i] = data[j];
                        }
                    }
                }
                const unitTotal = (horizontal ? mainData.row : mainData.column).unitTotal;
                const children = mainData.children;
                let columnCount = 0;
                for (const data of mainData.rowData) {
                    const lengthD = data.length;
                    columnCount = Math.max(lengthD, columnCount);
                    for (let i = 0; i < lengthD; i++) {
                        const column = data[i];
                        if (unitTotal[i] === undefined) {
                            unitTotal[i] = 0;
                        }
                        if (column) {
                            let maxDimension = 0;
                            for (const item of column) {
                                if (!children.includes(item)) {
                                    maxDimension = Math.max(maxDimension, horizontal ? item.bounds.height : item.bounds.width);
                                    children.push(item);
                                }
                            }
                            unitTotal[i] += maxDimension;
                        }
                    }
                }
                if (children.length === node.length) {
                    const data = mainData.rowData;
                    const rowCount = data.length;
                    const modified = new Set();
                    const rowHeight = new Array(rowCount);
                    const rowWeight = new Array(rowCount);
                    const columnGap = mainData.column.gap;
                    const rowGap = mainData.row.gap;
                    mainData.row.length = rowCount;
                    mainData.column.length = columnCount;
                    mainData.rowHeight = rowHeight;
                    mainData.rowWeight = rowWeight;
                    for (let i = 0; i < rowCount; i++) {
                        rowHeight[i] = 0;
                        const row = data[i];
                        for (let j = 0; j < columnCount; j++) {
                            const column = row[j];
                            if (column) {
                                for (const item of column) {
                                    if (!modified.has(item)) {
                                        const cellData = item.data(EXT_NAME.CSS_GRID, 'cellData');
                                        const x = j + cellData.columnSpan - 1;
                                        const y = i + cellData.rowSpan - 1;
                                        if (x < columnCount - 1) {
                                            item.modifyBox(4 /* MARGIN_RIGHT */, columnGap);
                                        }
                                        if (y < rowCount - 1) {
                                            item.modifyBox(8 /* MARGIN_BOTTOM */, rowGap);
                                        }
                                        if (cellData.rowSpan === 1) {
                                            rowHeight[i] = Math.max(rowHeight[i], item.bounds.height);
                                        }
                                        modified.add(item);
                                    }
                                }
                            }
                        }
                    }
                    const actualHeight = node.actualHeight;
                    for (let i = 0; i < rowCount; i++) {
                        rowWeight[i] = rowHeight[i] / actualHeight;
                    }
                    node.retain(children);
                    node.cssSort('zIndex');
                    if (node.cssTry('display', 'block')) {
                        node.each((item) => {
                            const bounds = item.initial.bounds;
                            if (bounds) {
                                const rect = item.element.getBoundingClientRect();
                                bounds.width = rect.width;
                                bounds.height = rect.height;
                            }
                        });
                        node.cssFinally('display');
                    }
                    node.data(EXT_NAME.CSS_GRID, STRING_BASE.EXT_DATA, mainData);
                }
            }
            return undefined;
        }
    }

    const $util$c = squared.lib.util;
    class Flexbox extends ExtensionUI {
        static createDataAttribute(node, children) {
            const wrap = node.css('flexWrap');
            const direction = node.css('flexDirection');
            return {
                directionRow: direction.startsWith('row'),
                directionColumn: direction.startsWith('column'),
                directionReverse: direction.endsWith('reverse'),
                wrap: wrap.startsWith('wrap'),
                wrapReverse: wrap === 'wrap-reverse',
                alignContent: node.css('alignContent'),
                justifyContent: node.css('justifyContent'),
                rowCount: 0,
                columnCount: 0,
                children
            };
        }
        is(node) {
            return node.flexElement;
        }
        condition(node) {
            return node.length > 0;
        }
        processNode(node) {
            const controller = this.controller;
            const [children, absolute] = node.partition((item) => item.pageFlow && !item.renderExclude);
            const mainData = Flexbox.createDataAttribute(node, children);
            if (node.cssTry('align-items', 'start')) {
                if (node.cssTry('justify-items', 'start')) {
                    for (const item of children) {
                        const bounds = item.initial.bounds;
                        if (bounds && item.cssTry('align-self', 'start')) {
                            if (item.cssTry('justify-self', 'start')) {
                                const rect = item.element.getBoundingClientRect();
                                bounds.width = rect.width;
                                bounds.height = rect.height;
                                item.cssFinally('justify-self');
                            }
                            item.cssFinally('align-self');
                        }
                    }
                    node.cssFinally('justify-items');
                }
                node.cssFinally('align-items');
            }
            if (mainData.wrap) {
                let align;
                let sort;
                let size;
                let method;
                if (mainData.directionRow) {
                    align = 'top';
                    sort = 'left';
                    size = 'right';
                    method = 'intersectY';
                }
                else {
                    align = 'left';
                    sort = 'top';
                    size = 'bottom';
                    method = 'intersectX';
                }
                children.sort((a, b) => {
                    if (!a[method](b.bounds, 'bounds')) {
                        return a.linear[align] < b.linear[align] ? -1 : 1;
                    }
                    else if (!$util$c.withinRange(a.linear[sort], b.linear[sort])) {
                        return a.linear[sort] < b.linear[sort] ? -1 : 1;
                    }
                    return 0;
                });
                let row = [children[0]];
                let rowStart = children[0];
                const rows = [row];
                let length = children.length;
                for (let i = 1; i < length; i++) {
                    const item = children[i];
                    if (rowStart[method](item.bounds, 'bounds')) {
                        row.push(item);
                    }
                    else {
                        rowStart = item;
                        row = [item];
                        rows.push(row);
                    }
                }
                node.clear();
                let maxCount = 0;
                let offset = 0;
                length = rows.length;
                if (length > 1) {
                    const boxSize = node.box[size];
                    for (let i = 0; i < length; i++) {
                        const seg = rows[i];
                        const group = controller.createNodeGroup(seg[0], seg, node, true);
                        group.containerIndex = i;
                        const box = group.unsafe('box');
                        if (box) {
                            box[size] = boxSize;
                        }
                        group.addAlign(128 /* SEGMENTED */);
                        maxCount = Math.max(seg.length, maxCount);
                    }
                    offset = length;
                }
                else {
                    const item = rows[0];
                    node.retain(item);
                    for (let i = 0; i < item.length; i++) {
                        item[i].containerIndex = i;
                    }
                    maxCount = item.length;
                    offset = maxCount;
                }
                for (let i = 0; i < absolute.length; i++) {
                    absolute[i].containerIndex = offset + i;
                }
                node.concat(absolute);
                node.sort();
                if (mainData.directionRow) {
                    mainData.rowCount = length;
                    mainData.columnCount = maxCount;
                }
                else {
                    mainData.rowCount = maxCount;
                    mainData.columnCount = length;
                }
            }
            else {
                if (children.some(item => item.flexbox.order !== 0)) {
                    const [c, d] = mainData.directionReverse ? [-1, 1] : [1, -1];
                    children.sort((a, b) => {
                        const orderA = a.flexbox.order;
                        const orderB = b.flexbox.order;
                        if (orderA === orderB) {
                            return 0;
                        }
                        return orderA > orderB ? c : d;
                    });
                }
                if (mainData.directionRow) {
                    mainData.rowCount = 1;
                    mainData.columnCount = node.length;
                }
                else {
                    mainData.rowCount = node.length;
                    mainData.columnCount = 1;
                }
            }
            node.data(EXT_NAME.FLEXBOX, STRING_BASE.EXT_DATA, mainData);
            return undefined;
        }
    }

    const { css: $css$8, util: $util$d } = squared.lib;
    function getRowIndex(columns, target) {
        const top = target.linear.top;
        for (const column of columns) {
            const index = column.findIndex(item => $util$d.withinRange(top, item.linear.top) || top > item.linear.top && top < item.linear.bottom);
            if (index !== -1) {
                return index;
            }
        }
        return -1;
    }
    class Grid extends ExtensionUI {
        static createDataCellAttribute() {
            return {
                rowSpan: 0,
                columnSpan: 0,
                index: -1,
                cellStart: false,
                cellEnd: false,
                rowEnd: false,
                rowStart: false,
                block: false
            };
        }
        condition(node) {
            if (node.length > 1 && !node.layoutElement && !node.has('listStyle')) {
                if (node.display === 'table') {
                    return node.every(item => item.display === 'table-row' && item.every(child => child.display === 'table-cell')) || node.every(item => item.display === 'table-cell');
                }
                else {
                    let length = 0;
                    let itemCount = 0;
                    for (const item of node) {
                        if (item.pageFlow && !item.visibleStyle.background && item.blockStatic && !item.autoMargin.leftRight && !item.autoMargin.left) {
                            if (item.length > 1) {
                                length++;
                            }
                            if (item.display === 'list-item' && !item.has('listStyleType')) {
                                itemCount++;
                            }
                        }
                        else {
                            return false;
                        }
                    }
                    if (itemCount === node.length) {
                        return true;
                    }
                    else if (length > 0) {
                        return node.every(item => item.length > 0 && NodeUI.linearData(item.children).linearX);
                    }
                }
            }
            return false;
        }
        processNode(node) {
            const columnEnd = [];
            const columns = [];
            const nextMapX = {};
            for (const row of node) {
                for (const column of row) {
                    if (column.visible) {
                        const x = Math.floor(column.linear.left);
                        if (nextMapX[x] === undefined) {
                            nextMapX[x] = [];
                        }
                        nextMapX[x].push(column);
                    }
                }
            }
            const nextCoordsX = Object.keys(nextMapX);
            const lengthA = nextCoordsX.length;
            if (lengthA) {
                let columnLength = -1;
                for (let i = 0; i < lengthA; i++) {
                    const nextAxisX = nextMapX[nextCoordsX[i]];
                    if (i === 0) {
                        columnLength = lengthA;
                    }
                    else if (columnLength !== nextAxisX.length) {
                        columnLength = -1;
                        break;
                    }
                }
                if (columnLength !== -1) {
                    for (let i = 0; i < lengthA; i++) {
                        columns.push(nextMapX[nextCoordsX[i]]);
                    }
                }
                else {
                    const columnRight = [];
                    for (let i = 0; i < lengthA; i++) {
                        const nextAxisX = nextMapX[nextCoordsX[i]];
                        const lengthB = nextAxisX.length;
                        if (i === 0 && lengthB === 0) {
                            return undefined;
                        }
                        columnRight[i] = i === 0 ? 0 : columnRight[i - 1];
                        for (let j = 0; j < lengthB; j++) {
                            const nextX = nextAxisX[j];
                            if (i === 0 || $util$d.aboveRange(nextX.linear.left, columnRight[i - 1])) {
                                if (columns[i] === undefined) {
                                    columns[i] = [];
                                }
                                if (i === 0 || columns[0].length === lengthB) {
                                    columns[i][j] = nextX;
                                }
                                else {
                                    const index = getRowIndex(columns, nextX);
                                    if (index !== -1) {
                                        columns[i][index] = nextX;
                                    }
                                    else {
                                        return undefined;
                                    }
                                }
                            }
                            else {
                                const endIndex = columns.length - 1;
                                if (columns[endIndex]) {
                                    let minLeft = Number.POSITIVE_INFINITY;
                                    let maxRight = Number.NEGATIVE_INFINITY;
                                    columns[endIndex].forEach(item => {
                                        const { left, right } = item.linear;
                                        if (left < minLeft) {
                                            minLeft = left;
                                        }
                                        if (right > maxRight) {
                                            maxRight = right;
                                        }
                                    });
                                    if (Math.floor(nextX.linear.left) > Math.ceil(minLeft) && Math.floor(nextX.linear.right) > Math.ceil(maxRight)) {
                                        const index = getRowIndex(columns, nextX);
                                        if (index !== -1) {
                                            for (let k = columns.length - 1; k >= 0; k--) {
                                                if (columns[k]) {
                                                    if (columns[k][index] === undefined) {
                                                        columns[endIndex].length = 0;
                                                    }
                                                    break;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            columnRight[i] = Math.max(nextX.linear.right, columnRight[i]);
                        }
                    }
                    const lengthC = columnRight.length;
                    for (let i = 0, j = -1; i < lengthC; i++) {
                        if (columns[i] === undefined) {
                            if (j === -1) {
                                j = i - 1;
                            }
                            else if (i === lengthC - 1) {
                                columnRight[j] = columnRight[i];
                            }
                        }
                        else if (j !== -1) {
                            columnRight[j] = columnRight[i - 1];
                            j = -1;
                        }
                    }
                    for (let i = 0; i < columns.length; i++) {
                        const column = columns[i];
                        if (column && column.length) {
                            columnEnd.push(columnRight[i]);
                        }
                        else {
                            columns.splice(i--, 1);
                        }
                    }
                    const maxColumn = columns.reduce((a, b) => Math.max(a, b.length), 0);
                    for (let l = 0; l < maxColumn; l++) {
                        const lengthD = columns.length;
                        for (let m = 0; m < lengthD; m++) {
                            if (columns[m][l] === undefined) {
                                columns[m][l] = { spacer: 1 };
                            }
                        }
                    }
                    columnEnd.push(node.box.right);
                }
            }
            const columnCount = columns.length;
            if (columnCount > 1 && columns[0].length === node.length) {
                const children = [];
                const assigned = new Set();
                for (let i = 0, count = 0; i < columnCount; i++) {
                    let spacer = 0;
                    const column = columns[i];
                    for (let j = 0, start = 0; j < column.length; j++) {
                        const item = column[j];
                        const rowCount = column.length;
                        if (children[j] === undefined) {
                            children[j] = [];
                        }
                        if (!item['spacer']) {
                            const data = Object.assign(Grid.createDataCellAttribute(), item.data(EXT_NAME.GRID, 'cellData'));
                            let rowSpan = 1;
                            let columnSpan = 1 + spacer;
                            for (let k = i + 1; k < columnCount; k++) {
                                if (columns[k][j].spacer === 1) {
                                    columnSpan++;
                                    columns[k][j].spacer = 2;
                                }
                                else {
                                    break;
                                }
                            }
                            if (columnSpan === 1) {
                                for (let k = j + 1; k < rowCount; k++) {
                                    if (column[k].spacer === 1) {
                                        rowSpan++;
                                        column[k].spacer = 2;
                                    }
                                    else {
                                        break;
                                    }
                                }
                            }
                            if (columnEnd.length) {
                                const l = Math.min(i + (columnSpan - 1), columnEnd.length - 1);
                                for (const sibling of item.documentParent.naturalChildren) {
                                    if (!assigned.has(sibling) && sibling.visible && !sibling.rendered && $util$d.aboveRange(sibling.linear.left, item.linear.right) && $util$d.belowRange(sibling.linear.right, columnEnd[l])) {
                                        if (data.siblings === undefined) {
                                            data.siblings = [];
                                        }
                                        data.siblings.push(sibling);
                                    }
                                }
                            }
                            data.rowSpan = rowSpan;
                            data.columnSpan = columnSpan;
                            data.rowStart = start++ === 0;
                            data.rowEnd = columnSpan + i === columnCount;
                            data.cellStart = count === 0;
                            data.cellEnd = data.rowEnd && j === rowCount - 1;
                            data.index = i;
                            spacer = 0;
                            item.data(EXT_NAME.GRID, 'cellData', data);
                            children[j].push(item);
                            assigned.add(item);
                        }
                        else if (item['spacer'] === 1) {
                            spacer++;
                        }
                    }
                }
                node.each((item) => item.hide());
                node.clear();
                for (const group of children) {
                    let hasLength = true;
                    let hasPercent = false;
                    for (const item of group) {
                        const width = item.css('width');
                        if ($css$8.isPercent(width)) {
                            hasPercent = true;
                        }
                        else if (!$css$8.isLength(width)) {
                            hasLength = false;
                            break;
                        }
                    }
                    if (hasLength && hasPercent && group.length > 1) {
                        const cellData = group[0].data(EXT_NAME.GRID, 'cellData');
                        if (cellData && cellData.rowSpan === 1) {
                            let siblings = cellData.siblings ? cellData.siblings.slice(0) : [];
                            const length = group.length;
                            for (let i = 1; i < length; i++) {
                                const item = group[i];
                                const siblingData = item.data(EXT_NAME.GRID, 'cellData');
                                if (siblingData && siblingData.rowSpan === 1) {
                                    siblings.push(item);
                                    if (siblingData.siblings) {
                                        siblings = siblings.concat(siblingData.siblings);
                                    }
                                }
                                else {
                                    siblings.length = 0;
                                    break;
                                }
                            }
                            if (siblings.length) {
                                cellData.block = true;
                                cellData.columnSpan = columnCount;
                                cellData.siblings = siblings;
                                group.length = 1;
                            }
                        }
                    }
                    for (const item of group) {
                        item.parent = node;
                        if (!hasLength && item.percentWidth) {
                            item.css('width', $css$8.formatPX(item.bounds.width));
                        }
                    }
                }
                if (node.tableElement && node.css('borderCollapse') === 'collapse') {
                    node.modifyBox(32 /* PADDING_TOP */);
                    node.modifyBox(64 /* PADDING_RIGHT */);
                    node.modifyBox(128 /* PADDING_BOTTOM */);
                    node.modifyBox(256 /* PADDING_LEFT */);
                }
                node.data(EXT_NAME.GRID, 'columnCount', columnCount);
            }
            return undefined;
        }
    }

    const $css$9 = squared.lib.css;
    const hasSingleImage = (node) => node.visibleStyle.backgroundImage && !node.visibleStyle.backgroundRepeat;
    class List extends ExtensionUI {
        static createDataAttribute() {
            return {
                ordinal: '',
                imageSrc: '',
                imagePosition: ''
            };
        }
        condition(node) {
            if (super.condition(node)) {
                const length = node.length;
                if (length) {
                    const floated = new Set();
                    const children = node.children;
                    let blockStatic = 0;
                    let inlineVertical = 0;
                    let floating = 0;
                    let blockAlternate = 0;
                    let imageType = 0;
                    let listType = 0;
                    for (let i = 0; i < length; i++) {
                        const item = children[i];
                        const listStyleType = item.css('listStyleType') !== 'none';
                        if (item.display === 'list-item' && (listStyleType || item.innerBefore)) {
                            listType++;
                        }
                        else if (item.marginLeft < 0 && !listStyleType && hasSingleImage(item)) {
                            imageType++;
                        }
                        if (item.blockStatic) {
                            blockStatic++;
                        }
                        else {
                            blockStatic = Number.POSITIVE_INFINITY;
                        }
                        if (item.inlineVertical) {
                            inlineVertical++;
                        }
                        else {
                            blockStatic = Number.POSITIVE_INFINITY;
                        }
                        if (item.floating) {
                            floated.add(item.float);
                            floating++;
                            blockAlternate = Number.POSITIVE_INFINITY;
                        }
                        else if (i === 0 || i === length - 1 || item.blockStatic || children[i - 1].blockStatic && children[i + 1].blockStatic) {
                            blockAlternate++;
                            floating = Number.POSITIVE_INFINITY;
                        }
                        else {
                            floating = Number.POSITIVE_INFINITY;
                            blockAlternate = Number.POSITIVE_INFINITY;
                        }
                        if (blockStatic === Number.POSITIVE_INFINITY && inlineVertical === Number.POSITIVE_INFINITY && blockAlternate === Number.POSITIVE_INFINITY && floating === Number.POSITIVE_INFINITY) {
                            return false;
                        }
                    }
                    return (imageType > 0 || listType > 0) && (blockStatic === length || inlineVertical === length || floating === length && floated.size === 1 || blockAlternate === length);
                }
            }
            return false;
        }
        processNode(node) {
            const ordered = node.tagName === 'OL';
            let i = ordered && node.element.start || 1;
            node.each((item) => {
                const mainData = List.createDataAttribute();
                const value = item.css('listStyleType');
                const listItem = item.display === 'list-item';
                if (listItem || value && value !== 'none' || hasSingleImage(item)) {
                    if (item.has('listStyleImage')) {
                        mainData.imageSrc = item.css('listStyleImage');
                    }
                    else {
                        if (ordered && listItem && item.tagName === 'LI') {
                            i = item.element.value || i;
                        }
                        let ordinal = $css$9.convertListStyle(value, i);
                        if (ordinal === '') {
                            switch (value) {
                                case 'disc':
                                    ordinal = '●';
                                    break;
                                case 'square':
                                    ordinal = '■';
                                    break;
                                case 'none':
                                    let src = '';
                                    let position = '';
                                    if (!item.visibleStyle.backgroundRepeat) {
                                        src = item.backgroundImage;
                                        position = item.css('backgroundPosition');
                                    }
                                    if (src && src !== 'none') {
                                        mainData.imageSrc = src;
                                        mainData.imagePosition = position;
                                        item.exclude(NODE_RESOURCE.IMAGE_SOURCE);
                                    }
                                    break;
                                default:
                                    ordinal = '○';
                                    break;
                            }
                        }
                        else {
                            ordinal += '.';
                        }
                        mainData.ordinal = ordinal;
                    }
                    if (listItem) {
                        i++;
                    }
                }
                item.data(EXT_NAME.LIST, STRING_BASE.EXT_DATA, mainData);
            });
            return undefined;
        }
    }

    const { dom: $dom$5, util: $util$e } = squared.lib;
    class Relative extends ExtensionUI {
        is(node) {
            return node.positionRelative || node.toFloat('verticalAlign', true) !== 0;
        }
        condition() {
            return true;
        }
        processNode() {
            return { include: true };
        }
        postOptimize(node) {
            const renderParent = node.renderParent;
            if (renderParent) {
                const verticalAlign = $util$e.convertFloat(node.verticalAlign);
                let { top, right, bottom, left } = node;
                let target = node;
                if (renderParent.support.container.positionRelative && renderParent.layoutHorizontal && node.renderChildren.length === 0 && (node.top !== 0 || node.bottom !== 0 || verticalAlign !== 0)) {
                    const application = this.application;
                    target = node.clone(application.nextId, true, true);
                    target.baselineAltered = true;
                    node.hide(true);
                    application.session.cache.append(target, false);
                    const layout = new LayoutUI(renderParent, target, target.containerType, target.alignmentType);
                    const index = renderParent.renderChildren.findIndex(item => item === node);
                    if (index !== -1) {
                        layout.renderIndex = index + 1;
                    }
                    application.addLayout(layout);
                    if (renderParent.layoutHorizontal && node.documentParent.parseUnit(node.css('textIndent')) < 0) {
                        renderParent.renderEach(item => {
                            const documentId = node.documentId;
                            if (item.alignSibling(STRING_BASE.TOP_BOTTOM) === documentId) {
                                item.alignSibling(STRING_BASE.TOP_BOTTOM, target.documentId);
                            }
                            else if (item.alignSibling(STRING_BASE.BOTTOM_TOP) === documentId) {
                                item.alignSibling(STRING_BASE.BOTTOM_TOP, target.documentId);
                            }
                        });
                    }
                    if (node.baselineActive && !node.baselineAltered) {
                        for (const children of (renderParent.horizontalRows || [renderParent.renderChildren])) {
                            if (children.includes(node)) {
                                const unaligned = $util$e.filterArray(children, item => item.positionRelative && item.length > 0 && $util$e.convertFloat(node.verticalAlign) !== 0);
                                const length = unaligned.length;
                                if (length) {
                                    unaligned.sort((a, b) => {
                                        const topA = a.linear.top;
                                        const topB = b.linear.top;
                                        if ($util$e.withinRange(topA, topB)) {
                                            return 0;
                                        }
                                        return topA < topB ? -1 : 1;
                                    });
                                    for (let i = 0; i < length; i++) {
                                        const item = unaligned[i];
                                        if (i === 0) {
                                            node.modifyBox(2 /* MARGIN_TOP */, $util$e.convertFloat(item.verticalAlign));
                                        }
                                        else {
                                            item.modifyBox(2 /* MARGIN_TOP */, item.linear.top - unaligned[0].linear.top);
                                        }
                                        item.css('verticalAlign', '0px', true);
                                    }
                                }
                                break;
                            }
                        }
                    }
                }
                else if (node.naturalElement && node.positionRelative) {
                    const parent = node.actualParent;
                    if (parent) {
                        let preceding = false;
                        let previous;
                        for (const item of parent.naturalElements) {
                            if (item === node) {
                                if (preceding) {
                                    if (renderParent.layoutVertical && (node.top !== 0 || node.bottom !== 0)) {
                                        const bounds = $dom$5.assignRect(node.element.getBoundingClientRect(), true);
                                        if (top !== 0) {
                                            top -= bounds.top - node.bounds.top;
                                        }
                                        if (bottom !== 0) {
                                            bottom += bounds.bottom - node.bounds.bottom;
                                        }
                                    }
                                    if (renderParent.layoutHorizontal && (node.left !== 0 || node.right !== 0) && node.alignSibling(STRING_BASE.LEFT_RIGHT) === '') {
                                        const bounds = $dom$5.assignRect(node.element.getBoundingClientRect(), true);
                                        if (left !== 0) {
                                            left -= bounds.left - node.bounds.left;
                                        }
                                        if (right !== 0) {
                                            right += bounds.right - node.bounds.right;
                                        }
                                    }
                                }
                                else if (renderParent.layoutVertical) {
                                    if (top !== 0) {
                                        if (previous && previous.blockStatic && previous.positionRelative && item.blockStatic) {
                                            top -= previous.top;
                                        }
                                    }
                                    else if (bottom !== 0) {
                                        const getBox = item.getBox(2 /* MARGIN_TOP */);
                                        if (getBox[0] === 1) {
                                            bottom -= item.marginTop;
                                        }
                                    }
                                }
                                break;
                            }
                            else if (item.positionRelative && item.renderParent === renderParent) {
                                preceding = true;
                            }
                            previous = item;
                        }
                    }
                }
                if (top !== 0) {
                    target.modifyBox(2 /* MARGIN_TOP */, top);
                }
                else if (bottom !== 0) {
                    target.modifyBox(2 /* MARGIN_TOP */, bottom * -1);
                }
                if (verticalAlign !== 0) {
                    target.modifyBox(2 /* MARGIN_TOP */, verticalAlign * -1);
                }
                if (left !== 0) {
                    if (target.autoMargin.left) {
                        target.modifyBox(4 /* MARGIN_RIGHT */, left * -1);
                    }
                    else {
                        target.modifyBox(16 /* MARGIN_LEFT */, left);
                    }
                }
                else if (right !== 0) {
                    target.modifyBox(16 /* MARGIN_LEFT */, right * -1);
                }
            }
        }
    }

    const $css$a = squared.lib.css;
    class Sprite extends ExtensionUI {
        is() {
            return true;
        }
        condition(node) {
            const backgroundImage = node.backgroundImage;
            if (backgroundImage !== '' && node.hasWidth && node.hasHeight && node.length === 0 && (this.included(node.element) || !node.dataset.use)) {
                const image = (this.resource.getRawData(backgroundImage) || this.resource.getImage($css$a.resolveURL(backgroundImage)));
                if (image) {
                    const pattern = /^0[a-z%]+|left|start|top/;
                    const dimension = node.actualDimension;
                    const backgroundPositionX = node.css('backgroundPositionX');
                    const backgroundPositionY = node.css('backgroundPositionY');
                    const position = $css$a.getBackgroundPosition(backgroundPositionX + ' ' + backgroundPositionY, dimension, node.fontSize);
                    const x = (position.left < 0 || pattern.test(backgroundPositionX)) && image.width > dimension.width;
                    const y = (position.top < 0 || pattern.test(backgroundPositionY)) && image.height > dimension.height;
                    if ((x || y) && (x || position.left === 0) && (y || position.top === 0)) {
                        node.data(EXT_NAME.SPRITE, STRING_BASE.EXT_DATA, { image, position });
                        return true;
                    }
                }
            }
            return false;
        }
    }

    const { css: $css$b, dom: $dom$6, math: $math$2, util: $util$f } = squared.lib;
    const REGEXP_BACKGROUND = /rgba\(0, 0, 0, 0\)|transparent/;
    class Table extends ExtensionUI {
        static createDataAttribute(node) {
            return {
                layoutType: 0,
                rowCount: 0,
                columnCount: 0,
                layoutFixed: node.css('tableLayout') === 'fixed',
                borderCollapse: node.css('borderCollapse') === 'collapse',
                expand: false
            };
        }
        processNode(node) {
            const mainData = Table.createDataAttribute(node);
            let table = [];
            const thead = [];
            const tbody = [];
            const tfoot = [];
            function setAutoWidth(td, data) {
                data.percent = Math.round((td.bounds.width / node.box.width) * 100) + '%';
                data.expand = true;
            }
            function inheritStyles(section) {
                if (section.length) {
                    for (const item of section[0].cascade()) {
                        const tagName = item.tagName;
                        if (tagName === 'TH' || tagName === 'TD') {
                            item.inherit(section[0], 'styleMap');
                            item.unsetCache('visibleStyle');
                        }
                    }
                    table = table.concat(section[0].children);
                    for (const item of section) {
                        item.hide();
                    }
                }
            }
            const setBoundsWidth = (td) => td.css('width', $css$b.formatPX(td.bounds.width), true);
            node.each((item) => {
                switch (item.tagName) {
                    case 'THEAD':
                        thead.push(item);
                        break;
                    case 'TBODY':
                        tbody.push(item);
                        break;
                    case 'TFOOT':
                        tfoot.push(item);
                        break;
                }
            });
            inheritStyles(thead);
            for (const section of tbody) {
                table = table.concat(section.children);
                section.hide();
            }
            inheritStyles(tfoot);
            const [horizontal, vertical] = mainData.borderCollapse ? [0, 0] : $util$f.replaceMap(node.css('borderSpacing').split(' '), (value, index) => node.parseUnit(value, index === 0 ? 'width' : 'height'));
            const spacingWidth = horizontal > 1 ? Math.round(horizontal / 2) : horizontal;
            const spacingHeight = vertical > 1 ? Math.round(vertical / 2) : vertical;
            const colgroup = node.element.querySelector('COLGROUP');
            const rowWidth = [];
            const mapBounds = [];
            const tableFilled = [];
            const mapWidth = [];
            const rowCount = table.length;
            let columnIndex = new Array(rowCount).fill(0);
            let columnCount = 0;
            for (let i = 0; i < rowCount; i++) {
                const tr = table[i];
                rowWidth[i] = horizontal;
                tableFilled[i] = [];
                tr.each((td, j) => {
                    const element = td.element;
                    for (let k = 0; k < element.rowSpan - 1; k++) {
                        const col = i + k + 1;
                        if (columnIndex[col] >= 0) {
                            columnIndex[col] += element.colSpan;
                        }
                    }
                    const m = columnIndex[i];
                    if (!td.hasPX('width')) {
                        const value = $dom$6.getNamedItem(element, 'width');
                        if ($css$b.isPercent(value)) {
                            td.css('width', value);
                        }
                        else if ($util$f.isNumber(value)) {
                            td.css('width', $css$b.formatPX(parseFloat(value)));
                        }
                    }
                    if (!td.hasPX('height')) {
                        const value = $dom$6.getNamedItem(element, 'height');
                        if ($css$b.isPercent(value)) {
                            td.css('height', value);
                        }
                        else if ($util$f.isNumber(value)) {
                            td.css('height', $css$b.formatPX(parseFloat(value)));
                        }
                    }
                    if (!td.visibleStyle.backgroundImage && !td.visibleStyle.backgroundColor) {
                        if (colgroup) {
                            const { backgroundImage, backgroundColor } = $css$b.getStyle(colgroup.children[m]);
                            if (backgroundImage && backgroundImage !== 'none') {
                                td.css('backgroundImage', backgroundImage, true);
                            }
                            if (backgroundColor && !REGEXP_BACKGROUND.test(backgroundColor)) {
                                td.css('backgroundColor', backgroundColor, true);
                            }
                        }
                        else {
                            let value = $css$b.getInheritedStyle(element, 'backgroundImage', /none/, 'TABLE');
                            if (value !== '') {
                                td.css('backgroundImage', value, true);
                            }
                            value = $css$b.getInheritedStyle(element, 'backgroundColor', REGEXP_BACKGROUND, 'TABLE');
                            if (value !== '') {
                                td.css('backgroundColor', value, true);
                            }
                        }
                    }
                    switch (td.tagName) {
                        case 'TH': {
                            function setBorderStyle(attr) {
                                const cssStyle = attr + 'Style';
                                const cssColor = attr + 'Color';
                                const cssWidth = attr + 'Width';
                                td.ascend(undefined, node).some((item) => {
                                    if (item.has(cssStyle)) {
                                        td.css(cssStyle, item.css(cssStyle));
                                        td.css(cssColor, item.css(cssColor));
                                        td.css(cssWidth, item.css(cssWidth), true);
                                        td.css('border', 'inherit');
                                        return true;
                                    }
                                    return false;
                                });
                            }
                            if (!td.cssInitial('textAlign')) {
                                td.css('textAlign', td.css('textAlign'));
                            }
                            if (td.borderTopWidth === 0) {
                                setBorderStyle('borderTop');
                            }
                            if (td.borderRightWidth === 0) {
                                setBorderStyle('borderRight');
                            }
                            if (td.borderBottomWidth === 0) {
                                setBorderStyle('borderBottom');
                            }
                            if (td.borderLeftWidth === 0) {
                                setBorderStyle('borderLeft');
                            }
                        }
                        case 'TD':
                            if (!td.cssInitial('verticalAlign')) {
                                td.css('verticalAlign', 'middle', true);
                            }
                            break;
                    }
                    const columnWidth = td.cssInitial('width');
                    const reevaluate = mapWidth[m] === undefined || mapWidth[m] === 'auto';
                    const width = td.bounds.width;
                    if (i === 0 || reevaluate || !mainData.layoutFixed) {
                        if (columnWidth === '' || columnWidth === 'auto') {
                            if (mapWidth[m] === undefined) {
                                mapWidth[m] = columnWidth || '0px';
                                mapBounds[m] = 0;
                            }
                            else if (i === rowCount - 1) {
                                if (reevaluate && mapBounds[m] === 0) {
                                    mapBounds[m] = width;
                                }
                            }
                        }
                        else {
                            const percent = $css$b.isPercent(columnWidth);
                            const length = $css$b.isLength(mapWidth[m]);
                            if (reevaluate || width < mapBounds[m] || width === mapBounds[m] && (length && percent || percent && $css$b.isPercent(mapWidth[m]) && td.parseUnit(columnWidth) >= td.parseUnit(mapWidth[m]) || length && $css$b.isLength(columnWidth) && td.parseUnit(columnWidth) > td.parseUnit(mapWidth[m]))) {
                                mapWidth[m] = columnWidth;
                            }
                            if (reevaluate || element.colSpan === 1) {
                                mapBounds[m] = width;
                            }
                        }
                    }
                    if (td.length || td.inlineText) {
                        rowWidth[i] += width + horizontal;
                    }
                    if (spacingWidth > 0) {
                        td.modifyBox(16 /* MARGIN_LEFT */, columnIndex[i] === 0 ? horizontal : spacingWidth);
                        td.modifyBox(4 /* MARGIN_RIGHT */, j === 0 ? spacingWidth : horizontal);
                    }
                    if (spacingHeight > 0) {
                        td.modifyBox(2 /* MARGIN_TOP */, i === 0 ? vertical : spacingHeight);
                        td.modifyBox(8 /* MARGIN_BOTTOM */, i + element.rowSpan < rowCount ? spacingHeight : vertical);
                    }
                    columnIndex[i] += element.colSpan;
                });
                columnCount = Math.max(columnCount, columnIndex[i]);
            }
            if (node.hasPX('width', false) && mapWidth.some(value => $css$b.isPercent(value))) {
                $util$f.replaceMap(mapWidth, (value, index) => {
                    if (value === 'auto' && mapBounds[index] > 0) {
                        return $css$b.formatPX(mapBounds[index]);
                    }
                    return value;
                });
            }
            let percentAll = false;
            if (mapWidth.every(value => $css$b.isPercent(value))) {
                if (mapWidth.reduce((a, b) => a + parseFloat(b), 0) > 1) {
                    let percentTotal = 100;
                    $util$f.replaceMap(mapWidth, value => {
                        const percent = parseFloat(value);
                        if (percentTotal <= 0) {
                            value = '0px';
                        }
                        else if (percentTotal - percent < 0) {
                            value = $css$b.formatPercent(percentTotal / 100);
                        }
                        percentTotal -= percent;
                        return value;
                    });
                }
                if (!node.hasWidth) {
                    mainData.expand = true;
                }
                percentAll = true;
            }
            else if (mapWidth.every(value => $css$b.isLength(value))) {
                const width = mapWidth.reduce((a, b) => a + parseFloat(b), 0);
                if (node.hasWidth) {
                    if (width < node.width) {
                        $util$f.replaceMap(mapWidth, value => value !== '0px' ? ((parseFloat(value) / width) * 100) + '%' : value);
                    }
                    else if (width > node.width) {
                        node.css('width', 'auto', true);
                        if (!mainData.layoutFixed) {
                            for (const item of node.cascade()) {
                                item.css('width', 'auto', true);
                            }
                        }
                    }
                }
                if (mainData.layoutFixed && !node.hasPX('width')) {
                    node.css('width', $css$b.formatPX(node.bounds.width), true);
                }
            }
            let mapPercent = 0;
            mainData.layoutType = (() => {
                if (mapWidth.length > 1) {
                    mapPercent = mapWidth.reduce((a, b) => a + ($css$b.isPercent(b) ? parseFloat(b) : 0), 0);
                    if (mainData.layoutFixed && mapWidth.reduce((a, b) => a + ($css$b.isLength(b) ? parseFloat(b) : 0), 0) >= node.actualWidth) {
                        return 4 /* COMPRESS */;
                    }
                    else if (mapWidth.length > 1 && mapWidth.some(value => $css$b.isPercent(value)) || mapWidth.every(value => $css$b.isLength(value) && value !== '0px')) {
                        return 3 /* VARIABLE */;
                    }
                    else if (mapWidth.every(value => value === mapWidth[0])) {
                        if (node.cascadeSome(td => td.hasHeight)) {
                            mainData.expand = true;
                            return 3 /* VARIABLE */;
                        }
                        else if (mapWidth[0] === 'auto') {
                            if (node.hasWidth) {
                                return 3 /* VARIABLE */;
                            }
                            else {
                                const td = node.cascade(item => item.tagName === 'TD');
                                if (td.length && td.every(item => $util$f.withinRange(item.bounds.width, td[0].bounds.width))) {
                                    return 0 /* NONE */;
                                }
                                return 3 /* VARIABLE */;
                            }
                        }
                        else if (node.hasWidth) {
                            return 2 /* FIXED */;
                        }
                    }
                    if (mapWidth.every(value => value === 'auto' || $css$b.isLength(value) && value !== '0px')) {
                        if (!node.hasWidth) {
                            mainData.expand = true;
                        }
                        return 1 /* STRETCH */;
                    }
                }
                return 0 /* NONE */;
            })();
            const caption = node.find(item => item.tagName === 'CAPTION');
            node.clear();
            if (caption) {
                if (!caption.hasWidth) {
                    if (caption.textElement) {
                        if (!caption.hasPX('maxWidth')) {
                            caption.css('maxWidth', $css$b.formatPX(caption.bounds.width));
                        }
                    }
                    else if (caption.bounds.width > $math$2.maxArray(rowWidth)) {
                        setBoundsWidth(caption);
                    }
                }
                if (!caption.cssInitial('textAlign')) {
                    caption.css('textAlign', 'center');
                }
                caption.data(EXT_NAME.TABLE, 'cellData', { colSpan: columnCount });
                caption.parent = node;
            }
            const hasWidth = node.hasWidth;
            columnIndex = new Array(rowCount).fill(0);
            for (let i = 0; i < rowCount; i++) {
                const tr = table[i];
                let lastChild;
                for (const td of tr.duplicate()) {
                    const element = td.element;
                    const { rowSpan, colSpan } = element;
                    const data = { rowSpan, colSpan };
                    for (let k = 0; k < rowSpan - 1; k++) {
                        const l = (i + 1) + k;
                        if (columnIndex[l] !== undefined) {
                            columnIndex[l] += colSpan;
                        }
                    }
                    if (!td.has('verticalAlign')) {
                        td.css('verticalAlign', 'middle');
                    }
                    const columnWidth = mapWidth[columnIndex[i]];
                    if (columnWidth) {
                        switch (mainData.layoutType) {
                            case 0 /* NONE */:
                                break;
                            case 3 /* VARIABLE */:
                                if (columnWidth === 'auto') {
                                    if (mapPercent >= 1) {
                                        setBoundsWidth(td);
                                        data.exceed = !hasWidth;
                                        data.downsized = true;
                                    }
                                    else {
                                        setAutoWidth(td, data);
                                    }
                                }
                                else if ($css$b.isPercent(columnWidth)) {
                                    if (percentAll) {
                                        data.percent = columnWidth;
                                        data.expand = true;
                                    }
                                    else {
                                        setBoundsWidth(td);
                                    }
                                }
                                else if ($css$b.isLength(columnWidth) && parseInt(columnWidth) > 0) {
                                    if (td.bounds.width >= parseInt(columnWidth)) {
                                        setBoundsWidth(td);
                                        data.expand = false;
                                        data.downsized = false;
                                    }
                                    else {
                                        if (mainData.layoutFixed) {
                                            setAutoWidth(td, data);
                                            data.downsized = true;
                                        }
                                        else {
                                            setBoundsWidth(td);
                                            data.expand = false;
                                        }
                                    }
                                }
                                else {
                                    if (!td.hasPX('width') || td.percentWidth) {
                                        setBoundsWidth(td);
                                    }
                                    data.expand = false;
                                }
                                break;
                            case 2 /* FIXED */:
                                td.css('width', '0px');
                                break;
                            case 1 /* STRETCH */:
                                if (columnWidth === 'auto') {
                                    td.css('width', '0px');
                                }
                                else {
                                    if (mainData.layoutFixed) {
                                        data.downsized = true;
                                    }
                                    else {
                                        setBoundsWidth(td);
                                    }
                                    data.expand = false;
                                }
                                break;
                            case 4 /* COMPRESS */:
                                if (!$css$b.isLength(columnWidth)) {
                                    td.hide();
                                }
                                break;
                        }
                    }
                    columnIndex[i] += colSpan;
                    for (let k = 0; k < rowSpan; k++) {
                        for (let l = 0; l < colSpan; l++) {
                            tableFilled[i + k].push(td);
                        }
                    }
                    td.data(EXT_NAME.TABLE, 'cellData', data);
                    td.parent = node;
                    lastChild = td;
                }
                if (lastChild && columnIndex[i] < columnCount) {
                    const data = lastChild.data(EXT_NAME.TABLE, 'cellData');
                    if (data) {
                        data.spaceSpan = columnCount - columnIndex[i];
                    }
                }
                tr.hide();
            }
            if (mainData.borderCollapse) {
                const borderTopColor = node.css('borderTopColor');
                const borderTopStyle = node.css('borderTopStyle');
                const borderTopWidth = node.css('borderTopWidth');
                const borderRightColor = node.css('borderRightColor');
                const borderRightStyle = node.css('borderRightStyle');
                const borderRightWidth = node.css('borderRightWidth');
                const borderBottomColor = node.css('borderBottomColor');
                const borderBottomStyle = node.css('borderBottomStyle');
                const borderBottomWidth = node.css('borderBottomWidth');
                const borderLeftColor = node.css('borderLeftColor');
                const borderLeftStyle = node.css('borderLeftStyle');
                const borderLeftWidth = node.css('borderLeftWidth');
                let hideTop = false;
                let hideRight = false;
                let hideBottom = false;
                let hideLeft = false;
                for (let i = 0; i < rowCount; i++) {
                    for (let j = 0; j < columnCount; j++) {
                        const td = tableFilled[i][j];
                        if (td && td.css('visibility') === 'visible') {
                            if (i === 0) {
                                if (td.borderTopWidth < parseInt(borderTopWidth)) {
                                    td.cssApply({
                                        borderTopColor,
                                        borderTopStyle,
                                        borderTopWidth
                                    });
                                }
                                else {
                                    hideTop = true;
                                }
                            }
                            if (i >= 0 && i < rowCount - 1) {
                                const next = tableFilled[i + 1][j];
                                if (next && next !== td && next.css('visibility') === 'visible') {
                                    if (td.borderBottomWidth >= next.borderTopWidth) {
                                        next.css('borderTopWidth', '0px', true);
                                    }
                                    else {
                                        td.css('borderBottomWidth', '0px', true);
                                    }
                                }
                            }
                            if (i === rowCount - 1) {
                                if (td.borderBottomWidth < parseInt(borderBottomWidth)) {
                                    td.cssApply({
                                        borderBottomColor,
                                        borderBottomStyle,
                                        borderBottomWidth
                                    });
                                }
                                else {
                                    hideBottom = true;
                                }
                            }
                            if (j === 0) {
                                if (td.borderLeftWidth < parseInt(borderLeftWidth)) {
                                    td.cssApply({
                                        borderLeftColor,
                                        borderLeftStyle,
                                        borderLeftWidth
                                    });
                                }
                                else {
                                    hideLeft = true;
                                }
                            }
                            if (j >= 0 && j < columnCount - 1) {
                                const next = tableFilled[i][j + 1];
                                if (next && next !== td && next.css('visibility') === 'visible') {
                                    if (td.borderRightWidth >= next.borderLeftWidth) {
                                        next.css('borderLeftWidth', '0px', true);
                                    }
                                    else {
                                        td.css('borderRightWidth', '0px', true);
                                    }
                                }
                            }
                            if (j === columnCount - 1) {
                                if (td.borderRightWidth < parseInt(borderRightWidth)) {
                                    td.cssApply({
                                        borderRightColor,
                                        borderRightStyle,
                                        borderRightWidth
                                    });
                                }
                                else {
                                    hideRight = true;
                                }
                            }
                        }
                    }
                }
                if (hideTop || hideRight || hideBottom || hideLeft) {
                    node.cssApply({
                        borderTopWidth: '0px',
                        borderRightWidth: '0px',
                        borderBottomWidth: '0px',
                        borderLeftWidth: '0px'
                    }, true);
                }
            }
            mainData.rowCount = rowCount;
            mainData.columnCount = columnCount;
            node.data(EXT_NAME.TABLE, STRING_BASE.EXT_DATA, mainData);
            return undefined;
        }
    }

    const { css: $css$c, util: $util$g } = squared.lib;
    class VerticalAlign extends ExtensionUI {
        is() {
            return true;
        }
        condition(node) {
            let valid = false;
            let alignable = 0;
            let inlineVertical = 0;
            let sameValue = 0;
            for (const item of node) {
                if (item.inlineVertical) {
                    const value = $util$g.convertFloat(item.verticalAlign);
                    if (value !== 0) {
                        valid = true;
                    }
                    if (!isNaN(sameValue)) {
                        if (sameValue === 0) {
                            sameValue = value;
                        }
                        else if (sameValue !== value) {
                            sameValue = NaN;
                        }
                    }
                    inlineVertical++;
                }
                else {
                    sameValue = NaN;
                }
                if (item.positionStatic || item.positionRelative && item.length) {
                    alignable++;
                }
            }
            return valid && isNaN(sameValue) && inlineVertical > 1 && alignable === node.length && NodeUI.linearData(node.children).linearX;
        }
        processNode(node) {
            node.each((item) => {
                if (item.inlineVertical && !item.baseline || item.imageElement) {
                    item.baselineAltered = true;
                }
            });
            return { include: true };
        }
        postConstraints(node) {
            if (node.layoutHorizontal) {
                for (const children of (node.horizontalRows || [node.renderChildren])) {
                    const aboveBaseline = [];
                    let minTop = Number.POSITIVE_INFINITY;
                    let baseline;
                    for (const item of children) {
                        const top = item.linear.top;
                        if (item.inlineVertical && top <= minTop) {
                            if (top < minTop) {
                                aboveBaseline.length = 0;
                            }
                            aboveBaseline.push(item);
                            minTop = top;
                        }
                        if (item.baselineActive) {
                            baseline = item;
                        }
                    }
                    if (aboveBaseline.length) {
                        const top = aboveBaseline[0].linear.top;
                        for (const item of children) {
                            if (item !== baseline) {
                                if (item.inlineVertical && !item.baseline) {
                                    if (!aboveBaseline.includes(item)) {
                                        const verticalAlign = item.verticalAlign;
                                        let valid = false;
                                        switch (verticalAlign) {
                                            case 'super':
                                            case 'sub':
                                                valid = true;
                                                break;
                                            default:
                                                if ($css$c.isLength(verticalAlign) || baseline === undefined) {
                                                    valid = true;
                                                }
                                                break;
                                        }
                                        if (valid) {
                                            item.modifyBox(2 /* MARGIN_TOP */, item.linear.top - top);
                                        }
                                    }
                                    else if (item.imageElement && baseline) {
                                        item.modifyBox(2 /* MARGIN_TOP */, baseline.linear.top - item.linear.top);
                                    }
                                }
                                if (item.baselineAltered) {
                                    item.css('verticalAlign', '0px', true);
                                }
                            }
                        }
                        if (baseline) {
                            baseline.modifyBox(2 /* MARGIN_TOP */, baseline.linear.top - top);
                            baseline.baselineAltered = true;
                        }
                    }
                }
            }
            else {
                node.each((item) => item.baselineAltered = false);
            }
        }
    }

    const { css: $css$d, util: $util$h } = squared.lib;
    const DOCTYPE_HTML = document.doctype !== null && document.doctype.name === 'html';
    function setSpacingOffset(node, region, value, adjustment = 0) {
        let offset = 0;
        switch (region) {
            case 2 /* MARGIN_TOP */:
                offset = node.actualRect('top') - value;
                break;
            case 16 /* MARGIN_LEFT */:
                offset = node.actualRect('left') - value;
                break;
            case 8 /* MARGIN_BOTTOM */:
                offset = value - node.actualRect('bottom');
                break;
        }
        offset -= adjustment;
        if (offset > 0) {
            (node.renderAs || node.outerWrapper || node).modifyBox(region, offset);
        }
    }
    function applyMarginCollapse(node, child, direction) {
        if (isBlockElement(child, direction)) {
            let margin;
            let borderWidth;
            let padding;
            let boxMargin;
            if (direction) {
                margin = 'marginTop';
                borderWidth = 'borderTopWidth';
                padding = 'paddingTop';
                boxMargin = 2 /* MARGIN_TOP */;
            }
            else {
                padding = 'paddingBottom';
                borderWidth = 'borderBottomWidth';
                margin = 'marginBottom';
                boxMargin = 8 /* MARGIN_BOTTOM */;
            }
            if (node[borderWidth] === 0) {
                if (node[padding] === 0) {
                    while (DOCTYPE_HTML && child[margin] === 0 && child[borderWidth] === 0 && child[padding] === 0 && canResetChild(child)) {
                        const endChild = (direction ? child.firstStaticChild : child.lastStaticChild);
                        if (isBlockElement(endChild, direction)) {
                            child = endChild;
                        }
                        else {
                            break;
                        }
                    }
                    const offsetParent = node[margin];
                    const offsetChild = child[margin];
                    const height = child.bounds.height;
                    let resetChild = false;
                    if (!DOCTYPE_HTML && offsetParent === 0 && offsetChild > 0 && child.cssInitial(margin) === '') {
                        resetChild = true;
                    }
                    else {
                        const outside = offsetParent >= offsetChild;
                        if (height === 0 && outside && child.textEmpty && child.extensions.length === 0) {
                            child.hide();
                        }
                        else if (child.getBox(boxMargin)[0] !== 1) {
                            if (outside) {
                                resetChild = true;
                            }
                            else if (node.documentBody) {
                                resetMargin(node, boxMargin);
                                if (direction) {
                                    node.bounds.top = 0;
                                    node.unset('box');
                                    node.unset('linear');
                                }
                            }
                            else {
                                if (node.getBox(boxMargin)[0] !== 1) {
                                    node.modifyBox(boxMargin);
                                    node.modifyBox(boxMargin, offsetChild);
                                }
                                resetChild = true;
                            }
                        }
                    }
                    if (resetChild) {
                        resetMargin(child, boxMargin);
                        if (height === 0 && !child.every(item => item.floating)) {
                            resetMargin(child, direction ? 8 /* MARGIN_BOTTOM */ : 2 /* MARGIN_TOP */);
                        }
                    }
                }
                else if (child[margin] === 0 && child[borderWidth] === 0 && canResetChild(child)) {
                    let blockAll = true;
                    do {
                        const endChild = (direction ? child.firstStaticChild : child.lastStaticChild);
                        if (endChild && endChild[margin] === 0 && endChild[borderWidth] === 0) {
                            if (endChild[padding] > 0) {
                                if (endChild[padding] >= node[padding]) {
                                    node.modifyBox(direction ? 32 /* PADDING_TOP */ : 128 /* PADDING_BOTTOM */);
                                }
                                else if (blockAll) {
                                    node.modifyBox(direction ? 32 /* PADDING_TOP */ : 128 /* PADDING_BOTTOM */, -endChild[padding]);
                                }
                                break;
                            }
                            else {
                                if (!isBlockElement(endChild, direction)) {
                                    blockAll = false;
                                }
                                child = endChild;
                            }
                        }
                        else {
                            break;
                        }
                    } while (true);
                }
            }
        }
    }
    function resetMargin(node, value) {
        const offset = node[CSS_SPACING.get(value)];
        if (node.getBox(value)[0] === 0) {
            node.modifyBox(value);
        }
        else {
            for (const outerWrapper of node.ascend(undefined, undefined, 'outerWrapper')) {
                if (outerWrapper.getBox(value)[1] >= offset) {
                    outerWrapper.modifyBox(value, -offset);
                    break;
                }
            }
        }
    }
    function isBlockElement(node, direction, checkIndex = false) {
        if (node && !node.lineBreak) {
            let valid = false;
            if (node.blockStatic) {
                valid = true;
            }
            else if (!node.floating) {
                const display = node.display;
                if (display === 'list-item') {
                    valid = true;
                }
                if (direction !== undefined) {
                    if (display === 'table') {
                        valid = true;
                    }
                    if (direction) {
                        const firstChild = node.firstStaticChild;
                        valid = isBlockElement(firstChild) && validAboveChild(firstChild);
                    }
                    else {
                        const lastChild = node.lastStaticChild;
                        valid = isBlockElement(lastChild) && validBelowChild(lastChild);
                    }
                }
            }
            return valid && (!checkIndex || direction === undefined || node.bounds.height > 0);
        }
        return false;
    }
    const setMinHeight = (node, offset) => node.css('minHeight', $css$d.formatPX(Math.max(offset, node.hasPX('minHeight', false) ? node.parseUnit(node.css('minHeight')) : 0)));
    const canResetChild = (node) => !node.layoutElement && !node.tableElement && node.tagName !== 'FIELDSET';
    const validAboveChild = (node) => !node.hasPX('height') && node.paddingBottom === 0 && node.borderBottomWidth === 0 && canResetChild(node);
    const validBelowChild = (node) => !node.hasPX('height') && node.borderTopWidth === 0 && node.paddingTop === 0 && canResetChild(node);
    class WhiteSpace extends ExtensionUI {
        afterBaseLayout() {
            const processed = new Set();
            for (const node of this.application.processing.cache) {
                if (node.naturalElement && node.naturalElements.length && !node.layoutElement && !node.tableElement && node.id !== 0) {
                    let firstChild;
                    let lastChild;
                    const blockParent = isBlockElement(node) && !node.actualParent.layoutElement;
                    const children = node.naturalChildren;
                    const length = children.length;
                    for (let i = 0; i < length; i++) {
                        const current = children[i];
                        if (!current.pageFlow) {
                            continue;
                        }
                        if (blockParent) {
                            if (!current.floating) {
                                if (current.bounds.height > 0 || length === 1 || isBlockElement(current, i === 0 ? true : (i === length - 1 ? false : undefined), true)) {
                                    if (firstChild === undefined) {
                                        firstChild = current;
                                    }
                                    lastChild = current;
                                }
                                else if (current.bounds.height === 0 && node.layoutVertical && node.alignSibling('top') === '' && node.alignSibling('bottom') === '') {
                                    if (i === 0) {
                                        firstChild = current;
                                    }
                                    else if (i === length - 1) {
                                        lastChild = current;
                                    }
                                    current.hide();
                                }
                            }
                            else {
                                lastChild = undefined;
                            }
                        }
                        if (i > 0 && isBlockElement(current, false)) {
                            const previousSiblings = current.previousSiblings({ floating: false });
                            const lengthA = previousSiblings.length;
                            if (lengthA) {
                                const previous = previousSiblings[lengthA - 1];
                                let inheritedTop = false;
                                if (isBlockElement(previous, true)) {
                                    let marginBottom = previous.marginBottom;
                                    let marginTop = current.marginTop;
                                    if (previous.excluded && !current.excluded) {
                                        const offset = Math.min(marginBottom, previous.marginTop);
                                        if (offset < 0) {
                                            current.modifyBox(2 /* MARGIN_TOP */, Math.abs(offset) < marginTop ? offset : undefined);
                                            processed.add(previous.id);
                                            continue;
                                        }
                                    }
                                    else if (!previous.excluded && current.excluded) {
                                        const offset = Math.min(marginTop, current.marginBottom);
                                        if (offset < 0) {
                                            previous.modifyBox(8 /* MARGIN_BOTTOM */, Math.abs(offset) < marginBottom ? offset : undefined);
                                            processed.add(current.id);
                                            continue;
                                        }
                                    }
                                    let inheritedBottom = false;
                                    if (blockParent) {
                                        let inherit = previous;
                                        while (validAboveChild(inherit)) {
                                            const bottomChild = inherit.lastStaticChild;
                                            if (isBlockElement(bottomChild, true) && bottomChild.getBox(8 /* MARGIN_BOTTOM */)[0] !== 1) {
                                                const childBottom = bottomChild.marginBottom;
                                                resetMargin(bottomChild, 8 /* MARGIN_BOTTOM */);
                                                if (childBottom > marginBottom) {
                                                    marginBottom = childBottom;
                                                    previous.setCacheValue('marginBottom', marginBottom);
                                                    inheritedBottom = true;
                                                }
                                                else if (childBottom === 0 && marginBottom === 0) {
                                                    inherit = bottomChild;
                                                    continue;
                                                }
                                            }
                                            break;
                                        }
                                        inherit = current;
                                        while (validBelowChild(inherit)) {
                                            const topChild = inherit.firstStaticChild;
                                            if (isBlockElement(topChild, false) && topChild.getBox(2 /* MARGIN_TOP */)[0] !== 1) {
                                                const childTop = topChild.marginTop;
                                                resetMargin(topChild, 2 /* MARGIN_TOP */);
                                                if (childTop > marginTop) {
                                                    marginTop = childTop;
                                                    current.setCacheValue('marginTop', marginTop);
                                                    inheritedTop = true;
                                                }
                                                else if (childTop === 0 && marginTop === 0) {
                                                    inherit = topChild;
                                                    continue;
                                                }
                                            }
                                            break;
                                        }
                                    }
                                    if (marginBottom > 0) {
                                        if (marginTop > 0) {
                                            if (marginTop <= marginBottom) {
                                                if (!inheritedTop || !$util$h.hasBit(current.overflow, 64 /* BLOCK */)) {
                                                    if (inheritedTop) {
                                                        current.setCacheValue('marginTop', 0);
                                                        inheritedTop = false;
                                                    }
                                                    resetMargin(current, 2 /* MARGIN_TOP */);
                                                }
                                            }
                                            else {
                                                if (!inheritedBottom || !$util$h.hasBit(previous.overflow, 64 /* BLOCK */)) {
                                                    if (inheritedBottom) {
                                                        previous.setCacheValue('marginBottom', 0);
                                                        inheritedBottom = false;
                                                    }
                                                    resetMargin(previous, 8 /* MARGIN_BOTTOM */);
                                                }
                                            }
                                        }
                                        else if (previous.bounds.height === 0) {
                                            resetMargin(previous, 8 /* MARGIN_BOTTOM */);
                                        }
                                    }
                                    if (inheritedTop) {
                                        for (const item of current.registerBox(2 /* MARGIN_TOP */)) {
                                            item.setCacheValue('marginTop', marginTop);
                                        }
                                    }
                                    if (inheritedBottom) {
                                        for (const item of previous.registerBox(8 /* MARGIN_BOTTOM */)) {
                                            item.setCacheValue('marginBottom', marginBottom);
                                        }
                                    }
                                }
                                if (!inheritedTop && previousSiblings.length > 1) {
                                    const adjacent = previousSiblings[0];
                                    if (adjacent.floating && (node.layoutVertical || current.renderParent && current.renderParent.layoutVertical)) {
                                        const offset = adjacent.linear.top - current.linear.top;
                                        if (offset < 0) {
                                            current.modifyBox(2 /* MARGIN_TOP */, offset, false);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (!$util$h.hasBit(node.overflow, 64 /* BLOCK */) && !(node.documentParent.layoutElement && node.documentParent.css('flexDirection').startsWith('column')) && node.tagName !== 'FIELDSET') {
                        if (firstChild) {
                            applyMarginCollapse(node, firstChild, true);
                        }
                        if (lastChild) {
                            applyMarginCollapse(node, lastChild, false);
                            if (lastChild.marginTop < 0) {
                                const offset = lastChild.bounds.height + lastChild.marginBottom + lastChild.marginTop;
                                if (offset < 0) {
                                    node.modifyBox(128 /* PADDING_BOTTOM */, offset, false);
                                }
                            }
                        }
                    }
                }
            }
            for (const node of this.application.processing.excluded) {
                if (node.lineBreak && !node.lineBreakTrailing && !processed.has(node.id)) {
                    const previousSiblings = node.previousSiblings({ floating: false });
                    let valid = false;
                    if (previousSiblings.length) {
                        const actualParent = node.actualParent;
                        const nextSiblings = node.nextSiblings({ floating: false });
                        if (nextSiblings.length) {
                            let above = previousSiblings.pop();
                            let below = nextSiblings.pop();
                            const inline = above.inlineStatic && below.inlineStatic;
                            if (inline && previousSiblings.length === 0) {
                                processed.add(node.id);
                                continue;
                            }
                            let lineHeight = 0;
                            let aboveLineBreak;
                            const getMarginOffset = () => below.linear.top - (aboveLineBreak ? Math.max(aboveLineBreak.linear.top, above.linear.bottom) : above.linear.bottom) - lineHeight;
                            if (!above.multiline && above.has('lineHeight')) {
                                const aboveOffset = Math.floor((above.lineHeight - above.bounds.height) / 2);
                                if (aboveOffset > 0) {
                                    lineHeight += aboveOffset;
                                }
                            }
                            if (!below.multiline && below.has('lineHeight')) {
                                const belowOffset = Math.round((below.lineHeight - below.bounds.height) / 2);
                                if (belowOffset > 0) {
                                    lineHeight += belowOffset;
                                }
                            }
                            if (inline) {
                                aboveLineBreak = previousSiblings[0];
                                if (previousSiblings.length === 1) {
                                    if (aboveLineBreak.lineBreak) {
                                        aboveLineBreak = node;
                                    }
                                    else {
                                        aboveLineBreak = undefined;
                                    }
                                }
                                if (aboveLineBreak) {
                                    aboveLineBreak.setBounds(false);
                                }
                            }
                            let aboveParent = above.renderParent;
                            let belowParent = below.renderParent;
                            if (aboveParent && belowParent) {
                                while (aboveParent && aboveParent !== actualParent) {
                                    above = aboveParent;
                                    aboveParent = above.renderParent;
                                }
                                while (belowParent && belowParent !== actualParent) {
                                    below = belowParent;
                                    belowParent = below.renderParent;
                                }
                                if (belowParent === aboveParent) {
                                    const offset = getMarginOffset();
                                    if (offset !== 0) {
                                        if (below.visible) {
                                            below.modifyBox(2 /* MARGIN_TOP */, offset);
                                            valid = true;
                                        }
                                        else if (above.visible) {
                                            above.modifyBox(8 /* MARGIN_BOTTOM */, offset);
                                            valid = true;
                                        }
                                    }
                                }
                            }
                            else {
                                const offset = getMarginOffset();
                                if (offset !== 0) {
                                    if (below.lineBreak || below.excluded) {
                                        actualParent.modifyBox(128 /* PADDING_BOTTOM */, offset);
                                        valid = true;
                                    }
                                    else if (above.lineBreak || above.excluded) {
                                        actualParent.modifyBox(32 /* PADDING_TOP */, offset);
                                        valid = true;
                                    }
                                }
                            }
                        }
                        else if (actualParent.visible) {
                            if (!actualParent.documentRoot && actualParent.ascend(item => item.documentRoot, undefined, 'outerWrapper').length === 0) {
                                const previousStart = previousSiblings[previousSiblings.length - 1];
                                const rect = previousStart.bounds.height === 0 && previousStart.length ? NodeUI.outerRegion(previousStart) : previousStart.linear;
                                const offset = actualParent.box.bottom - (previousStart.lineBreak || previousStart.excluded ? rect.top : rect.bottom);
                                if (offset !== 0) {
                                    if (previousStart.rendered || actualParent.visibleStyle.background) {
                                        actualParent.modifyBox(128 /* PADDING_BOTTOM */, offset);
                                    }
                                    else if (!actualParent.hasHeight) {
                                        setMinHeight(actualParent, offset);
                                    }
                                }
                            }
                            else if (nextSiblings.length) {
                                const nextStart = nextSiblings[nextSiblings.length - 1];
                                const offset = (nextStart.lineBreak || nextStart.excluded ? nextStart.linear.bottom : nextStart.linear.top) - actualParent.box.top;
                                if (offset !== 0) {
                                    if (nextStart.rendered || actualParent.visibleStyle.background) {
                                        actualParent.modifyBox(32 /* PADDING_TOP */, offset);
                                    }
                                    else if (!actualParent.hasHeight) {
                                        setMinHeight(actualParent, offset);
                                    }
                                }
                            }
                            valid = true;
                        }
                        if (valid) {
                            for (const item of previousSiblings) {
                                processed.add(item.id);
                            }
                            for (const item of nextSiblings) {
                                processed.add(item.id);
                            }
                        }
                    }
                }
            }
        }
        afterConstraints() {
            const cache = this.application.processing.cache;
            for (const node of cache) {
                if (node.pageFlow) {
                    const renderParent = node.renderParent;
                    if (renderParent && node.styleElement && node.inlineVertical && !node.positioned && !node.documentParent.layoutElement && !renderParent.tableElement) {
                        if (node.blockDimension && !node.floating) {
                            if (renderParent.layoutVertical) {
                                const children = renderParent.renderChildren;
                                const index = children.findIndex(item => item === node);
                                if (index !== -1) {
                                    if (!node.lineBreakLeading) {
                                        const previous = children[index - 1];
                                        if (previous && previous.pageFlow) {
                                            setSpacingOffset(node, 2 /* MARGIN_TOP */, previous.actualRect('bottom'), previous.getBox(8 /* MARGIN_BOTTOM */)[1]);
                                        }
                                    }
                                    if (!node.lineBreakTrailing) {
                                        const next = children[index + 1];
                                        if (next && next.pageFlow && next.styleElement && !next.inlineVertical) {
                                            setSpacingOffset(node, 8 /* MARGIN_BOTTOM */, next.actualRect('top'), next.getBox(2 /* MARGIN_TOP */)[1]);
                                        }
                                    }
                                }
                            }
                            else {
                                let horizontal;
                                if (renderParent.horizontalRows) {
                                    found: {
                                        const horizontalRows = renderParent.horizontalRows;
                                        let maxBottom = Number.NEGATIVE_INFINITY;
                                        const lengthA = horizontalRows.length;
                                        for (let i = 0; i < lengthA; i++) {
                                            const row = horizontalRows[i];
                                            const lengthB = row.length;
                                            for (let j = 0; j < lengthB; j++) {
                                                if (node === row[j]) {
                                                    if (i > 0) {
                                                        setSpacingOffset(node, 2 /* MARGIN_TOP */, maxBottom);
                                                    }
                                                    else {
                                                        horizontal = row;
                                                    }
                                                    break found;
                                                }
                                            }
                                            for (const item of row) {
                                                if (item.blockDimension && !item.floating) {
                                                    const bottom = item.actualRect('bottom');
                                                    if (bottom > maxBottom) {
                                                        maxBottom = bottom;
                                                    }
                                                }
                                            }
                                            if (maxBottom === Number.NEGATIVE_INFINITY) {
                                                break;
                                            }
                                        }
                                    }
                                }
                                else if (renderParent.layoutHorizontal) {
                                    horizontal = renderParent.renderChildren;
                                }
                                if (horizontal) {
                                    const actualParent = node.actualParent;
                                    if (actualParent) {
                                        const top = node.actualRect('top');
                                        let maxBottom = Number.NEGATIVE_INFINITY;
                                        for (const item of actualParent.naturalChildren) {
                                            if (horizontal.includes(item)) {
                                                break;
                                            }
                                            else if (item.lineBreak) {
                                                maxBottom = Number.NEGATIVE_INFINITY;
                                            }
                                            else if (item.blockDimension && !item.floating) {
                                                const bottom = item.actualRect('bottom');
                                                if (bottom > maxBottom) {
                                                    maxBottom = bottom;
                                                }
                                            }
                                        }
                                        if (maxBottom !== Number.NEGATIVE_INFINITY && top > maxBottom) {
                                            setSpacingOffset(node, 2 /* MARGIN_TOP */, maxBottom);
                                        }
                                    }
                                }
                            }
                        }
                        if (renderParent.layoutHorizontal && !node.alignParent('left')) {
                            const documentId = node.alignSibling('leftRight');
                            if (documentId !== '') {
                                const previousSibling = renderParent.renderChildren.find(item => item.documentId === documentId);
                                if (previousSibling && previousSibling.inlineVertical) {
                                    setSpacingOffset(node, 16 /* MARGIN_LEFT */, previousSibling.actualRect('right'));
                                }
                            }
                            else {
                                let current = node;
                                while (true) {
                                    const siblingsLeading = current.siblingsLeading;
                                    if (siblingsLeading.length && !siblingsLeading.some(item => item.lineBreak || item.excluded && item.blockStatic)) {
                                        const previousSibling = siblingsLeading[0];
                                        if (previousSibling.inlineVertical) {
                                            setSpacingOffset(node, 16 /* MARGIN_LEFT */, previousSibling.actualRect('right'));
                                        }
                                        else if (previousSibling.floating) {
                                            current = previousSibling;
                                            continue;
                                        }
                                    }
                                    break;
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    const extensions = {
        Accessibility,
        CssGrid,
        Flexbox,
        Grid,
        List,
        Relative,
        Sprite,
        Table,
        VerticalAlign,
        WhiteSpace
    };
    const lib = {
        constant,
        enumeration
    };

    exports.Application = Application;
    exports.ApplicationUI = ApplicationUI;
    exports.Controller = Controller;
    exports.ControllerUI = ControllerUI;
    exports.Extension = Extension;
    exports.ExtensionManager = ExtensionManager;
    exports.ExtensionUI = ExtensionUI;
    exports.File = File;
    exports.FileUI = FileUI;
    exports.LayoutUI = LayoutUI;
    exports.Node = Node;
    exports.NodeGroupUI = NodeGroupUI;
    exports.NodeList = NodeList;
    exports.NodeUI = NodeUI;
    exports.Resource = Resource;
    exports.ResourceUI = ResourceUI;
    exports.extensions = extensions;
    exports.lib = lib;

    Object.defineProperty(exports, '__esModule', { value: true });

}));

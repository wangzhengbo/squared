import { ResourceStoredMapAndroid, StyleAttribute } from '../../../../@types/android/application';
import { ResourceFontsOptions } from '../../../../@types/android/extension';

import Resource from '../../resource';
import View from '../../view';

import { BUILD_ANDROID } from '../../lib/enumeration';
import { convertLength } from '../../lib/util';

type StyleList = ObjectMap<number[]>;
type SharedAttributes = ObjectMapNested<number[]>;
type AttributeMap = ObjectMap<number[]>;
type TagNameMap = ObjectMap<StyleAttribute[]>;
type NodeStyleMap = ObjectMap<string[]>;

const {
    regex: $regex,
    util: $util
} = squared.lib;

const $e = squared.base.lib.enumeration;

const STORED = <ResourceStoredMapAndroid> Resource.STORED;
const REGEXP_TAGNAME = /^(\w*?)(?:_(\d+))?$/;
const REGEXP_DOUBLEQUOTE = /"/g;
const FONT_ANDROID = {
    'sans-serif': BUILD_ANDROID.ICE_CREAM_SANDWICH,
    'sans-serif-thin': BUILD_ANDROID.JELLYBEAN,
    'sans-serif-light': BUILD_ANDROID.JELLYBEAN,
    'sans-serif-condensed': BUILD_ANDROID.JELLYBEAN,
    'sans-serif-condensed-light': BUILD_ANDROID.JELLYBEAN,
    'sans-serif-medium': BUILD_ANDROID.LOLLIPOP,
    'sans-serif-black': BUILD_ANDROID.LOLLIPOP,
    'sans-serif-smallcaps': BUILD_ANDROID.LOLLIPOP,
    'serif-monospace' : BUILD_ANDROID.LOLLIPOP,
    'serif': BUILD_ANDROID.LOLLIPOP,
    'casual' : BUILD_ANDROID.LOLLIPOP,
    'cursive': BUILD_ANDROID.LOLLIPOP,
    'monospace': BUILD_ANDROID.LOLLIPOP,
    'sans-serif-condensed-medium': BUILD_ANDROID.OREO
};
const FONTALIAS_ANDROID = {
    'arial': 'sans-serif',
    'helvetica': 'sans-serif',
    'tahoma': 'sans-serif',
    'verdana': 'sans-serif',
    'times': 'serif',
    'times new roman': 'serif',
    'palatino': 'serif',
    'georgia': 'serif',
    'baskerville': 'serif',
    'goudy': 'serif',
    'fantasy': 'serif',
    'itc stone serif': 'serif',
    'sans-serif-monospace': 'monospace',
    'monaco': 'monospace',
    'courier': 'serif-monospace',
    'courier new': 'serif-monospace'
};
const FONTREPLACE_ANDROID = {
    'ms shell dlg \\32': 'sans-serif',
    'system-ui': 'sans-serif',
    '-apple-system': 'sans-serif',
    '-webkit-standard': 'sans-serif'
};
const FONTWEIGHT_ANDROID = {
    '100': 'thin',
    '200': 'extra_light',
    '300': 'light',
    '400': 'normal',
    '500': 'medium',
    '600': 'semi_bold',
    '700': 'bold',
    '800': 'extra_bold',
    '900': 'black'
};
const FONT_STYLE = {
    'fontFamily': 'android:fontFamily="',
    'fontStyle': 'android:textStyle="',
    'fontWeight': 'android:fontWeight="',
    'fontSize': 'android:textSize="',
    'color': 'android:textColor="@color/',
    'backgroundColor': 'android:background="@color/'
};

function deleteStyleAttribute(sorted: AttributeMap[], attrs: string, ids: number[]) {
    const length = sorted.length;
    for (const value of attrs.split(';')) {
        for (let i = 0; i < length; i++) {
            let index = -1;
            let key = '';
            const data = sorted[i];
            for (const j in data) {
                if (j === value) {
                    index = i;
                    key = j;
                    i = length;
                    break;
                }
            }
            if (index !== -1) {
                sorted[index][key] = $util.filterArray(sorted[index][key], id => !ids.includes(id));
                if (sorted[index][key].length === 0) {
                    delete sorted[index][key];
                }
                break;
            }
        }
    }
}

export default class ResourceFonts<T extends View> extends squared.base.ExtensionUI<T> {
    public readonly options: ResourceFontsOptions = {
        systemDefaultFont: 'sans-serif',
        disableFontAlias: false
    };
    public readonly eventOnly = true;

    public afterParseDocument() {
        const resource = <android.base.Resource<T>> this.resource;
        const settings = resource.userSettings;
        const dpi = settings.resolutionDPI;
        const convertPixels = settings.convertPixels === 'dp';
        const { fonts, styles } = STORED;
        const nameMap: ObjectMap<T[]> = {};
        const groupMap: ObjectMap<StyleList[]> = {};
        for (const node of this.application.session.cache) {
            if (node.data(Resource.KEY_NAME, 'fontStyle') && node.hasResource($e.NODE_RESOURCE.FONT_STYLE)) {
                if (nameMap[node.containerName] === undefined) {
                    nameMap[node.containerName] = [];
                }
                nameMap[node.containerName].push(node);
            }
        }
        const styleKeys = Object.keys(FONT_STYLE);
        const length = styleKeys.length;
        for (const tag in nameMap) {
            const sorted: StyleList[] = [];
            const data = nameMap[tag];
            for (let node of data) {
                const stored: FontAttribute = { ...node.data(Resource.KEY_NAME, 'fontStyle') };
                const { id, companion } = node;
                if (companion && !companion.visible && companion.tagName === 'LABEL') {
                    node = companion as T;
                }
                if (stored.backgroundColor) {
                    stored.backgroundColor = Resource.addColor(stored.backgroundColor);
                }
                if (stored.fontFamily) {
                    stored.fontFamily.replace(REGEXP_DOUBLEQUOTE, '').split($regex.XML.SEPARATOR).some((value, index, array) => {
                        value = $util.trimString(value, "'");
                        let fontFamily = value.toLowerCase();
                        let customFont = false;
                        if (!this.options.disableFontAlias && FONTREPLACE_ANDROID[fontFamily]) {
                            fontFamily = this.options.systemDefaultFont || FONTREPLACE_ANDROID[fontFamily];
                        }
                        if (FONT_ANDROID[fontFamily] && node.localSettings.targetAPI >= FONT_ANDROID[fontFamily] || !this.options.disableFontAlias && FONTALIAS_ANDROID[fontFamily] && node.localSettings.targetAPI >= FONT_ANDROID[FONTALIAS_ANDROID[fontFamily]]) {
                            stored.fontFamily = fontFamily;
                            customFont = true;
                        }
                        else if (stored.fontStyle && stored.fontWeight) {
                            let createFont = true;
                            if (resource.getFont(value, stored.fontStyle, stored.fontWeight) === undefined) {
                                if (resource.getFont(value, stored.fontStyle)) {
                                    createFont = false;
                                }
                                else if (index < array.length - 1) {
                                    return false;
                                }
                                else if (index > 0) {
                                    value = $util.trimString(array[0], "'");
                                    fontFamily = value.toLowerCase();
                                }
                            }
                            fontFamily = $util.convertWord(fontFamily);
                            if (createFont) {
                                const fontData = fonts.get(fontFamily) || {};
                                fontData[value + '|' + stored.fontStyle + '|' + stored.fontWeight] = FONTWEIGHT_ANDROID[stored.fontWeight] || stored.fontWeight;
                                fonts.set(fontFamily, fontData);
                            }
                            stored.fontFamily = '@font/' + fontFamily;
                            customFont = true;
                        }
                        if (customFont) {
                            const fontWeight = stored.fontWeight;
                            if (stored.fontStyle === 'normal') {
                                stored.fontStyle = '';
                            }
                            if (fontWeight === '400' || node.localSettings.targetAPI < BUILD_ANDROID.OREO) {
                                stored.fontWeight = '';
                            }
                            else if (parseInt(fontWeight) > 500) {
                                stored.fontStyle += (stored.fontStyle ? '|' : '') + 'bold';
                            }
                            return true;
                        }
                        return false;
                    });
                }
                stored.color = Resource.addColor(stored.color);
                for (let i = 0; i < length; i++) {
                    const key = styleKeys[i];
                    let value: string = stored[key];
                    if (value) {
                        if (convertPixels && key === 'fontSize') {
                            value = convertLength(value, dpi, true);
                        }
                        const attr = FONT_STYLE[key] + value + '"';
                        if (sorted[i] === undefined) {
                            sorted[i] = {};
                        }
                        if (sorted[i][attr] === undefined) {
                            sorted[i][attr] = [];
                        }
                        sorted[i][attr].push(id);
                    }
                }
            }
            groupMap[tag] = sorted;
        }
        const style: SharedAttributes = {};
        for (const tag in groupMap) {
            const styleTag = {};
            style[tag] = styleTag;
            const sorted = $util.filterArray(groupMap[tag], item => item !== undefined).sort((a, b) => {
                let maxA = 0;
                let maxB = 0;
                let countA = 0;
                let countB = 0;
                for (const attr in a) {
                    maxA = Math.max(a[attr].length, maxA);
                    countA += a[attr].length;
                }
                for (const attr in b) {
                    if (b[attr]) {
                        maxB = Math.max(b[attr].length, maxB);
                        countB += b[attr].length;
                    }
                }
                if (maxA !== maxB) {
                    return maxA > maxB ? -1 : 1;
                }
                else if (countA !== countB) {
                    return countA > countB ? -1 : 1;
                }
                return 0;
            });
            do {
                if (sorted.length === 1) {
                    const data = sorted[0];
                    for (const attr in data) {
                        const item = data[attr];
                        if (item.length) {
                            styleTag[attr] = item;
                        }
                    }
                    sorted.length = 0;
                }
                else {
                    const styleKey: AttributeMap = {};
                    for (let i = 0; i < sorted.length; i++) {
                        const filtered: AttributeMap = {};
                        const dataA = sorted[i];
                        for (const attr1 in dataA) {
                            const ids = dataA[attr1];
                            if (ids.length === 0) {
                                continue;
                            }
                            else if (ids.length === nameMap[tag].length) {
                                styleKey[attr1] = ids;
                                sorted[i] = {};
                                break;
                            }
                            const found: AttributeMap = {};
                            let merged = false;
                            for (let j = 0; j < sorted.length; j++) {
                                if (i !== j) {
                                    const dataB = sorted[j];
                                    for (const attr in dataB) {
                                        const compare = dataB[attr];
                                        if (compare.length) {
                                            for (const id of ids) {
                                                if (compare.includes(id)) {
                                                    if (found[attr] === undefined) {
                                                        found[attr] = [];
                                                    }
                                                    found[attr].push(id);
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                            for (const attr2 in found) {
                                if (found[attr2].length > 1) {
                                    filtered[[attr1, attr2].sort().join(';')] = found[attr2];
                                    merged = true;
                                }
                            }
                            if (!merged) {
                                filtered[attr1] = ids;
                            }
                        }
                        if (Object.keys(filtered).length) {
                            const combined: ObjectMap<Set<string>> = {};
                            const deleteKeys = new Set<string>();
                            const joinMap: StringMap = {};
                            for (const attr in filtered) {
                                joinMap[attr] = filtered[attr].join(',');
                            }
                            for (const attr1 in filtered) {
                                for (const attr2 in filtered) {
                                    const index = joinMap[attr1];
                                    if (attr1 !== attr2 && index === joinMap[attr2]) {
                                        if (combined[index] === undefined) {
                                            combined[index] = new Set(attr1.split(';'));
                                        }
                                        for (const value of attr2.split(';')) {
                                            combined[index].add(value);
                                        }
                                        deleteKeys.add(attr1).add(attr2);
                                    }
                                }
                            }
                            for (const attr of deleteKeys) {
                                delete filtered[attr];
                            }
                            for (const attr in filtered) {
                                deleteStyleAttribute(sorted, attr, filtered[attr]);
                                styleTag[attr] = filtered[attr];
                            }
                            for (const attr in combined) {
                                const attrs = Array.from(combined[attr]).sort().join(';');
                                const ids = $util.objectMap<string, number>(attr.split($regex.XML.SEPARATOR), value => parseInt(value));
                                deleteStyleAttribute(sorted, attrs, ids);
                                styleTag[attrs] = ids;
                            }
                        }
                    }
                    const shared = Object.keys(styleKey);
                    if (shared.length) {
                        styleTag[shared.join(';')] = styleKey[shared[0]];
                    }
                    $util.spliceArray(sorted, item => {
                        for (const attr in item) {
                            if (item[attr].length) {
                                return false;
                            }
                        }
                        return true;
                    });
                }
            }
            while (sorted.length);
        }
        const resourceMap: TagNameMap = {};
        const nodeMap: NodeStyleMap = {};
        const parentStyle = new Set<string>();
        for (const tag in style) {
            const styleTag = style[tag];
            const styleData: StyleAttribute[] = [];
            for (const attrs in styleTag) {
                const items: StringValue[] = [];
                for (const value of attrs.split(';')) {
                    const match = $regex.XML.ATTRIBUTE.exec(value);
                    if (match) {
                        items.push({ key: match[1], value: match[2] });
                    }
                }
                styleData.push({
                    name: '',
                    parent: '',
                    items,
                    ids: styleTag[attrs]
                });
            }
            styleData.sort((a, b) => {
                let c = 0;
                let d = 0;
                if (a.ids && b.ids) {
                    c = a.ids.length;
                    d = b.ids.length;
                }
                if (c === d) {
                    c = (a.items as any[]).length;
                    d = (b.items as any[]).length;
                    if (c === d) {
                        c = a.items[0].name;
                        d = b.items[0].name;
                        if (c === d) {
                            c = a.items[0].value;
                            d = b.items[0].value;
                        }
                    }
                }
                return c <= d ? 1 : -1;
            });
            const lengthA = styleData.length;
            for (let i = 0; i < lengthA; i++) {
                styleData[i].name = $util.capitalize(tag) + (i > 0 ? '_' + i : '');
            }
            resourceMap[tag] = styleData;
        }
        for (const tag in resourceMap) {
            for (const group of resourceMap[tag]) {
                if (group.ids) {
                    for (const id of group.ids) {
                        if (nodeMap[id] === undefined) {
                            nodeMap[id] = [];
                        }
                        nodeMap[id].push(group.name);
                    }
                }
            }
        }
        for (const node of this.application.session.cache) {
            const styleData = nodeMap[node.id];
            if (styleData && styleData.length) {
                switch (node.tagName) {
                    case 'METER':
                    case 'PROGRESS':
                        node.attr('_', 'style', '@android:style/Widget.ProgressBar.Horizontal');
                        break;
                    default:
                        if (styleData.length > 1) {
                            parentStyle.add(styleData.join('.'));
                            styleData.shift();
                        }
                        else {
                            parentStyle.add(styleData[0]);
                        }
                        node.attr('_', 'style', '@style/' + styleData.join('.'));
                        break;
                }
            }
        }
        for (const value of parentStyle) {
            const styleName: string[] = [];
            let items: StringValue[] | undefined;
            let parent = '';
            value.split('.').forEach((tag, index, array) => {
                const match = REGEXP_TAGNAME.exec(tag);
                if (match) {
                    const styleData = resourceMap[match[1].toUpperCase()][$util.convertInt(match[2])];
                    if (styleData) {
                        if (index === 0) {
                            parent = tag;
                            if (array.length === 1) {
                                items = <StringValue[]> styleData.items;
                            }
                            else if (!styles.has(tag)) {
                                styles.set(tag, { name: tag, parent: '', items: styleData.items });
                            }
                        }
                        else {
                            if (items) {
                                for (const item of styleData.items as StringValue[]) {
                                    const replaceIndex = items.findIndex(previous => previous.key === item.key);
                                    if (replaceIndex !== -1) {
                                        items[replaceIndex] = item;
                                    }
                                    else {
                                        items.push(item);
                                    }
                                }
                            }
                            else {
                                items = (<StringValue[]> styleData.items).slice(0);
                            }
                            styleName.push(tag);
                        }
                    }
                }
            });
            if (items) {
                if (styleName.length === 0) {
                    styles.set(parent, { name: parent, parent: '', items });
                }
                else {
                    const name = styleName.join('.');
                    styles.set(name, { name, parent, items });
                }
            }
        }
    }
}
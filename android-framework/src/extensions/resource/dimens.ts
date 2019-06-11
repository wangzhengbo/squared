import { ResourceStoredMapAndroid } from '../../@types/application';

import Resource from '../../resource';
import View from '../../view';

import { STRING_ANDROID } from '../../lib/constant';

const $regex = squared.lib.regex;
const $util = squared.lib.util;

const STORED = <ResourceStoredMapAndroid> Resource.STORED;
const REGEXP_WIDGETNAME = /:(\w+)="(-?[\d.]+px)"/;
const REGEXP_DEVICEUNIT = /\dpx$/;
const NAMESPACE_ATTR = [STRING_ANDROID.ANDROID, STRING_ANDROID.APP];

function getResourceName(map: Map<string, string>, name: string, value: string) {
    for (const [storedName, storedValue] of map.entries()) {
        if (storedName.startsWith(name) && value === storedValue) {
            return storedName;
        }
    }
    return map.has(name) && map.get(name) !== value ? Resource.generateId('dimen', name) : name;
}

const getDisplayName = (value: string) => $util.fromLastIndexOf(value, '.');

export default class ResourceDimens<T extends View> extends squared.base.ExtensionUI<T> {
    public readonly eventOnly = true;

    public beforeCascade() {
        const groups: ObjectMapNested<T[]> = {};
        for (const node of this.application.session.cache) {
            if (node.visible) {
                const containerName = node.containerName.toLowerCase();
                if (groups[containerName] === undefined) {
                    groups[containerName] = {};
                }
                for (const namespace of NAMESPACE_ATTR) {
                    const obj = node.namespace(namespace);
                    for (const attr in obj) {
                        if (attr !== 'text') {
                            const value = obj[attr].trim();
                            if (REGEXP_DEVICEUNIT.test(value)) {
                                const dimen = `${namespace},${attr},${value}`;
                                if (groups[containerName][dimen] === undefined) {
                                    groups[containerName][dimen] = [];
                                }
                                groups[containerName][dimen].push(node);
                            }
                        }
                    }
                }
            }
        }
        for (const containerName in groups) {
            const group = groups[containerName];
            for (const name in group) {
                const [namespace, attr, value] = name.split($regex.XML.SEPARATOR);
                const key = getResourceName(STORED.dimens, `${getDisplayName(containerName)}_${$util.convertUnderscore(attr)}`, value);
                const data = group[name];
                for (const node of data) {
                    node[namespace](attr, `@dimen/${key}`);
                }
                STORED.dimens.set(key, value);
            }
        }
    }

    public afterFinalize() {
        if (this.application.controllerHandler.hasAppendProcessing()) {
            for (const layout of this.application.layouts) {
                let content = layout.content;
                let match: RegExpExecArray | null;
                while ((match = REGEXP_WIDGETNAME.exec(content)) !== null) {
                    if (match[1] !== 'text') {
                        const key = getResourceName(STORED.dimens, `custom_${$util.convertUnderscore(match[1])}`, match[2]);
                        STORED.dimens.set(key, match[2]);
                        content = content.replace(match[0], match[0].replace(match[2], `@dimen/${key}`));
                    }
                }
                layout.content = content;
            }
        }
    }
}
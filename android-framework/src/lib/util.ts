import { StyleAttribute } from '../@types/application';
import { ViewAttribute } from '../@types/node';

import { XMLNS_ANDROID } from './constant';
import { BUILD_ANDROID } from './enumeration';

const $util = squared.lib.util;

export function stripId(value: string) {
    return value ? value.replace(/^@\+?id\//, '') : '';
}

export function createViewAttribute(options?: ExternalData): ViewAttribute {
    return {
        android: {},
        app: {},
        ...options
    };
}

export function createStyleAttribute(options?: ExternalData) {
    const result: StyleAttribute = {
        output: {
            path: 'res/values',
            file: ''
        },
        name: '',
        parent: '',
        items: {}
    };
    if (options && typeof options === 'object') {
        for (const attr in result) {
            if (typeof options[attr] === typeof result[attr]) {
                result[attr] = options[attr];
            }
        }
    }
    return result;
}

export function localizeString(value: string, rtl: boolean, api: number) {
    if (rtl && api >= BUILD_ANDROID.JELLYBEAN_1) {
        switch (value) {
            case 'left':
                return 'start';
            case 'right':
                return 'end';
            case 'layout_marginLeft':
                return 'layout_marginStart';
            case 'layout_marginRight':
                return 'layout_marginEnd';
            case 'paddingLeft':
                return 'paddingStart';
            case 'paddingRight':
                return 'paddingEnd';
            case 'layout_alignParentLeft':
                return 'layout_alignParentStart';
            case 'layout_alignParentRight':
                return 'layout_alignParentEnd';
            case 'layout_alignLeft':
                return 'layout_alignStart';
            case 'layout_alignRight':
                return 'layout_alignEnd';
            case 'layout_toRightOf':
                return 'layout_toEndOf';
            case 'layout_toLeftOf':
                return 'layout_toStartOf';
            case 'layout_constraintLeft_toLeftOf':
                return 'layout_constraintStart_toStartOf';
            case 'layout_constraintRight_toRightOf':
                return 'layout_constraintEnd_toEndOf';
            case 'layout_constraintLeft_toRightOf':
                return 'layout_constraintStart_toEndOf';
            case 'layout_constraintRight_toLeftOf':
                return 'layout_constraintEnd_toStartOf';
        }
    }
    return value;
}

export function getXmlNs(...values: string[]) {
    return $util.joinMap(values, namespace => XMLNS_ANDROID[namespace] ? `xmlns:${namespace}="${XMLNS_ANDROID[namespace]}"` : '', ' ').trim();
}

export function getRootNs(value: string) {
    let output = '';
    for (const namespace in XMLNS_ANDROID) {
        if (value.indexOf(`${namespace}:`) !== -1) {
            output += `\n\t${getXmlNs(namespace)}`;
        }
    }
    return output;
}
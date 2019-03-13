import { ResourceStringsOptions } from '../../@types/extension';

import Resource from '../../resource';

const $enum = squared.base.lib.enumeration;
const $css = squared.lib.css;
const $util = squared.lib.util;
const $xml = squared.lib.xml;

function getOptionArray(element: HTMLSelectElement, replaceEntities = false) {
    const stringArray: string[] = [];
    let numberArray: string[] | undefined = [];
    let i = -1;
    while (++i < element.children.length) {
        const item = <HTMLOptionElement> element.children[i];
        const value = item.text.trim();
        if (value !== '') {
            if (numberArray && stringArray.length === 0 && $util.isNumber(value)) {
                numberArray.push(value);
            }
            else {
                if (numberArray && numberArray.length) {
                    i = -1;
                    numberArray = undefined;
                    continue;
                }
                if (value !== '') {
                    stringArray.push(replaceEntities ? $xml.replaceEntity(value) : value);
                }
            }
        }
    }
    return [stringArray.length ? stringArray : undefined, numberArray && numberArray.length ? numberArray : undefined];
}

export default class ResourceStrings<T extends android.base.View> extends squared.base.Extension<T> {
    public readonly options: ResourceStringsOptions = {
        numberResourceValue: false
    };

    public readonly eventOnly = true;

    public afterResources() {
        for (const node of this.application.processing.cache) {
            if (!node.hasBit('excludeResource', $enum.NODE_RESOURCE.VALUE_STRING)) {
                switch (node.tagName) {
                    case 'SELECT': {
                        const element = <HTMLSelectElement> node.element;
                        const [stringArray, numberArray] = getOptionArray(<HTMLSelectElement> element, this.application.userSettings.replaceCharacterEntities);
                        let result: string[] | undefined;
                        if (!this.options.numberResourceValue && numberArray && numberArray.length) {
                            result = numberArray;
                        }
                        else {
                            const resourceArray = stringArray || numberArray;
                            if (resourceArray) {
                                result = [];
                                for (let value of resourceArray) {
                                    value = Resource.addString($xml.replaceCharacter(value), '', this.options.numberResourceValue);
                                    result.push(value !== '' ? `@string/${value}` : '');
                                }
                            }
                        }
                        if (result && result.length) {
                            const arrayValue = result.join('-');
                            let arrayName = '';
                            for (const [storedName, storedResult] of Resource.STORED.arrays.entries()) {
                                if (arrayValue === storedResult.join('-')) {
                                    arrayName = storedName;
                                    break;
                                }
                            }
                            if (arrayName === '') {
                                arrayName = `${node.controlId}_array`;
                                Resource.STORED.arrays.set(arrayName, result);
                            }
                            node.android('entries', `@array/${arrayName}`, false);
                        }
                        break;
                    }
                    case 'IFRAME': {
                        const stored: NameValue = node.data(Resource.KEY_NAME, 'valueString');
                        const value = $xml.replaceCharacter(stored.value);
                        Resource.addString(value, stored.name);
                        break;
                    }
                    default: {
                        const stored: NameValue = node.data(Resource.KEY_NAME, 'valueString');
                        if (stored) {
                            const renderParent = node.renderParent as T;
                            let value = stored.value;
                            if (renderParent && renderParent.layoutRelative) {
                                if (node.alignParent('left') && !$css.isParentStyle(node.element, 'whiteSpace', 'pre', 'pre-wrap')) {
                                    const textContent = node.textContent;
                                    let leadingSpace = 0;
                                    for (let i = 0; i < textContent.length; i++) {
                                        switch (textContent.charCodeAt(i)) {
                                            case 160:
                                                leadingSpace++;
                                            case 32:
                                                continue;
                                            default:
                                                break;
                                        }
                                    }
                                    if (leadingSpace === 0) {
                                        value = value.replace(/^(\s|&#160;)+/, '');
                                    }
                                }
                            }
                            value = $xml.replaceCharacter(value);
                            if (node.htmlElement) {
                                if (node.css('fontVariant') === 'small-caps') {
                                    value = value.toUpperCase();
                                }
                            }
                            const actualParent = node.actualParent;
                            if (actualParent) {
                                let textIndent = 0;
                                if (actualParent.blockDimension || node.blockDimension) {
                                    textIndent = node.toInt('textIndent') || actualParent.toInt('textIndent');
                                }
                                if (textIndent !== 0 && (node.blockDimension || actualParent.firstChild === node)) {
                                    if (textIndent > 0) {
                                        value = '&#160;'.repeat(Math.floor(textIndent / 7)) + value;
                                    }
                                    else if (node.toInt('textIndent') + node.bounds.width < 0) {
                                        value = '';
                                    }
                                }
                            }
                            const name = Resource.addString(value, stored.name, this.options.numberResourceValue);
                            if (name !== '') {
                                node.android('text', this.options.numberResourceValue || !$util.isNumber(name) ? `@string/${name}` : name, false);
                            }
                        }
                    }
                }
            }
        }
    }
}
import { ControllerSettings } from '../../src/base/@types/application';
import { UserSettingsChrome } from './@types/application';

import View from './view';

import $NodeList = squared.base.NodeList;

let DEFAULT_VIEWSETTINGS!: { floatPrecision: number };

export default class Controller<T extends View> extends squared.base.Controller<T> implements chrome.base.Controller<T> {
    public readonly localSettings: ControllerSettings = {
        svg: {
            enabled: true
        },
        supported: {
            fontFormat: ['truetype', 'opentype', 'woff', 'woff2', 'embedded-opentype', 'svg'],
            imageFormat: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'ico', 'cur', 'pdf']
        },
        unsupported: {
            cascade: new Set(),
            tagName: new Set(),
            excluded: new Set()
        },
        precision: {
            standardFloat: 4
        }
    };

    private _elementMap = new Map<Element, T>();

    public init() {
        if (this.userSettings.excludeNonRenderedElements) {
            this.localSettings.unsupported.tagName = new Set([
                'SCRIPT',
                'STYLE',
                'INPUT:hidden',
                'MAP',
                'AREA',
                'SOURCE',
                'TEMPLATE',
                'DATALIST',
                'WBR'
            ]);
        }
        else {
            this.localSettings.unsupported.tagName.clear();
        }
        DEFAULT_VIEWSETTINGS = {
            floatPrecision: this.localSettings.precision.standardFloat
        };
    }

    public reset() {
        this._elementMap.clear();
    }

    public addElement(node: T) {
        node.rendered = !this.localSettings.unsupported.tagName.has(node.tagName);
        this._elementMap.set(<Element> node.element, node);
    }

    public addElementList(list: squared.base.NodeList<T>) {
        for (const node of list) {
            node.rendered = !this.localSettings.unsupported.tagName.has(node.tagName);
            this._elementMap.set(<Element> node.element, node);
        }
    }

    public evaluateNonStatic(documentRoot: T, cache: $NodeList<T>) {
        for (const node of cache) {
            if (!node.documentRoot) {
                let parent: T | undefined;
                switch (node.css('position')) {
                    case 'fixed':
                        parent = documentRoot;
                        break;
                    case 'absolute':
                        parent = node.absoluteParent as T;
                        break;
                }
                node.documentParent = parent || node.parent as T;
            }
        }
    }

    public applyDefaultStyles() {}

    public includeElement() {
        return true;
    }

    public visibleElement() {
        return true;
    }

    get elementMap() {
        return this._elementMap;
    }

    get userSettings() {
        return <UserSettingsChrome> this.application.userSettings;
    }

    get afterInsertNode(): BindGeneric<T, void> {
        return (target: View) => target.localSettings = DEFAULT_VIEWSETTINGS;
    }
}
import { NodeXmlTemplate } from '../../../@types/base/application';

import Resource from '../resource';
import View from '../view';

import { EXT_ANDROID } from '../lib/constant';
import { CONTAINER_NODE } from '../lib/enumeration';
import { createViewAttribute } from '../lib/util';

const $css = squared.lib.css;
const $e = squared.base.lib.enumeration;

export default class Substitute<T extends View> extends squared.base.ExtensionUI<T> {
    constructor(
        name: string,
        framework: number,
        options?: ExternalData,
        tagNames?: string[])
    {
        super(name, framework, options, tagNames);
        this.require(EXT_ANDROID.EXTERNAL, true);
    }

    public processNode(node: T, parent: T) {
        const name = this.name;
        const data = $css.getDataSet(<HTMLElement> node.element, name);
        const controlName = data.tag;
        if (controlName) {
            node.containerType = node.blockStatic ? CONTAINER_NODE.BLOCK : CONTAINER_NODE.INLINE;
            node.setControlType(controlName);
            node.render(parent);
            const tagChild = data.tagChild;
            if (tagChild) {
                node.addAlign($e.NODE_ALIGNMENT.AUTO_LAYOUT);
                node.each(item => {
                    if (item.styleElement) {
                        const dataset = item.dataset;
                        dataset.use = name;
                        dataset.androidSubstituteTag = tagChild;
                    }
                });
            }
            return {
                output: <NodeXmlTemplate<T>> {
                    type: $e.NODE_TEMPLATE.XML,
                    node,
                    controlName
                }
            };
        }
        return undefined;
    }

    public postOptimize(node: T) {
        node.apply(
            Resource.formatOptions(
                createViewAttribute(this.options[node.elementId]),
                this.application.extensionManager.optionValueAsBoolean(EXT_ANDROID.RESOURCE_STRINGS, 'numberResourceValue')
            )
        );
    }
}
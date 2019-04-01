import { ImageAsset } from '../@types/application';

import Extension from '../extension';
import Node from '../node';

import { EXT_NAME } from '../lib/constant';

const $css = squared.lib.css;
const $util = squared.lib.util;

export default abstract class Sprite<T extends Node> extends Extension<T> {
    public condition(node: T) {
        let valid = false;
        if (node.hasWidth && node.hasHeight && node.length === 0 && (this.included(<HTMLElement> node.element) || !node.dataset.use)) {
            let url = node.css('backgroundImage');
            if (url === '' || url === 'none') {
                const match = $util.REGEXP_COMPILED.URL.exec(node.css('background'));
                url = match ? match[0] : '';
            }
            if (url !== '') {
                url = $css.resolveURL(url);
                const image = <ImageAsset> this.application.session.image.get(url);
                if (image) {
                    const dimension = node.actualDimension;
                    const fontSize = node.fontSize;
                    const position = $css.getBackgroundPosition(`${node.css('backgroundPositionX')} ${node.css('backgroundPositionY')}`, dimension, fontSize);
                    if (position.left <= 0 && position.top <= 0 && image.width > dimension.width && image.height > dimension.height) {
                        image.position = { x: position.left, y: position.top };
                        node.data(EXT_NAME.SPRITE, 'mainData', image);
                        valid = true;
                    }
                }
            }
        }
        return valid;
    }
}
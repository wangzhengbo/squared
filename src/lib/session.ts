import { assignRect, newRectDimension } from './dom';
import { withinRange } from './util';

type Node = squared.base.Node;

export function getClientRect(element: Element, sessionId: string, cache = true) {
    if (cache) {
        const rect: ClientRect = getElementCache(element, 'boundingClientRect', sessionId);
        if (rect) {
            return rect;
        }
    }
    const bounds = element.getBoundingClientRect();
    setElementCache(element, 'boundingClientRect', sessionId, bounds);
    return bounds;
}

export function getRangeClientRect(element: Element, sessionId: string, cache = true) {
    if (cache) {
        const rect: ClientRect = getElementCache(element, 'rangeClientRect', sessionId);
        if (rect) {
            return rect;
        }
    }
    const range = document.createRange();
    range.selectNodeContents(element);
    const clientRects = range.getClientRects();
    const domRect: ClientRect[] = [];
    for (let i = 0; i < clientRects.length; i++) {
        const item = <ClientRect> clientRects.item(i);
        if (!(Math.round(item.width) === 0 && withinRange(item.left, item.right))) {
            domRect.push(item);
        }
    }
    let bounds: RectDimension = newRectDimension();
    let multiline = 0;
    let maxTop = Number.NEGATIVE_INFINITY;
    if (domRect.length) {
        bounds = assignRect(domRect[0]);
        for (let i = 1 ; i < domRect.length; i++) {
            const rect = domRect[i];
            if (rect.left < bounds.left) {
                bounds.left = rect.left;
            }
            if (rect.right > bounds.right) {
                bounds.right = rect.right;
            }
            if (rect.top < bounds.top) {
                bounds.top = rect.top;
            }
            if (rect.bottom > bounds.bottom) {
                bounds.bottom = rect.bottom;
            }
            if (rect.height > bounds.height) {
                bounds.height = rect.height;
            }
            bounds.width += rect.width;
            if (rect.top > maxTop) {
                maxTop = rect.top;
            }
        }
        if (domRect.length > 1 && maxTop >= domRect[0].bottom && element.textContent && (element.textContent.trim() !== '' || /^\s*\n/.test(element.textContent))) {
            multiline = domRect.length - 1;
        }
    }
    (<TextDimension> bounds).multiline = multiline;
    setElementCache(element, 'rangeClientRect', sessionId, bounds);
    return <TextDimension> bounds;
}

export function causesLineBreak(element: Element, sessionId: string) {
    if (element.tagName === 'BR') {
        return true;
    }
    else {
        const node = getElementAsNode<Node>(element, sessionId);
        if (node) {
            return node.excluded && node.blockStatic;
        }
    }
    return false;
}

export function setElementCache(element: Element, attr: string, sessionId: string, data: any) {
    element[`__${attr}::${sessionId}`] = data;
}

export function getElementCache(element: Element, attr: string, sessionId: string) {
    return element[`__${attr}::${sessionId}`];
}

export function deleteElementCache(element: Element, attr: string, sessionId: string) {
    delete element[`__${attr}::${sessionId}`];
}

export function getElementAsNode<T>(element: Element, sessionId: string): T | undefined {
    const node = getElementCache(element, 'node', sessionId);
    return node && node.naturalElement ? node : undefined;
}
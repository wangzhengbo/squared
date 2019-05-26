import { NodeTemplate } from './@types/application';
import { CachedValue, InitialData, SiblingOptions, Support } from './@types/node';

import Extension from './extension';

import { CSS_BORDER, CSS_SPACING } from './lib/constant';
import { APP_SECTION, BOX_STANDARD, CSS_STANDARD, NODE_ALIGNMENT, NODE_PROCEDURE, NODE_RESOURCE, NODE_TRAVERSE } from './lib/enumeration';

type T = Node;

const $const = squared.lib.constant;
const $css = squared.lib.css;
const $dom = squared.lib.dom;
const $session = squared.lib.session;
const $util = squared.lib.util;

const REGEXP_BACKGROUND = /\s*(url\(.+?\))\s*/;
const INHERIT_ALIGNMENT = ['position', 'display', 'verticalAlign', 'float', 'clear', 'zIndex'];
const CSS_SPACING_KEYS = Array.from(CSS_SPACING.keys());

export default abstract class Node extends squared.lib.base.Container<T> implements squared.base.Node {
    public alignmentType = 0;
    public depth = -1;
    public siblingIndex = Number.POSITIVE_INFINITY;
    public documentRoot = false;
    public visible = true;
    public excluded = false;
    public rendered = false;
    public baselineActive = false;
    public baselineAltered = false;
    public lineBreakLeading = false;
    public lineBreakTrailing = false;
    public floatContainer = false;
    public positioned = false;
    public controlId = '';
    public style!: CSSStyleDeclaration;
    public renderExtension?: Extension<T>[];

    public abstract renderParent?: T;
    public abstract renderTemplates?: (NodeTemplate<T> | null)[];
    public abstract outerWrapper?: T;
    public abstract innerWrapped?: T;
    public abstract companion?: T;
    public abstract extracted?: T[];
    public abstract horizontalRows?: T[][];
    public abstract innerBefore?: T;
    public abstract innerAfter?: T;
    public abstract readonly localSettings: {};
    public abstract readonly renderChildren: T[];

    protected _styleMap!: StringMap;
    protected _box?: BoxRectDimension;
    protected _bounds?: BoxRectDimension;
    protected _linear?: BoxRectDimension;
    protected _controlName?: string;
    protected _documentParent?: T;
    protected readonly _initial: InitialData<T> = {
        iteration: -1,
        children: [],
        styleMap: {}
    };

    protected abstract _namespaces: string[];
    protected abstract _cached: CachedValue<T>;
    protected abstract readonly _boxAdjustment: BoxModel;
    protected abstract readonly _boxReset: BoxModel;

    private _data = {};
    private _excludeSection = 0;
    private _excludeProcedure = 0;
    private _excludeResource = 0;
    private _fontSize = 0;
    private _inlineText = false;
    private _parent?: T;
    private _renderAs?: T;
    private _siblingsLeading?: T[];
    private _siblingsTrailing?: T[];
    private readonly _element: Element | null = null;

    protected constructor(
        public readonly id: number,
        public readonly sessionId = '0',
        element?: Element)
    {
        super();
        if (element) {
            this._element = element;
            this.init();
        }
        else {
            this._styleMap = {};
            this.style = <CSSStyleDeclaration> {};
        }
    }

    public abstract setControlType(viewName: string, containerType?: number): void;
    public abstract setLayout(width?: number, height?: number): void;
    public abstract setAlignment(): void;
    public abstract setBoxSpacing(): void;
    public abstract clone(id?: number, attributes?: boolean, position?: boolean): T;
    public abstract extractAttributes(depth?: number): string;
    public abstract alignParent(position: string): boolean;
    public abstract alignSibling(position: string, documentId?: string): string;
    public abstract localizeString(value: string): string;
    public abstract set containerType(value: number);
    public abstract get containerType(): number;
    public abstract get documentId(): string;
    public abstract get baselineHeight(): number;
    public abstract get support(): Support;
    public abstract set renderExclude(value: boolean);
    public abstract get renderExclude(): boolean;

    public cloneBase(node: T) {
        Object.assign(node.localSettings, this.localSettings);
        node.tagName = this.tagName;
        node.alignmentType = this.alignmentType;
        node.depth = this.depth;
        node.visible = this.visible;
        node.excluded = this.excluded;
        node.rendered = this.rendered;
        node.siblingIndex = this.siblingIndex;
        if (this.inlineText) {
            node.setInlineText(true, true);
        }
        node.lineBreakLeading = this.lineBreakLeading;
        node.lineBreakTrailing = this.lineBreakTrailing;
        node.renderParent = this.renderParent;
        node.documentParent = this.documentParent;
        node.documentRoot = this.documentRoot;
        if (this.length) {
            node.retain(this.duplicate());
        }
        node.inherit(this, 'initial', 'base', 'alignment', 'styleMap', 'textStyle');
        Object.assign(node.unsafe('cached'), this._cached);
    }

    public init() {
        const element = <HTMLElement> this._element;
        if (element) {
            if (this.sessionId !== '0') {
                $session.setElementCache(element, 'node', this.sessionId, this);
            }
            this.style = $session.getElementCache(element, 'style', '0') || $css.getStyle(element, undefined, false);
            this._styleMap = { ...$session.getElementCache(element, 'styleMap', this.sessionId) };
            if ($css.hasComputedStyle(element) && !this.pseudoElement && this.sessionId !== '0') {
                for (let attr of Array.from(element.style)) {
                    let value = element.style.getPropertyValue(attr);
                    attr = $util.convertCamelCase(attr);
                    value = $css.checkStyleValue(element, attr, value, this.style, 1000);
                    if (value) {
                        this._styleMap[attr] = value;
                    }
                }
            }
        }
    }

    public saveAsInitial(overwrite = false) {
        if (this._initial.iteration === -1 || overwrite) {
            this._initial.children = this.duplicate();
            this._initial.styleMap = { ...this._styleMap };
        }
        if (this._bounds) {
            this._initial.bounds = $dom.assignRect(this._bounds);
            this._initial.linear = $dom.assignRect(this.linear);
            this._initial.box = $dom.assignRect(this.box);
        }
        this._initial.iteration++;
    }

    public is(containerType: number) {
        return this.containerType === containerType;
    }

    public of(containerType: number, ...alignmentType: number[]) {
        return this.containerType === containerType && alignmentType.some(value => this.hasAlign(value));
    }

    public unsafe(name: string, unset = false): any {
        if (unset) {
            delete this[`_${name}`];
        }
        else {
            return this[`_${name}`];
        }
    }

    public attr(name: string, attr: string, value?: string, overwrite = true): string {
        let obj = this[`__${name}`];
        if (value) {
            if (obj === undefined) {
                if (!this._namespaces.includes(name)) {
                    this._namespaces.push(name);
                }
                obj = {};
                this[`__${name}`] = obj;
            }
            if (!overwrite && obj[attr]) {
                return '';
            }
            obj[attr] = value.toString();
            return obj[attr];
        }
        else {
            return obj && obj[attr] || '';
        }
    }

    public namespace(name: string): StringMap {
        return this[`__${name}`] || {};
    }

    public delete(name: string, ...attrs: string[]) {
        const obj = this[`__${name}`];
        if (obj) {
            for (const attr of attrs) {
                if (attr.indexOf('*') !== -1) {
                    for (const [key] of $util.searchObject(obj, attr)) {
                        delete obj[key];
                    }
                }
                else {
                    delete obj[attr];
                }
            }
        }
    }

    public apply(options: {}) {
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

    public render(parent?: T) {
        this.renderParent = parent;
        this.rendered = true;
    }

    public renderEach(predicate: IteratorPredicate<T, void>) {
        for (let i = 0; i < this.renderChildren.length; i++) {
            if (this.renderChildren[i].visible) {
                predicate(this.renderChildren[i], i, this.renderChildren);
            }
        }
        return this;
    }

    public renderFilter(predicate: IteratorPredicate<T, boolean>) {
        return $util.filterArray(this.renderChildren, predicate);
    }

    public hide(invisible?: boolean) {
        this.rendered = true;
        this.visible = false;
        const renderParent = this.renderParent;
        if (renderParent && renderParent.renderTemplates) {
            const index = renderParent.renderChildren.findIndex(node => node === this);
            if (index !== -1) {
                const template = renderParent.renderTemplates[index];
                if (template && template.node === this) {
                    renderParent.renderTemplates[index] = null;
                }
            }
        }
    }

    public data(name: string, attr: string, value?: any, overwrite = true) {
        if ($util.hasValue(value)) {
            if (typeof this._data[name] !== 'object') {
                this._data[name] = {};
            }
            if (overwrite || this._data[name][attr] === undefined) {
                this._data[name][attr] = value;
            }
        }
        else if (value === null) {
            delete this._data[name];
        }
        return this._data[name] === undefined || this._data[name][attr] === undefined ? undefined : this._data[name][attr];
    }

    public unsetCache(...attrs: string[]) {
        if (attrs.length) {
            for (const attr of attrs) {
                switch (attr) {
                    case 'position':
                        this._cached = {};
                        return;
                    case 'width':
                        this._cached.percentWidth = undefined;
                        this._cached.actualWidth = undefined;
                    case 'minWidth':
                        this._cached.width = undefined;
                        break;
                    case 'height':
                        this._cached.percentHeight = undefined;
                        this._cached.actualHeight = undefined;
                    case 'minHeight':
                        this._cached.height = undefined;
                        break;
                    case 'verticalAlign':
                        this._cached.baseline = undefined;
                        break;
                    case 'display':
                        this._cached.inline = undefined;
                        this._cached.inlineVertical = undefined;
                        this._cached.inlineFlow = undefined;
                        this._cached.block = undefined;
                        this._cached.blockDimension = undefined;
                        this._cached.blockStatic = undefined;
                        this._cached.autoMargin = undefined;
                        break;
                    case 'backgroundColor':
                    case 'backgroundImage':
                        this._cached.visibleStyle = undefined;
                        break;
                    case 'pageFlow':
                        this._cached.positionAuto = undefined;
                        this._cached.blockStatic = undefined;
                        this._cached.baseline = undefined;
                        this._cached.floating = undefined;
                        this._cached.autoMargin = undefined;
                        this._cached.rightAligned = undefined;
                        this._cached.bottomAligned = undefined;
                        break;
                    case 'float':
                        this._cached.floating = undefined;
                        break;
                    default:
                        if (attr.startsWith('margin')) {
                            this._cached.autoMargin = undefined;
                        }
                        if (attr.startsWith('padding') || attr.startsWith('border')) {
                            this._cached.contentBoxWidth = undefined;
                            this._cached.contentBoxHeight = undefined;
                        }
                        break;
                }
                this._cached[attr] = undefined;
            }
        }
        else {
            this._cached = {};
        }
    }

    public ascend(generated = false, condition?: (item: T) => boolean, parent?: T) {
        const result: T[] = [];
        const attr = !generated ? 'actualParent'
                                : this.renderParent ? 'renderParent' : 'parent';
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

    public ascendOuter(condition?: (item: T) => boolean, parent?: T) {
        const result: T[] = [];
        let current = this.outerWrapper;
        while (current && current !== parent) {
            if (condition) {
                if (condition(current)) {
                    return [current];
                }
            }
            else {
                result.push(current);
            }
            current = current.outerWrapper;
        }
        return result;
    }

    public inherit(node: T, ...modules: string[]) {
        const initial = <InitialData<T>> node.unsafe('initial');
        for (const name of modules) {
            switch (name) {
                case 'initial':
                    $util.cloneObject(initial, this._initial);
                    break;
                case 'base':
                    this._documentParent = node.documentParent;
                    this._bounds = $dom.assignRect(node.bounds);
                    this._linear = $dom.assignRect(node.linear);
                    this._box = $dom.assignRect(node.box);
                    if (node.actualParent) {
                        this.dir = node.actualParent.dir;
                    }
                    break;
                case 'alignment':
                    this.positionAuto = node.positionAuto;
                    for (const attr of INHERIT_ALIGNMENT) {
                        this._styleMap[attr] = node.css(attr);
                        this._initial.styleMap[attr] = initial.styleMap[attr];
                    }
                    if (!this.positionStatic) {
                        for (const attr of $css.BOX_POSITION) {
                            if (node.has(attr)) {
                                this._styleMap[attr] = node.css(attr);
                            }
                            this._initial.styleMap[attr] = initial.styleMap[attr];
                        }
                    }
                    if (node.autoMargin.horizontal || node.autoMargin.vertical) {
                        for (const attr of $css.BOX_MARGIN) {
                            if (node.cssInitial(attr) === $const.CSS.AUTO) {
                                this._styleMap[attr] = $const.CSS.AUTO;
                                this._initial.styleMap[attr] = $const.CSS.AUTO;
                            }
                        }
                    }
                    break;
                case 'styleMap':
                    $util.assignEmptyProperty(this._styleMap, node.unsafe('styleMap'));
                    break;
                case 'textStyle':
                    this.cssApply({
                        fontFamily: node.css('fontFamily'),
                        fontSize: $css.formatPX(node.fontSize),
                        fontWeight: node.css('fontWeight'),
                        fontStyle: node.css('fontStyle'),
                        color: node.css('color'),
                        whiteSpace: node.css('whiteSpace'),
                        textDecoration: node.css('textDecoration'),
                        textTransform: node.css('textTransform'),
                        wordSpacing: node.css('wordSpacing'),
                        opacity: node.css('opacity')
                    });
                    break;
            }
        }
    }

    public alignedVertically(siblings?: T[], cleared?: Map<T, string>, horizontal?: boolean) {
        if (this.lineBreak) {
            return NODE_TRAVERSE.LINEBREAK;
        }
        else if (this.pageFlow || this.positionAuto) {
            const isBlockWrap = (node: T) => node.blockVertical || node.percentWidth;
            const checkBlockDimension = (previous: T) => $util.aboveRange(this.linear.top, previous.linear.bottom) && (isBlockWrap(this) || isBlockWrap(previous) || this.float !== previous.float);
            if ($util.isArray(siblings)) {
                if (cleared && cleared.has(this)) {
                    return NODE_TRAVERSE.FLOAT_CLEAR;
                }
                else {
                    const lastSibling = siblings[siblings.length - 1];
                    if (this.floating && lastSibling.floating) {
                        if (horizontal && this.float === lastSibling.float) {
                            return NODE_TRAVERSE.HORIZONTAL;
                        }
                        else if ($util.aboveRange(this.linear.top, lastSibling.linear.bottom)) {
                            return NODE_TRAVERSE.FLOAT_WRAP;
                        }
                        else if (horizontal && cleared && !siblings.some((item, index) => index > 0 && cleared.get(item) === this.float)) {
                            return NODE_TRAVERSE.HORIZONTAL;
                        }
                    }
                    else if (horizontal === false && this.floating && lastSibling.blockStatic) {
                        return NODE_TRAVERSE.HORIZONTAL;
                    }
                    else if (horizontal !== undefined) {
                        if (!this.display.startsWith('inline-')) {
                            const { top, bottom } = this.linear;
                            if (this.textElement && cleared && cleared.size && siblings.some((item, index) => index > 0 && cleared.has(item)) && siblings.some(item => top < item.linear.top && bottom > item.linear.bottom)) {
                                return NODE_TRAVERSE.FLOAT_INTERSECT;
                            }
                            else if (horizontal) {
                                if (siblings.length > 1 && siblings[0].float === $const.CSS.RIGHT) {
                                    let minTop = Number.POSITIVE_INFINITY;
                                    let maxBottom = Number.NEGATIVE_INFINITY;
                                    let actualBottom = top;
                                    for (const item of siblings) {
                                        if (item.float === $const.CSS.RIGHT) {
                                            if (item.linear.top < minTop) {
                                                minTop = item.linear.top;
                                            }
                                            if (item.linear.bottom > maxBottom) {
                                                maxBottom = item.linear.bottom;
                                            }
                                        }
                                    }
                                    if (this.multiline) {
                                        actualBottom = bottom;
                                        if (this.textElement && !this.plainText) {
                                            const rect = $session.getRangeClientRect(<Element> this._element, this.sessionId);
                                            if (rect.bottom > bottom) {
                                                actualBottom = rect.bottom;
                                            }
                                        }
                                    }
                                    return $util.belowRange(actualBottom, maxBottom) ? NODE_TRAVERSE.HORIZONTAL : NODE_TRAVERSE.FLOAT_BLOCK;
                                }
                            }
                            else if ($util.sameArray(siblings, (item, index) => item.floating ? item.float : index)) {
                                return NODE_TRAVERSE.FLOAT_BLOCK;
                            }
                        }
                    }
                    if (this.blockDimension && checkBlockDimension(lastSibling)) {
                        return NODE_TRAVERSE.INLINE_WRAP;
                    }
                }
            }
            if (this.blockDimension && this.css($const.CSS.WIDTH) === $const.CSS.PERCENT_100 && !this.has('maxWidth')) {
                return NODE_TRAVERSE.VERTICAL;
            }
            const parent = this.actualParent || this.documentParent;
            const blockStatic = this.blockStatic || this.display === 'table';
            for (const previous of this.siblingsLeading) {
                if (previous.lineBreak) {
                    return NODE_TRAVERSE.LINEBREAK;
                }
                else if (cleared && cleared.get(previous) === 'both' && (!$util.isArray(siblings) || siblings[0] !== previous)) {
                    return NODE_TRAVERSE.FLOAT_CLEAR;
                }
                else if (
                    blockStatic && (!previous.floating || !previous.rightAligned && $util.withinRange(previous.linear.right, parent.box.right) || cleared && cleared.has(previous)) ||
                    previous.blockStatic ||
                    previous.autoMargin.leftRight ||
                    previous.float === $const.CSS.LEFT && this.autoMargin.right ||
                    previous.float === $const.CSS.RIGHT && this.autoMargin.left)
                {
                    return NODE_TRAVERSE.VERTICAL;
                }
                else if (this.blockDimension && checkBlockDimension(previous)) {
                    return NODE_TRAVERSE.INLINE_WRAP;
                }
            }
        }
        return NODE_TRAVERSE.HORIZONTAL;
    }

    public intersectX(rect: BoxRectDimension, dimension = 'linear') {
        const self: BoxRectDimension = this[dimension];
        return (
            $util.aboveRange(rect.left, self.left) && Math.ceil(rect.left) < self.right ||
            rect.right > Math.ceil(self.left) && $util.belowRange(rect.right, self.right) ||
            $util.aboveRange(self.left, rect.left) && $util.belowRange(self.right, rect.right) ||
            $util.aboveRange(rect.left, self.left) && $util.belowRange(rect.right, self.right)
        );
    }

    public intersectY(rect: BoxRectDimension, dimension = 'linear') {
        const self: BoxRectDimension = this[dimension];
        return (
            $util.aboveRange(rect.top, self.top) && Math.ceil(rect.top) < self.bottom ||
            rect.bottom > Math.ceil(self.top) && $util.belowRange(rect.bottom, self.bottom) ||
            $util.aboveRange(self.top, rect.top) && $util.belowRange(self.bottom, rect.bottom) ||
            $util.aboveRange(rect.top, self.top) && $util.belowRange(rect.bottom, self.bottom)
        );
    }

    public withinX(rect: BoxRectDimension, dimension = 'linear') {
        const self: BoxRectDimension = this[dimension];
        return $util.aboveRange(self.left, rect.left) && $util.belowRange(self.right, rect.right);
    }

    public withinY(rect: BoxRectDimension, dimension = 'linear') {
        const self: BoxRectDimension = this[dimension];
        return $util.aboveRange(self.top, rect.top) && $util.belowRange(self.bottom, rect.bottom);
    }

    public outsideX(rect: BoxRectDimension, dimension = 'linear') {
        const self: BoxRectDimension = this[dimension];
        return self.left < Math.floor(rect.left) || Math.floor(self.right) > rect.right;
    }

    public outsideY(rect: BoxRectDimension, dimension = 'linear') {
        const self: BoxRectDimension = this[dimension];
        return self.top < Math.floor(rect.top) || Math.floor(self.bottom) > rect.bottom;
    }

    public css(attr: string, value?: string, cache = false): string {
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
        return this._styleMap[attr] || this.style[attr] || '';
    }

    public cssApply(values: StringMap, cache = false) {
        Object.assign(this._styleMap, values);
        if (cache) {
            for (const name in values) {
                this.unsetCache(name);
            }
        }
        return this;
    }

    public cssInitial(attr: string, modified = false, computed = false) {
        if (this._initial.iteration === -1 && !modified) {
            computed = true;
        }
        let value = modified ? this._styleMap[attr] : this._initial.styleMap[attr];
        if (computed && !value) {
            value = this.style[attr];
        }
        return value || '';
    }

    public cssAny(attr: string, ...values: string[]) {
        for (const value of values) {
            if (this.css(attr) === value) {
                return true;
            }
        }
        return false;
    }

    public cssInitialAny(attr: string, ...values: string[]) {
        for (const value of values) {
            if (this.cssInitial(attr) === value) {
                return true;
            }
        }
        return false;
    }

    public cssAscend(attr: string, startChild = false, dimension?: string) {
        let current = startChild ? this : this.actualParent;
        let value: string;
        while (current) {
            value = current.cssInitial(attr);
            if (value !== '') {
                if (dimension) {
                    return current.convertPX(value, dimension);
                }
                return value;
            }
            if (current.documentBody) {
                break;
            }
            current = current.actualParent;
        }
        return '';
    }

    public cssSort(attr: string, ascending = true, duplicate = false) {
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

    public cssPX(attr: string, value: number, negative = false, cache = false) {
        const current = this._styleMap[attr];
        if (current && $css.isLength(current)) {
            value += $css.parseUnit(current, this.fontSize);
            if (!negative && value < 0) {
                value = 0;
            }
            const length = $css.formatPX(value);
            this.css(attr, length);
            if (cache) {
                this.unsetCache(attr);
            }
            return length;
        }
        return '';
    }

    public cssSpecificity(attr: string) {
        if (this.styleElement) {
            const element = <Element> this._element;
            const target = this.pseudoElement ? $session.getElementCache(element, 'pseudoType', this.sessionId) : '';
            const data: ObjectMap<number> = $session.getElementCache(element, `styleSpecificity${target ? '::' + target : ''}`, this.sessionId);
            if (data) {
                return data[attr] || 0;
            }
        }
        return 0;
    }

    public cssTry(attr: string, value: string) {
        if (this.styleElement) {
            const element = <HTMLElement> this._element;
            let current = this.css(attr);
            if (value === current) {
                current = element.style[attr];
            }
            element.style[attr] = value;
            if (element.style[attr] === value) {
                $session.setElementCache(element, attr, this.sessionId, current);
                return true;
            }
        }
        return false;
    }

    public cssFinally(attr: string) {
        if (this.styleElement) {
            const element = <HTMLElement> this._element;
            const value: string = $session.getElementCache(element, attr, this.sessionId);
            if (value) {
                element.style[attr] = value;
                $session.deleteElementCache(element, attr, this.sessionId);
                return true;
            }
        }
        return false;
    }

    public toInt(attr: string, initial = false, fallback = 0) {
        const value = parseInt((initial ? this._initial.styleMap : this._styleMap)[attr]);
        return isNaN(value) ? fallback : value;
    }

    public toFloat(attr: string, initial = false, fallback = 0) {
        const value = parseFloat((initial ? this._initial.styleMap : this._styleMap)[attr]);
        return isNaN(value) ? fallback : value;
    }

    public parseUnit(value: string, dimension = $const.CSS.WIDTH, parent = true) {
        if (value) {
            if ($css.isPercent(value)) {
                let result = parseFloat(value) / 100;
                if (parent) {
                    const absoluteParent = this.absoluteParent;
                    if (absoluteParent) {
                        switch (dimension) {
                            case $const.CSS.WIDTH:
                                result *= absoluteParent.has(dimension, CSS_STANDARD.LENGTH) ? absoluteParent.actualWidth : absoluteParent.bounds.width;
                                break;
                            case $const.CSS.HEIGHT:
                                result *= absoluteParent.has(dimension, CSS_STANDARD.LENGTH) ? absoluteParent.actualHeight : absoluteParent.bounds.height;
                                break;
                            default:
                                result *= Math.max(absoluteParent.actualWidth, absoluteParent.actualHeight);
                                break;
                        }
                        return result;
                    }
                }
                return result * (this.has(dimension, CSS_STANDARD.LENGTH) ? this.toFloat(dimension) : this.bounds[dimension]);
            }
            return $css.parseUnit(value, this.fontSize);
        }
        return 0;
    }

    public convertPX(value: string, dimension = $const.CSS.WIDTH, parent = true) {
        return value.endsWith('px') ? value : `${Math.round(this.parseUnit(value, dimension, parent))}px`;
    }

    public has(attr: string, checkType: number = 0, options?: ObjectMap<string | string[] | boolean>): boolean {
        const value = (options && options.map === 'initial' ? this._initial.styleMap : this._styleMap)[attr];
        if (value) {
            switch (value) {
                case $const.CSS.PX_0:
                    if ($util.hasBit(checkType, CSS_STANDARD.ZERO)) {
                        return true;
                    }
                    else {
                        switch (attr) {
                            case $const.CSS.TOP:
                            case $const.CSS.RIGHT:
                            case $const.CSS.BOTTOM:
                            case $const.CSS.LEFT:
                                return true;
                        }
                    }
                case $const.CSS.LEFT:
                    if ($util.hasBit(checkType, CSS_STANDARD.LEFT)) {
                        return true;
                    }
                case 'baseline':
                    if ($util.hasBit(checkType, CSS_STANDARD.BASELINE)) {
                        return true;
                    }
                case 'auto':
                    if ($util.hasBit(checkType, CSS_STANDARD.AUTO)) {
                        return true;
                    }
                case 'none':
                case 'initial':
                case 'unset':
                case 'normal':
                case 'transparent':
                case 'rgba(0, 0, 0, 0)':
                    return false;
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
                        if (options.all) {
                            return true;
                        }
                    }
                    if (checkType > 0) {
                        if ($util.hasBit(checkType, CSS_STANDARD.LENGTH) && $css.isLength(value)) {
                            return true;
                        }
                        if ($util.hasBit(checkType, CSS_STANDARD.PERCENT) && $css.isPercent(value)) {
                            return true;
                        }
                    }
                    return checkType === 0;
            }
        }
        return false;
    }

    public hasAlign(value: number) {
        return $util.hasBit(this.alignmentType, value);
    }

    public hasResource(value: number) {
        return !$util.hasBit(this.excludeResource, value);
    }

    public hasProcedure(value: number) {
        return !$util.hasBit(this.excludeProcedure, value);
    }

    public hasSection(value: number) {
        return !$util.hasBit(this.excludeSection, value);
    }

    public exclude(resource = 0, procedure = 0, section = 0) {
        if (resource > 0 && !$util.hasBit(this._excludeResource, resource)) {
            this._excludeResource |= resource;
        }
        if (procedure > 0 && !$util.hasBit(this._excludeProcedure, procedure)) {
            this._excludeProcedure |= procedure;
        }
        if (section > 0 && !$util.hasBit(this._excludeSection, section)) {
            this._excludeSection |= section;
        }
    }

    public setExclusions() {
        if (this.styleElement) {
            const parent = this.actualParent;
            const parseExclusions = (attr: string, enumeration: {}) => {
                let exclude = this.dataset[`exclude${attr}`] || '';
                let offset = 0;
                if (parent && parent.dataset[`exclude${attr}Child`]) {
                    exclude += (exclude !== '' ? '|' : '') + parent.dataset[`exclude${attr}Child`];
                }
                if (exclude !== '') {
                    for (let name of exclude.split('|')) {
                        name = name.trim().toUpperCase();
                        if (enumeration[name] && !$util.hasBit(offset, enumeration[name])) {
                            offset |= enumeration[name];
                        }
                    }
                }
                return offset;
            };
            this.exclude(
                parseExclusions('Resource', NODE_RESOURCE),
                parseExclusions('Procedure', NODE_PROCEDURE),
                parseExclusions('Section', APP_SECTION)
            );
        }
    }

    public setBounds(cache = true) {
        if (this.styleElement) {
            this._bounds = $dom.assignRect($session.getClientRect(<Element> this._element, this.sessionId, cache), true);
            if (this.documentBody && this.marginTop === 0) {
                this._bounds.top = 0;
            }
        }
        else if (this.plainText) {
            const rect = $session.getRangeClientRect(<Element> this._element, this.sessionId, cache);
            this._bounds = $dom.assignRect(rect, true);
            this._cached.multiline = (rect.numberOfLines as number) > 0;
        }
        if (!cache) {
            this._linear = undefined;
            this._box = undefined;
        }
    }

    public setInlineText(value: boolean, overwrite = false) {
        if (overwrite) {
            this._inlineText = value;
        }
        else if (this.htmlElement) {
            const element = <Element> this._element;
            switch (element.tagName) {
                case 'INPUT':
                case 'IMG':
                case 'SELECT':
                case 'TEXTAREA':
                case 'HR':
                case 'SVG':
                    break;
                case 'BUTTON':
                    this._inlineText = true;
                    break;
                default:
                    this._inlineText = value;
                    break;
            }
        }
    }

    public appendTry(node: T, replacement: T, append = true) {
        let valid = false;
        for (let i = 0; i < this.length; i++) {
            if (this.item(i) === node) {
                this.item(i, replacement);
                replacement.parent = this;
                replacement.innerWrapped = node;
                valid = true;
                break;
            }
        }
        if (append) {
            replacement.parent = this;
            valid = true;
        }
        return valid;
    }

    public modifyBox(region: number, offset?: number, negative = true) {
        if (offset !== 0) {
            const attr = CSS_SPACING.get(region);
            if (attr) {
                if (offset === undefined) {
                    this._boxReset[attr] = 1;
                }
                else if (!negative) {
                    if (this[attr] + this._boxAdjustment[attr] + offset <= 0) {
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
        }
    }

    public getBox(region: number): [number, number] {
        const attr = CSS_SPACING.get(region);
        return attr ? [this._boxReset[attr], this._boxAdjustment[attr]] : [0, 0];
    }

    public resetBox(region: number, node?: T, fromParent = false) {
        const applyReset = (attrs: string[], start: number) => {
            for (let i = 0; i < attrs.length; i++) {
                if (this._boxReset[attrs[i]] !== 1) {
                    this._boxReset[attrs[i]] = 1;
                    const attr = CSS_SPACING.get(CSS_SPACING_KEYS[i + start]) as string;
                    const value = this[attr];
                    if (node && value !== 0) {
                        if (!node.naturalElement && node[attr] === 0) {
                            node.css(attr, $css.formatPX(value), true);
                        }
                        else {
                            node.modifyBox(CSS_SPACING_KEYS[i + (fromParent ? 0 : 4)], value);
                        }
                    }
                }
            }
        };
        if ($util.hasBit(region, BOX_STANDARD.MARGIN)) {
            applyReset($css.BOX_MARGIN, 0);
        }
        if ($util.hasBit(region, BOX_STANDARD.PADDING)) {
            applyReset($css.BOX_PADDING, 4);
        }
    }

    public transferBox(region: number, node: T) {
        const applyReset = (attrs: string[], start: number) => {
            for (let i = 0; i < attrs.length; i++) {
                const value: number = this._boxAdjustment[attrs[i]];
                if (value > 0) {
                    node.modifyBox(CSS_SPACING_KEYS[i + start], value, false);
                    this._boxAdjustment[attrs[i]] = 0;
                }
            }
        };
        if ($util.hasBit(region, BOX_STANDARD.MARGIN)) {
            applyReset($css.BOX_MARGIN, 0);
        }
        if ($util.hasBit(region, BOX_STANDARD.PADDING)) {
            applyReset($css.BOX_PADDING, 4);
        }
    }

    public previousSiblings(options: SiblingOptions = {}) {
        const floating = options.floating;
        const pageFlow = options.pageFlow;
        const lineBreak = options.lineBreak;
        const excluded = options.excluded;
        const result: T[] = [];
        let element: Element | null = null;
        if (this._element) {
            if (this.naturalElement) {
                element = <Element> this._element.previousSibling;
            }
            else {
                let current = this.innerWrapped;
                while (current) {
                    if (current.naturalElement) {
                        element = <Element> (current.element as Element).previousSibling;
                        break;
                    }
                    current = current.innerWrapped;
                }
            }
        }
        else {
            const node = this.firstChild;
            if (node) {
                element = (<Element> node.element).previousSibling as Element;
            }
        }
        while (element) {
            const node = $session.getElementAsNode<T>(element, this.sessionId);
            if (node) {
                if (lineBreak !== false && node.lineBreak || excluded !== false && node.excluded) {
                    result.push(node);
                }
                else if (!node.excluded && node.pageFlow) {
                    if (pageFlow === false) {
                        break;
                    }
                    result.push(node);
                    if (floating !== false || !node.floating && (node.visible || node.rendered)) {
                        break;
                    }
                }
            }
            element = <Element> element.previousSibling;
        }
        return result;
    }

    public nextSiblings(options: SiblingOptions = {}) {
        const floating = options.floating;
        const pageFlow = options.pageFlow;
        const lineBreak = options.lineBreak;
        const excluded = options.excluded;
        const result: T[] = [];
        let element: Element | null = null;
        if (this._element) {
            if (this.naturalElement) {
                element = <Element> this._element.nextSibling;
            }
            else {
                let current = this.innerWrapped;
                while (current) {
                    if (current.naturalElement) {
                        element = <Element> (current.element as Element).nextSibling;
                        break;
                    }
                    current = current.innerWrapped;
                }
            }
        }
        else {
            const node = this.lastChild;
            if (node) {
                element = (<Element> node.element).nextSibling as Element;
            }
        }
        while (element) {
            const node = $session.getElementAsNode<T>(element, this.sessionId);
            if (node) {
                if (lineBreak !== false && node.lineBreak || excluded !== false && node.excluded) {
                    result.push(node);
                }
                else if (!node.excluded && node.pageFlow) {
                    if (pageFlow === false) {
                        break;
                    }
                    result.push(node);
                    if (floating !== false || !node.floating && (node.visible || node.rendered)) {
                        break;
                    }
                }
            }
            element = <Element> element.nextSibling;
        }
        return result;
    }

    public getFirstChildElement(options: SiblingOptions = {}) {
        const lineBreak = options.lineBreak;
        const excluded = options.excluded;
        if (this.htmlElement) {
            for (const node of this.actualChildren) {
                if (!node.pseudoElement && (!node.excluded || lineBreak !== false && node.lineBreak || excluded !== false && node.excluded)) {
                    return node.element;
                }
            }
        }
        return null;
    }

    public getLastChildElement(options: SiblingOptions = {}) {
        const lineBreak = options.lineBreak;
        const excluded = options.excluded;
        if (this.htmlElement) {
            const children = this.actualChildren;
            for (let i = children.length - 1; i >= 0; i--) {
                const node = children[i];
                if (!node.pseudoElement && (!node.excluded || lineBreak !== false && node.lineBreak || excluded !== false && node.excluded)) {
                    return node.element;
                }
            }
        }
        return null;
    }

    public actualRect(direction: string, dimension = 'linear') {
        let node: T;
        switch (direction) {
            case $const.CSS.TOP:
            case $const.CSS.LEFT:
                node = this.companion && !this.companion.visible && this.companion[dimension][direction] < this[dimension][direction] ? this.companion : this;
                break;
            case $const.CSS.RIGHT:
            case $const.CSS.BOTTOM:
                node = this.companion && !this.companion.visible && this.companion[dimension][direction] > this[dimension][direction] ? this.companion : this;
                break;
            default:
                return NaN;
        }
        return node[dimension][direction] as number;
    }

    private setDimension(attr: string, attrMin: string, attrMax: string) {
        const baseValue = this.parseUnit(this._styleMap[attr], attr);
        let value = Math.max(baseValue, this.parseUnit(this._styleMap[attrMin], attr));
        if (value === 0 && this.naturalElement && this.styleElement) {
            switch (this.tagName) {
                case 'IMG':
                case 'INPUT_IMAGE':
                case 'TD':
                case 'TH':
                case 'SVG':
                case 'IFRAME':
                case 'VIDEO':
                case 'CANVAS':
                case 'OBJECT':
                case 'EMBED':
                    const size = $dom.getNamedItem(this._element, attr);
                    if (size !== '') {
                        value = this.parseUnit(size, attr);
                        if (value > 0) {
                            this.css(attr, $css.isPercent(size) ? size : $css.formatPX(size));
                        }
                    }
                    break;
            }
        }
        let maxValue = 0;
        if (baseValue > 0 && !this.imageElement) {
            if (this._styleMap[attrMax] === this._styleMap[attr]) {
                delete this._styleMap[attrMax];
            }
            else {
                maxValue = this.parseUnit(this._styleMap[attrMax], attr);
                if (maxValue > 0 && maxValue <= baseValue && $css.isLength(this._styleMap[attr])) {
                    maxValue = 0;
                    this._styleMap[attr] = this._styleMap[attrMax];
                    delete this._styleMap[attrMax];
                }
            }
        }
        return maxValue > 0 ? Math.min(value, maxValue) : value;
    }

    private setBoxModel(dimension: 'box' | 'linear') {
        const bounds: BoxRectDimension = this.unsafe(dimension);
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
                        bounds.width += (this.marginLeft > 0 ? this.marginLeft : 0) + this.marginRight;
                        bounds.height += (this.marginTop > 0 ? this.marginTop : 0) + this.marginBottom;
                        break;
                }
            }
            if (this._initial[dimension] === undefined) {
                this._initial[dimension] = $dom.assignRect(bounds);
            }
        }
    }

    private convertPosition(attr: string) {
        let value = 0;
        if (!this.positionStatic) {
            const unit = this.cssInitial(attr, true);
            if ($css.isLength(unit)) {
                value = $util.convertFloat(this.convertPX(unit, attr === $const.CSS.LEFT || attr === $const.CSS.RIGHT ? $const.CSS.WIDTH : $const.CSS.HEIGHT));
            }
            else if ($css.isPercent(unit) && this.styleElement) {
                value = $util.convertFloat(this.style[attr]);
            }
        }
        return value;
    }

    private convertBorderWidth(index: number) {
        if (this.styleElement) {
            const value = this.css(CSS_BORDER[index][0]);
            if (value !== $const.CSS.NONE) {
                const width = this.css(CSS_BORDER[index][1]);
                let result: number;
                switch (width) {
                    case 'thin':
                    case 'medium':
                    case 'thick':
                        result = $util.convertFloat(this.style[CSS_BORDER[index][1]]);
                        break;
                    default:
                        result = this.parseUnit(width, index === 1 || index === 3 ? $const.CSS.WIDTH : $const.CSS.HEIGHT);
                        break;
                }
                if (result > 0) {
                    return Math.max(Math.round(result), 1);
                }
            }
        }
        return 0;
    }

    private convertBox(attr: string, margin: boolean) {
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
                    return 0;
                }
                break;
        }
        const result = this.parseUnit(this.css(attr), $const.CSS.NONE);
        if (!margin) {
            let paddingStart = this.toFloat('paddingInlineStart');
            let paddingEnd = this.toFloat('paddingInlineEnd');
            if (paddingStart > 0 || paddingEnd > 0) {
                if (this.css('writingMode') === 'vertical-rl') {
                    if (this.dir === 'ltr') {
                        if (attr !== 'paddingTop') {
                            paddingStart = 0;
                        }
                        if (attr !== 'paddingBottom') {
                            paddingEnd = 0;
                        }
                    }
                    else {
                        if (attr !== 'paddingBottom') {
                            paddingStart = 0;
                        }
                        if (attr !== 'paddingTop') {
                            paddingEnd = 0;
                        }
                    }
                }
                else {
                    if (this.dir === 'ltr') {
                        if (attr !== 'paddingLeft') {
                            paddingStart = 0;
                        }
                        if (attr !== 'paddingRight') {
                            paddingEnd = 0;
                        }
                    }
                    else {
                        if (attr !== 'paddingRight') {
                            paddingStart = 0;
                        }
                        if (attr !== 'paddingLeft') {
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

    set tagName(value) {
        this._cached.tagName = value.toUpperCase();
    }
    get tagName() {
        if (this._cached.tagName === undefined) {
            const element = <HTMLInputElement> this._element;
            let value = '';
            if (element) {
                if (element.nodeName === '#text') {
                    value = 'PLAINTEXT';
                }
                else if (element.tagName === 'INPUT') {
                    value = `INPUT_${element.type}`;
                }
                else {
                    value = element.tagName;
                }
            }
            this._cached.tagName = value.toUpperCase();
        }
        return this._cached.tagName;
    }

    get element() {
        if (!this.naturalElement && this.innerWrapped) {
            const element: Element | null = this.innerWrapped.unsafe('element');
            if (element) {
                return element;
            }
        }
        return this._element;
    }

    get elementId() {
        return this._element ? this._element.id : '';
    }

    get htmlElement() {
        if (this._cached.htmlElement === undefined) {
            this._cached.htmlElement = this._element !== null && !this.plainText && !this.svgElement;
        }
        return this._cached.htmlElement;
    }

    get svgElement() {
        return this._element !== null && this._element.tagName === 'svg';
    }

    get styleElement() {
        return this.htmlElement || this.svgElement;
    }

    get naturalElement() {
        if (this._cached.naturalElement === undefined) {
            this._cached.naturalElement = this._element !== null && this._element.className !== '__squared.placeholder';
        }
        return this._cached.naturalElement;
    }

    get pseudoElement() {
        return this._element !== null && this._element.className === '__squared.pseudo';
    }

    get imageElement() {
        return this.tagName === 'IMG';
    }

    get flexElement() {
        return this.display === 'flex' || this.display === 'inline-flex';
    }

    get gridElement() {
        return this.display === 'grid' || this.display === 'inline-grid';
    }

    get textElement() {
        return this.plainText || this.inlineText && !this.inputElement;
    }

    get tableElement() {
        return this.tagName === 'TABLE' || this.display === 'table';
    }

    get inputElement() {
        if (this._cached.inputElement === undefined) {
            const tagName = this.tagName;
            this._cached.inputElement = this._element !== null && this._element.tagName === 'INPUT' || tagName === 'BUTTON' || tagName === 'SELECT' || tagName === 'TEXTAREA';
        }
        return this._cached.inputElement;
    }

    get layoutElement() {
        return this.flexElement || this.gridElement;
    }

    get groupParent() {
        return false;
    }

    get plainText() {
        return this.tagName === 'PLAINTEXT';
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
        return this._bounds || $dom.newBoxRectDimension();
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
                this._linear = $dom.assignRect(this._bounds);
            }
            this.setBoxModel('linear');
        }
        return this._linear || $dom.newBoxRectDimension();
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
                this._box = $dom.assignRect(this._bounds);
            }
            this.setBoxModel('box');
        }
        return this._box || $dom.newBoxRectDimension();
    }

    set renderAs(value) {
        if (!this.rendered && value && !value.rendered) {
            this._renderAs = value;
        }
    }
    get renderAs() {
        return this._renderAs;
    }

    get dataset(): DOMStringMap {
        return this.htmlElement ? (<HTMLElement> this._element).dataset : {};
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

    get extensions() {
        if (this._cached.extensions === undefined) {
            this._cached.extensions = this.dataset.use ? $util.spliceArray(this.dataset.use.split(/\s*,\s*/), value => value === '') : [];
        }
        return this._cached.extensions;
    }

    set flexbox(value) {
        this._cached.flexbox = value;
    }
    get flexbox() {
        if (this._cached.flexbox === undefined) {
            const actualParent = this.actualParent;
            const alignSelf = this.css('alignSelf');
            const justifySelf = this.css('justifySelf');
            const getFlexValue = (attr: string, initialValue: number, parent?: Node): number => {
                const value = (parent || this).css(attr);
                if ($util.isNumber(value)) {
                    return parseFloat(value);
                }
                else if (value === 'inherit' && actualParent && parent === undefined) {
                    return getFlexValue(attr, initialValue, actualParent);
                }
                return initialValue;
            };
            this._cached.flexbox = {
                alignSelf: alignSelf === $const.CSS.AUTO && actualParent && actualParent.has('alignItems', CSS_STANDARD.BASELINE, { all: true }) ? actualParent.css('alignItems') : alignSelf,
                justifySelf: justifySelf === $const.CSS.AUTO && actualParent && actualParent.has('justifyItems') ? actualParent.css('justifyItems') : justifySelf,
                basis: this.css('flexBasis'),
                grow: getFlexValue('flexGrow', 0),
                shrink: getFlexValue('flexShrink', 1),
                order: this.toInt('order')
            };
        }
        return this._cached.flexbox;
    }

    get width() {
        if (this._cached.width === undefined) {
            this._cached.width = this.setDimension($const.CSS.WIDTH, 'minWidth', 'maxWidth');
        }
        return this._cached.width;
    }
    get height() {
        if (this._cached.height === undefined) {
            this._cached.height = this.setDimension($const.CSS.HEIGHT, 'minHeight', 'maxHeight');
        }
        return this._cached.height;
    }

    get hasWidth() {
        return this.width > 0;
    }
    get hasHeight() {
        const value = this.css($const.CSS.HEIGHT);
        if ($css.isPercent(value)) {
            if (this.pageFlow) {
                const actualParent = this.actualParent;
                if (actualParent && actualParent.hasHeight) {
                    return parseFloat(value) > 0;
                }
            }
            return false;
        }
        return this.height > 0;
    }

    get lineHeight() {
        if (this._cached.lineHeight === undefined) {
            if (!this.imageElement && !this.svgElement) {
                let hasOwnStyle = this.has('lineHeight');
                let value = 0;
                if (hasOwnStyle) {
                    value = $css.parseUnit(this.css('lineHeight'), this.fontSize);
                }
                else if (this.naturalElement) {
                    value = $util.convertFloat(this.cssAscend('lineHeight', false, $const.CSS.HEIGHT));
                    if (this.styleElement) {
                        const fontSize = this.cssInitial('fontSize');
                        if (fontSize.endsWith('em')) {
                            const emSize = parseFloat(fontSize);
                            if (emSize < 1) {
                                value *= emSize;
                                this.css('lineHeight', $css.formatPX(value));
                                hasOwnStyle = true;
                            }
                        }
                    }
                }
                this._cached.lineHeight = hasOwnStyle || value > this.actualHeight || this.multiline || this.block && this.actualChildren.some(node => node.textElement) ? value : 0;
            }
            else {
                this._cached.lineHeight = 0;
            }
        }
        return this._cached.lineHeight;
    }

    get display() {
        return this.css('display');
    }

    set positionStatic(value) {
        this._cached.positionStatic = value;
        this.unsetCache('pageFlow');
    }
    get positionStatic() {
        if (this._cached.positionStatic === undefined) {
            switch (this.css('position')) {
                case 'fixed':
                case 'absolute':
                    this._cached.positionStatic = false;
                    break;
                case 'sticky':
                case 'relative':
                    this._cached.positionStatic = !this.has($const.CSS.TOP) && !this.has($const.CSS.RIGHT) && !this.has($const.CSS.BOTTOM) && !this.has($const.CSS.LEFT);
                    if (this._cached.positionStatic) {
                        this._cached.positionRelative = false;
                    }
                    break;
                case 'inherit':
                    const position = this._element ? $css.getInheritedStyle(this._element.parentElement, 'position') : '';
                    this._cached.positionStatic = position !== '' && !(position === 'absolute' || position === 'fixed');
                    break;
                default:
                    this._cached.positionStatic = true;
                    break;
            }
        }
        return this._cached.positionStatic;
    }

    get positionRelative() {
        if (this._cached.positionRelative === undefined) {
            const value = this.css('position');
            this._cached.positionRelative = value === 'relative' || value === 'sticky';
        }
        return this._cached.positionRelative;
    }

    set positionAuto(value) {
        this._cached.positionAuto = value;
    }
    get positionAuto() {
        if (this._cached.positionAuto === undefined) {
            const styleMap = this._initial.iteration === -1 ? this._styleMap : this._initial.styleMap;
            this._cached.positionAuto = !this.pageFlow && (
                (!styleMap.top || styleMap.top === $const.CSS.AUTO) &&
                (!styleMap.right || styleMap.right === $const.CSS.AUTO) &&
                (!styleMap.bottom || styleMap.bottom === $const.CSS.AUTO) &&
                (!styleMap.left || styleMap.left === $const.CSS.AUTO)
            );
        }
        return this._cached.positionAuto;
    }

    get top() {
        if (this._cached.top === undefined) {
            this._cached.top = this.convertPosition($const.CSS.TOP);
        }
        return this._cached.top;
    }
    get right() {
        if (this._cached.right === undefined) {
            this._cached.right = this.convertPosition($const.CSS.RIGHT);
        }
        return this._cached.right;
    }
    get bottom() {
        if (this._cached.bottom === undefined) {
            this._cached.bottom = this.convertPosition($const.CSS.BOTTOM);
        }
        return this._cached.bottom;
    }
    get left() {
        if (this._cached.left === undefined) {
            this._cached.left = this.convertPosition($const.CSS.LEFT);
        }
        return this._cached.left;
    }

    get marginTop() {
        if (this._cached.marginTop === undefined) {
            this._cached.marginTop = this.inlineStatic ? 0 : this.convertBox('marginTop', true);
        }
        return this._cached.marginTop;
    }
    get marginRight() {
        if (this._cached.marginRight === undefined) {
            this._cached.marginRight = this.convertBox('marginRight', true);
        }
        return this._cached.marginRight;
    }
    get marginBottom() {
        if (this._cached.marginBottom === undefined) {
            if (this.inlineStatic) {
                this._cached.marginBottom = 0;
            }
            else {
                const value = this.convertBox('marginBottom', true);
                this._cached.marginBottom = this.bounds.height === 0 && !this.overflowY && value > 0 ? 0 : value;
            }
        }
        return this._cached.marginBottom;
    }
    get marginLeft() {
        if (this._cached.marginLeft === undefined) {
            this._cached.marginLeft = this.convertBox('marginLeft', true);
        }
        return this._cached.marginLeft;
    }

    get borderTopWidth() {
        if (this._cached.borderTopWidth === undefined) {
            this._cached.borderTopWidth = this.convertBorderWidth(0);
        }
        return this._cached.borderTopWidth;
    }
    get borderRightWidth() {
        if (this._cached.borderRightWidth === undefined) {
            this._cached.borderRightWidth = this.convertBorderWidth(1);
        }
        return this._cached.borderRightWidth;
    }
    get borderBottomWidth() {
        if (this._cached.borderBottomWidth === undefined) {
            this._cached.borderBottomWidth = this.convertBorderWidth(2);
        }
        return this._cached.borderBottomWidth;
    }
    get borderLeftWidth() {
        if (this._cached.borderLeftWidth === undefined) {
            this._cached.borderLeftWidth = this.convertBorderWidth(3);
        }
        return this._cached.borderLeftWidth;
    }

    get paddingTop() {
        if (this._cached.paddingTop === undefined) {
            const value = this.convertBox('paddingTop', false);
            if (this.length && value > 0 && !this.layoutElement) {
                let top = 0;
                for (const node of this.children) {
                    if (node.inline && !node.has('lineHeight')) {
                        top = Math.max(top, node.paddingTop);
                    }
                    else {
                        top = 0;
                        break;
                    }
                }
                this._cached.paddingTop = Math.max(0, value - top);
            }
            else {
                this._cached.paddingTop = this.inlineStatic && !this.visibleStyle.background ? 0 : value;
            }
        }
        return this._cached.paddingTop;
    }
    get paddingRight() {
        if (this._cached.paddingRight === undefined) {
            this._cached.paddingRight = this.convertBox('paddingRight', false);
        }
        return this._cached.paddingRight;
    }
    get paddingBottom() {
        if (this._cached.paddingBottom === undefined) {
            const value = this.convertBox('paddingBottom', false);
            if (this.length && value > 0 && !this.layoutElement) {
                let bottom = 0;
                for (const node of this.children) {
                    if (node.inline && !node.has('lineHeight')) {
                        bottom = Math.max(bottom, node.paddingBottom);
                    }
                    else {
                        bottom = 0;
                        break;
                    }
                }
                this._cached.paddingBottom = Math.max(0, value - bottom);
            }
            else {
                this._cached.paddingBottom = this.inlineStatic && !this.visibleStyle.background ? 0 : value;
            }
        }
        return this._cached.paddingBottom;
    }
    get paddingLeft() {
        if (this._cached.paddingLeft === undefined) {
            this._cached.paddingLeft = this.convertBox('paddingLeft', false);
        }
        return this._cached.paddingLeft;
    }

    get contentBox() {
        return this.css('boxSizing') !== 'border-box';
    }

    set contentBoxWidth(value) {
        this._cached.contentBoxWidth = value;
    }
    get contentBoxWidth() {
        if (this._cached.contentBoxWidth === undefined) {
            this._cached.contentBoxWidth = this.tableElement && this.css('borderCollapse') === 'collapse' ? 0 : this.borderLeftWidth + this.paddingLeft + this.paddingRight + this.borderRightWidth;
        }
        return this._cached.contentBoxWidth;
    }

    set contentBoxHeight(value) {
        this._cached.contentBoxHeight = value;
    }
    get contentBoxHeight() {
        if (this._cached.contentBoxHeight === undefined) {
            this._cached.contentBoxHeight = this.tableElement && this.css('borderCollapse') === 'collapse' ? 0 : this.borderTopWidth + this.paddingTop + this.paddingBottom + this.borderBottomWidth;
        }
        return this._cached.contentBoxHeight;
    }

    get inline() {
        if (this._cached.inline === undefined) {
            const value = this.display;
            this._cached.inline = value === 'inline' || (value === 'initial' || value === 'unset') && !$dom.ELEMENT_BLOCK.includes(this.tagName);
        }
        return this._cached.inline;
    }

    get inlineStatic() {
        if (this._cached.inlineStatic === undefined) {
            this._cached.inlineStatic = this.inline && this.pageFlow && !this.floating && !this.imageElement;
        }
        return this._cached.inlineStatic;
    }

    get inlineVertical() {
        if (this._cached.inlineVertical === undefined) {
            const value = this.display;
            this._cached.inlineVertical = (value.startsWith('inline') || value === 'table-cell') && !this.floating && !this.plainText;
        }
        return this._cached.inlineVertical;
    }

    get inlineText() {
        return this._inlineText;
    }

    get block() {
        if (this._cached.block === undefined) {
            const value = this.display;
            switch (value) {
                case 'inline':
                    this._cached.block = this.svgElement && !this.hasWidth;
                    break;
                case 'block':
                case 'flex':
                case 'grid':
                case 'list-item':
                    this._cached.block = true;
                    break;
                case 'initial':
                    this._cached.block = $dom.ELEMENT_BLOCK.includes(this.tagName);
                    break;
                default:
                    this._cached.block = false;
                    break;
            }
        }
        return this._cached.block;
    }

    get blockStatic() {
        if (this._cached.blockStatic === undefined) {
            this._cached.blockStatic = this.pageFlow && this.block && (!this.floating || this.cssInitial($const.CSS.WIDTH) === $const.CSS.PERCENT_100 && !this.has('maxWidth')) || this.hasAlign(NODE_ALIGNMENT.BLOCK);
        }
        return this._cached.blockStatic;
    }

    get blockDimension() {
        if (this._cached.blockDimension === undefined) {
            const value = this.display;
            this._cached.blockDimension = this.block || value.startsWith('inline-') || value === 'table' || this.imageElement || this.svgElement;
        }
        return this._cached.blockDimension;
    }

    get blockVertical() {
        if (this._cached.blockVertical === undefined) {
            this._cached.blockVertical = this.blockDimension && this.has($const.CSS.HEIGHT);
        }
        return this._cached.blockVertical;
    }

    get pageFlow() {
        if (this._cached.pageFlow === undefined) {
            this._cached.pageFlow = this.positionStatic || this.positionRelative;
        }
        return this._cached.pageFlow;
    }

    get inlineFlow() {
        if (this._cached.inlineFlow === undefined) {
            const display = this.display;
            this._cached.inlineFlow = this.inline || display.startsWith('inline') || display === 'table-cell' || this.imageElement || this.floating;
        }
        return this._cached.inlineFlow;
    }

    get centerAligned() {
        if (this._cached.centerAligned === undefined) {
            this._cached.centerAligned = this.autoMargin.leftRight || this.textElement && this.blockStatic && this.cssInitial('textAlign') === $const.CSS.CENTER || this.inlineStatic && this.cssAscend('textAlign', true) === $const.CSS.CENTER;
        }
        return this._cached.centerAligned;
    }

    get rightAligned() {
        if (this._cached.rightAligned === undefined) {
            this._cached.rightAligned = this.float === $const.CSS.RIGHT || this.autoMargin.left || !this.pageFlow && this.has($const.CSS.RIGHT) || this.textElement && this.blockStatic && this.cssInitial('textAlign') === $const.CSS.RIGHT;
        }
        return this._cached.rightAligned || this.hasAlign(NODE_ALIGNMENT.RIGHT);
    }

    get bottomAligned() {
        if (this._cached.bottomAligned === undefined) {
            this._cached.bottomAligned = !this.pageFlow && this.has($const.CSS.BOTTOM) && this.bottom >= 0;
        }
        return this._cached.bottomAligned;
    }

    get horizontalAligned() {
        if (this._cached.horizontalAligned === undefined) {
            this._cached.horizontalAligned = !this.blockStatic && !this.autoMargin.horizontal && !(this.blockDimension && this.css($const.CSS.WIDTH) === $const.CSS.PERCENT_100);
        }
        return this._cached.horizontalAligned;
    }

    get autoMargin() {
        if (this._cached.autoMargin === undefined) {
            if (!this.pageFlow || this.blockStatic || this.display === 'table') {
                const styleMap = this._initial.iteration === -1 ? this._styleMap : this._initial.styleMap;
                const left = styleMap.marginLeft === $const.CSS.AUTO && (this.pageFlow || this.has($const.CSS.RIGHT));
                const right = styleMap.marginRight === $const.CSS.AUTO && (this.pageFlow || this.has($const.CSS.LEFT));
                const top = styleMap.marginTop === $const.CSS.AUTO && (this.pageFlow || this.has($const.CSS.BOTTOM));
                const bottom = styleMap.marginBottom === $const.CSS.AUTO && (this.pageFlow || this.has($const.CSS.TOP));
                this._cached.autoMargin = {
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
                this._cached.autoMargin = {
                    horizontal: false,
                    left: false,
                    right: false,
                    leftRight: false,
                    top: false,
                    bottom: false,
                    vertical: false,
                    topBottom: false
                };
            }
        }
        return this._cached.autoMargin;
    }

    get floating() {
        if (this._cached.floating === undefined) {
            if (this.pageFlow) {
                this._cached.floating = this.cssAny('float', $const.CSS.LEFT, $const.CSS.RIGHT);
            }
            else {
                this._cached.floating = false;
            }
        }
        return this._cached.floating;
    }

    get float() {
        if (this._cached.float === undefined) {
            this._cached.float = this.floating ? this.css('float') : $const.CSS.NONE;
        }
        return this._cached.float;
    }

    get zIndex() {
        return this.toInt('zIndex');
    }

    set textContent(value) {
        this._cached.textContent = value;
    }
    get textContent() {
        if (this._cached.textContent === undefined) {
            this._cached.textContent = (this.htmlElement || this.plainText) && (<HTMLElement> this._element).textContent || '';
        }
        return this._cached.textContent;
    }

    get textEmpty() {
        return this.inlineText && (this.textContent === '' || !this.preserveWhiteSpace && this.textContent.trim() === '');
    }

    get src() {
        return this.imageElement || this.tagName === 'INPUT_IMAGE' ? (<HTMLInputElement> this._element).src : '';
    }

    set overflow(value) {
        if (value === 0 || value === NODE_ALIGNMENT.VERTICAL || value === NODE_ALIGNMENT.HORIZONTAL || value === (NODE_ALIGNMENT.HORIZONTAL | NODE_ALIGNMENT.VERTICAL)) {
            if ($util.hasBit(this.overflow, NODE_ALIGNMENT.BLOCK)) {
                value |= NODE_ALIGNMENT.BLOCK;
            }
            this._cached.overflow = value;
        }
    }
    get overflow() {
        if (this._cached.overflow === undefined) {
            const overflowX = this.css('overflowX');
            const overflowY = this.css('overflowY');
            let value = 0;
            if (!this.documentBody) {
                if ((this.has($const.CSS.WIDTH) || this.has('maxWidth')) && (overflowX === 'scroll' || overflowX === $const.CSS.AUTO)) {
                    value |= NODE_ALIGNMENT.HORIZONTAL;
                }
                if (this.hasHeight && (this.has($const.CSS.HEIGHT) || this.has('maxHeight')) && (overflowY === 'scroll' || overflowY === $const.CSS.AUTO)) {
                    value |= NODE_ALIGNMENT.VERTICAL;
                }
            }
            if (overflowX === $const.CSS.AUTO || overflowX === 'hidden' || overflowX === 'overlay' || overflowY === $const.CSS.AUTO || overflowY === 'hidden' || overflowY === 'overlay') {
                value |= NODE_ALIGNMENT.BLOCK;
            }
            this._cached.overflow = value;
        }
        return this._cached.overflow;
    }

    get overflowX() {
        return $util.hasBit(this.overflow, NODE_ALIGNMENT.HORIZONTAL);
    }
    get overflowY() {
        return $util.hasBit(this.overflow, NODE_ALIGNMENT.VERTICAL);
    }

    set baseline(value) {
        this._cached.baseline = value;
    }
    get baseline() {
        if (this._cached.baseline === undefined) {
            this._cached.baseline = this.pageFlow && !this.floating && this.cssAny('verticalAlign', 'baseline', 'initial', $const.CSS.PX_0, $const.CSS.PERCENT_0);
        }
        return this._cached.baseline;
    }

    get verticalAlign() {
        if (this._cached.verticalAlign === undefined) {
            let value = this.css('verticalAlign');
            if ($css.isLength(value, true)) {
                value = this.convertPX(value, $const.CSS.HEIGHT);
            }
            this._cached.verticalAlign = value;
        }
        return this._cached.verticalAlign;
    }

    set multiline(value) {
        this._cached.multiline = value;
    }
    get multiline() {
        if (this._cached.multiline === undefined) {
            this._cached.multiline = this.plainText || this.inlineText && (this.inlineFlow || this.length === 0) ? ($session.getRangeClientRect(<Element> this._element, this.sessionId).numberOfLines as number) > 0 : false;
        }
        return this._cached.multiline;
    }

    get positiveAxis() {
        if (this._cached.positiveAxis === undefined) {
            this._cached.positiveAxis = (!this.positionRelative || this.positionRelative && this.top >= 0 && this.left >= 0 && (this.right <= 0 || this.has($const.CSS.LEFT)) && (this.bottom <= 0 || this.has($const.CSS.TOP))) && this.marginTop >= 0 && this.marginLeft >= 0 && this.marginRight >= 0;
        }
        return this._cached.positiveAxis;
    }

    get leftTopAxis() {
        if (this._cached.leftTopAxis === undefined) {
            const value = this.cssInitial('position');
            this._cached.leftTopAxis = value === 'absolute' && this.absoluteParent === this.documentParent || value === 'fixed';
        }
        return this._cached.leftTopAxis;
    }

    get backgroundColor() {
        if (this._cached.backgroundColor === undefined) {
            let value = this.css('backgroundColor');
            if (value !== '' && this.pageFlow && (this._initial.iteration === -1 || this.cssInitial('backgroundColor') === value)) {
                let current = this.actualParent;
                while (current && current.id !== 0) {
                    const color = current.cssInitial('backgroundColor', true);
                    if (color !== '') {
                        if (color === value) {
                            value = '';
                        }
                        break;
                    }
                    current = current.actualParent;
                }
            }
            this._cached.backgroundColor = value !== 'rgba(0, 0, 0, 0)' ? value : '';
        }
        return this._cached.backgroundColor;
    }

    get backgroundImage() {
        if (this._cached.backgroundImage === undefined) {
            const value = this.css('backgroundImage');
            if (value !== '' && value !== $const.CSS.NONE) {
                this._cached.backgroundImage = value;
            }
            else {
                const match = REGEXP_BACKGROUND.exec(this.css('background'));
                this._cached.backgroundImage = match ? match[1] : '';
            }
        }
        return this._cached.backgroundImage;
    }

    get visibleStyle() {
        if (this._cached.visibleStyle === undefined) {
            const borderWidth = this.borderTopWidth > 0 || this.borderRightWidth > 0 || this.borderBottomWidth > 0 || this.borderLeftWidth > 0;
            const backgroundColor = this.backgroundColor !== '';
            const backgroundImage = this.backgroundImage !== '';
            this._cached.visibleStyle = {
                background: borderWidth || backgroundImage || backgroundColor,
                borderWidth,
                backgroundImage,
                backgroundColor,
                backgroundRepeat: this.css('backgroundRepeat') !== 'no-repeat'
            };
        }
        return this._cached.visibleStyle;
    }

    get preserveWhiteSpace() {
        if (this._cached.preserveWhiteSpace === undefined) {
            this._cached.preserveWhiteSpace = this.cssAny('whiteSpace', 'pre', 'pre-wrap');
        }
        return this._cached.preserveWhiteSpace;
    }

    get percentWidth() {
        if (this._cached.percentWidth === undefined) {
            this._cached.percentWidth = this.has($const.CSS.WIDTH, CSS_STANDARD.PERCENT);
        }
        return this._cached.percentWidth;
    }

    get percentHeight() {
        if (this._cached.percentHeight === undefined) {
            this._cached.percentHeight = this.has($const.CSS.HEIGHT, CSS_STANDARD.PERCENT);
        }
        return this._cached.percentHeight;
    }

    get layoutHorizontal() {
        return this.hasAlign(NODE_ALIGNMENT.HORIZONTAL);
    }
    get layoutVertical() {
        return this.hasAlign(NODE_ALIGNMENT.VERTICAL);
    }

    set controlName(value) {
        if (!this.rendered || this._controlName === undefined) {
            this._controlName = value;
        }
    }
    get controlName() {
        return this._controlName || '';
    }

    set documentParent(value) {
        this._documentParent = value;
    }
    get documentParent() {
        return this._documentParent || this.absoluteParent || this.actualParent || this.parent || this;
    }

    get absoluteParent() {
        if (this._cached.absoluteParent === undefined) {
            let current = this.actualParent;
            if (!this.pageFlow) {
                while (current && current.id !== 0) {
                    const position = current.cssInitial('position', false, true);
                    if (current.documentBody || position !== 'static' && position !== 'initial' && position !== 'unset') {
                        break;
                    }
                    current = current.actualParent;
                }
            }
            this._cached.absoluteParent = current || null;
        }
        return this._cached.absoluteParent;
    }

    get actualParent() {
        if (this._cached.actualParent === undefined) {
            this._cached.actualParent = this._element && this._element.parentElement && $session.getElementAsNode<T>(this._element.parentElement, this.sessionId) || null;
        }
        return this._cached.actualParent;
    }

    set actualChildren(value) {
        this._cached.actualChildren = value;
    }

    get actualChildren() {
        if (this._cached.actualChildren === undefined) {
            if (this.htmlElement && this.naturalElement) {
                const children: T[] = [];
                (<HTMLElement> this._element).childNodes.forEach((element: Element) => {
                    const node = $session.getElementAsNode<T>(element, this.sessionId);
                    if (node) {
                        children.push(node);
                    }
                });
                this._cached.actualChildren = children;
            }
            else {
                if (this._initial.iteration === -1) {
                    this.saveAsInitial();
                }
                this._cached.actualChildren = this._initial.children;
            }
        }
        return this._cached.actualChildren;
    }

    get actualWidth() {
        if (this._cached.actualWidth === undefined) {
            if (this.plainText) {
                this._cached.actualWidth = this.bounds.right - this.bounds.left;
            }
            else if (!this.documentParent.flexElement && this.display !== 'table-cell') {
                let width = this.parseUnit(this.cssInitial($const.CSS.WIDTH, true));
                if (width > 0) {
                    const maxWidth = this.parseUnit(this.css('maxWidth'));
                    if (maxWidth > 0) {
                        width = Math.min(width, maxWidth);
                    }
                    if (this.contentBox && !this.tableElement) {
                        width += this.contentBoxWidth;
                    }
                    this._cached.actualWidth = width;
                    return width;
                }
            }
            this._cached.actualWidth = this.bounds.width;
        }
        return this._cached.actualWidth;
    }

    get actualHeight() {
        if (this._cached.actualHeight === undefined) {
            if (!this.plainText && !this.documentParent.flexElement && this.display !== 'table-cell') {
                let height = this.parseUnit(this.cssInitial($const.CSS.HEIGHT, true), $const.CSS.HEIGHT);
                if (height > 0) {
                    const maxHeight = this.parseUnit(this.css('maxHeight'));
                    if (maxHeight > 0) {
                        height = Math.min(height, maxHeight);
                    }
                    if (this.contentBox && !this.tableElement) {
                        height += this.contentBoxHeight;
                    }
                    this._cached.actualHeight = height;
                    return height;
                }
            }
            this._cached.actualHeight = this.bounds.height;
        }
        return this._cached.actualHeight;
    }

    get actualDimension(): Dimension {
        return { width: this.actualWidth, height: this.actualHeight };
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

    get firstChild() {
        for (const node of this.actualChildren) {
            if (node.naturalElement) {
                return node;
            }
        }
        return null;
    }

    get lastChild() {
        for (let i = this.actualChildren.length - 1; i >= 0; i--) {
            const node = this.actualChildren[i];
            if (node.naturalElement) {
                return node;
            }
        }
        return null;
    }

    get singleChild() {
        if (this.renderParent) {
            return this.renderParent.length === 1;
        }
        else if (this.parent && this.parent.id !== 0) {
            return this.parent.length === 1;
        }
        return false;
    }

    get previousSibling() {
        if (this._cached.previousSibling === undefined) {
            if (this.naturalElement) {
                let element = <Element> (this._element as Element).previousSibling;
                while (element) {
                    const node = $session.getElementAsNode<Node>(element, this.sessionId);
                    if (node && (!node.excluded || node.lineBreak)) {
                        this._cached.previousSibling = node;
                        return node;
                    }
                    element = <Element> element.previousSibling;
                }
            }
            this._cached.previousSibling = null;
        }
        return this._cached.previousSibling;
    }

    get nextSibling() {
        if (this._cached.nextSibling === undefined) {
            if (this.naturalElement) {
                let element = <Element> (this._element as Element).nextSibling;
                while (element) {
                    const node =  $session.getElementAsNode<Node>(element, this.sessionId);
                    if (node && (!node.excluded || node.lineBreak)) {
                        this._cached.nextSibling = node;
                        return node;
                    }
                    element = <Element> element.nextSibling;
                }
            }
            this._cached.nextSibling = null;
        }
        return this._cached.nextSibling;
    }

    get fontSize() {
        if (this._fontSize === 0) {
            this._fontSize = this.styleElement && !this.pseudoElement ? parseFloat(this.style.getPropertyValue('font-size')) : $css.parseUnit(this.css('fontSize'));
        }
        return this._fontSize || parseFloat($css.getStyle(document.body).getPropertyValue('font-size'));
    }

    set dir(value) {
        this._cached.dir = value;
    }
    get dir() {
        if (this._cached.dir === undefined) {
            let value = this.naturalElement && this.styleElement && !this.pseudoElement ? (<HTMLElement> this._element).dir : '';
            switch (value) {
                case 'ltr':
                case 'rtl':
                    break;
                default:
                    let parent = this.actualParent;
                    while (parent) {
                        value = parent.dir;
                        if (value) {
                            this._cached.dir = value;
                            break;
                        }
                        parent = parent.actualParent;
                    }
                    break;
            }
            this._cached.dir = value || document.body.dir;
        }
        return this._cached.dir;
    }

    get center(): Point {
        return {
            x: (this.bounds.left + this.bounds.right) / 2,
            y: (this.bounds.top + this.bounds.bottom) / 2
        };
    }
}
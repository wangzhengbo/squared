import { AutoMargin, InitialData, SiblingOptions, VisibleStyle } from '../base/@types/node';

import Container = squared.lib.base.Container;

declare global {
    namespace squared.base {
        interface Node extends Container<Node>, BoxModel {
            id: number;
            style: CSSStyleDeclaration;
            depth: number;
            siblingIndex: number;
            documentRoot: boolean;
            actualParent: Node | null;
            visible: boolean;
            inlineText: boolean;
            dir: string;
            documentParent: Node;
            actualChildren: Node[];
            parent?: Node;
            innerBefore?: Node;
            innerAfter?: Node;
            queryMap?: Node[][];
            readonly sessionId: string;
            readonly initial: InitialData<Node>;
            readonly box: BoxRectDimension;
            readonly bounds: BoxRectDimension;
            readonly linear: BoxRectDimension;
            readonly element: Element | null;
            readonly elementId: string;
            readonly tagName: string;
            readonly htmlElement: boolean;
            readonly styleElement: boolean;
            readonly naturalElement: boolean;
            readonly actualElement: boolean;
            readonly imageElement: boolean;
            readonly svgElement: boolean;
            readonly flexElement: boolean;
            readonly gridElement: boolean;
            readonly textElement: boolean;
            readonly tableElement: boolean;
            readonly inputElement: boolean;
            readonly layoutElement: boolean;
            readonly pseudoElement: boolean;
            readonly documentBody: boolean;
            readonly dataset: DOMStringMap;
            readonly extensions: string[];
            readonly centerAligned: boolean;
            readonly rightAligned: boolean;
            readonly bottomAligned: boolean;
            readonly horizontalAligned: boolean;
            readonly width: number;
            readonly height: number;
            readonly hasWidth: boolean;
            readonly hasHeight: boolean;
            readonly lineHeight: number;
            readonly display: string;
            readonly positionRelative: boolean;
            readonly top: number;
            readonly right: number;
            readonly bottom: number;
            readonly left: number;
            readonly marginTop: number;
            readonly marginRight: number;
            readonly marginBottom: number;
            readonly marginLeft: number;
            readonly borderTopWidth: number;
            readonly borderRightWidth: number;
            readonly borderBottomWidth: number;
            readonly borderLeftWidth: number;
            readonly paddingTop: number;
            readonly paddingRight: number;
            readonly paddingBottom: number;
            readonly paddingLeft: number;
            readonly inlineFlow: boolean;
            readonly inline: boolean;
            readonly inlineStatic: boolean;
            readonly inlineVertical: boolean;
            readonly plainText: boolean;
            readonly textContent: string;
            readonly lineBreak: boolean;
            readonly positionStatic: boolean;
            readonly block: boolean;
            readonly blockStatic: boolean;
            readonly blockDimension: boolean;
            readonly blockVertical: boolean;
            readonly contentBox: boolean;
            readonly autoMargin: AutoMargin;
            readonly pageFlow: boolean;
            readonly floating: boolean;
            readonly float: string;
            readonly positionAuto: boolean;
            readonly baseline: boolean;
            readonly multiline: boolean;
            readonly overflow: number;
            readonly contentBoxWidth: number;
            readonly contentBoxHeight: number;
            readonly flexbox: Flexbox;
            readonly zIndex: number;
            readonly positiveAxis: boolean;
            readonly leftTopAxis: boolean;
            readonly backgroundImage: string;
            readonly visibleStyle: VisibleStyle;
            readonly fontSize: number;
            readonly percentWidth: boolean;
            readonly percentHeight: boolean;
            readonly src: string;
            readonly overflowX: boolean;
            readonly overflowY: boolean;
            readonly verticalAlign: string;
            readonly textEmpty: boolean;
            readonly preserveWhiteSpace: boolean;
            readonly absoluteParent: Node | null;
            readonly actualWidth: number;
            readonly actualHeight: number;
            readonly actualDimension: Dimension;
            readonly firstChild: Node | null;
            readonly lastChild: Node | null;
            readonly previousSibling: Node | null;
            readonly nextSibling: Node | null;
            readonly previousElementSibling: Node | null;
            readonly nextElementSibling: Node | null;
            readonly childrenElements: Node[];
            readonly attributes: StringMap;
            readonly center: Point;
            init(): void;
            saveAsInitial(overwrite?: boolean): void;
            unsafe(name: string, unset?: boolean): any;
            data(name: string, attr: string, value?: any, overwrite?: boolean): any;
            unsetCache(...attrs: string[]): void;
            ascend(condition?: (item: Node) => boolean, parent?: Node, attr?: string): Node[];
            intersectX(rect: BoxRectDimension, dimension?: string): boolean;
            intersectY(rect: BoxRectDimension, dimension?: string): boolean;
            withinX(rect: BoxRectDimension, dimension?: string): boolean;
            withinY(rect: BoxRectDimension, dimension?: string): boolean;
            outsideX(rect: BoxRectDimension, dimension?: string): boolean;
            outsideY(rect: BoxRectDimension, dimension?: string): boolean;
            css(attr: string, value?: string, cache?: boolean): string;
            cssSet(attr: string, value: string, cache?: boolean): this;
            cssApply(values: StringMap, cache?: boolean): this;
            cssInitial(attr: string, modified?: boolean, computed?: boolean): string;
            cssAny(attr: string, ...values: string[]): boolean;
            cssInitialAny(attr: string, ...values: string[]): boolean;
            cssAscend(attr: string, startChild?: boolean, dimension?: string): string;
            cssSort(attr: string, ascending?: boolean, duplicate?: boolean): Node[];
            cssPX(attr: string, value: number, negative?: boolean, cache?: boolean): string;
            cssSpecificity(attr: string): number;
            cssTry(attr: string, value: string): boolean;
            cssFinally(attr: string): boolean;
            toInt(attr: string, initial?: boolean, fallback?: number): number;
            toFloat(attr: string, initial?: boolean, fallback?: number): number;
            parseUnit(value: string, dimension?: string, parent?: boolean): number;
            convertPX(value: string, dimension?: string, parent?: boolean): string;
            has(attr: string, checkType?: number, options?: {}): boolean;
            setBounds(cache?: boolean): void;
            querySelector(value: string): Node | null;
            querySelectorAll(value: string, resultCount?: number): Node[];
        }

        class Node implements Node {
            public static copyTextStyle(dest: Node, source: Node): void;
            constructor(id: number, sessionId?: string, element?: Element);
        }
    }
}

export = squared.base.Node;
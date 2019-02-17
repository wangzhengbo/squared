import { AutoMargin, Support, VisibleStyle } from '../base/@types/node';

import Container = squared.lib.base.Container;

declare global {
    namespace squared.base {
        interface Node extends Container<Node>, BoxModel {
            id: number;
            style: CSSStyleDeclaration;
            containerType: number;
            alignmentType: number;
            depth: number;
            siblingIndex: number;
            renderPosition: number;
            renderExtension: Set<Extension<Node>>;
            documentRoot: boolean;
            positionStatic: boolean;
            baselineActive: boolean;
            positioned: boolean;
            visible: boolean;
            excluded: boolean;
            rendered: boolean;
            controlId: string;
            tagName: string;
            controlName: string;
            renderDepth: number;
            renderPositionId: string;
            inlineText: boolean;
            multiline: number;
            overflow: number;
            documentParent: Node;
            parent?: Node;
            renderParent?: Node;
            companion?: Node;
            renderAs?: Node;
            readonly localSettings: {};
            readonly excludeSection: number;
            readonly excludeProcedure: number;
            readonly excludeResource: number;
            readonly renderChildren: Node[];
            readonly box: RectDimension;
            readonly bounds: RectDimension;
            readonly linear: RectDimension;
            readonly element: Element | null;
            readonly htmlElement: boolean;
            readonly styleElement: boolean;
            readonly naturalElement: boolean;
            readonly imageElement: boolean;
            readonly svgElement: boolean;
            readonly flexElement: boolean;
            readonly gridElement: boolean;
            readonly textElement: boolean;
            readonly tableElement: boolean;
            readonly groupParent: boolean;
            readonly documentBody: boolean;
            readonly dataset: DOMStringMap;
            readonly extensions: string[];
            readonly flexbox: Flexbox;
            readonly rightAligned: boolean;
            readonly bottomAligned: boolean;
            readonly width: number;
            readonly height: number;
            readonly hasWidth: boolean;
            readonly hasHeight: boolean;
            readonly lineHeight: number;
            readonly display: string;
            readonly position: string;
            readonly positionRelative: boolean;
            readonly positionAuto: boolean;
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
            readonly contentBoxWidth: number;
            readonly contentBoxHeight: number;
            readonly inlineFlow: boolean;
            readonly inline: boolean;
            readonly inlineStatic: boolean;
            readonly inlineVertical: boolean;
            readonly plainText: boolean;
            readonly lineBreak: boolean;
            readonly block: boolean;
            readonly blockStatic: boolean;
            readonly blockDimension: boolean;
            readonly autoMargin: AutoMargin;
            readonly pageFlow: boolean;
            readonly floating: boolean;
            readonly float: string;
            readonly zIndex: number;
            readonly visibleStyle: VisibleStyle;
            readonly textContent: string;
            readonly fontSize: number;
            readonly overflowX: boolean;
            readonly overflowY: boolean;
            readonly baseline: boolean;
            readonly verticalAlign: string;
            readonly preserveWhiteSpace: boolean;
            readonly layoutHorizontal: boolean;
            readonly layoutVertical: boolean;
            readonly support: Support;
            readonly absoluteParent: Node | undefined;
            readonly actualParent: Node | undefined;
            readonly actualChildren: Node[];
            readonly actualHeight: number;
            readonly firstChild: Node | undefined;
            readonly lastChild: Node | undefined;
            readonly documentId: string;
            readonly dir: string;
            readonly nodes: Node[];
            readonly center: Point;
            setControlType(controlName: string, containerType?: number): void;
            setLayout(): void;
            setAlignment(): void;
            applyOptimizations(): void;
            applyCustomizations(): void;
            modifyBox(region: number, offset: number | null, negative?: boolean): void;
            valueBox(region: number): [number, number];
            alignParent(position: string): boolean;
            alignSibling(position: string): boolean;
            localizeString(value: string): string;
            clone(id?: number, attributes?: boolean, position?: boolean): Node;
            init(): void;
            saveAsInitial(): void;
            is(...containers: number[]): boolean;
            of(containerType: number, ...alignmentType: number[]): boolean;
            unsafe(obj: string): any;
            attr(obj: string, attr: string, value?: string, overwrite?: boolean): string;
            namespace(obj: string): StringMap;
            delete(obj: string, ...attrs: string[]): void;
            apply(options: {}): void;
            render(parent: Node): void;
            renderEach(predicate: IteratorPredicate<Node, void>): this;
            renderFilter(predicate: IteratorPredicate<Node, boolean>): Node[];
            hide(invisible?: boolean): void;
            data(obj: string, attr: string, value?: any, overwrite?: boolean): any;
            unsetCache(...attrs: string[]): void;
            ascend(generated?: boolean, levels?: number): Node[];
            cascade(element?: boolean): Node[];
            inherit(node: Node, ...props: string[]): void;
            alignedVertically(previousSiblings: Node[], siblings?: Node[], cleared?: Map<Node, string>, checkFloat?: boolean): boolean;
            intersectX(rect: RectDimension, dimension?: string): boolean;
            intersectY(rect: RectDimension, dimension?: string): boolean;
            withinX(rect: RectDimension, dimension?: string): boolean;
            withinY(rect: RectDimension, dimension?: string): boolean;
            outsideX(rect: RectDimension, dimension?: string): boolean;
            outsideY(rect: RectDimension, dimension?: string): boolean;
            css(attr: object | string, value?: string, cache?: boolean): string;
            cssInitial(attr: string, modified?: boolean, computed?: boolean): string;
            cssParent(attr: string, childStart?: boolean, visible?: boolean): string;
            cssSort(attr: string, duplicate?: boolean): Node[];
            cssPX(attr: string, value: number, negative?: boolean, cache?: boolean): string;
            cssTry(attr: string, value: string): boolean;
            cssFinally(attr: string): boolean;
            appendTry(node: Node, withNode: Node, append?: boolean): void;
            toInt(attr: string, initial?: boolean, defaultValue?: number): number;
            convertPX(value: string, horizontal?: boolean, parent?: boolean): string;
            convertPercent(value: string, horizontal: boolean, parent?: boolean): string;
            has(attr: string, checkType?: number, options?: {}): boolean;
            hasBit(attr: string, value: number): boolean;
            hasAlign(value: number): boolean;
            exclude(options: { section?: number, procedure?: number, resource?: number }): void;
            setExclusions(): void;
            setBounds(calibrate?: boolean): void;
            setBoxSpacing(): void;
            resetBox(region: number, node?: Node, fromParent?: boolean): void;
            inheritBox(region: number, node: Node): void;
            actualRight(dimension?: string): number;
            previousSiblings(lineBreak?: boolean, excluded?: boolean, height?: boolean): Node[];
            nextSiblings(lineBreak?: boolean, excluded?: boolean, height?: boolean): Node[];
        }

        class Node implements Node {}

        class NodeGroup extends Node {}
    }
}

export = squared.base.Node;
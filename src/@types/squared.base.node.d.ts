import { NodeTemplate } from '../base/@types/application';
import { AutoMargin, InitialData, SiblingDirection, Support, VisibleStyle } from '../base/@types/node';

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
            documentRoot: boolean;
            positionStatic: boolean;
            baselineActive: boolean;
            baselineAltered: boolean;
            lineBreakLeading: boolean;
            lineBreakTrailing: boolean;
            positioned: boolean;
            visible: boolean;
            excluded: boolean;
            rendered: boolean;
            controlId: string;
            tagName: string;
            controlName: string;
            baseline: boolean;
            textContent: string;
            multiline: boolean;
            overflow: number;
            flexbox: Flexbox;
            dir: string;
            documentParent: Node;
            actualChildren: Node[];
            renderExclude: boolean;
            renderAs?: Node;
            parent?: Node;
            renderParent?: Node;
            renderExtension?: Extension<Node>[];
            renderTemplates?: NodeTemplate<Node>[];
            outerWrapper?: Node;
            innerWrapped?: Node;
            pseudoBeforeChild?: Node;
            pseudoAfterChild?: Node;
            companion?: Node;
            extracted?: Node[];
            horizontalRows?: Node[][];
            readonly sessionId: string;
            readonly localSettings: {};
            readonly excludeSection: number;
            readonly excludeProcedure: number;
            readonly excludeResource: number;
            readonly renderChildren: Node[];
            readonly initial: InitialData<Node>;
            readonly box: BoxRectDimension;
            readonly bounds: BoxRectDimension;
            readonly linear: BoxRectDimension;
            readonly element: Element | null;
            readonly elementId: string;
            readonly htmlElement: boolean;
            readonly styleElement: boolean;
            readonly naturalElement: boolean;
            readonly imageElement: boolean;
            readonly svgElement: boolean;
            readonly flexElement: boolean;
            readonly gridElement: boolean;
            readonly textElement: boolean;
            readonly tableElement: boolean;
            readonly inputElement: boolean;
            readonly layoutElement: boolean;
            readonly pseudoElement: boolean;
            readonly groupParent: boolean;
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
            readonly inlineText: boolean;
            readonly lineBreak: boolean;
            readonly block: boolean;
            readonly blockStatic: boolean;
            readonly blockDimension: boolean;
            readonly contentBox: boolean;
            readonly autoMargin: AutoMargin;
            readonly pageFlow: boolean;
            readonly floating: boolean;
            readonly float: string;
            readonly zIndex: number;
            readonly positiveAxis: boolean;
            readonly leftTopAxis: boolean;
            readonly visibleStyle: VisibleStyle;
            readonly fontSize: number;
            readonly src: string;
            readonly overflowX: boolean;
            readonly overflowY: boolean;
            readonly verticalAlign: string;
            readonly textEmpty: boolean;
            readonly preserveWhiteSpace: boolean;
            readonly layoutHorizontal: boolean;
            readonly layoutVertical: boolean;
            readonly support: Support;
            readonly absoluteParent: Node | null;
            readonly actualParent: Node | null;
            readonly actualWidth: number;
            readonly actualHeight: number;
            readonly actualDimension: Dimension;
            readonly firstChild: Node | null;
            readonly lastChild: Node | null;
            readonly previousSibling: Node | null;
            readonly nextSibling: Node | null;
            readonly singleChild: boolean;
            readonly documentId: string;
            readonly nodes: Node[];
            readonly center: Point;
            setControlType(controlName: string, containerType?: number): void;
            setLayout(): void;
            setAlignment(): void;
            applyOptimizations(): void;
            applyCustomizations(overwrite?: boolean): void;
            modifyBox(region: number, offset: number | null, negative?: boolean): void;
            valueBox(region: number): [number, number];
            alignParent(position: string): boolean;
            alignSibling(position: string, documentId?: string): string;
            localizeString(value: string): string;
            clone(id?: number, attributes?: boolean, position?: boolean): Node;
            init(): void;
            saveAsInitial(overwrite?: boolean): void;
            is(...containers: number[]): boolean;
            of(containerType: number, ...alignmentType: number[]): boolean;
            unsafe(name: string, reset?: boolean): any;
            attr(name: string, attr: string, value?: string, overwrite?: boolean): string;
            namespace(name: string): StringMap;
            delete(name: string, ...attrs: string[]): void;
            apply(options: {}): void;
            render(parent?: Node): void;
            renderEach(predicate: IteratorPredicate<Node, void>): this;
            renderFilter(predicate: IteratorPredicate<Node, boolean>): Node[];
            hide(invisible?: boolean): void;
            data(name: string, attr: string, value?: any, overwrite?: boolean): any;
            unsetCache(...attrs: string[]): void;
            ascend(generated?: boolean, condition?: (item: Node) => boolean, parent?: Node): Node[];
            cascade(predicate?: (item: Node) => boolean, element?: boolean): Node[];
            inherit(node: Node, ...modules: string[]): void;
            alignedVertically(previousSiblings: Node[], siblings?: Node[], cleared?: Map<Node, string>, horizontal?: boolean): number;
            intersectX(rect: BoxRectDimension, dimension?: string): boolean;
            intersectY(rect: BoxRectDimension, dimension?: string): boolean;
            withinX(rect: BoxRectDimension, dimension?: string): boolean;
            withinY(rect: BoxRectDimension, dimension?: string): boolean;
            outsideX(rect: BoxRectDimension, dimension?: string): boolean;
            outsideY(rect: BoxRectDimension, dimension?: string): boolean;
            css(attr: string, value?: string, cache?: boolean): string;
            cssApply(values: StringMap, cache?: boolean): this;
            cssInitial(attr: string, modified?: boolean, computed?: boolean): string;
            cssAny(attr: string, ...values: string[]): boolean;
            cssInitialAny(attr: string, ...values: string[]): boolean;
            cssAscend(attr: string, startChild?: boolean, visible?: boolean): string;
            cssSort(attr: string, ascending?: boolean, duplicate?: boolean): Node[];
            cssPX(attr: string, value: number, negative?: boolean, cache?: boolean): string;
            cssSpecificity(attr: string): number;
            cssTry(attr: string, value: string): boolean;
            cssFinally(attr: string): boolean;
            appendTry(node: Node, replacement: Node, append?: boolean): boolean;
            toInt(attr: string, initial?: boolean, fallback?: number): number;
            toFloat(attr: string, initial?: boolean, fallback?: number): number;
            parseUnit(value: string, horizontal?: boolean, parent?: boolean): number;
            convertPX(value: string, horizontal?: boolean, parent?: boolean): string;
            has(attr: string, checkType?: number, options?: {}): boolean;
            hasAlign(value: number): boolean;
            hasProcedure(value: number): boolean;
            hasResource(value: number): boolean;
            hasSection(value: number): boolean;
            exclude(options: { section?: number, procedure?: number, resource?: number }): void;
            setExclusions(): void;
            setBounds(cache?: boolean): void;
            setInlineText(value: boolean, overwrite?: boolean): void;
            setBoxSpacing(): void;
            extractAttributes(depth: number): string;
            resetBox(region: number, node?: Node, fromParent?: boolean): void;
            inheritBox(region: number, node: Node): void;
            actualRect(direction: string, dimension?: string): number;
            previousSiblings(options?: SiblingDirection): Node[];
            nextSiblings(options?: SiblingDirection): Node[];
            getFirstChildElement(options?: SiblingDirection): Element | null;
            getLastChildElement(options?: SiblingDirection): Element | null;
        }

        class Node implements Node {}

        class NodeGroup extends Node {}
    }
}

export = squared.base.Node;
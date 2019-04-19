import { FlexboxData } from '../../../src/base/@types/extension';

import Controller from '../controller';
import View from '../view';

import { AXIS_ANDROID } from '../lib/constant';
import { CONTAINER_NODE } from '../lib/enumeration';

import $Layout = squared.base.Layout;
import $NodeList = squared.base.NodeList;

type FlexBasis = {
    item: View;
    basis: number;
    dimension: number;
    shrink: number;
    grow: number;
};

const $const = squared.base.lib.constant;
const $enum = squared.base.lib.enumeration;
const $math = squared.lib.math;
const $util = squared.lib.util;

const CHAIN_MAP = {
    leftTop: ['left', 'top'],
    rightBottom: ['right', 'bottom'],
    rightLeftBottomTop: ['rightLeft', 'bottomTop'],
    leftRightTopBottom: ['leftRight', 'topBottom'],
    widthHeight: ['Width', 'Height'],
    horizontalVertical: [AXIS_ANDROID.HORIZONTAL, AXIS_ANDROID.VERTICAL]
};

function adjustGrowRatio(parent: View, items: View[], attr: string) {
    const horizontal = attr === 'width';
    let percent = parent[attr] > 0 || parent.blockStatic && $util.withinRange(parent.parseUnit(parent.css(horizontal ? 'maxWidth' : 'maxHeight')), parent.box.width);
    if (percent) {
        for (const item of items) {
            const autoMargin = item.innerChild ? item.innerChild.autoMargin : item.autoMargin;
            if (horizontal) {
                if (autoMargin.horizontal) {
                    percent = false;
                    break;
                }
            }
            else {
                if (autoMargin.vertical) {
                    percent = false;
                    break;
                }
            }
        }
    }
    const result = items.reduce((a, b) => a + b.flexbox.grow, 0);
    if (items.length > 1 && (horizontal || percent)) {
        const groupBasis: FlexBasis[] = [];
        const percentage: View[] = [];
        let maxBasis!: View;
        let maxBasisUnit = 0;
        let maxDimension = 0;
        let maxRatio = NaN;
        for (const item of items) {
            const dimension = item.bounds[attr];
            if (item.flexbox.grow > 0 || item.flexbox.shrink !== 1) {
                const basis = item.flexbox.basis === 'auto' ? item.parseUnit(item.css(attr), horizontal) : item.parseUnit(item.flexbox.basis, horizontal);
                if (basis > 0) {
                    const { shrink, grow } = item.flexbox;
                    let largest = false;
                    if (dimension < basis) {
                        if (isNaN(maxRatio) || shrink < maxRatio) {
                            maxRatio = shrink;
                            largest = true;
                        }
                    }
                    else {
                        if (isNaN(maxRatio) || grow > maxRatio) {
                            maxRatio = grow;
                            largest = true;
                        }
                    }
                    if (largest) {
                        maxBasis = item;
                        maxBasisUnit = basis;
                        maxDimension = dimension;
                    }
                    groupBasis.push({
                        item,
                        basis,
                        dimension,
                        shrink,
                        grow
                    });
                    continue;
                }
            }
            if (percent && item.flexbox.alignSelf === 'auto' && !item.has(attr)) {
                percentage.push(item);
            }
        }
        if (groupBasis.length > 1) {
            for (const data of groupBasis) {
                const item = data.item;
                if (item === maxBasis || data.basis === maxBasisUnit && (maxRatio === data.shrink || maxRatio === data.grow)) {
                    item.flexbox.grow = 1;
                }
                else {
                    item.flexbox.grow = ((data.dimension / data.basis) / (maxDimension / maxBasisUnit)) * data.basis / maxBasisUnit;
                }
            }
        }
        if (percentage.length) {
            const rowSize = parent.box[attr];
            for (const item of percentage) {
                item.flexbox.basis = `${item.bounds[attr] / rowSize * 100}%`;
            }
        }
    }
    return result;
}

function getAutoMargin(node: View) {
    return node.innerChild ? node.innerChild.autoMargin : node.autoMargin;
}

export default class <T extends View> extends squared.base.extensions.Flexbox<T> {
    public processNode(node: T, parent: T) {
        super.processNode(node, parent);
        const mainData: FlexboxData<T> = node.data($const.EXT_NAME.FLEXBOX, 'mainData');
        const layout = new $Layout(
            parent,
            node,
            0,
            $enum.NODE_ALIGNMENT.AUTO_LAYOUT
        );
        layout.itemCount = node.length;
        layout.rowCount = mainData.rowCount;
        layout.columnCount = mainData.columnCount;
        if (mainData.directionRow && (mainData.rowCount === 1 || node.hasHeight) || mainData.directionColumn && (mainData.columnCount === 1 || node.hasWidth) || node.find(item => !item.pageFlow)) {
            layout.containerType = CONTAINER_NODE.CONSTRAINT;
        }
        else {
            layout.setType(CONTAINER_NODE.LINEAR, mainData.directionColumn ? $enum.NODE_ALIGNMENT.HORIZONTAL : $enum.NODE_ALIGNMENT.VERTICAL);
        }
        return {
            output: this.application.renderNode(layout),
            complete: true
        };
    }

    public processChild(node: T, parent: T) {
        if (node.hasAlign($enum.NODE_ALIGNMENT.SEGMENTED)) {
            return {
                output: this.application.renderNode(
                    new $Layout(
                        parent,
                        node,
                        CONTAINER_NODE.CONSTRAINT,
                        $enum.NODE_ALIGNMENT.AUTO_LAYOUT,
                        node.children as T[]
                    )
                ),
                complete: true
            };
        }
        else if (node.autoMargin.horizontal || node.autoMargin.vertical && node.has('height', $enum.CSS_STANDARD.LENGTH)) {
            const mainData: FlexboxData<T> = parent.data($const.EXT_NAME.FLEXBOX, 'mainData');
            if (mainData) {
                const index = mainData.children.findIndex(item => item === node);
                if (index !== -1) {
                    const container = (<android.base.Controller<T>> this.application.controllerHandler).createNodeWrapper(node, parent);
                    container.cssApply({
                        marginTop: '0px',
                        marginRight: '0px',
                        marginBottom: '0px',
                        marginLeft: '0px',
                    }, true);
                    container.saveAsInitial(true);
                    container.flexbox = { ...node.flexbox };
                    mainData.children[index] = container;
                    if (node.autoMargin.horizontal && !node.hasWidth) {
                        node.android('layout_width', 'wrap_content');
                    }
                    return {
                        parent: container,
                        renderAs: container,
                        outputAs: this.application.renderNode(
                            new $Layout(
                                parent,
                                container,
                                CONTAINER_NODE.FRAME,
                                $enum.NODE_ALIGNMENT.SINGLE,
                                container.children as T[]
                            )
                        )
                    };
                }
            }
        }
        return undefined;
    }

    public postBaseLayout(node: T) {
        const mainData: FlexboxData<T> = node.data($const.EXT_NAME.FLEXBOX, 'mainData');
        if (mainData) {
            const chainHorizontal: T[][] = [];
            const chainVertical: T[][] = [];
            const segmented: T[] = [];
            if (mainData.wrap) {
                let previous: T[] | undefined;
                node.each((item: T) => {
                    if (item.hasAlign($enum.NODE_ALIGNMENT.SEGMENTED)) {
                        const pageFlow = item.renderFilter(child => child.pageFlow) as T[];
                        if (pageFlow.length) {
                            if (mainData.directionRow) {
                                item.android('layout_width', 'match_parent');
                                chainHorizontal.push(pageFlow);
                            }
                            else {
                                item.android('layout_height', 'match_parent');
                                if (previous) {
                                    let largest = previous[0];
                                    for (let j = 1; j < previous.length; j++) {
                                        if (previous[j].linear.right > largest.linear.right) {
                                            largest = previous[j];
                                        }
                                    }
                                    const offset = item.linear.left - largest.actualRect('right');
                                    if (offset > 0) {
                                        item.modifyBox($enum.BOX_STANDARD.MARGIN_LEFT, offset);
                                    }
                                    item.constraint.horizontal = true;
                                }
                                chainVertical.push(pageFlow);
                                previous = pageFlow;
                            }
                            segmented.push(item);
                        }
                    }
                });
                if (node.layoutLinear) {
                    if (mainData.directionColumn && mainData.wrapReverse) {
                        node.mergeGravity('gravity', 'right');
                    }
                }
                else if (segmented.length) {
                    if (mainData.directionRow) {
                        chainVertical.push(segmented);
                    }
                    else {
                        chainHorizontal.push(segmented);
                    }
                }
            }
            else {
                if (mainData.directionRow) {
                    if (mainData.directionReverse) {
                        mainData.children.reverse();
                    }
                    chainHorizontal[0] = mainData.children;
                }
                else {
                    if (mainData.directionReverse) {
                        mainData.children.reverse();
                    }
                    chainVertical[0] = mainData.children;
                }
            }
            [chainHorizontal, chainVertical].forEach((partition, index) => {
                const horizontal = index === 0;
                const inverse = horizontal ? 1 : 0;
                const orientation = CHAIN_MAP.horizontalVertical[index];
                const orientationInverse = CHAIN_MAP.horizontalVertical[inverse];
                const WH = CHAIN_MAP.widthHeight[index];
                const HW = CHAIN_MAP.widthHeight[inverse];
                const LT = CHAIN_MAP.leftTop[index];
                const TL = CHAIN_MAP.leftTop[inverse];
                const RB = CHAIN_MAP.rightBottom[index];
                const BR = CHAIN_MAP.rightBottom[inverse];
                const LRTB = CHAIN_MAP.leftRightTopBottom[index];
                const RLBT = CHAIN_MAP.rightLeftBottomTop[index];
                const WHL = WH.toLowerCase();
                const HWL = HW.toLowerCase();
                const dimensionDirection = node[`has${WH}`];
                const hasDimension = (chain: T): boolean => chain[HWL] > 0;
                function setLayoutWeight(chain: T, value: number) {
                    chain.app(`layout_constraint${$util.capitalize(orientation)}_weight`, $math.truncate(value, chain.localSettings.floatPrecision));
                    chain.android(`layout_${WH.toLowerCase()}`, '0px');
                }
                for (let i = 0; i < partition.length; i++) {
                    const seg = partition[i];
                    const segStart = seg[0];
                    const segEnd = seg[seg.length - 1];
                    const opposing = seg === segmented;
                    const justifyContent = !opposing && seg.every(item => item.flexbox.grow === 0);
                    const spreadInside = justifyContent && (mainData.justifyContent === 'space-between' || mainData.justifyContent === 'space-around' && seg.length > 1);
                    const layoutWeight: T[] = [];
                    let maxSize = 0;
                    let growAvailable = 0;
                    let parentEnd = true;
                    let baseline: T | undefined;
                    if (opposing) {
                        if (dimensionDirection) {
                            let chainStyle = 'spread';
                            let bias = 0;
                            switch (mainData.alignContent) {
                                case 'left':
                                case 'right':
                                case 'flex-end':
                                    chainStyle = 'packed';
                                    bias = 1;
                                    parentEnd = false;
                                    break;
                                case 'baseline':
                                case 'start':
                                case 'end':
                                case 'flex-start':
                                    chainStyle = 'packed';
                                    parentEnd = false;
                                    break;
                            }
                            segStart.anchorStyle(orientation, chainStyle, bias);
                        }
                    }
                    else {
                        growAvailable = 1 - adjustGrowRatio(node, seg, WHL);
                        if (seg.length > 1) {
                            const sizeMap = new Set<number>($util.objectMap(seg, item => item.initial.bounds ? item.initial.bounds[HWL] : 0));
                            if (sizeMap.size > 1) {
                                maxSize = $math.maxArray(Array.from(sizeMap));
                            }
                        }
                    }
                    for (let j = 0; j < seg.length; j++) {
                        const chain = seg[j];
                        const previous = seg[j - 1];
                        const next = seg[j + 1];
                        if (next) {
                            chain.anchor(RLBT, (next.outerParent || next).documentId);
                        }
                        if (previous) {
                            chain.anchor(LRTB, (previous.outerParent || previous).documentId);
                        }
                        if (opposing) {
                            if (parentEnd && seg.length > 1 && dimensionDirection) {
                                setLayoutWeight(chain, 1);
                            }
                        }
                        else {
                            const autoMargin = getAutoMargin(chain);
                            const innerChild = chain.innerChild as T | undefined;
                            if (horizontal) {
                                if (autoMargin.horizontal) {
                                    if (innerChild) {
                                        let gravity: string;
                                        if (autoMargin.leftRight) {
                                            gravity = 'center_horizontal';
                                        }
                                        else {
                                            gravity = chain.localizeString(autoMargin.left ? 'right' : 'left');
                                        }
                                        innerChild.mergeGravity('layout_gravity', gravity);
                                        if (growAvailable > 0) {
                                            chain.flexbox.basis = '0%';
                                            layoutWeight.push(chain);
                                        }
                                    }
                                    else if (!autoMargin.leftRight) {
                                        if (autoMargin.left) {
                                            if (previous) {
                                                chain.anchorDelete(LRTB);
                                            }
                                        }
                                        else {
                                            if (next) {
                                                chain.anchorDelete(RLBT);
                                            }
                                        }
                                    }
                                }
                            }
                            else {
                                if (autoMargin.vertical) {
                                    if (innerChild) {
                                        let gravity: string;
                                        if (autoMargin.topBottom) {
                                            gravity = 'center_vertical';
                                        }
                                        else {
                                            gravity = chain.localizeString(autoMargin.top ? 'bottom' : 'top');
                                        }
                                        innerChild.mergeGravity('layout_gravity', gravity);
                                        if (growAvailable > 0) {
                                            chain.flexbox.basis = '0%';
                                            layoutWeight.push(chain);
                                        }
                                    }
                                    else if (!autoMargin.topBottom) {
                                        if (autoMargin.top) {
                                            if (previous) {
                                                chain.anchorDelete(LRTB);
                                            }
                                        }
                                        else {
                                            if (next) {
                                                chain.anchorDelete(RLBT);
                                            }
                                        }
                                    }
                                }
                            }
                            switch (chain.flexbox.alignSelf) {
                                case 'stretch':
                                    chain.anchorParent(orientationInverse);
                                    chain.android(`layout_${HWL}`, '0px');
                                    break;
                                case 'start':
                                case 'flex-start':
                                    chain.anchor(TL, 'parent');
                                    break;
                                case 'end':
                                case 'flex-end':
                                    chain.anchor(BR, 'parent');
                                    break;
                                case 'baseline':
                                    if (horizontal) {
                                        if (baseline === undefined) {
                                            baseline = $NodeList.baseline(seg)[0];
                                        }
                                        if (baseline && chain !== baseline) {
                                            chain.anchor('baseline', baseline.documentId);
                                        }
                                    }
                                    break;
                                case 'center':
                                    chain.anchorParent(orientationInverse);
                                    chain.anchorStyle(orientationInverse, 'packed', 0.5);
                                    if (!hasDimension(chain)) {
                                        chain.android(`layout_${HWL}`, chain.some(item => item.textElement && (item.blockStatic || item.multiline)) ? '0dp' : 'wrap_content');
                                    }
                                    break;
                                default:
                                    const contentChild = chain.innerChild as T;
                                    const wrapReverse = mainData.wrapReverse;
                                    switch (mainData.alignContent) {
                                        case 'center':
                                            if (partition.length % 2 === 1 && i === Math.floor(partition.length / 2)) {
                                                chain.anchorParent(orientationInverse);
                                            }
                                            else if (i < partition.length / 2) {
                                                chain.anchor(BR, 'parent');
                                            }
                                            else if (i >= partition.length / 2) {
                                                chain.anchor(TL, 'parent');
                                            }
                                            break;
                                        case 'space-evenly':
                                        case 'space-around':
                                            if (chain.layoutFrame && contentChild) {
                                                contentChild.mergeGravity('layout_gravity', horizontal ? 'center_vertical' : 'center_horizontal');
                                            }
                                            else {
                                                chain.anchorParent(orientationInverse);
                                            }
                                            break;
                                        case 'space-between':
                                            if (spreadInside && seg.length === 2) {
                                                chain.anchorDelete(j === 0 ? RLBT : LRTB);
                                            }
                                            if (i === 0) {
                                                if (chain.layoutFrame && contentChild) {
                                                    contentChild.mergeGravity('layout_gravity', wrapReverse ? BR : TL);
                                                }
                                                else {
                                                    chain.anchor(wrapReverse ? BR : TL, 'parent');
                                                }
                                            }
                                            else if (partition.length > 2 && i < partition.length - 1) {
                                                if (chain.layoutFrame && contentChild) {
                                                    contentChild.mergeGravity('layout_gravity', horizontal ? 'center_vertical' : 'center_horizontal');
                                                }
                                                else {
                                                    chain.anchorParent(orientationInverse);
                                                }
                                            }
                                            else {
                                                if (chain.layoutFrame && contentChild) {
                                                    contentChild.mergeGravity('layout_gravity', wrapReverse ? TL : BR);
                                                }
                                                else {
                                                    chain.anchor(wrapReverse ? TL : BR, 'parent');
                                                }
                                            }
                                            break;
                                        default: {
                                            chain.anchorParent(orientationInverse);
                                            chain.anchorStyle(orientationInverse, 'packed', wrapReverse ? 1 : 0);
                                            if (!hasDimension(chain)) {
                                                const bounds = chain.initial.bounds && chain.initial.bounds[HWL];
                                                const stretchable = node[HWL] > 0;
                                                const smaller = bounds < maxSize;
                                                const attr = `layout_${HWL}`;
                                                if (!smaller) {
                                                    if (maxSize === 0) {
                                                        chain.android(attr, stretchable && chain.bounds[HWL] > bounds ? '0px' : 'wrap_content');
                                                    }
                                                }
                                                else if (stretchable || maxSize === 0 || smaller) {
                                                    if (maxSize === 0 && (!stretchable && seg.length > 1 || mainData.wrap)) {
                                                        chain.android(attr, 'wrap_content');
                                                    }
                                                    else if (horizontal && !stretchable) {
                                                        chain.android(attr, smaller ? '0px' : 'match_parent');
                                                    }
                                                    else {
                                                        chain.android(attr, '0px');
                                                    }
                                                    if (innerChild && !innerChild.autoMargin[orientation]) {
                                                        innerChild.android(attr, 'match_parent');
                                                    }
                                                }
                                            }
                                            break;
                                        }
                                    }
                                    break;
                            }
                            Controller.setFlexDimension(chain, WHL);
                        }
                        chain.anchored = true;
                        chain.positioned = true;
                    }
                    if (growAvailable > 0) {
                        for (const item of layoutWeight) {
                            const autoMargin = getAutoMargin(item);
                            let ratio = 1;
                            if (horizontal) {
                                if (autoMargin.leftRight) {
                                    ratio = 2;
                                }
                            }
                            else if (autoMargin.topBottom) {
                                ratio = 2;
                            }
                            setLayoutWeight(item, Math.max(item.flexbox.grow, (growAvailable * ratio) / layoutWeight.length));
                        }
                    }
                    segStart.anchor(LT, 'parent');
                    segEnd.anchor(RB, 'parent');
                    if (!opposing && (horizontal || mainData.directionColumn)) {
                        let centered = false;
                        if (justifyContent) {
                            switch (mainData.justifyContent) {
                                case 'left':
                                    if (!horizontal) {
                                        break;
                                    }
                                case 'start':
                                case 'flex-start':
                                    segStart.anchorStyle(orientation);
                                    break;
                                case 'center':
                                    if (seg.length > 1) {
                                        segStart.anchorStyle(orientation, 'packed', 0.5);
                                    }
                                    centered = true;
                                    break;
                                case 'right':
                                    if (!horizontal) {
                                        break;
                                    }
                                case 'end':
                                case 'flex-end':
                                    segStart.anchorStyle(orientation, 'packed', 1);
                                    break;
                                case 'space-between':
                                    if (seg.length === 1) {
                                        segEnd.anchorDelete(RB);
                                    }
                                    break;
                                case 'space-evenly':
                                    if (seg.length > 1) {
                                        segStart.anchorStyle(orientation, 'spread');
                                        const HVU = $util.capitalize(orientation);
                                        for (const item of seg) {
                                            item.app(`layout_constraint${HVU}_weight`, (item.flexbox.grow || 1).toString());
                                        }
                                    }
                                    else {
                                        centered = true;
                                    }
                                    break;
                                case 'space-around':
                                    if (seg.length > 1) {
                                        const controller = <android.base.Controller<T>> this.application.controllerHandler;
                                        segStart.constraint[orientation] = false;
                                        segEnd.constraint[orientation] = false;
                                        controller.addGuideline(segStart, node, orientation, true, false);
                                        controller.addGuideline(segEnd, node, orientation, true, true);
                                    }
                                    else {
                                        centered = true;
                                    }
                                    break;
                            }
                        }
                        if (spreadInside) {
                            segStart.anchorStyle(orientation, 'spread_inside', 0, false);
                        }
                        else if (!centered) {
                            segStart.anchorStyle(orientation, 'packed', mainData.directionReverse ? 1 : 0, false);
                        }
                    }
                }
            });
        }
    }
}
import { TableData } from '../@types/extension';

import Extension from '../extension';
import Node from '../node';

import { EXT_NAME } from '../lib/constant';
import { BOX_STANDARD, CSS_STANDARD } from '../lib/enumeration';

const $client = squared.lib.client;
const $css = squared.lib.css;
const $dom = squared.lib.dom;
const $math = squared.lib.math;
const $util = squared.lib.util;

const enum LAYOUT_TABLE {
    NONE = 0,
    STRETCH = 1,
    FIXED = 2,
    VARIABLE = 3
}

const REGEXP_BACKGROUND = /rgba\(0, 0, 0, 0\)|transparent/;
const REGEXP_BORDER = /none|\s0px|rgba\(0, 0, 0, 0\)|transparent/;

export default abstract class Table<T extends Node> extends Extension<T> {
    public static createDataAttribute(): TableData {
        return {
            layoutType: 0,
            rowCount: 0,
            columnCount: 0,
            expand: false
        };
    }

    public processNode(node: T) {
        const mainData = Table.createDataAttribute();
        const table: T[] = [];
        function setAutoWidth(td: T) {
            td.data(EXT_NAME.TABLE, 'percent', `${Math.round((td.bounds.width / node.box.width) * 100)}%`);
            td.data(EXT_NAME.TABLE, 'expand', true);
        }
        function setBoundsWidth(td: T) {
            td.css('width', $css.formatPX(td.bounds.width), true);
        }
        function inheritStyles(section: T[]) {
            if (section.length) {
                for (const item of section[0].cascade()) {
                    if (item.tagName === 'TH' || item.tagName === 'TD') {
                        item.inherit(section[0], 'styleMap');
                        item.unsetCache('visibleStyle');
                    }
                }
                $util.concatArray(table, section[0].children as T[]);
                for (const item of section) {
                    item.hide();
                }
            }
        }
        const thead: T[] = [];
        const tbody: T[] = [];
        const tfoot: T[] = [];
        node.each((item: T) => {
            switch (item.tagName) {
                case 'THEAD':
                    thead.push(item);
                    break;
                case 'TBODY':
                    tbody.push(item);
                    break;
                case 'TFOOT':
                    tfoot.push(item);
                    break;
            }
        });
        inheritStyles(thead);
        for (const section of tbody) {
            $util.concatArray(table, section.children as T[]);
            section.hide();
        }
        inheritStyles(tfoot);
        const layoutFixed = node.css('tableLayout') === 'fixed';
        const borderCollapse = node.css('borderCollapse') === 'collapse';
        const [horizontal, vertical] = borderCollapse ? [0, 0] : $util.replaceMap<string, number>(node.css('borderSpacing').split(' '), value => parseInt(value));
        if (horizontal > 0) {
            node.modifyBox(BOX_STANDARD.PADDING_LEFT, horizontal);
            node.modifyBox(BOX_STANDARD.PADDING_RIGHT, horizontal);
        }
        else {
            node.modifyBox(BOX_STANDARD.PADDING_LEFT, null);
            node.modifyBox(BOX_STANDARD.PADDING_RIGHT, null);
        }
        if (vertical > 0) {
            node.modifyBox(BOX_STANDARD.PADDING_TOP, vertical);
            node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, vertical);
        }
        else {
            node.modifyBox(BOX_STANDARD.PADDING_TOP, null);
            node.modifyBox(BOX_STANDARD.PADDING_BOTTOM, null);
        }
        const spacingWidth = $css.formatPX(horizontal > 1 ? Math.round(horizontal / 2) : horizontal);
        const spacingHeight = $css.formatPX(vertical > 1 ? Math.round(vertical / 2) : vertical);
        const colgroup = node.element && node.element.querySelector('COLGROUP');
        const rowWidth: number[] = [];
        const mapBounds: number[] = [];
        const tableFilled: T[][] = [];
        const mapWidth: string[] = [];
        const rowCount = table.length;
        let columnIndex: number[] = new Array(rowCount).fill(0);
        let columnCount = 0;
        for (let i = 0; i < rowCount; i++) {
            const tr = table[i];
            rowWidth[i] = horizontal;
            tableFilled[i] = [];
            tr.each((td: T, j) => {
                const element = <HTMLTableCellElement> td.element;
                for (let k = 0; k < element.rowSpan - 1; k++)  {
                    const col = (i + 1) + k;
                    if (columnIndex[col] !== undefined) {
                        columnIndex[col] += element.colSpan;
                    }
                }
                if (!td.hasWidth) {
                    const width = $util.convertInt($dom.getNamedItem(element, 'width'));
                    if (width > 0) {
                        td.css('width', $css.formatPX(width));
                    }
                }
                if (!td.hasHeight) {
                    const height = $util.convertInt($dom.getNamedItem(element, 'height'));
                    if (height > 0) {
                        td.css('height', $css.formatPX(height));
                    }
                }
                if (!td.visibleStyle.backgroundImage && !td.visibleStyle.backgroundColor) {
                    if (colgroup) {
                        const style = $css.getStyle(colgroup.children[columnIndex[i]]);
                        if (style.background) {
                            element.style.setProperty('background', style.background);
                        }
                        else if (style.backgroundColor) {
                            element.style.setProperty('background-color', style.backgroundColor);
                        }
                    }
                    else {
                        let value = $css.getInheritedStyle(element, 'background', REGEXP_BACKGROUND, 'TABLE');
                        if (value !== '') {
                            element.style.setProperty('background', value);
                        }
                        else {
                            value = $css.getInheritedStyle(element, 'backgroundColor', REGEXP_BACKGROUND, 'TABLE');
                            if (value !== '') {
                                element.style.setProperty('background-color', value);
                            }
                        }
                    }
                }
                switch (td.tagName) {
                    case 'TH': {
                        function setBorderStyle(attr: string) {
                            const value = $css.getInheritedStyle(element, attr, REGEXP_BORDER, 'TABLE');
                            if (value !== '') {
                                const match = /^(\d+[a-z]+) ([a-z]+) (.+)$/.exec(value);
                                if (match) {
                                    td.css(`${attr}Style`, match[2]);
                                    td.css(`${attr}Color`, match[3]);
                                    td.css(`${attr}Width`, match[1], true);
                                    if (!td.has('border')) {
                                        td.css('border', 'inherit');
                                    }
                                }
                            }
                        }
                        if (!td.cssInitial('textAlign')) {
                            td.css('textAlign', td.css('textAlign'));
                        }
                        if (td.borderTopWidth === 0) {
                            setBorderStyle('borderTop');
                        }
                        if (td.borderRightWidth === 0) {
                            setBorderStyle('borderRight');
                        }
                        if (td.borderBottomWidth === 0) {
                            setBorderStyle('borderBottom');
                        }
                        if (td.borderLeftWidth === 0) {
                            setBorderStyle('borderLeft');
                        }
                    }
                    case 'TD':
                        if (!td.cssInitial('verticalAlign')) {
                            td.css('verticalAlign', 'middle', true);
                        }
                        break;
                }
                const columnWidth = td.cssInitial('width');
                const m = columnIndex[i];
                const reevaluate = mapWidth[m] === undefined || mapWidth[m] === 'auto';
                if (i === 0 || reevaluate || !layoutFixed) {
                    if (columnWidth === '' || columnWidth === 'auto') {
                        if (mapWidth[m] === undefined) {
                            mapWidth[m] = columnWidth || '0px';
                            mapBounds[m] = 0;
                        }
                        else if (i === table.length - 1) {
                            if (reevaluate && mapBounds[m] === 0) {
                                mapBounds[m] = td.bounds.width;
                            }
                        }
                    }
                    else {
                        const length = $css.isLength(mapWidth[m]);
                        const percent = $css.isPercent(columnWidth);
                        if (reevaluate || td.bounds.width < mapBounds[m] || td.bounds.width === mapBounds[m] && (
                                length && percent ||
                                percent && $css.isPercent(mapWidth[m]) && $util.convertFloat(columnWidth) > $util.convertFloat(mapWidth[m]) ||
                                length && $css.isLength(columnWidth) && $util.convertFloat(columnWidth) > $util.convertFloat(mapWidth[m])
                           ))
                        {
                            mapWidth[m] = columnWidth;
                        }
                        if (reevaluate || element.colSpan === 1) {
                            mapBounds[m] = td.bounds.width;
                        }
                    }
                }
                if (td.length || td.inlineText) {
                    rowWidth[i] += td.bounds.width + horizontal;
                }
                td.cssApply({
                    marginTop: i === 0 ? '0px' : spacingHeight,
                    marginRight: j < tr.length - 1 ? spacingWidth : '0px',
                    marginBottom: i + element.rowSpan - 1 >= table.length - 1 ? '0px' : spacingHeight,
                    marginLeft: columnIndex[i] === 0 ? '0px' : spacingWidth
                }, true);
                columnIndex[i] += element.colSpan;
            });
            columnCount = Math.max(columnCount, columnIndex[i]);
        }
        if (node.has('width', CSS_STANDARD.LENGTH) && mapWidth.some(value => $css.isPercent(value))) {
            $util.replaceMap<string, string>(mapWidth, (value, index) => {
                if (value === 'auto' && mapBounds[index] > 0) {
                    return $css.formatPX(mapBounds[index]);
                }
                return value;
            });
        }
        if (mapWidth.every(value => $css.isPercent(value)) && mapWidth.reduce((a, b) => a + parseFloat(b), 0) > 1) {
            let percentTotal = 100;
            $util.replaceMap<string, string>(mapWidth, value => {
                const percent = parseFloat(value);
                if (percentTotal <= 0) {
                    value = '0px';
                }
                else if (percentTotal - percent < 0) {
                    value = $css.formatPercent(percentTotal);
                }
                percentTotal -= percent;
                return value;
            });
        }
        else if (mapWidth.every(value => $css.isLength(value))) {
            const width = mapWidth.reduce((a, b) => a + parseFloat(b), 0);
            if (node.width > 0) {
                if (width < node.width) {
                    $util.replaceMap<string, string>(mapWidth, value => value !== '0px' ? `${(parseFloat(value) / width) * 100}%` : value);
                }
                else if (width > node.width) {
                    node.css('width', 'auto', true);
                    if (!layoutFixed) {
                        for (const item of node.cascade()) {
                            item.css('width', 'auto', true);
                        }
                    }
                }
            }
            if (layoutFixed && !node.has('width')) {
                node.css('width', $css.formatPX(node.bounds.width), true);
            }
        }
        const mapPercent = mapWidth.reduce((a, b) => a + ($css.isPercent(b) ? parseFloat(b) : 0), 0);
        mainData.layoutType = (() => {
            if (mapWidth.some(value => $css.isPercent(value)) || mapWidth.every(value => $css.isLength(value) && value !== '0px')) {
                return LAYOUT_TABLE.VARIABLE;
            }
            else if (mapWidth.every(value => value === mapWidth[0])) {
                if (node.cascadeSome(td => td.hasHeight)) {
                    mainData.expand = true;
                    return LAYOUT_TABLE.VARIABLE;
                }
                else if (mapWidth[0] === 'auto') {
                    if (node.hasWidth) {
                        return LAYOUT_TABLE.VARIABLE;
                    }
                    else {
                        const td = node.cascade(item => item.tagName === 'TD');
                        if (td.length && td.every(item => $util.withinRange(item.bounds.width, td[0].bounds.width))) {
                            return LAYOUT_TABLE.NONE;
                        }
                        return LAYOUT_TABLE.VARIABLE;
                    }
                }
                else if (node.hasWidth) {
                    return LAYOUT_TABLE.FIXED;
                }
            }
            if (mapWidth.every(value => value === 'auto' || $css.isLength(value) && value !== '0px')) {
                if (!node.hasWidth) {
                    mainData.expand = true;
                }
                return LAYOUT_TABLE.STRETCH;
            }
            return LAYOUT_TABLE.NONE;
        })();
        const caption = node.find(item => item.tagName === 'CAPTION') as T | undefined;
        node.clear();
        if (caption) {
            if (!caption.hasWidth && !$client.isUserAgent($client.USER_AGENT.EDGE)) {
                if (caption.textElement) {
                    if (!caption.has('maxWidth')) {
                        caption.css('maxWidth', $css.formatPX(caption.bounds.width));
                    }
                }
                else if (caption.bounds.width > $math.maxArray(rowWidth)) {
                    setBoundsWidth(caption);
                }
            }
            if (!caption.cssInitial('textAlign')) {
                caption.css('textAlign', 'center');
            }
            caption.data(EXT_NAME.TABLE, 'colSpan', columnCount);
            caption.parent = node;
        }
        columnIndex = new Array(table.length).fill(0);
        const hasWidth = node.hasWidth;
        for (let i = 0; i < table.length; i++) {
            const tr = table[i];
            const children = tr.duplicate();
            for (let j = 0; j < children.length; j++) {
                const td = children[j] as T;
                const element = <HTMLTableCellElement> td.element;
                const rowSpan = element.rowSpan;
                const colSpan = element.colSpan;
                for (let k = 0; k < rowSpan - 1; k++)  {
                    const l = (i + 1) + k;
                    if (columnIndex[l] !== undefined) {
                        columnIndex[l] += colSpan;
                    }
                }
                if (rowSpan > 1) {
                    td.data(EXT_NAME.TABLE, 'rowSpan', rowSpan);
                }
                if (colSpan > 1) {
                    td.data(EXT_NAME.TABLE, 'colSpan', colSpan);
                }
                if (!td.has('verticalAlign')) {
                    td.css('verticalAlign', 'middle');
                }
                const columnWidth = mapWidth[columnIndex[i]];
                if (columnWidth !== undefined) {
                    switch (mainData.layoutType) {
                        case LAYOUT_TABLE.VARIABLE:
                            if (columnWidth === 'auto') {
                                if (mapPercent >= 1) {
                                    setBoundsWidth(td);
                                    td.data(EXT_NAME.TABLE, 'exceed', !hasWidth);
                                    td.data(EXT_NAME.TABLE, 'downsized', true);
                                }
                                else {
                                    setAutoWidth(td);
                                }
                            }
                            else if ($css.isPercent(columnWidth)) {
                                td.data(EXT_NAME.TABLE, 'percent', columnWidth);
                                td.data(EXT_NAME.TABLE, 'expand', true);
                            }
                            else if ($css.isLength(columnWidth) && parseInt(columnWidth) > 0) {
                                if (td.bounds.width >= parseInt(columnWidth)) {
                                    setBoundsWidth(td);
                                    td.data(EXT_NAME.TABLE, 'expand', false);
                                    td.data(EXT_NAME.TABLE, 'downsized', false);
                                }
                                else {
                                    if (layoutFixed) {
                                        setAutoWidth(td);
                                        td.data(EXT_NAME.TABLE, 'downsized', true);
                                    }
                                    else {
                                        setBoundsWidth(td);
                                        td.data(EXT_NAME.TABLE, 'expand', false);
                                    }
                                }
                            }
                            else {
                                if (!td.has('width') || td.has('width', CSS_STANDARD.PERCENT)) {
                                    setBoundsWidth(td);
                                }
                                td.data(EXT_NAME.TABLE, 'expand', false);
                            }
                            break;
                        case LAYOUT_TABLE.FIXED:
                            td.css('width', '0px');
                            break;
                        case LAYOUT_TABLE.STRETCH:
                            if (columnWidth === 'auto') {
                                td.css('width', '0px');
                            }
                            else {
                                if (layoutFixed) {
                                    td.data(EXT_NAME.TABLE, 'downsized', true);
                                }
                                else {
                                    setBoundsWidth(td);
                                }
                                td.data(EXT_NAME.TABLE, 'expand', false);
                            }
                            break;

                    }
                }
                columnIndex[i] += colSpan;
                for (let k = 0; k < rowSpan; k++) {
                    for (let l = 0; l < colSpan; l++) {
                        tableFilled[i + k].push(td);
                    }
                }
                td.parent = node;
            }
            if (columnIndex[i] < columnCount) {
                const td = children[children.length - 1];
                td.data(EXT_NAME.TABLE, 'spaceSpan', columnCount - columnIndex[i]);
            }
            tr.hide();
        }
        if (borderCollapse) {
            const borderTopColor = node.css('borderTopColor');
            const borderTopStyle = node.css('borderTopStyle');
            const borderTopWidth = node.css('borderTopWidth');
            const borderRightColor = node.css('borderRightColor');
            const borderRightStyle = node.css('borderRightStyle');
            const borderRightWidth = node.css('borderRightWidth');
            const borderBottomColor = node.css('borderBottomColor');
            const borderBottomStyle = node.css('borderBottomStyle');
            const borderBottomWidth = node.css('borderBottomWidth');
            const borderLeftColor = node.css('borderLeftColor');
            const borderLeftStyle = node.css('borderLeftStyle');
            const borderLeftWidth = node.css('borderLeftWidth');
            let hideTop = false;
            let hideRight = false;
            let hideBottom = false;
            let hideLeft = false;
            for (let i = 0; i < rowCount; i++) {
                for (let j = 0; j < columnCount; j++) {
                    const td = tableFilled[i][j];
                    if (td && td.css('visibility') === 'visible') {
                        if (i === 0) {
                            if (td.borderTopWidth < parseInt(borderTopWidth)) {
                                td.cssApply({
                                    borderTopColor,
                                    borderTopStyle,
                                    borderTopWidth
                                });
                            }
                            else {
                                hideTop = true;
                            }
                        }
                        if (i >= 0 && i < rowCount - 1) {
                            const next = tableFilled[i + 1][j];
                            if (next && next !== td && next.css('visibility') === 'visible') {
                                if (td.borderBottomWidth >= next.borderTopWidth) {
                                    next.css('borderTopWidth', '0px', true);
                                }
                                else {
                                    td.css('borderBottomWidth', '0px', true);
                                }
                            }
                        }
                        if (i === rowCount - 1) {
                            if (td.borderBottomWidth < parseInt(borderBottomWidth)) {
                                td.cssApply({
                                    borderBottomColor,
                                    borderBottomStyle,
                                    borderBottomWidth
                                });
                            }
                            else {
                                hideBottom = true;
                            }
                        }
                        if (j === 0) {
                            if (td.borderLeftWidth < parseInt(borderLeftWidth)) {
                                td.cssApply({
                                    borderLeftColor,
                                    borderLeftStyle,
                                    borderLeftWidth
                                });
                            }
                            else {
                                hideLeft = true;
                            }
                        }
                        if (j >= 0 && j < columnCount - 1) {
                            const next = tableFilled[i][j + 1];
                            if (next && next !== td && next.css('visibility') === 'visible') {
                                if (td.borderRightWidth >= next.borderLeftWidth) {
                                    next.css('borderLeftWidth', '0px', true);
                                }
                                else {
                                    td.css('borderRightWidth', '0px', true);
                                }
                            }
                        }
                        if (j === columnCount - 1) {
                            if (td.borderRightWidth < parseInt(borderRightWidth)) {
                                td.cssApply({
                                    borderRightColor,
                                    borderRightStyle,
                                    borderRightWidth
                                });
                            }
                            else {
                                hideRight = true;
                            }
                        }
                    }
                }
            }
            if (hideTop || hideRight || hideBottom || hideLeft) {
                node.cssApply({
                    borderTopWidth: '0px',
                    borderRightWidth: '0px',
                    borderBottomWidth: '0px',
                    borderLeftWidth: '0px'
                }, true);
            }
        }
        mainData.rowCount = rowCount;
        mainData.columnCount = columnCount;
        node.data(EXT_NAME.TABLE, 'mainData', mainData);
        return undefined;
    }
}
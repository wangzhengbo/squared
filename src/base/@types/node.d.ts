export interface InitialData<T> {
    iteration: number;
    styleMap: StringMap;
    children: T[];
    bounds?: RectDimensions;
    linear?: RectDimensions;
    box?: RectDimensions;
    documentParent?: T;
}

export interface CachedValue<T> {
    pageFlow?: boolean;
    inlineFlow?: boolean;
    positionStatic?: boolean;
    positionAuto?: boolean;
    top?: number;
    right?: number;
    bottom?: number;
    left?: number;
    marginTop?: number;
    marginRight?: number;
    marginBottom?: number;
    marginLeft?: number;
    paddingTop?: number;
    paddingRight?: number;
    paddingBottom?: number;
    paddingLeft?: number;
    inlineText?: boolean;
    inline?: boolean;
    inlineStatic?: boolean;
    inlineVertical?: boolean;
    block?: boolean;
    blockStatic?: boolean;
    blockDimension?: boolean;
    floating?: boolean;
    baseline?: boolean;
    multiLine?: number;
    hasWidth?: boolean;
    hasHeight?: boolean;
    rightAligned?: boolean;
    bottomAligned?: boolean;
    preserveWhiteSpace?: boolean;
    width?: number;
    height?: number;
    overflow?: number;
    lineHeight?: number;
    dir?: string;
    tagName?: string;
    textContent?: string;
    float?: string;
    actualChildren?: T[];
    flexbox?: Flexbox;
    autoMargin?: AutoMargin;
    visibleStyle?: VisibleStyle;
}

export interface VisibleStyle {
    padding: boolean;
    paddingHorizontal: boolean;
    paddingVertical: boolean;
    borderWidth: boolean;
    background: boolean;
    backgroundImage: boolean;
    backgroundColor: boolean;
    backgroundRepeat: boolean;
    backgroundRepeatX: boolean;
    backgroundRepeatY: boolean;
}

export interface Support {
    container: {
        positionRelative: boolean;
    };
}

export type AutoMargin = {
    horizontal: boolean;
    left: boolean;
    right: boolean;
    leftRight: boolean;
    vertical: boolean;
    top: boolean;
    bottom: boolean;
    topBottom: boolean;
};

interface LinearGradient extends Gradient {
    angle: number;
}

interface RadialGradient extends Gradient {
    position: string[];
}
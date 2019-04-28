import { Constraint, LocalSettings, SupportAndroid } from '../src/@types/node';

declare global {
    namespace android.base {
        interface View extends squared.base.Node {
            anchored: boolean;
            readonly constraint: Constraint;
            readonly localSettings: LocalSettings;
            readonly documentId: string;
            readonly layoutFrame: boolean;
            readonly layoutLinear: boolean;
            readonly layoutRelative: boolean;
            readonly layoutConstraint: boolean;
            readonly actualAnchor: View;
            readonly inlineWidth: boolean;
            readonly inlineHeight: boolean;
            readonly blockWidth: boolean;
            readonly blockHeight: boolean;
            readonly flexibleWidth: boolean;
            readonly flexibleHeight: boolean;
            readonly support: SupportAndroid;
            android(attr: string, value?: string, overwrite?: boolean): string;
            app(attr: string, value?: string, overwrite?: boolean): string;
            applyOptimizations(): void;
            applyCustomizations(overwrite?: boolean): void;
            formatted(value: string, overwrite?: boolean): void;
            mergeGravity(attr: string, alignment: string, overwrite?: boolean): void;
            anchor(position: string, documentId?: string, overwrite?: boolean): boolean;
            anchorParent(orientation: string, overwrite?: boolean, bias?: number): boolean;
            anchorStyle(orientation: string, value?: string, bias?: number, overwrite?: boolean): void;
            anchorDelete(...position: string[]): void;
            anchorClear(): void;
            supported(obj: string, attr: string, result?: {}): boolean;
            combine(...objs: string[]): string[];
        }

        class View implements View {
            public static documentBody(): View;
            public static getControlName(containerType: number): string;
            constructor(id: number, sessionId?: string, element?: Element, afterInit?: BindGeneric<View, void>);
        }

        class ViewGroup<T extends View> extends View {}
    }
}

export = android.base.View;
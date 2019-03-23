import { FileAsset, SessionData, TemplateDataA } from '../../src/base/@types/application';
import { ResourceStoredMapAndroid, UserSettingsAndroid } from './@types/application';

import View from './view';

import { BUILD_ANDROID } from './lib/enumeration';
import { getXmlNs, replaceLength } from './lib/util';

import COLOR_TMPL from './template/resource/color';
import DIMEN_TMPL from './template/resource/dimen';
import DRAWABLE_TMPL from './template/resource/drawable';
import FONT_TMPL from './template/resource/font';
import STRING_TMPL from './template/resource/string';
import STRINGARRAY_TMPL from './template/resource/string-array';
import STYLE_TMPL from './template/resource/style';

import $NodeList = squared.base.NodeList;

type StyleXML = {
    filename: string;
    data: TemplateDataA;
};

const $util = squared.lib.util;
const $xml = squared.lib.xml;

const REGEXP_FILE = /^[\w\W]*?(<!-- filename: (.+)\/(.+?\.xml) -->)$/;
const REGEXP_IMAGE = /^<!-- image: (.+) -->\n<!-- filename: (.+)\/(.+?\.\w+) -->$/;

const TEMPLATES = {
    color: $xml.parseTemplate(COLOR_TMPL),
    dimen: $xml.parseTemplate(DIMEN_TMPL),
    drawable: $xml.parseTemplate(DRAWABLE_TMPL),
    font: $xml.parseTemplate(FONT_TMPL),
    string: $xml.parseTemplate(STRING_TMPL),
    string_array: $xml.parseTemplate(STRINGARRAY_TMPL),
    style: $xml.parseTemplate(STYLE_TMPL)
};

function parseFileDetails(files: string[]) {
    const result: FileAsset[] = [];
    for (const xml of files) {
        const match = REGEXP_FILE.exec(xml);
        if (match) {
            result.push({
                pathname: match[2],
                filename: match[3],
                content: match[0].replace(match[1], '')
            });
        }
    }
    return result;
}

function parseImageDetails(files: string[]) {
    const result: FileAsset[] = [];
    for (const xml of files) {
        const match = REGEXP_IMAGE.exec(xml);
        if (match) {
            result.push({
                uri: match[1],
                pathname: match[2],
                filename: match[3],
                content: ''
            });
        }
    }
    return result;
}

function createFileAsset(pathname: string, filename: string, content: string): FileAsset {
    return {
        pathname,
        filename,
        content
    };
}

function caseInsensitive(a: string | string[], b: string | string[]) {
    return a.toString().toLowerCase() >= b.toString().toLowerCase() ? 1 : -1;
}

export default class File<T extends View> extends squared.base.File<T> implements android.base.File<T> {
    public saveAllToDisk(data: SessionData<$NodeList<T>>) {
        const files: FileAsset[] = [];
        for (let i = 0; i < data.templates.length; i++) {
            const view = data.templates[i];
            files.push(createFileAsset(view.pathname, i === 0 ? this.userSettings.outputMainFileName : `${view.filename}.xml`, view.content));
        }
        this.saveToDisk(
            $util.concatMultiArray(
                files,
                parseFileDetails(this.resourceStringToXml()),
                parseFileDetails(this.resourceStringArrayToXml()),
                parseFileDetails(this.resourceFontToXml()),
                parseFileDetails(this.resourceColorToXml()),
                parseFileDetails(this.resourceStyleToXml()),
                parseFileDetails(this.resourceDimenToXml()),
                parseFileDetails(this.resourceDrawableToXml()),
                parseImageDetails(this.resourceDrawableImageToXml()),
                parseFileDetails(this.resourceAnimToXml())
            ),
            this.userSettings.manifestLabelAppName
        );
    }

    public layoutAllToXml(data: SessionData<$NodeList<T>>, saveToDisk = false) {
        const result = {};
        const files: FileAsset[] = [];
        for (let i = 0; i < data.templates.length; i++) {
            const view = data.templates[i];
            result[view.filename] = [view.content];
            if (saveToDisk) {
                files.push(createFileAsset(view.pathname, i === 0 ? this.userSettings.outputMainFileName : `${view.filename}.xml`, view.content));
            }
        }
        if (saveToDisk) {
            this.saveToDisk(files, this.userSettings.manifestLabelAppName);
        }
        return result;
    }

    public resourceAllToXml(saveToDisk = false) {
        const result = {
            string: this.resourceStringToXml(),
            stringArray: this.resourceStringArrayToXml(),
            font: this.resourceFontToXml(),
            color: this.resourceColorToXml(),
            style: this.resourceStyleToXml(),
            dimen: this.resourceDimenToXml(),
            drawable: this.resourceDrawableToXml(),
            drawableImage: this.resourceDrawableImageToXml(),
            anim: this.resourceAnimToXml()
        };
        for (const name in result) {
            if (result[name].length === 0) {
                delete result[name];
            }
        }
        if (saveToDisk) {
            const files: FileAsset[] = [];
            for (const name in result) {
                if (name === 'image') {
                    $util.concatArray(files, parseImageDetails(result[name]));
                }
                else {
                    $util.concatArray(files, parseFileDetails(result[name]));
                }
            }
            this.saveToDisk(files, this.userSettings.manifestLabelAppName);
        }
        return result;
    }

    public resourceStringToXml(saveToDisk = false) {
        const result: string[] = [];
        const data: TemplateDataA = { A: [] };
        if (!this.stored.strings.has('app_name')) {
            data.A.push({ name: 'app_name', value: this.userSettings.manifestLabelAppName });
        }
        for (const [name, value] of Array.from(this.stored.strings.entries()).sort(caseInsensitive)) {
            data.A.push({ name, value });
        }
        result.push(
            $xml.replaceTab(
                $xml.createTemplate(TEMPLATES.string, data),
                this.userSettings.insertSpaces,
                true
            )
        );
        if (saveToDisk) {
            this.saveToDisk(parseFileDetails(result), this.userSettings.manifestLabelAppName);
        }
        return result;
    }

    public resourceStringArrayToXml(saveToDisk = false) {
        const result: string[] = [];
        if (this.stored.arrays.size) {
            const data: TemplateDataA = { A: [] };
            for (const [name, values] of Array.from(this.stored.arrays.entries()).sort()) {
                data.A.push({
                    name,
                    AA: $util.objectMap<string, {}>(values, value => ({ value }))
                });
            }
            result.push(
                $xml.replaceTab(
                    $xml.createTemplate(TEMPLATES.string_array, data),
                    this.userSettings.insertSpaces,
                    true
                )
            );
            if (saveToDisk) {
                this.saveToDisk(parseFileDetails(result), this.userSettings.manifestLabelAppName);
            }
        }
        return result;
    }

    public resourceFontToXml(saveToDisk = false) {
        const result: string[] = [];
        if (this.stored.fonts.size) {
            const settings = this.userSettings;
            const namespace = settings.targetAPI < BUILD_ANDROID.OREO ? 'app' : 'android';
            for (const [name, font] of Array.from(this.stored.fonts.entries()).sort()) {
                const data: TemplateDataA = {
                    name,
                    namespace: getXmlNs(namespace),
                    A: []
                };
                let xml = '';
                for (const attr in font) {
                    const [style, weight] = attr.split('-');
                    data.A.push({
                        style,
                        weight,
                        font: `@font/${name + (style === 'normal' && weight === 'normal' ? `_${style}` : (style !== 'normal' ? `_${style}` : '') + (weight !== 'normal' ? `_${weight}` : ''))}`
                    });
                }
                xml += $xml.createTemplate(TEMPLATES.font, data);
                if (settings.targetAPI < BUILD_ANDROID.OREO) {
                    xml = xml.replace(/\s+android:/g, ' app:');
                }
                result.push(
                    $xml.replaceTab(
                        xml,
                        settings.insertSpaces
                    )
                );
            }
            if (saveToDisk) {
                this.saveToDisk(parseFileDetails(result), this.userSettings.manifestLabelAppName);
            }
        }
        return result;
    }

    public resourceColorToXml(saveToDisk = false) {
        const result: string[] = [];
        if (this.stored.colors.size) {
            const data: TemplateDataA = { A: [] };
            for (const [name, value] of Array.from(this.stored.colors.entries()).sort()) {
                data.A.push({ name, value });
            }
            result.push(
                $xml.replaceTab(
                    $xml.createTemplate(TEMPLATES.color, data),
                    this.userSettings.insertSpaces
                )
            );
            if (saveToDisk) {
                this.saveToDisk(parseFileDetails(result), this.userSettings.manifestLabelAppName);
            }
        }
        return result;
    }

    public resourceStyleToXml(saveToDisk = false) {
        const settings = this.userSettings;
        const result: string[] = [];
        const files: StyleXML[] = [];
        if (this.stored.styles.size) {
            const data: TemplateDataA = { A: [] };
            for (const style of Array.from(this.stored.styles.values()).sort((a, b) => a.name.toString().toLowerCase() >= b.name.toString().toLowerCase() ? 1 : -1)) {
                if (Array.isArray(style.items)) {
                    style.items.sort((a, b) => a.name >= b.name ? 1 : -1);
                    data.A.push(<ExternalData> style);
                }
            }
            files.push({ filename: 'res/values/styles.xml', data });
        }
        if (this.stored.themes.size) {
            const appTheme: ObjectMap<boolean> = {};
            for (const [filename, theme] of this.stored.themes.entries()) {
                const data: TemplateDataA = { A: [] };
                for (const [themeName, themeData] of theme.entries()) {
                    const items: StringMap[] = [];
                    for (const name in themeData.items) {
                        items.push({ name, value: themeData.items[name] });
                    }
                    if (!appTheme[filename] || themeName !== settings.manifestThemeName || items.length) {
                        data.A.push({
                            name: themeName,
                            parent: themeData.parent,
                            items
                        });
                    }
                    if (themeName === settings.manifestThemeName) {
                        appTheme[filename] = true;
                    }
                }
                files.push({ filename, data });
            }
        }
        for (const style of files) {
            result.push(
                $xml.replaceTab(
                    replaceLength(
                        $xml.createTemplate(TEMPLATES.style, style.data).replace('filename: {0}', `filename: ${style.filename}`),
                        settings.resolutionDPI,
                        settings.convertPixels,
                        true
                    ),
                    settings.insertSpaces
                )
            );
        }
        if (saveToDisk) {
            this.saveToDisk(parseFileDetails(result), this.userSettings.manifestLabelAppName);
        }
        return result;
    }

    public resourceDimenToXml(saveToDisk = false) {
        const result: string[] = [];
        if (this.stored.dimens.size) {
            const settings = this.userSettings;
            const data: TemplateDataA = { A: [] };
            for (const [name, value] of Array.from(this.stored.dimens.entries()).sort()) {
                data.A.push({ name, value });
            }
            result.push(
                $xml.replaceTab(
                    replaceLength(
                        $xml.createTemplate(TEMPLATES.dimen, data),
                        settings.resolutionDPI,
                        settings.convertPixels
                    ),
                    settings.insertSpaces
                )
            );
            if (saveToDisk) {
                this.saveToDisk(parseFileDetails(result), this.userSettings.manifestLabelAppName);
            }
        }
        return result;
    }

    public resourceDrawableToXml(saveToDisk = false) {
        const result: string[] = [];
        if (this.stored.drawables.size) {
            const settings = this.userSettings;
            for (const [name, value] of this.stored.drawables.entries()) {
                result.push(
                    $xml.replaceTab(
                        replaceLength(
                            $xml.createTemplate(TEMPLATES.drawable, {
                                name: `res/drawable/${name}.xml`,
                                value
                            }),
                            settings.resolutionDPI,
                            settings.convertPixels
                        ),
                        settings.insertSpaces
                    )
                );
            }
            if (saveToDisk) {
                this.saveToDisk(parseFileDetails(result), this.userSettings.manifestLabelAppName);
            }
        }
        return result;
    }

    public resourceDrawableImageToXml(saveToDisk = false) {
        const result: string[] = [];
        if (this.stored.images.size) {
            const settings = this.userSettings;
            for (const [name, images] of this.stored.images.entries()) {
                if (Object.keys(images).length > 1) {
                    for (const dpi in images) {
                        result.push(
                            $xml.replaceTab(
                                $xml.createTemplate(TEMPLATES.drawable, {
                                    name: `res/drawable-${dpi}/${name}.${$util.fromLastIndexOf(images[dpi], '.')}`,
                                    value: `<!-- image: ${images[dpi]} -->`
                                }),
                                settings.insertSpaces
                            )
                        );
                    }
                }
                else if (images.mdpi) {
                    result.push(
                        $xml.replaceTab(
                            $xml.createTemplate(TEMPLATES.drawable, {
                                name: `res/drawable/${name}.${$util.fromLastIndexOf(images.mdpi, '.')}`,
                                value: `<!-- image: ${images.mdpi} -->`
                            }),
                            settings.insertSpaces
                        )
                    );
                }
            }
            if (saveToDisk) {
                this.saveToDisk(parseImageDetails(result), this.userSettings.manifestLabelAppName);
            }
        }
        return result;
    }

    public resourceAnimToXml(saveToDisk = false) {
        const result: string[] = [];
        if (this.stored.animators.size) {
            for (const [name, value] of this.stored.animators.entries()) {
                result.push(
                    $xml.replaceTab(
                        $xml.createTemplate(TEMPLATES.drawable, {
                            name: `res/anim/${name}.xml`,
                            value
                        }),
                        this.userSettings.insertSpaces
                    )
                );
            }
            if (saveToDisk) {
                this.saveToDisk(parseFileDetails(result), this.userSettings.manifestLabelAppName);
            }
        }
        return result;
    }

    get userSettings() {
        return <UserSettingsAndroid> this.resource.userSettings;
    }

    get stored() {
        return <ResourceStoredMapAndroid> this.resource.stored;
    }
}
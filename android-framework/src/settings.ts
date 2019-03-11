import { UserSettingsAndroid } from './@types/application';

const settings: UserSettingsAndroid = {
    builtInExtensions: [
        'android.delegate.fixed',
        'android.delegate.max-width-height',
        'android.delegate.percent',
        'android.delegate.radiogroup',
        'android.delegate.scrollbar',
        'squared.external',
        'squared.substitute',
        'squared.sprite',
        'squared.css-grid',
        'squared.flexbox',
        'squared.table',
        'squared.list',
        'squared.grid',
        'squared.relative',
        'squared.verticalalign',
        'squared.whitespace',
        'squared.accessibility',
        'android.constraint.guideline',
        'android.resource.includes',
        'android.resource.background',
        'android.resource.svg',
        'android.resource.strings',
        'android.resource.fonts',
        'android.resource.dimens',
        'android.resource.styles'
    ],
    targetAPI: 28,
    resolutionDPI: 160,
    supportRTL: true,
    preloadImages: true,
    ellipsisOnTextOverflow: true,
    supportNegativeLeftTop: true,
    floatOverlapDisabled: false,
    collapseUnattributedElements: true,
    customizationsDisabled: true,
    customizationsOverwritePrivilege: true,
    replaceCharacterEntities: false,
    showAttributes: true,
    convertPixels: 'dp',
    insertSpaces: 4,
    handleExtensionsAsync: true,
    autoCloseOnWrite: true,
    outputDirectory: 'app/src/main',
    outputMainFileName: 'activity_main.xml',
    outputArchiveFileType: 'zip',
    outputMaxProcessingTime: 30
};

export default settings;
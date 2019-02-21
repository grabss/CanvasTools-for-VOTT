# CanvasTools librarary for VoTT

`CanvasTools` is one of the UI modules used in the [VoTT project](https://github.com/Microsoft/VoTT/). The library impelements the following core features:

* Region (box, point, polyline & polygon) selection & manipulation
* Filters pipeline for underlaying canvas element
* Toolbar for all available tools

## Dependencies

* `CanvasTools` heavily uses the [Snap.Svg](https://github.com/adobe-webplatform/Snap.svg) library. In the webpack-eged version it is bundled with `CanvasTools` into one `ct.js` file, including also styles.
* Current version of the library depends on some features (e.g., masks-support in SVG) that are not fully cross-browser, but are targeting Electron (Chromium).

## How to use

### Install npm package

Install package from npm:

```node
npm i vott-ct
```

The package structure:

```txt
dist/
    ct.d.ts -- bundled typings
    ct.dev.js -- webpack bundle for development (incl source map)
    ct.js -- webpack bundle for production ({tsc->commonjs, snapsvg, styles} -> umd)
    ct.js.map -- source map for ct.js
    ct.min.js -- webpack minimized bundle for production
    ct.min.js.map -- source map for ct.min.js
lib/
    css/
        canvastools.css
    icons/
        {*.png, *.svg} - collection of icons for toolbar and cursor
    js/
        ct.d.ts -- typings generated by tcs
        ct.js -- AMD module generated by tcs
        ct.js.map -- map file generated by tcs
        snapsvg-cjs.d.ts -- typings for the snapsvg-cjs package
        CanvasTools/
            {*.js, *.d.ts} -- compilied js and typings files
```

### Add library to the app

1. Add the `ct.js` file to your web-app (e.g., an Electron-based app).

    ```html
    <script src="ct.js"></script>
    <!-- OR -->
    <script src="ct.min.js"></script>

    ```

2. Copy toolbar icons from the [`src` folder](https://github.com/kichinsky/CanvasTools-for-VOTT/tree/master/src/canvastools/icons) to your project.

### Add Editor to the page

1. Add container elements to host SVG elements for the toolbar and the editor.

    ```html
    <div id="canvasTiilsDiv">
        <div id="toolbarDiv"></div>
        <div id="selectionDiv">
            <div id="editorDiv"></div>
        </div>
    </div>
    ```

2. Initiate the `Editor`-object from the `CanvasTools`.

    ```js
    var editorContainer = document.getElementById("editorDiv");
    var toolbarContainer = document.getElementById("toolbarDiv");

    var editor = new CanvasTools.Editor(editorContainer).api;
    editor.addToolbar(toolbarContainer, CanvasTools.Editor.FullToolbarSet, "./images/icons/");
    ```

    The editor will auto-adjust to available space in provided container block.
    `FullToolbarSet` icons set is used by default and exposes all available tools. The `RectToolbarSet` set contains only box-creation tools. Correct the path to toolbar icons based on the structure of your project.

### Add callbacks to the Editor

1. Add a callback for the `onSelectionEnd` event to define what should happen when a new region is selected (created). Usually at the end of processing the new `regionData` you also want to add it to the screen with some tags applyed. Use the `addRegion` method for that.

    ```js
    // Create some ID for regions
    let incrementalRegionID = 100;

    // Set callback for onSelectionEnd
    editor.onSelectionEnd = (regionData) => {
        let id = (incrementalRegionID++).toString();
        let tags = getTagsDescriptor();            
        editor.addRegion(id, regionData, tags);
    };        

    const Color = CanvasTools.Core.Colors.Color;
    const LABColor = CanvasTools.Core.Colors.LABColor;
    const Tag = CanvasTools.Core.Tag;
    const TagsDescriptor = CanvasTools.Core.TagsDescriptor;

    // Generate tags
    function getTagsDescriptor() {
        // Use the Color class to specify color
        let primaryTag = new Tag("Awesome", new Color("#c48de7"));
        // Use a string color to specify color
        let secondaryTag = new Tag("Yes", "#f94c48");
        // Use one of the color spaces classes (e.g., LABColor) to specify color
        let ternaryTag = new Tag("one", new Color(new LABColor(0.62, 0.50, -0.55)));
        return new TagsDescriptor(primaryTag, [secondaryTag, ternaryTag]);
    }
    ```

2. Add a callback for the `onRegionMove` event to track region changes.

    ```js
    editor.onRegionMove = (id, regionData) => {
        console.log(`Moved ${id}: {${regionData.x}, ${regionData.y}} x {${regionData.width}, ${regionData.height}}`);
    };
    ```

### Update background
Once the background image for tagging task is loaded (or a video element is ready, or a canvas element is created), pass it to the editor as a new content source.

```js
let imagePath = "./../images/background-forest-v.jpg";
let image = new Image();
image.addEventListener("load", (e) => {
    editor.addContentSource(e.target);
});
image.src = imagePath;
```

## Changelog

### 2.1.21 - New color infrastructure from the v3-color-lab branch

*New color infrastructure*

*CT Library Changes*
* Added the `color` property to `ITag` and `Tag`. Using `colorHue` is now deprecated. Consider using the `Color` class or hex-string
when creating new tags.
* Updated styling of regions to use new `Color` infrastructure.
* Partially refactored the `canvastools.css` file to use variables to define cursors and colors.
* Added `regionData` for the `onRegionDeleted` callback.
* Fixed a bug with menu positioning when region is deleted.

### 2.1.20

Fix to expose the `multiselection` flag in the `onRegionSelected` callback.

### 2.1.19

Changed compiler options for `lib` to preserve comments.

### 2.1.18

*Docs*
* Added jsdocs for all classes and interfaces.

*CT Library Changes*
* `Editor` class now exposes the internal `filterPipeline` object as `FP` instead of `FilterPipeline` to follow other shortcuts namings (like `RM` and `AS`). 
* For `PointRegion`, `PolygonRegion`, `PolylineRegion` and `RectRegion`classes aligned the constructor signature with the `Region` class.
* Small refactorings for internal methods and classes naming.

*Samples*
* Moved the `/test` folder to a new `samples` folder to better reflect that those are usage samples, not tests.
* Splitted original sample into 1) `/editor` and 2) `/filters`. Extracted common media and js files into `/shared` folder.
* Extracted new sample without toolbar under the `/editor-no-toolbar` folder.
* Updated `package.json` and `webpack.config.js` to reflect changes.


### 2.1.17

Added `onRegionMoveBegin` and `onRegionMoveEnd` callbacks to the `Editor` and the `RegionsManager` classes. Usage:

```js
        editor.onRegionMoveBegin = (id, regionData) => {
            console.log(`Move Begin ${id}: {${regionData.x}, ${regionData.y}} x {${regionData.width}, ${regionData.height}}`);
        };

        editor.onRegionMove = (id, regionData) => {
            console.log(`Moving ${id}: {${regionData.x}, ${regionData.y}} x {${regionData.width}, ${regionData.height}}`);
        };

        editor.onRegionMoveEnd = (id, regionData) => {
            console.log(`Move End ${id}: {${regionData.x}, ${regionData.y}} x {${regionData.width}, ${regionData.height}}`);
        };
```

### 2.1.15-16

Updated `README` and sample under the `/test` folder.

### 2.1.14

1. Added a new `api` proxy to the `Editor` class. It wraps accessing to all the public methods of `Editor`, `RegionsManager`, `AreaSelector` and `FilterPipeline`. So instead of writing `editor.RM.addRegion(...)`, you can use the following approach:
    ```js
    var editor = new ct.Editor(editorDiv).api;
    editor.addRegion(...)
    editor.setSelectionMode(...)
    ```

2. Removed from the `Editor` class itself the `setSelectionMode` method. Use instead the approach above or `editor.AS.setSelectionMode(...)`.

3. Added new overloads for the `Editor` class `constructor`. You can now also provide custom components (`AreaSelector`, `RegionsManager` or `FilterPipeline`). E.g., to create `Editor` with custom `RegionsManager`:
    ```js
    let editor = new ct.Editor(sz, null, regionsManager);
    ```
    Note: editor will override the `callbacks` properties for `AreaSelector` and `RegionsManager` to ensure they crossreference and can work together.  
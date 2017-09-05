# PlayCanvas Editor Plus

A set of extensions for the PlayCanvas editor.  Implemented as a Google Chrome extension.

## Features

* Colour model view in the assets panel and preview window (no more grey shadows!)
* See whole of asset name in the asset panel
* Quickly select the Root node and collapse others
* Quickly select the parent of an entity
* Powerful search with RegEx, supports component names, entity names etc and returns all matches (unlike the normal hierarchy search)
* Drop to root - enables items being dropped from the asset panel to be located at the position of the selected entity but then parented to the root - stops accidental creation of complicated deep structures when designing scenes
* Snap to grid - snaps one or more entities that are already in the scene to the current grid interval - normal snapping in PlayCanvas does not round the existing position, but only move
 items it by grid increments.
* Snap Rotation - snaps the Y rotation of one or more entities to a 90 degree increment. Useful for laying out levels.  


## Installation

Clone the repo and run `npm install` in the root folder.

## Usage

*For developing extensions to the plugin use:*

1. Use ***chrome://extensions*** in developer mode and "Load Unpacked Extension" in the **chrome-extension** folder. 
2. run `npm start` in the root folder to start a webpack dev server which will serve the plugin files
3. You will have to approve the self certified HTTPS server next. In a browser open ***https://localhost:8081/main.build.js*** and use the advanced
tab to proceed to localhost.

*If you just want to use the plugin:*

Use ***chrome://extensions*** in developer mode and "Load Unpacked Extension" in the **production-extension** folder

*In other browsers:*

Host or otherwise insert the **production-extension/main.fn.build.js** into the editor 
page and call `_inject()` or build the project insert **build/main.build.js** into the page.

## Keyboard Shortcuts

The plugin adds some shortcut keys:

**T** - snap the current entity or entities to the snap increment

**R** - select the root scene node (collapsing others)

**U** - select the parent of the current entity (or the first entity selected)
 

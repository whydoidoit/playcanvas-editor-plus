# PlayCanvas Editor Plus

A set of extensions for the PlayCanvas editor.  Implemented as a Google Chrome extension.

## Features

* Decimate models right in the asset window
* Downsize textures with a high quality resample.
* Copy and Paste components and scripts between entities
* Copy and Paste **between projects** (experimental)
* Colour model view in the assets panel and preview window (no more grey shadows!)
* See whole of asset name in the asset panel
* Bake together meshes to reduce draw calls and improve performance
* Quickly select the Root node and collapse others
* Quickly select the parent of an entity
* Powerful search with RegEx, supports component names, entity names etc and returns all matches (unlike the normal hierarchy search)
* Drop to root - enables items being dropped from the asset panel to be located at the position of the selected entity but then parented to the root - stops accidental creation of complicated deep structures when designing scenes
* Snap to grid - snaps one or more entities that are already in the scene to
 the current grid interval - normal snapping in PlayCanvas does not round
 the existing position, but only moves items by grid increments.
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
page and call `_inject()` or build the project and insert **build/main.build.js** into the page.

## Copy & Paste Components

When you select an entity there will be an extra panel in the Inspector that lets you select the components and scripts you want to copy.  Check the box next to each and then press the `Copy` button.  Now select the target entity and the box will show which things can be pasted.  You can't paste a component or script that already exists, so they will not appear (delete the existing ones if you want to overwrite them).

## Copy & Paste Between Projects (Experimental)

When you select one or more entities in the scene or the hierarchy a copy button will appear on the Ixion toolbar. Press this, then open your other project in a different tab and then press the paste button.

Clicking paste will:

* Import all missing assets from the other project including models, scripts, animations, sounds and textures etc
* Create the same hierarchy in your new project assigning all of the correct components
* If an asset already exists it should be used and not re-imported

**This may all take some time.  You may see duplicated items appearing during the operation, they should be cleared up at the end.**

## Mesh Decimator - LOD level creator

The mesh decimator allows you to reduce the number of faces in your models to optimise them or create LODs (Levels Of Detail) to use when the item is far from the camera.  

When you select a model in the assets window, a new panel will appear in the Inspector called DECIMATE.  You can select the target triangle count with a slider and then hit the "Decimate" button.  This may take some time, an overlay will show you that it is working.

The decimator *will* hit it's target goal of triangles - but that may not be a good idea for your mesh.  Experiment with different settings for different meshes and make sure you review the model from a variety of angles and ranges before deciding to use it.

Decimator outputs models with millimeter precision to reduce the file size. This means you should get a good download speed improvement from just re-saving the model using Decimate with no face removal at all - presuming you can live with millimeter accuracy.

## Downsize Textures

When you select a texture asset a new panel will appear in the inspector allowing you to choose a size to which you would like to resize the image.  You may also choose to replace references to the current texture with the new one.

New texture files are created with a name of "Resized_XXXX_OLD_FILE_NAME" they are also tagged as "Resized" and the size to which they were resized.

## Keyboard Shortcuts

The plugin adds some shortcut keys:

**T** - snap the current entity or entities to the snap increment

**R** - select the root scene node (collapsing others)

**U** - select the parent of the current entity (or the first entity selected)

**G** - activate the search window

## Baking Meshes

The plugin allows you to bake together meshes to save draw calls and improve performance.

You select one or more entities in the tree and then they and their children are combined based on the materials used in their meshes.

A new asset is added to the project with the baked mesh and an entity is added to the scene which uses this mesh.  Existing entities that were baked are disabled.

Baking can take a while and the resulting model is automatically imported into PlayCanvas and this will take additional time, with the normal orange import progress bar showing at the bottom right of the window.  No new entities will be added and no entities disabled until this process is complete.  So don't leave the editor until it finishes.

You can specify options for the resulting meshes - for instance their lightmapping and shadow settings.  You can also choose to ignore meshes with more than a  vertex limit you specify. You get the biggest performance improvements when you bake many meshes with few vertices, but you can also leave this option turned off if you prefer and just bake everything.

There is a limit on the number of vertices in a mesh of 62,000.  If the number of vertices exceeds this a second mesh is automatically created and added as a  further mesh instance.  This process is repeated so there is no practical limit.

### Downsides of baking

Baking meshes may end up messing with culling and having more triangles drawn than if they weren't baked.  This is a CPU/GPU balancing issue.  In general I pretty much always bake meshes for static items, but you should be aware that this may  significantly increase the number of triangles rendered and assess yourself whether your application is GPU or CPU bound.

Baked meshes can be large.  You can bake meshes at runtime to get the same performance boost without downloading the files.  The choice here is between how long it will take to  bake the mesh at runtime compared to downloading a prepared mesh.  A runtime version of the mesh baker is included in the project source files.

## Searching

The search tool searches entities in the current scene.  You can use regular expressions for searches.

The entities are searched by name, components attached and the names of scripts.  If you need to differentiate between them then you can prepend a special character - but this must then be followed by the start of the name, script or component.

* **:** Name of the entity. *e.g. :player*
* **=** Name of the component. *e.g. =collision*
* **#** Name of the script. *e.g. #follow*

You can follow a search term with an @ to indicate that there should be no more characters in the match. 

e.g. :man@ searches for entities that are called 'man' but will omit 'manual' etc. 

### History

v1.4.5

* Fixed a problem with normals being blown by scaling during baking

v1.4.3

* Fixed a bug in baking with no UV2
* Fixed a bug in decimation where the decimation panel would not appear

v1.4.1

* Added per sub mesh settings for decimation as an advanced option
* Added mesh output precision

v1.4

* Added copy and paste between projects
* Added mesh decimation
* Fixed a bug in colour assets

v1.3

* Added texture downsizing

v1.2

* Copy & Paste for scripts and components

v1.1.4

* Fixed a few faults in the CSS - especially buttons in the properties window
* Added a settings dialog to configure which buttons are displayed by default

v1.1.3

* Added an @ symbol after search terms (name, component, script) to enable searching for exact matches

> *e.g. #blend@ searches for all entities that have a script called 'blend' but not 'blender' etc*

v1.1.2

* Fixed a bug with searching for Scripts 2.0 scripts

v1.1.1 

* Fixed a CSS bug with the assets window

v1.1

* Added Bake for meshes
* Improved selectivity of search terms with # : and =
* Added a checkbox to specify search scope
* Search has a hot key and reacts to ENTER 
 

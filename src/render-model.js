var app = editor.call('viewport:app');

var device = app.graphicsDevice;
var renderer = app.renderer;
var scene = editor.call('preview:scene');

var pitch = -15;
var yaw = 45;

var white = new pc.Color(1,1,1,1)
// material
var standardMaterial = new pc.StandardMaterial();
standardMaterial.useSkybox = false;
standardMaterial._scene = scene;

var mapping = editor.call('assets:material:mapping');
var mappingShading = {
    'phong': 0,
    'blinn': 1
};
var cubemapPrefiltered = [
    'prefilteredCubeMap128',
    'prefilteredCubeMap64',
    'prefilteredCubeMap32',
    'prefilteredCubeMap16',
    'prefilteredCubeMap8',
    'prefilteredCubeMap4'
];


var aabb = new pc.BoundingBox();

// model
var modelNode = new pc.GraphNode();

var meshSphere = pc.createSphere(device, {
    radius: 0,
    latitudeBands: 2,
    longitudeBands: 2
});

var modelPlaceholder = new pc.Model();
modelPlaceholder.node = modelNode;
modelPlaceholder.meshInstances = [new pc.MeshInstance(modelNode, meshSphere, standardMaterial)];


// light
var lightNode = new pc.GraphNode();
lightNode.setLocalEulerAngles(45, 135, 0);

var light = new pc.Light();
light.enabled = true;
light.type = pc.LIGHTTYPE_DIRECTIONAL;
light.intensity = 2;
light._node = lightNode;

var materialLookup = {}

// camera
var cameraOrigin = new pc.GraphNode();

var cameraNode = new pc.GraphNode();
cameraNode.setLocalPosition(0, 0, 1.35);
cameraOrigin.addChild(cameraNode);

var camera = new pc.Camera();
camera._node = cameraNode;
camera.nearClip = 0.01;
camera.farClip = 32;
camera.clearColor = [41 / 255, 53 / 255, 56 / 255, 0.0];
camera.frustumCulling = false;

function getMaterial(id) {
    if(materialLookup[id]) return materialLookup[id]
    let asset = editor.call('assets:get', id)
    if (!asset) return standardMaterial
    var data = asset.get('data');
    if (!data) return standardMaterial
    let material = new pc.StandardMaterial()
    // update material
    for (var key in mapping) {
        var value = data.hasOwnProperty(key) ? data[key] : mapping[key].default;


        switch (mapping[key].type) {
            case 'boolean':
            case 'string':
            case 'int':
            case 'float':
            case 'number':
                material[key] = value;
                break;
            case 'vec2':
                material[key].set(value[0], value[1]);
                break;
            case 'rgb':
            case 'vec3':
                material[key].set(value[0], value[1], value[2]);
                break;
            case 'cubemap':
                if (value) {
                    // TODO
                    // handle async
                    var textureAsset = app.assets.get(value);
                    if (textureAsset) {
                        if (textureAsset.resource) {
                            material[key] = textureAsset.resource;
                        } else {
                            material[key] = null;
                        }

                        if (textureAsset.file && textureAsset.resources && textureAsset.resources.length === 7) {
                            for (var i = 0; i < 6; i++)
                                material[cubemapPrefiltered[i]] = textureAsset.resources[i + 1];
                        } else {
                            for (var i = 0; i < 6; i++)
                                material[cubemapPrefiltered[i]] = null;
                        }

                        textureAsset.loadFaces = true;
                        app.assets.load(textureAsset);
                    } else {
                        material[key] = null;
                        for (var i = 0; i < 6; i++)
                            material[cubemapPrefiltered[i]] = null;
                    }
                } else {
                    material[key] = null;
                    for (var i = 0; i < 6; i++)
                        material[cubemapPrefiltered[i]] = null;
                }
                break;
            case 'texture':
                if (value) {
                    // TODO
                    // handle async
                    var textureAsset = app.assets.get(value);
                    if (textureAsset) {
                        if (textureAsset.resource) {
                            material[key] = textureAsset.resource;
                        } else {
                            app.assets.load(textureAsset);
                            material[key] = null;
                        }
                    } else {
                        material[key] = null;
                    }
                } else {
                    material[key] = null;
                }
                break;
            case 'object':
                switch (key) {
                    case 'cubeMapProjectionBox':
                        if (value) {
                            if (material.cubeMapProjectionBox) {
                                material.cubeMapProjectionBox.center.set(0, 0, 0);
                                material.cubeMapProjectionBox.halfExtents.set(value.halfExtents[0], value.halfExtents[1], value.halfExtents[2]);
                            } else {
                                material.cubeMapProjectionBox = new pc.BoundingBox(new pc.Vec3(0, 0, 0), new pc.Vec3(value.halfExtents[0], value.halfExtents[1], value.halfExtents[2]));
                            }
                        } else {
                            material.cubeMapProjectionBox = null;
                        }
                        break;
                }
                break;
        }
    }

    material.shadingModel = mappingShading[data.shader];
    material.update();
    materialLookup[id] = material
    return material
}

editor._hooks['preview:model:render'] = function (asset, target, args) {
    args = args || {};

    camera.aspectRatio = target.height / target.width;
    camera.renderTarget = target;

    var data = asset.get('data');
    if (!data) return;

    var modelAsset = app.assets.get(asset.get('id'));
    if (!modelAsset) return;

    var model = modelPlaceholder;
    var materials = data.mapping.filter(f=>f.material).map(mapping=>getMaterial(mapping.material))

    if (modelAsset._editorPreviewModel)
        model = modelAsset._editorPreviewModel.clone();

    model.lights = [light];

    var first = true;

    var i;

    // initialize any skin instances
    for (i = 0; i < model.skinInstances.length; i++) {
        model.skinInstances[i].updateMatrices();
    }

    // generate aabb for model
    for (i = 0; i < model.meshInstances.length; i++) {
        model.meshInstances[i].material = materials[i % materials.length];

        if (first) {
            first = false;
            aabb.copy(model.meshInstances[i].aabb);
        } else {
            aabb.add(model.meshInstances[i].aabb);
        }
    }

    if (first) {
        aabb.center.set(0, 0, 0);
        aabb.halfExtents.set(0.1, 0.1, 0.1);
    }

    scene.addModel(model);

    pitch = args.hasOwnProperty('rotation') ? args.rotation[0] : -15;
    yaw = args.hasOwnProperty('rotation') ? args.rotation[1] : 45;

    var max = aabb.halfExtents.length();
    cameraNode.setLocalPosition(0, 0, max * 2.5);

    cameraOrigin.setLocalPosition(aabb.center);
    cameraOrigin.setLocalEulerAngles(pitch, yaw, 0);
    cameraOrigin.syncHierarchy();

    lightNode.setLocalRotation(cameraOrigin.getLocalRotation());
    lightNode.rotateLocal(90, 0, 0);

    camera.farClip = max * 5.0;

    light.intensity = (1.0 / (Math.min(1.0, scene.exposure) || 0.01))*2.8;
    light.color = white;

    renderer.render(scene, camera);

    scene.removeModel(model);

    if (model !== modelPlaceholder)
        model.destroy();
};

function nextPow2(size) {
    return Math.pow(2, Math.ceil(Math.log(size) / Math.log(2)));
}

var canvas = document.createElement('canvas');
var ctx = canvas.getContext('2d');


import $ from "jquery";
import { defaultGradient, drawGradient } from './utils.js';
import '@shoelace-style/shoelace/dist/themes/dark.css';
import '@shoelace-style/shoelace/dist/components/button/button.js';
import '@shoelace-style/shoelace/dist/components/icon/icon.js';
import '@shoelace-style/shoelace/dist/components/input/input.js';
import '@shoelace-style/shoelace/dist/components/color-picker/color-picker.js';
import '@shoelace-style/shoelace/dist/components/range/range.js';
import '@shoelace-style/shoelace/dist/components/tooltip/tooltip.js';
import '@shoelace-style/shoelace/dist/components/select/select.js';
import '@shoelace-style/shoelace/dist/components/option/option.js';
import '@shoelace-style/shoelace/dist/components/details/details.js';
import { setBasePath } from '@shoelace-style/shoelace/dist/utilities/base-path.js';
setBasePath('./shoelace');

// streamlabs api variables
let streamlabs, streamlabsOBS;
let gradientSettings = defaultGradient;
let canAddSource = false;
let existingSource;

async function loadShoelaceElements() {
    await Promise.allSettled([
        customElements.whenDefined('sl-range'),
        customElements.whenDefined('sl-icon'),
        customElements.whenDefined('sl-select'),
        customElements.whenDefined('sl-details'),
        customElements.whenDefined('sl-range'),
    ]);
}

$(function() {
    updateUI(gradientSettings);
    drawGradient(gradientSettings);
    loadShoelaceElements();
    initApp();
});

async function initApp() {
    streamlabs = window.Streamlabs;
    streamlabs.init().then(async () => {
        //await loadUserSettings();

        streamlabsOBS = window.streamlabsOBS;
        streamlabsOBS.apiReady.then(() => {
            canAddSource = true;
        });

        streamlabsOBS.v1.App.onNavigation(nav => {

            if(nav.sourceId) {
                // Accesses via existing source, load source settings
                console.log('Accessed via existing source');

                streamlabsOBS.v1.Sources.getAppSourceSettings(nav.sourceId).then(settings => {
                    existingSource = nav.sourceId;

                    if(!settings) {
                        console.log('New source, no settings');
                        updateUI(gradientSettings, 'existing');
                        
                    } else {
                        console.log('Gradient source, update from stored settings');
                        gradientSettings = JSON.parse(settings);
                        updateUI(gradientSettings, 'existing');
                        drawGradient(gradientSettings);
                    }
                });  
            } else {
                existingSource = null;
                // Accesses via side nav, load saved settings
                console.log('Accessed via side nav');
                updateUI(gradientSettings, 'new');
                drawGradient(gradientSettings);
            }
        });
    });
}


function updateUI(settings, newSource) {
    if (!settings) return;
    const $type = $('#type');
    $type.val(settings["type"]);

    const c1 = settings["color1"];
    const c2 = settings["color2"];

    $('#color1').val(c1);
    $('#color2').val(c2);
    $('#color1').next('span').text(nearestColorName(c1));
    $('#color2').next('span').text(nearestColorName(c2));

    $('#angle').attr('label', `${Number(settings["angle"])} degrees`);
    $('#angle').val(Number(settings["angle"]));

    if(newSource === 'new') {
        $('#saveAppSource').hide();
    } else {
        $('#saveAppSource').show();
    }
}

function makeAppSourceTitle(settings) {
    const c1 = settings && settings.color1 ? settings.color1 : (defaultGradient.color1 || '#000000');
    const c2 = settings && settings.color2 ? settings.color2 : (defaultGradient.color2 || '#ffffff');
    const n1 = nearestColorName(c1);
    const n2 = nearestColorName(c2);

    let gradientString = `${n1} & ${n2} Gradient`;
    return gradientString;
}

$("sl-range").off('sl-change');
$("sl-range").on('sl-change', event => {
    const value = event.target && event.target.value;
    if (value === undefined) return;

    const numeric = Number(value);
    $(event.target).attr('label', `${numeric} degrees`);
    gradientSettings[$(event.target).attr('id')] = numeric;
    drawGradient(gradientSettings);

    // streamlabs.userSettings.set('gradient-settings', gradientSettings).then(() => {}).catch(saveErr => {
    //     console.error('Failed to save setting', saveErr);
    // });
});

$('#type').off('sl-change');
$('#type').on('sl-change', event => {
    const val = event.target && event.target.value;
    if (!val) return;

    const id = $(event.target).attr('id');
    gradientSettings[id] = val;
    drawGradient(gradientSettings);

    // streamlabs.userSettings.set('gradient-settings', gradientSettings).then(() => {}).catch(saveErr => {
    //     console.error('Failed to save setting', saveErr);
    // });
});

$('.colorInput').off('sl-change');
$('.colorInput').on('sl-change', event => {
    const val = event.target && event.target.value;
    if (val === undefined) return;

    const $nextSpan = $(event.target).next('span');
    if ($nextSpan.length) $nextSpan.text(nearestColorName(val));

    const id = $(event.target).attr('id');
    gradientSettings[id] = val;
    drawGradient(gradientSettings);

    // streamlabs.userSettings.set('gradient-settings', gradientSettings).then(() => {}).catch(saveErr => {
    //     console.error('Failed to save setting', saveErr);
    // });
});

// Nearest color name lookup: small palette of common CSS color names with hex values
const NAMED_COLORS = [
    ['Black', '#000000'], ['White', '#FFFFFF'], ['Red', '#FF0000'], ['Green', '#00FF00'], ['Blue', '#0000FF'],
    ['Yellow', '#FFFF00'], ['Orange', '#FFA500'], ['Purple', '#800080'], ['Pink', '#FFC0CB'], ['Brown', '#8B4513'],
    ['Gray', '#808080'], ['Teal', '#008080'], ['Cyan', '#00FFFF'], ['Magenta', '#FF00FF'], ['Navy', '#000080'],
    ['Olive', '#808000'], ['Lime', '#00FF00'], ['Maroon', '#800000'], ['Coral', '#FF7F50'], ['Salmon', '#FA8072'],
    ['Gold', '#FFD700'], ['Silver', '#C0C0C0'], ['Beige', '#F5F5DC'], ['Chocolate', '#D2691E'], ['Indigo', '#4B0082'],
    ['Violet', '#EE82EE'], ['Turquoise', '#40E0D0'], ['SkyBlue', '#87CEEB'], ['SlateBlue', '#6A5ACD'], ['Crimson', '#DC143C']
];

function parseColorToRgb(input) {
    if (!input) return null;
    const canvas = document.createElement('canvas').getContext('2d');
    try {
        canvas.fillStyle = input;
        const computed = canvas.fillStyle; // normalized
        // rgb(...) or #rrggbb
        const m = computed.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/i);
        if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
        const hex = computed.replace(/^#/, '');
        if (hex.length === 3) {
            return [parseInt(hex[0]+hex[0],16), parseInt(hex[1]+hex[1],16), parseInt(hex[2]+hex[2],16)];
        }
        return [parseInt(hex.slice(0,2),16), parseInt(hex.slice(2,4),16), parseInt(hex.slice(4,6),16)];
    } catch (err) {
        return null;
    }
}

function nearestColorName(hex) {
    const rgb = parseColorToRgb(hex);
    if (!rgb) return null;
    let best = { name: null, dist: Infinity };
    for (const [name, h] of NAMED_COLORS) {
        const r2 = parseInt(h.slice(1,3), 16);
        const g2 = parseInt(h.slice(3,5), 16);
        const b2 = parseInt(h.slice(5,7), 16);
        const d = Math.pow(rgb[0]-r2,2) + Math.pow(rgb[1]-g2,2) + Math.pow(rgb[2]-b2,2);
        if (d < best.dist) {
            best = { name, dist: d };
        }
    }
    return best.name;
}
$("#saveAppSource").on('click', () => { 
    if(!canAddSource) return;
    const title = makeAppSourceTitle(gradientSettings || {});

    if(existingSource) {
        streamlabsOBS.v1.Sources.updateSource({id: existingSource, name: title});
        streamlabsOBS.v1.Sources.setAppSourceSettings(existingSource, JSON.stringify(gradientSettings));
        streamlabsOBS.v1.App.navigate('Editor');
        existingSource = null;
    }
});


$("#addAppSource").on('click', () => { 
    if(!canAddSource) return;
    const title = makeAppSourceTitle(gradientSettings || {});

    streamlabsOBS.v1.Scenes.getActiveScene().then(scene => {
        streamlabsOBS.v1.Sources.createAppSource(title, 'gradient_block').then(source => {
            streamlabsOBS.v1.Sources.setAppSourceSettings(source.id, JSON.stringify(gradientSettings));
            streamlabsOBS.v1.Scenes.createSceneItem(scene.id, source.id);
            streamlabsOBS.v1.App.navigate('Editor');
        });
    });
});

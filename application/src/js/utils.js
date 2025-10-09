export const defaultGradient = {
    "color1": "#f7c5c2",
    "color2": "#e41357",
    "angle": 320,
    "type": "linear"
};

export function drawGradient(settings) {
    const c1 = settings && (settings.color1 !== undefined && settings.color1 !== null) ? settings.color1 : defaultUserSettings.color1;
    const c2 = settings && (settings.color2 !== undefined && settings.color2 !== null) ? settings.color2 : defaultUserSettings.color2;
    const angle = settings && (settings.angle !== undefined && settings.angle !== null) ? settings.angle : defaultUserSettings.angle;
    const type = settings && (settings.type !== undefined && settings.type !== null) ? settings.type : defaultUserSettings.type;

    let gradient;
    if(type === 'linear') {
        gradient = `linear-gradient(${angle}deg, ${c1}, ${c2})`;
    } else if(type === 'radial') {
        gradient = `radial-gradient(${c1}, ${c2})`;
    } else if(type === 'conic') {
        gradient = `conic-gradient(from ${angle}deg, ${c1}, ${c2})`;
    }
    const displayEl = document.querySelector('.gradient-display');
    if (displayEl) {
        displayEl.style.background = gradient;
    }

    // Apply background to the page body
    if (document && document.body) {
        document.body.style.background = gradient;
    }
}
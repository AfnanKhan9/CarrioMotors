/* Carrio Motors - side-profile car illustrations drawn in SVG.
   Used whenever a car in data/cars.json has no photo in its "image" field. */
(function (window) {
  'use strict';

  var shapes = {
    sedan: {
      body: 'M18,122 C18,108 26,100 44,96 L118,86 C140,66 168,52 206,50 L256,51 C282,52 300,64 322,84 L360,90 C376,93 384,104 384,118 L384,124 C384,128 381,130 377,130 L331,130 A30,30 0 0 0 271,130 L135,130 A30,30 0 0 0 75,130 L24,130 C20,130 18,127 18,122 Z',
      glass: ['M130,87 C150,70 172,61 200,60 L204,87 Z', 'M212,87 L212,60 L250,61 C270,62 285,71 300,86 Z'],
      wheels: [105, 301], light: [366, 98], tail: [22, 104]
    },
    suv: {
      body: 'M16,120 C16,104 22,96 38,94 L70,90 L96,58 C102,50 110,46 122,46 L300,46 C314,46 322,52 330,62 L350,86 L368,90 C380,93 386,102 386,116 L386,124 C386,128 383,130 379,130 L333,130 A31,31 0 0 0 271,130 L135,130 A31,31 0 0 0 73,130 L22,130 C18,130 16,127 16,120 Z',
      glass: ['M102,86 L119,56 L196,56 L196,86 Z', 'M204,86 L204,56 L296,56 C306,56 312,60 318,68 L331,86 Z'],
      wheels: [104, 302], light: [368, 96], tail: [20, 100]
    },
    hatch: {
      body: 'M22,122 C22,106 28,98 44,96 L60,94 L88,56 C94,48 102,46 114,46 L230,48 C256,50 276,62 300,82 L350,90 C370,93 380,104 380,118 L380,124 C380,128 377,130 373,130 L323,130 A29,29 0 0 0 265,130 L137,130 A29,29 0 0 0 79,130 L28,130 C24,130 22,127 22,122 Z',
      glass: ['M93,86 L111,56 L176,56 L176,86 Z', 'M184,86 L184,56 L228,57 C250,59 266,68 284,84 Z'],
      wheels: [108, 294], light: [362, 98], tail: [26, 102]
    },
    coupe: {
      body: 'M16,120 C16,108 24,102 40,100 L110,92 C136,72 166,62 204,62 L240,63 C272,65 300,78 322,92 L362,98 C378,101 386,110 386,120 L386,124 C386,128 383,130 379,130 L331,130 A30,30 0 0 0 271,130 L135,130 A30,30 0 0 0 75,130 L22,130 C18,130 16,127 16,120 Z',
      glass: ['M122,92 C144,77 168,69 198,69 L200,92 Z', 'M208,92 L208,69 L238,70 C262,72 282,80 300,92 Z'],
      wheels: [105, 301], light: [368, 106], tail: [20, 108]
    }
  };

  var uid = 0;

  function wheel(cx) {
    var spokes = '';
    for (var a = 0; a < 5; a++) {
      var r = (a * 72) * Math.PI / 180;
      spokes += '<line x1="' + cx + '" y1="130" x2="' + (cx + Math.cos(r) * 13).toFixed(1) +
        '" y2="' + (130 + Math.sin(r) * 13).toFixed(1) + '" stroke="#5d6770" stroke-width="3" stroke-linecap="round"/>';
    }
    return '<circle cx="' + cx + '" cy="130" r="24" fill="#1c2127"/>' +
      '<circle cx="' + cx + '" cy="130" r="15" fill="#b9c2cb"/>' + spokes +
      '<circle cx="' + cx + '" cy="130" r="4" fill="#2c333b"/>';
  }

  function carSVG(body, color, label) {
    var s = shapes[body] || shapes.sedan;
    var id = 'cg' + (++uid);
    var glass = s.glass.map(function (d) {
      return '<path d="' + d + '" fill="#1d2f3d" opacity=".88"/>';
    }).join('');
    return '<svg class="car-art" viewBox="0 0 400 165" xmlns="http://www.w3.org/2000/svg" role="img" aria-label="' + (label || 'Car illustration') + '">' +
      '<defs><linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1">' +
      '<stop offset="0" stop-color="#fff" stop-opacity=".35"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/>' +
      '<stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient></defs>' +
      '<ellipse cx="202" cy="155" rx="178" ry="7" fill="#000" opacity=".16"/>' +
      '<path d="' + s.body + '" fill="' + color + '"/>' +
      '<path d="' + s.body + '" fill="url(#' + id + ')"/>' + glass +
      '<rect x="' + s.light[0] + '" y="' + s.light[1] + '" width="14" height="6" rx="3" fill="#fff4cc"/>' +
      '<rect x="' + s.tail[0] + '" y="' + s.tail[1] + '" width="10" height="6" rx="3" fill="#d7263d"/>' +
      wheel(s.wheels[0]) + wheel(s.wheels[1]) + '</svg>';
  }

  /* Returns a photo if the car has one, otherwise the SVG drawing. */
  function carVisual(car) {
    if (car.image) {
      return '<img class="car-photo" src="' + car.image + '" alt="' + car.name + '" loading="lazy"' +
        ' data-body="' + car.body + '" data-color="' + car.color + '"' +
        ' onload="CarArt.loaded(this)" onerror="CarArt.fallback(this)">';
    }
    return carSVG(car.body, car.color, car.name);
  }

  /* Photo found: let its container drop the padding so the photo fills it. */
  function loaded(img) {
    if (img.parentNode) img.parentNode.classList.add('has-photo');
  }

  /* Photo missing: swap in the SVG drawing instead. */
  function fallback(img) {
    var holder = document.createElement('span');
    holder.innerHTML = carSVG(img.getAttribute('data-body'), img.getAttribute('data-color'), img.alt);
    if (img.parentNode) {
      img.parentNode.classList.remove('has-photo');
      img.parentNode.replaceChild(holder.firstChild, img);
    }
  }

  window.CarArt = { svg: carSVG, visual: carVisual, loaded: loaded, fallback: fallback };
})(window);

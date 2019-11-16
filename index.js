var canvas;
var ctx;
var orgCanvas;
var orgCtx;
var max;
var min;

function getElement(id) {
  return document.getElementById(id);
}

document.addEventListener("DOMContentLoaded", function() {
  // attaches listner to image input
  getElement("fileUpload").addEventListener("change", readImage, false);

  max = getElement("slider").max;
  min = getElement("slider").min;

  getElement("slider").addEventListener("input", () => {
    let value = getElement("slider").value;
    changeBlueBrightness(value, max, min);
  });

  getElement("btnRestore").addEventListener(
    "click",
    () => {
      ctx.putImageData(
        orgCtx.getImageData(0, 0, orgCanvas.width, orgCanvas.height),
        0,
        0
      );
      blueValue = 0;
    },
    false
  );

  // canvas mouse move handler
  getElement("canvas").addEventListener("mousemove", canvasMouseMove, false);
  getElement("originalCanvas").addEventListener(
    "mousemove",
    canvasMouseMove,
    false
  );

  canvas = getElement("canvas");
  ctx = canvas.getContext("2d");

  orgCanvas = getElement("originalCanvas");
  orgCtx = orgCanvas.getContext("2d");
});

// Event handler for file upload input
function readImage() {
  if (this.files && this.files[0]) {
    var fileReader = new FileReader();

    fileReader.onload = function(e) {
      var img = new Image();

      // event handler for changing photo url
      img.addEventListener("load", function() {
        let width;
        let height;

        if (img.width > img.height) {
          width = canvas.width;
          heigth = img.height * (width / img.width);
        } else {
          height = canvas.height;
          width = img.width * (height / img.height);
        }

        ctx.drawImage(
          img,
          canvas.width / 2 - width / 2,
          canvas.height / 2 - height / 2,
          width,
          height
        );

        orgCtx.drawImage(
          img,
          canvas.width / 2 - width / 2,
          canvas.height / 2 - height / 2,
          width,
          height
        );
      });

      img.src = e.target.result;
    };

    fileReader.readAsDataURL(this.files[0]);
  }
}

function changeBlueBrightness(blueValue, max, min) {
  let imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let orgImgData = orgCtx.getImageData(0, 0, orgCanvas.width, orgCanvas.height);

  let i;
  for (i = 0; i < imgData.data.length; i += 4) {
    let orgBlue = orgImgData.data[i + 2];
    let newBlue;

    if (blueValue >= 0) {
      newBlue = orgBlue + ((255 - orgBlue) / max) * blueValue;
    } else {
      newBlue = orgBlue + (orgBlue / -min) * blueValue;
    }
    imgData.data[i + 2] = newBlue;
  }

  ctx.putImageData(imgData, 0, 0);
}

// For canvas mouse position detection
function findPos(obj) {
  var curleft = 0,
    curtop = 0;
  if (obj.offsetParent) {
    do {
      curleft += obj.offsetLeft;
      curtop += obj.offsetTop;
    } while ((obj = obj.offsetParent));
    return { x: curleft, y: curtop };
  }
  return undefined;
}

function canvasMouseMove(e) {
  let pos = findPos(this);
  let ox = e.pageX - pos.x;
  let oy = e.pageY - pos.y;
  let ctx = this.getContext("2d");
  let rgb = ctx.getImageData(ox, oy, 1, 1).data;

  //console.log("x = " + ox + ", y = " + oy);
  //console.log(`rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`);

  let hsv = rgbToHsv(rgb[0], rgb[1], rgb[2]);
  let cmyk = rgbToCmyk(rgb[0], rgb[1], rgb[2]);

  let h = Math.round(hsv[0] * 360);
  let s = Math.round(hsv[1] * 100);
  let v = Math.round(hsv[2] * 100);

  let c = cmyk[0].toFixed(2);
  let m = cmyk[1].toFixed(2);
  let y = cmyk[2].toFixed(2);
  let k = cmyk[3].toFixed(2);

  //console.log(`hsv(${h}, ${s}, ${v})`);
  //console.log(`cmyk(${c}, ${m}, ${y}, ${k})`);

  getElement("output").innerHTML =
    `x=${ox}; y=${oy}` +
    "<br>" +
    `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})` +
    "<br>" +
    `hsv(${h}&deg;, ${s}, ${v})` +
    "<br>" +
    `cmyk(${c}, ${m}, ${y}, ${k})`;
}

// transformations

// converts from [r, g, b] value to [h, s, v] value
function rgbToHsv(r, g, b) {
  (r /= 255), (g /= 255), (b /= 255);

  let max = Math.max(r, g, b),
    min = Math.min(r, g, b);
  let h,
    s,
    v = max;

  let d = max - min;
  s = max == 0 ? 0 : d / max;

  if (max == min) {
    h = 0; // achromatic
  } else {
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }

    h /= 6;
  }

  return [h, s, v];
}

// converts from [h, s, v] value to [r, g, b] value
function hsvToRgb(h, s, v) {
  let r, g, b;

  let i = Math.floor(h * 6);
  let f = h * 6 - i;
  let rgb = v * (1 - s);
  let q = v * (1 - f * s);
  let t = v * (1 - (1 - f) * s);

  switch (i % 6) {
    case 0:
      (r = v), (g = t), (b = rgb);
      break;
    case 1:
      (r = q), (g = v), (b = rgb);
      break;
    case 2:
      (r = rgb), (g = v), (b = t);
      break;
    case 3:
      (r = rgb), (g = q), (b = v);
      break;
    case 4:
      (r = t), (g = rgb), (b = v);
      break;
    case 5:
      (r = v), (g = rgb), (b = q);
      break;
  }

  return [r * 255, g * 255, b * 255];
}

// converts from [r, g, b] value to [c, m, y, k] value
function rgbToCmyk(r, g, b) {
  let c = 0;
  let m = 0;
  let y = 0;
  let k = 0;

  c = 1 - r / 255;
  m = 1 - g / 255;
  y = 1 - b / 255;

  k = Math.min(c, m, y);

  if (k == 1) {
    return [0, 0, 0, 1];
  }

  return [(c - k) / (1 - k), (m - k) / (1 - k), (y - k) / (1 - k), k];
}

// converts from [c, m, y, k] value to [r, g, b] value
function cmykToRgb(c, m, y, k) {
  c = c * (1 - k) + k;
  m = m * (1 - k) + k;
  y = y * (1 - k) + k;

  let r = 1 - c;
  let g = 1 - m;
  let b = 1 - y;

  r = Math.round(255 * r);
  g = Math.round(255 * g);
  b = Math.round(255 * b);

  return [r, g, b];
}

//the code that actually makes the default QR code is in the other file courtesy of https://kazuhikoarase.github.io/qrcode-generator/js/demo/
let imag = null;//

function onezeroonezero(link)//t/f code
{
    const boringqr = qrcode(0, 'H');//0 = pick the smallest code that fits, H = high error correction
    boringqr.addData(link);
    boringqr.make();
    const count = boringqr.getModuleCount();
    const grid = [];
    for (let y = 0; y < count + 2; y++)//the +2 is the margin cells on the left/right
    {
        const row = [];
        for (let x = 0; x < count + 2; x++)
        {
            const inside = x > 0 && y > 0 && x < count + 1 && y < count + 1;
            row.push(inside && boringqr.isDark(y - 1, x - 1));
        }
        grid.push(row);
    }
    return grid;
}

const spacingforeachhelper = [//qr code allignment squares spacing for all the different versions
    [],
    [6, 18], [6, 22], [6, 26], [6, 30], [6, 34],
    [6, 22, 38], [6, 24, 42], [6, 26, 46], [6, 28, 50], [6, 30, 54], [6, 32, 58], [6, 34, 62],
    [6, 26, 46, 66], [6, 26, 48, 70], [6, 26, 50, 74], [6, 30, 54, 78], [6, 30, 56, 82], [6, 30, 58, 86], [6, 34, 62, 90],
    [6, 28, 50, 72, 94], [6, 26, 50, 74, 98], [6, 30, 54, 78, 102], [6, 28, 54, 80, 106], [6, 32, 58, 84, 110], [6, 30, 58, 86, 114], [6, 34, 62, 90, 118],
    [6, 26, 50, 74, 98, 122], [6, 30, 54, 78, 102, 126], [6, 26, 52, 78, 104, 130], [6, 30, 56, 82, 108, 134], [6, 34, 60, 86, 112, 138], [6, 30, 58, 86, 114, 142], [6, 34, 62, 90, 118, 146],
    [6, 30, 54, 78, 102, 126, 150], [6, 24, 50, 76, 102, 128, 154], [6, 28, 54, 80, 106, 132, 158], [6, 32, 58, 84, 110, 136, 162], [6, 26, 54, 82, 110, 138, 166], [6, 30, 58, 86, 114, 142, 170],
];

function isitcontrol(x, y, grid)//
{
    const howbig = grid.length;
    if (x === 0 || y === 0 || x === howbig - 1 || y === howbig - 1) return true;//the margin ring
    if ((x < 9 && (y < 9 || y >= howbig - 9)) || (y < 9 && x >= howbig - 9)) return true;//the finder corners (with their separators)
    const n = howbig - 2;//the qr code itself, without the margin ring
    const thecenters = spacingforeachhelper[(n - 17) / 4 - 1];
    for (const cy of thecenters)
    {
        for (const cx of thecenters)
        {
            if ((cx === 6 && cy === 6) || (cx === 6 && cy === n - 7) || (cx === n - 7 && cy === 6)) continue;//these three spots are already inside the finder corners
            if (Math.abs(x - cx - 1) <= 2 && Math.abs(y - cy - 1) <= 2) return true;//the +1 shifts by the margin ring, the 5x5 area is +/-2 around the center
        }
    }
    return false;
}

function maketheboringqr(grid)//the boring black/white code
{
    const scale = 4;//just so it's comfortable to look at and scan
    const canvas = document.createElement('canvas');
    canvas.width = grid.length * scale;
    canvas.height = grid.length * scale;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = 'black';
    for (let y = 0; y < grid.length; y++)
    {
        for (let x = 0; x < grid.length; x++)
        {
            if (grid[y][x]) ctx.fillRect(x * scale, y * scale, scale, scale);
        }
    }
    return canvas;
}

function maketheactualthing(art, grid)
{
    const size = grid.length * 3;//each qr module becomes a 3x3 pixel block on the art or it doesn't work
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');

    //fill the whole sqwuare
    ctx.imageSmoothingEnabled = false;//makes it look bad if no
    ctx.fillStyle = 'white';
    ctx.fillRect(0, 0, size, size);
    const side = Math.min(art.naturalWidth, art.naturalHeight);
    ctx.drawImage(art, (art.naturalWidth - side) / 2, (art.naturalHeight - side) / 2, side, side, 0, 0, size, size);

    //the center is data to be scanned
    const dots = document.createElement('canvas');
    dots.width = size;
    dots.height = size;
    const dotsCtx = dots.getContext('2d');
    for (let y = 0; y < grid.length; y++)
    {
        for (let x = 0; x < grid.length; x++)
        {
            if (!isitcontrol(x, y, grid))
            {
                dotsCtx.fillStyle = grid[y][x] ? 'black' : 'white';
                dotsCtx.fillRect(x * 3 + 1, y * 3 + 1, 1, 1);
            }
        }
    }

    //luminosity at 50%
    ctx.globalCompositeOperation = 'luminosity';
    ctx.globalAlpha = 0.5;
    ctx.drawImage(dots, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    //the not art ones don't have the art
    const squares = document.createElement('canvas');
    squares.width = size;
    squares.height = size;
    const squaresCtx = squares.getContext('2d');
    for (let y = 0; y < grid.length; y++)
    {
        for (let x = 0; x < grid.length; x++)
        {
            if (isitcontrol(x, y, grid))
            {
                squaresCtx.fillStyle = grid[y][x] ? 'black' : 'white';
                squaresCtx.fillRect(x * 3, y * 3, 3, 3);
            }
        }
    }
    ctx.drawImage(squares, 0, 0);

    return canvas;
}

function shownow()//show the not art one and the yes art one
{
    const link = document.getElementById('link-input').value;
    if (!link) return;//failsafe
    const grid = onezeroonezero(link);

    const qrboxelement = document.getElementById('qr-box');
    qrboxelement.innerHTML = '';
    qrboxelement.appendChild(maketheboringqr(grid));

    if (!imag) return;//fairlsafe
    const whereitgoes = document.getElementById('output-box');
    whereitgoes.innerHTML = '';
    whereitgoes.appendChild(maketheactualthing(imag, grid));
}

function loadtheimagethattheuseruploaded(file)
{
    if (!file) return;//failsafe

    const img = new Image();
    const reader = new FileReader();
    reader.onload = function(e)
    {
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
    img.onload = function()
    {
        imag = img;//wow
        previewuploaded(img);
        shownow();
    };
}

function previewuploaded(img)//the button actually BECOMES the image. i'll make this more clear later and also remember to change this comment
{
    const clickthis = document.getElementById('upload-button');
    if (clickthis) 
    {
        clickthis.remove();
    }
    const oldevilpreview = document.getElementById('preview');
    if (oldevilpreview) 
    {
        oldevilpreview.remove();
    }
    img.id = 'preview';
    img.onclick = function()
    {
        document.getElementById('image-input').click();
    };
    document.getElementById('input-box').prepend(img);
}

document.getElementById('link-input').addEventListener('input', shownow);

document.getElementById('image-input').addEventListener('change', e =>
{
    loadtheimagethattheuseruploaded(e.target.files[0]);
});
//i took below from OLDER project
document.addEventListener('paste', e =>//pasting an image directly
{
    const items = e.clipboardData && e.clipboardData.items;
    if (!items) return;//failsafes
    for (const item of items)
    {
        if (item.type.startsWith('image/'))
        {
            loadtheimagethattheuseruploaded(item.getAsFile());
            break;
        }
    }
});

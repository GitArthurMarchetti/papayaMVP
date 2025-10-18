export function getMaskBoundingBox(mask: Uint8Array, w: number, h: number, ss: number, pad: number) {
    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            if (mask[y * w + x]) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
            }
        }
    }
    const finalMinX = minX / ss - pad;
    const finalMinY = minY / ss - pad;
    const finalMaxX = maxX / ss - pad;
    const finalMaxY = maxY / ss - pad;

    return {
        minX: finalMinX,
        minY: finalMinY,
        width: finalMaxX - finalMinX,
        height: finalMaxY - finalMinY,
    };
}

export function getLargestComponentMask(mask: Uint8Array, w: number, h: number): Uint8Array {
    const { labeledMask, labelCount } = findAllComponents(mask, w, h);
    if (labelCount === 0) return new Uint8Array(mask.length);
    const sizes = new Array(labelCount + 1).fill(0);
    for (let i = 0; i < labeledMask.length; i++) {
        if (labeledMask[i] > 0) {
            sizes[labeledMask[i]]++;
        }
    }
    let largestLabel = 0, maxSize = 0;
    for (let i = 1; i <= labelCount; i++) {
        if (sizes[i] > maxSize) {
            maxSize = sizes[i];
            largestLabel = i;
        }
    }
    const largestComponentMask = new Uint8Array(mask.length);
    for (let i = 0; i < labeledMask.length; i++) {
        if (labeledMask[i] === largestLabel) {
            largestComponentMask[i] = 1;
        }
    }
    return largestComponentMask;
}

export function getAllComponentMasks(mask: Uint8Array, w: number, h: number): Uint8Array[] {
    const { labeledMask, labelCount } = findAllComponents(mask, w, h);
    if (labelCount === 0) return [];
    const components: Uint8Array[] = [];
    for (let i = 1; i <= labelCount; i++) {
        const componentMask = new Uint8Array(mask.length);
        for (let j = 0; j < labeledMask.length; j++) {
            if (labeledMask[j] === i) {
                componentMask[j] = 1;
            }
        }
        components.push(componentMask);
    }
    return components;
}

export function findAllComponents(mask: Uint8Array, w: number, h: number) {
    const labeledMask = new Uint32Array(mask.length);
    let labelCount = 0;
    const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    for (let i = 0; i < mask.length; i++) {
        if (mask[i] && !labeledMask[i]) {
            labelCount++;
            const q = [i];
            labeledMask[i] = labelCount;
            let head = 0;
            while (head < q.length) {
                const p = q[head++];
                const x = p % w;
                const y = Math.floor(p / w);
                for (const [dx, dy] of dirs) {
                    const nx = x + dx, ny = y + dy;
                    if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                        const ni = ny * w + nx;
                        if (mask[ni] && !labeledMask[ni]) {
                            labeledMask[ni] = labelCount;
                            q.push(ni);
                        }
                    }
                }
            }
        }
    }
    return { labeledMask, labelCount };
}

export function buildObjectMask(imgData: ImageData, tol: number, ss: number): Uint8Array {
    const { data, width, height } = imgData;
    const mask = new Uint8Array(width * height);
    let hasAlpha = false, hasTransparent = false;
    for (let i = 0; i < data.length; i += 4) {
        if (data[i + 3] < 255) hasAlpha = true;
        if (data[i + 3] === 0) hasTransparent = true;
    }
    if (hasAlpha && hasTransparent) {
        for (let i = 0, p = 0; i < data.length; i += 4, p++) mask[p] = data[i + 3] > 0 ? 1 : 0;
        if (ss > 1) closeMask(mask, width, height);
        return mask;
    }
    const r0 = data[0], g0 = data[1], b0 = data[2];
    const tol2 = tol * tol;
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const dr = data[i] - r0, dg = data[i + 1] - g0, db = data[i + 2] - b0;
        mask[p] = (dr * dr + dg * dg + db * db) > tol2 ? 1 : 0;
    }
    if (ss > 1) { openMask(mask, width, height); closeMask(mask, width, height); }
    return mask;
}

export function chamferDistance(mask: Uint8Array, w: number, h: number): Int32Array {
    const INF = 1e9;
    const dist = new Int32Array(w * h).fill(INF);
    for (let i = 0; i < dist.length; i++) if (mask[i]) dist[i] = 0;
    // Forward pass
    for (let y = 0; y < h; y++) {
        for (let x = 0; x < w; x++) {
            const i = y * w + x;
            if (x > 0) dist[i] = Math.min(dist[i], dist[i - 1] + 3);
            if (y > 0) dist[i] = Math.min(dist[i], dist[i - w] + 3);
            if (x > 0 && y > 0) dist[i] = Math.min(dist[i], dist[i - w - 1] + 4);
            if (x < w - 1 && y > 0) dist[i] = Math.min(dist[i], dist[i - w + 1] + 4);
        }
    }
    // Backward pass
    for (let y = h - 1; y >= 0; y--) {
        for (let x = w - 1; x >= 0; x--) {
            const i = y * w + x;
            if (x < w - 1) dist[i] = Math.min(dist[i], dist[i + 1] + 3);
            if (y < h - 1) dist[i] = Math.min(dist[i], dist[i + w] + 3);
            if (x < w - 1 && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w + 1] + 4);
            if (x > 0 && y < h - 1) dist[i] = Math.min(dist[i], dist[i + w - 1] + 4);
        }
    }
    return dist;
}

function openMask(mask: Uint8Array, w: number, h: number) { erode(mask, w, h); dilate(mask, w, h); }
function closeMask(mask: Uint8Array, w: number, h: number) { dilate(mask, w, h); erode(mask, w, h); }

function erode(mask: Uint8Array, w: number, h: number) {
    const out = new Uint8Array(mask.length);
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            let ok = 1;
            for (let dy = -1; dy <= 1 && ok; dy++) {
                for (let dx = -1; dx <= 1 && ok; dx++) {
                    if (!mask[(y + dy) * w + (x + dx)]) ok = 0;
                }
            }
            if (ok) out[y * w + x] = 1;
        }
    }
    mask.set(out);
}

function dilate(mask: Uint8Array, w: number, h: number) {
    const out = new Uint8Array(mask.length);
    for (let y = 1; y < h - 1; y++) {
        for (let x = 1; x < w - 1; x++) {
            let any = 0;
            for (let dy = -1; dy <= 1 && !any; dy++) {
                for (let dx = -1; dx <= 1 && !any; dx++) {
                    if (mask[(y + dy) * w + (x + dx)]) any = 1;
                }
            }
            if (any) out[y * w + x] = 1;
        }
    }
    mask.set(out);
}

export function hexToRgb(hex: string) {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return m ? { r: parseInt(m[1], 16), g: parseInt(m[2], 16), b: parseInt(m[3], 16) } : { r: 0, g: 0, b: 0 };
}

export function hasAny(mask: Uint8Array) { return mask.some(Boolean); }
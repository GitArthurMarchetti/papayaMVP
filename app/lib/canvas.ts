import { DesignConfig } from "../types";
import { DIE_CUT_COLOR, FIXED_SMOOTHNESS, FIXED_TOLERANCE, KISS_CUT_COLOR } from "./constants";
import { buildObjectMask, chamferDistance, getAllComponentMasks, getLargestComponentMask, getMaskBoundingBox, hasAny, hexToRgb } from "./imageProcessing";

const generateContourCanvas = (img: HTMLImageElement, lineColor: string, keepLargest: boolean, gap: number, pad: number) => {
    const lineWidth = 2;
    const ss = FIXED_SMOOTHNESS;
    const baseW = img.width, baseH = img.height;
    const workW = (baseW + pad * 2) * ss;
    const workH = (baseH + pad * 2) * ss;

    const workCanvas = document.createElement('canvas');
    workCanvas.width = workW; workCanvas.height = workH;
    const wctx = workCanvas.getContext('2d');
    if (!wctx) return { allContoursMask: null, overallBoundingBox: null };

    wctx.drawImage(img, 0, 0, baseW, baseH, pad * ss, pad * ss, baseW * ss, baseH * ss);
    const imgData = wctx.getImageData(0, 0, workW, workH);
    const mask = buildObjectMask(imgData, FIXED_TOLERANCE, ss);
    wctx.clearRect(0, 0, workW, workH);
    if (!hasAny(mask)) return { allContoursMask: null, overallBoundingBox: null };

    const components = keepLargest ? [getLargestComponentMask(mask, workW, workH)] : getAllComponentMasks(mask, workW, workH);

    const out = wctx.createImageData(workW, workH);
    const { r, g, b } = hexToRgb(lineColor);

    for (const componentMask of components) {
      if(!hasAny(componentMask)) continue;
        const dist = chamferDistance(componentMask, workW, workH);
        const scale = 3;
        const low = gap * scale * ss;
        const high = (gap + lineWidth) * scale * ss;
        for (let i = 0; i < componentMask.length; i++) {
            if (!componentMask[i] && dist[i] >= low && dist[i] < high) {
                const k = i * 4;
                out.data[k] = r; out.data[k+1] = g; out.data[k+2] = b; out.data[k+3] = 255;
            }
        }
    }
    wctx.putImageData(out, 0, 0);

    const overallBoundingBox = keepLargest ? null : getMaskBoundingBox(mask, workW, workH, ss, pad);

    return { allContoursMask: workCanvas, overallBoundingBox };
}

const drawContourOutlines = (img: HTMLImageElement, finalCtx: CanvasRenderingContext2D, lineColor: string, pad: number, gap: number) => {
  const { allContoursMask } = generateContourCanvas(img, lineColor, false, gap, pad);
  if (allContoursMask) {
    finalCtx.drawImage(allContoursMask, 0, 0, finalCtx.canvas.width, finalCtx.canvas.height);
  }
};

const generateMultiContourData = (img: HTMLImageElement, lineColor: string, innerGap: number, pad: number) => {
  return generateContourCanvas(img, lineColor, false, innerGap, pad);
};

export const generateAndDrawOutline = (img: HTMLImageElement, config: DesignConfig, previewCanvas: HTMLCanvasElement | null) => {
    if (!previewCanvas) return;
  
    // 1. Definir um tamanho máximo para a área de exibição do design.
    //    Isso garante que o canvas não fique gigante.
    const MAX_DISPLAY_SIZE = 300; // 300 pixels, por exemplo. Pode ajustar.
  
    const lineWidth = 2;
    const maxGap = Math.max(config.outerGap, config.innerGap);
    const pad = maxGap + lineWidth + 2;
    const baseW = img.width;
    const baseH = img.height;
  
    // 2. Calcular a proporção de redimensionamento para caber no MAX_DISPLAY_SIZE
    const scaleRatio = Math.min(MAX_DISPLAY_SIZE / baseW, MAX_DISPLAY_SIZE / baseH);
  
    // 3. Calcular as novas dimensões de exibição mantendo a proporção original
    const displayW = baseW * scaleRatio;
    const displayH = baseH * scaleRatio;
  
    // O padding também precisa ser escalado para o desenho
    const scaledPad = pad * scaleRatio;
  
    // 4. Ajustar o tamanho do canvas para as dimensões redimensionadas + padding escalado
    const outW = displayW + scaledPad * 2;
    const outH = displayH + scaledPad * 2;
    previewCanvas.width = outW;
    previewCanvas.height = outH;
    
    const dctx = previewCanvas.getContext('2d');
    if (!dctx) return;
  
    dctx.clearRect(0, 0, outW, outH);
    
    // 5. Desenhar a IMAGEM REDIMENSIONADA no canvas
    dctx.drawImage(img, scaledPad, scaledPad, displayW, displayH);
    
    dctx.lineWidth = lineWidth;
  
    if (config.cutType === 'Die Cut') {
      dctx.strokeStyle = DIE_CUT_COLOR;
      const gap = config.outerGap;
      // O gap também precisa ser escalado
      const scaledGap = gap * scaleRatio;
  
      switch (config.shape) {
        case 'Contour':
          // A função de contorno ainda usa a imagem original para precisão,
          // mas o resultado é desenhado no tamanho do canvas final, que já está redimensionado.
          drawContourOutlines(img, dctx, DIE_CUT_COLOR, pad, gap);
          break;
        case 'Square':
          dctx.strokeRect(
              scaledPad - scaledGap, 
              scaledPad - scaledGap, 
              displayW + scaledGap * 2, 
              displayH + scaledGap * 2
          );
          break;
        case 'Circle':
          const centerX = scaledPad + displayW / 2;
          const centerY = scaledPad + displayH / 2;
          const radius = Math.max(displayW, displayH) / 2 + scaledGap;
          dctx.beginPath();
          dctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
          dctx.stroke();
          break;
      }
    } else if (config.cutType === 'Kiss Cut') {
      // A lógica de contorno não muda, ela calcula com base na imagem original (alta qualidade)
      const { allContoursMask, overallBoundingBox } = generateMultiContourData(img, KISS_CUT_COLOR, config.innerGap, pad);
      
      if (allContoursMask) {
        // O resultado é desenhado no canvas final, que já tem o tamanho correto
        dctx.drawImage(allContoursMask, 0, 0, outW, outH);
      }
      
      if (overallBoundingBox) {
        dctx.strokeStyle = DIE_CUT_COLOR;
        const gap = config.outerGap;
        const scaledGap = gap * scaleRatio;
        
        // As coordenadas e dimensões do retângulo também são escaladas
        dctx.strokeRect(
          (overallBoundingBox.minX * scaleRatio) + scaledPad - scaledGap,
          (overallBoundingBox.minY * scaleRatio) + scaledPad - scaledGap,
          (overallBoundingBox.width * scaleRatio) + (scaledGap * 2),
          (overallBoundingBox.height * scaleRatio) + (scaledGap * 2)
        );
      }
    }
  };
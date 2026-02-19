import { jsPDF } from 'jspdf';
import { getFiberColor } from './fiberColors';

interface Point {
    x: number;
    y: number;
}

// Helper for sweeping technical lines
const drawBezierConnection = (doc: jsPDF, p1: Point, p2: Point) => {
    const dist = p2.x - p1.x;
    // Standard S-curve
    const curvature = 0.5;

    const cp1 = { x: p1.x + (dist * curvature), y: p1.y };
    const cp2 = { x: p2.x - (dist * curvature), y: p2.y };

    const scale = 1.0;
    const c1x = (cp1.x - p1.x) * scale;
    const c1y = (cp1.y - p1.y) * scale;
    const c2x = (cp2.x - p1.x) * scale;
    const c2y = (cp2.y - p1.y) * scale;
    const ex = (p2.x - p1.x) * scale;
    const ey = (p2.y - p1.y) * scale;

    // Fixed color: Technical Dark Blue/Gray
    doc.setDrawColor(47, 79, 79);
    doc.setLineWidth(0.15);
    doc.lines([[c1x, c1y, c2x, c2y, ex, ey]], p1.x, p1.y, [1, 1], 'S', true);
};

export const generateFusionDiagram = (doc: jsPDF, box: any, cables: any[], fusions: any[], splitters: any[]) => {
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    const margin = 10;
    const headerHeight = 35;

    // --- 1. Header ---
    doc.setFillColor(255, 255, 255);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');

    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.setFont('times', 'normal');

    // Header Text Block
    doc.text(`ISM TELECOM`, margin, 12);
    doc.setFontSize(9);
    doc.text(`Terminal de atendimento: ${box.name || 'CTO'} ( Instalado no ${box.poleId || 'Poste'} )`, margin, 17);
    doc.text(`Modelo: Tipo de terminal - ${(box.type || 'Padrão').toUpperCase()}`, margin, 22);
    doc.text(`Pasta: ${box.projectId || 'Geral'}`, margin, 27);

    // Separator
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(0, 32, pageWidth, 32);

    // --- 2. Layout Shared Metrics ---
    const startContentY = headerHeight + 15;

    let leftY = startContentY;
    let rightY = startContentY;

    // Common Metrics
    const rowHeight = 8;
    const cardHeaderHeight = 10;
    const headerPadding = 4;

    const columnWidth = 60;

    const getRowCenterY = (blockStartY: number, rowIndex: number) => {
        return blockStartY + cardHeaderHeight + headerPadding + (rowIndex * rowHeight) + (rowHeight / 2);
    };

    const fiberPositions: Record<string, Point> = {};

    // --- 3. Helper: Draw Cable ---
    const drawCableBlock = (cable: any, startX: number, startY: number, isLeft: boolean) => {
        const fiberCount = cable.fiberCount || 12;
        const tubesCount = Math.ceil(fiberCount / 12);

        let rowCount = 0;
        for (let t = 0; t < tubesCount; t++) {
            const fibersInTube = Math.min(12, fiberCount - (t * 12));
            rowCount += fibersInTube;
        }

        // Total Height
        const totalHeight = cardHeaderHeight + headerPadding + (rowCount * rowHeight) + 4;

        if (startY + totalHeight > pageHeight - margin) {
            doc.text('...', startX, startY + 5);
            return startY + 20;
        }

        // --- Cable Header ---
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.2);
        doc.setFillColor(255, 255, 255);
        doc.rect(startX, startY, columnWidth, cardHeaderHeight, 'S');

        doc.setFontSize(8);
        doc.setTextColor(0, 0, 0);
        doc.setFont('helvetica', 'normal');
        const displayName = (cable.name || `Cabo ${cable.id.substring(0, 4)}`).toUpperCase();
        doc.text(`FIBRA ${fiberCount}FO ${displayName}`, startX + 2, startY + 6.5);

        // Gray background for rows
        const bgStartY = startY + cardHeaderHeight;
        doc.setFillColor(245, 245, 245);
        doc.setDrawColor(0);
        doc.rect(startX, bgStartY, columnWidth, totalHeight - cardHeaderHeight, 'F');

        let absoluteRowIndex = 0;

        for (let t = 0; t < tubesCount; t++) {
            const fibersInThisTube = Math.min(12, fiberCount - (t * 12));
            const tubeColor = getFiberColor(t + 1);

            // Draw Fibers
            for (let f = 1; f <= fibersInThisTube; f++) {
                const fiberGlobalIndex = (t * 12) + f;
                const fiberColor = getFiberColor(f);

                // Position
                const fiberYCenter = getRowCenterY(startY, absoluteRowIndex);
                const currentYTop = fiberYCenter - (rowHeight / 2);

                const squareSize = 4;

                if (isLeft) {
                    // --- LEFT CABLE ---
                    // Tube
                    doc.setFillColor(tubeColor);
                    doc.setDrawColor(0);
                    doc.setLineWidth(0.1);
                    doc.rect(startX + 2, currentYTop + 2, squareSize, squareSize, 'FD');

                    // Fiber
                    doc.setFillColor(fiberColor);
                    doc.rect(startX + 8, currentYTop + 2, squareSize, squareSize, 'FD');

                    // Number
                    doc.setTextColor(0);
                    doc.setFontSize(8);
                    doc.text(`${f}`, startX + 22, fiberYCenter + 1);

                    // Connector (Green Gun)
                    doc.setFillColor(100, 200, 100);
                    doc.setDrawColor(50, 100, 50);
                    doc.rect(startX + columnWidth - 8, currentYTop + 2, 6, 4, 'FD');
                    doc.rect(startX + columnWidth - 10, currentYTop + 3, 2, 2, 'FD');

                    // Anchor (Tip)
                    fiberPositions[`${cable.id}-${fiberGlobalIndex}`] = { x: startX + columnWidth - 10, y: fiberYCenter };

                } else {
                    // --- RIGHT CABLE ---
                    // Connector (Green Gun)
                    doc.setFillColor(100, 200, 100);
                    doc.setDrawColor(50, 100, 50);
                    doc.setLineWidth(0.1);
                    doc.rect(startX + 4, currentYTop + 2, 6, 4, 'FD');
                    doc.rect(startX + 2, currentYTop + 3, 2, 2, 'FD');

                    // Number
                    doc.setTextColor(0);
                    doc.setFontSize(8);
                    doc.text(`${f}`, startX + 14, fiberYCenter + 1);

                    // Fiber
                    doc.setFillColor(fiberColor);
                    doc.setDrawColor(0);
                    doc.rect(startX + columnWidth - 12, currentYTop + 2, squareSize, squareSize, 'FD');

                    // Tube
                    doc.setFillColor(tubeColor);
                    doc.rect(startX + columnWidth - 6, currentYTop + 2, squareSize, squareSize, 'FD');

                    // Anchor (Tip)
                    fiberPositions[`${cable.id}-${fiberGlobalIndex}`] = { x: startX + 2, y: fiberYCenter };
                }

                absoluteRowIndex++;
            }
        }

        return startY + totalHeight + 10;
    };

    // --- 4. Process Cables ---
    const incoming = cables.filter(c => c.toId === box.id || (box.poleId && c.toId === box.poleId));
    const outgoing = cables.filter(c => c.fromId === box.id || (box.poleId && c.fromId === box.poleId));

    // If no explicit direction, split evenly
    let cablesToDrawLeft = incoming;
    let cablesToDrawRight = outgoing;
    if (incoming.length === 0 && outgoing.length === 0) {
        const connected = cables.filter(c =>
            c.toId === box.id || (box.poleId && c.toId === box.poleId) ||
            c.fromId === box.id || (box.poleId && c.fromId === box.poleId)
        );
        const mid = Math.ceil(connected.length / 2);
        cablesToDrawLeft = connected.slice(0, mid);
        cablesToDrawRight = connected.slice(mid);
    }

    let maxCableY = startContentY;

    cablesToDrawLeft.forEach(c => {
        leftY = drawCableBlock(c, margin, leftY, true);
        if (leftY > maxCableY) maxCableY = leftY;
    });

    cablesToDrawRight.forEach(c => {
        rightY = drawCableBlock(c, pageWidth - margin - columnWidth, rightY, false);
        if (rightY > maxCableY) maxCableY = rightY;
    });

    // --- 5. Draw Splitters (Separate Lower Layout) ---
    // Start splitters cleanly below the lowest cable block to avoid "mixing"
    let splitterY = maxCableY + 20;

    const boxSplitters = splitters.filter(s => s.boxId === box.id);

    const splitterWidth = 90;
    const centerX = pageWidth / 2;
    const splitXStart = centerX - (splitterWidth / 2);

    const splitterPositions: Record<string, { input: Point, outputs: Point[] }> = {};

    boxSplitters.forEach((splitter) => {
        const splitStr = splitter.type && splitter.type.includes('1:') ? splitter.type : '1:8';
        const splitCount = parseInt(splitStr.split(':')[1]) || 8;

        // Calculate Height
        const bodyContentHeight = (splitCount * rowHeight) + 4;
        const totalSplitterHeight = cardHeaderHeight + bodyContentHeight;

        // Page break if needed
        if (splitterY + totalSplitterHeight > pageHeight - margin) {
            doc.addPage();
            splitterY = margin + 10;
        }

        // Header Box
        doc.setDrawColor(0);
        doc.setLineWidth(0.2);
        doc.setFillColor(255, 255, 255);
        doc.rect(splitXStart, splitterY, splitterWidth, cardHeaderHeight, 'S');

        doc.setFontSize(9);
        doc.setTextColor(0);
        doc.text(`spliter ${splitStr}`, splitXStart + 4, splitterY + 6.5);
        doc.text(`${splitter.id?.substring(0, 6) || ''}`, splitXStart + splitterWidth - 20, splitterY + 6.5);

        // Body Box
        doc.rect(splitXStart, splitterY + cardHeaderHeight, splitterWidth, bodyContentHeight, 'S');

        // Grid of Ports

        // Input logic
        // FIX: Start Input at Row 1 Y (Index 0)
        const inputY = getRowCenterY(splitterY, 0);
        const inputIconX = splitXStart; // On Left Edge

        // Draw Input Icon
        doc.setFillColor(100, 200, 100);
        doc.setDrawColor(50, 100, 50);
        doc.setLineWidth(0.1);
        doc.rect(inputIconX + 2, inputY - 2, 6, 4, 'FD');
        doc.rect(inputIconX, inputY - 1, 2, 2, 'FD');

        // Internal lines
        doc.setDrawColor(200);
        doc.setLineWidth(0.1);
        doc.line(inputIconX + 8, inputY, splitXStart + splitterWidth / 2, inputY);

        const outputs = [];

        for (let i = 0; i < splitCount; i++) {
            const y = getRowCenterY(splitterY, i);
            const currentYTop = y - (rowHeight / 2);

            // Output Position: Right Edge
            const outputAnchorX = splitXStart + splitterWidth;
            const iconX = outputAnchorX - 15;

            // Body
            doc.setFillColor(255, 255, 255);
            doc.setDrawColor(0);
            doc.setLineWidth(0.15);
            doc.rect(iconX, currentYTop + 2, 5, 4, 'S');
            doc.rect(iconX + 5, currentYTop + 3, 1.5, 2, 'S');

            // Number - Force string to avoid type errors
            doc.setFontSize(8);
            doc.setTextColor(0);
            const numStr = String(i + 1);
            doc.text(numStr, iconX - 6, y + 1);

            outputs.push({ x: outputAnchorX, y: y });
        }

        splitterPositions[splitter.id] = {
            input: { x: inputIconX, y: inputY },
            outputs: outputs
        };

        splitterY += totalSplitterHeight + 10;
    });

    // --- 6. Draw Connections ---
    const boxFusions = fusions.filter(f => f.boxId === box.id);

    boxFusions.forEach(fusion => {
        let p1: Point | null = null;
        let p2: Point | null = null;

        // Origin
        if (fusion.originType === 'cable') {
            p1 = fiberPositions[`${fusion.originId}-${fusion.originFiberIndex}`];
        } else if (fusion.originType === 'splitter') {
            const split = splitterPositions[fusion.originId];
            if (split && split.outputs[fusion.originFiberIndex - 1]) {
                p1 = split.outputs[fusion.originFiberIndex - 1];
            }
        }

        // Destination
        if (fusion.destinationType === 'cable') {
            p2 = fiberPositions[`${fusion.destinationId}-${fusion.destinationFiberIndex}`];
        } else if (fusion.destinationType === 'splitter') {
            const split = splitterPositions[fusion.destinationId];
            if (split) p2 = split.input;
        }

        if (p1 && p2) {
            drawBezierConnection(doc, p1, p2);
        }
    });
};

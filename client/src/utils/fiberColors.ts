export const getFiberColor = (index: number) => {
    // 1-based index
    const colors = [
        '#009c3b', // 1 - Green
        '#ffdf00', // 2 - Yellow
        '#ffffff', // 3 - White
        '#0072bc', // 4 - Blue
        '#ff0000', // 5 - Red
        '#8a2be2', // 6 - Violet
        '#964b00', // 7 - Brown
        '#ffc0cb', // 8 - Pink
        '#000000', // 9 - Black
        '#808080', // 10 - Gray
        '#ff7f00', // 11 - Orange
        '#00ffff', // 12 - Aqua
    ];
    // Handle simplified loop (13 maps to 1, etc, if needed, but usually 12-fiber tubes)
    const normalizedIndex = (index - 1) % 12;
    return colors[normalizedIndex];
};

export const getFiberName = (index: number) => {
    const names = [
        'Verde', 'Amarelo', 'Branco', 'Azul', 'Vermelho', 'Violeta',
        'Marrom', 'Rosa', 'Preto', 'Cinza', 'Laranja', 'Aqua'
    ];
    return names[(index - 1) % 12];
};

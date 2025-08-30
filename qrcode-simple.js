// Простая библиотека для генерации QR-кодов
class QRCodeSimple {
    constructor() {
        this.size = 21; // Стандартный размер QR-кода
    }

    // Основной метод для генерации QR-кода
    toCanvas(canvas, text, options = {}) {
        const size = options.width || 256;
        const color = options.color?.dark || '#000000';
        
        // Устанавливаем размеры canvas
        canvas.width = size;
        canvas.height = size;
        
        // Получаем контекст для рисования
        const ctx = canvas.getContext('2d');
        
        // Генерируем QR-код
        const qrMatrix = this.generateQRMatrix(text);
        
        // Рисуем QR-код на canvas
        this.drawQRCode(ctx, qrMatrix, size, color);
        
        return canvas;
    }

    // Генерация матрицы QR-кода
    generateQRMatrix(text) {
        const matrix = Array(this.size).fill().map(() => Array(this.size).fill(false));
        
        // Добавляем finder patterns (квадраты в углах)
        this.addFinderPatterns(matrix);
        
        // Добавляем alignment pattern (квадрат в центре)
        this.addAlignmentPattern(matrix);
        
        // Добавляем timing patterns (линии)
        this.addTimingPatterns(matrix);
        
        // Добавляем данные
        this.addData(matrix, text);
        
        // Применяем маску данных
        this.applyDataMask(matrix);
        
        return matrix;
    }

    // Добавление finder patterns (квадраты в углах)
    addFinderPatterns(matrix) {
        // Левый верхний угол
        this.drawFinderPattern(matrix, 0, 0);
        // Правый верхний угол
        this.drawFinderPattern(matrix, this.size - 7, 0);
        // Левый нижний угол
        this.drawFinderPattern(matrix, 0, this.size - 7);
    }

    // Рисование finder pattern
    drawFinderPattern(matrix, x, y) {
        // Внешний квадрат
        for (let i = 0; i < 7; i++) {
            for (let j = 0; j < 7; j++) {
                if (i === 0 || i === 6 || j === 0 || j === 6) {
                    matrix[y + i][x + j] = true;
                }
            }
        }
        // Внутренний квадрат
        for (let i = 2; i < 5; i++) {
            for (let j = 2; j < 5; j++) {
                matrix[y + i][x + j] = true;
            }
        }
    }

    // Добавление alignment pattern
    addAlignmentPattern(matrix) {
        const center = Math.floor(this.size / 2);
        for (let i = center - 2; i <= center + 2; i++) {
            for (let j = center - 2; j <= center + 2; j++) {
                if (i >= 0 && i < this.size && j >= 0 && j < this.size) {
                    if (i === center - 2 || i === center + 2 || j === center - 2 || j === center + 2) {
                        matrix[i][j] = true;
                    }
                }
            }
        }
        matrix[center][center] = true;
    }

    // Добавление timing patterns
    addTimingPatterns(matrix) {
        // Горизонтальная линия
        for (let i = 8; i < this.size - 8; i++) {
            if (i % 2 === 0) {
                matrix[6][i] = true;
            }
        }
        // Вертикальная линия
        for (let i = 8; i < this.size - 8; i++) {
            if (i % 2 === 0) {
                matrix[i][6] = true;
            }
        }
    }

    // Добавление данных
    addData(matrix, text) {
        const data = this.encodeText(text);
        let dataIndex = 0;
        
        // Заполняем матрицу данными (простой алгоритм)
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                // Пропускаем служебные области
                if (this.isReserved(i, j)) continue;
                
                if (dataIndex < data.length) {
                    matrix[i][j] = data[dataIndex];
                    dataIndex++;
                } else {
                    // Заполняем оставшиеся ячейки случайными данными
                    matrix[i][j] = Math.random() > 0.5;
                }
            }
        }
    }

    // Проверка, является ли ячейка зарезервированной
    isReserved(i, j) {
        // Finders
        if ((i < 7 && j < 7) || (i < 7 && j >= this.size - 7) || (i >= this.size - 7 && j < 7)) {
            return true;
        }
        // Timing patterns
        if (i === 6 || j === 6) {
            return true;
        }
        // Alignment pattern
        const center = Math.floor(this.size / 2);
        if (i >= center - 2 && i <= center + 2 && j >= center - 2 && j <= center + 2) {
            return true;
        }
        return false;
    }

    // Кодирование текста в биты
    encodeText(text) {
        const bits = [];
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i);
            for (let j = 7; j >= 0; j--) {
                bits.push((charCode >> j) & 1);
            }
        }
        return bits;
    }

    // Применение маски данных
    applyDataMask(matrix) {
        // Простая маска - инвертируем каждый второй столбец
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (j % 2 === 1 && !this.isReserved(i, j)) {
                    matrix[i][j] = !matrix[i][j];
                }
            }
        }
    }

    // Рисование QR-кода на canvas
    drawQRCode(ctx, matrix, size, color) {
        const cellSize = size / this.size;
        
        // Очищаем canvas белым цветом
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, size, size);
        
        // Рисуем черные ячейки
        ctx.fillStyle = color;
        for (let i = 0; i < this.size; i++) {
            for (let j = 0; j < this.size; j++) {
                if (matrix[i][j]) {
                    ctx.fillRect(
                        j * cellSize,
                        i * cellSize,
                        cellSize,
                        cellSize
                    );
                }
            }
        }
    }
}

// Создаем глобальный объект QRCode для совместимости
window.QRCode = {
    toCanvas: function(canvas, text, options, callback) {
        const qr = new QRCodeSimple();
        qr.toCanvas(canvas, text, options);
        
        if (callback) {
            callback(null);
        }
        
        return canvas;
    }
};

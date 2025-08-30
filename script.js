// DOM элементы
const textInput = document.getElementById('text-input');
const generateBtn = document.getElementById('generate-btn');
const qrSize = document.getElementById('qr-size');
const qrColor = document.getElementById('qr-color');
const resultSection = document.getElementById('result-section');
const qrCanvas = document.getElementById('qr-canvas');
const downloadBtn = document.getElementById('download-btn');
const copyBtn = document.getElementById('copy-btn');

// Excel элементы
const excelUploadArea = document.getElementById('excel-upload-area');
const excelFileInput = document.getElementById('excel-file-input');
const selectFileBtn = document.getElementById('select-file-btn');
const excelOptions = document.getElementById('excel-options');
const maxRowsSelect = document.getElementById('max-rows');
const excelQrSize = document.getElementById('excel-qr-size');
const excelQrColor = document.getElementById('excel-qr-color');
const processExcelBtn = document.getElementById('process-excel-btn');
const excelProgress = document.getElementById('excel-progress');
const progressFill = document.getElementById('progress-fill');
const progressText = document.getElementById('progress-text');

// Multiple results элементы
const multipleResultsSection = document.getElementById('multiple-results-section');
const totalQrCodes = document.getElementById('total-qr-codes');
const totalRows = document.getElementById('total-rows');
const qrGrid = document.getElementById('qr-grid');
const downloadAllBtn = document.getElementById('download-all-btn');

// Состояние приложения
let currentQRCode = null;
let excelData = null;
let generatedQRCodes = [];

// Инициализация приложения
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM загружен, проверяем библиотеки...');
    
    // Проверяем загрузку библиотеки qrcode.js
    if (typeof QRCode === 'undefined') {
        console.error('Библиотека qrcode.js не загружена!');
        showNotification('Ошибка: библиотека qrcode.js не загружена. Попробуйте обновить страницу.', 'error');
        
        // Показываем кнопку для перезагрузки
        const reloadBtn = document.createElement('button');
        reloadBtn.textContent = '🔄 Обновить страницу';
        reloadBtn.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            padding: 16px 32px;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 12px;
            font-size: 1.1rem;
            cursor: pointer;
            z-index: 10000;
        `;
        reloadBtn.onclick = () => location.reload();
        document.body.appendChild(reloadBtn);
        return;
    }
    
    console.log('qrcode.js загружен успешно:', typeof QRCode);
    console.log('Доступные уровни коррекции:', {
        L: QRCode.CorrectLevel.L,
        M: QRCode.CorrectLevel.M,
        Q: QRCode.CorrectLevel.Q,
        H: QRCode.CorrectLevel.H
    });
    
    // Проверяем загрузку библиотеки XLSX
    if (typeof XLSX === 'undefined') {
        console.warn('XLSX библиотека не загружена - Excel функциональность недоступна');
    } else {
        console.log('XLSX библиотека загружена успешно:', typeof XLSX);
        console.log('Доступные форматы:', XLSX.SSF ? 'SSF' : 'нет SSF');
    }
    
    // Проверяем загрузку библиотеки JSZip
    if (typeof JSZip === 'undefined') {
        console.warn('JSZip библиотека не загружена - ZIP архивы недоступны');
    } else {
        console.log('JSZip библиотека загружена успешно:', typeof JSZip);
    }
    
    // Добавляем обработчики событий для одиночного QR-кода
    generateBtn.addEventListener('click', generateQRCode);
    textInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter' && e.ctrlKey) {
            generateQRCode();
        }
    });
    
    // Добавляем обработчик для изменения текста
    textInput.addEventListener('input', function() {
        // Очищаем предыдущий QR-код при изменении текста
        if (currentQRCode) {
            currentQRCode = null;
            if (qrCanvas) {
                const ctx = qrCanvas.getContext('2d');
                ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
            }
            resultSection.style.display = 'none';
        }
    });
    
    // Добавляем обработчики для автоматического обновления при изменении параметров
    qrSize.addEventListener('change', function() {
        if (currentQRCode && textInput.value.trim()) {
            console.log('Размер изменен, перегенерируем QR-код...');
            generateQRCode();
        }
    });
    
    qrColor.addEventListener('change', function() {
        if (currentQRCode && textInput.value.trim()) {
            console.log('Цвет изменен, перегенерируем QR-код...');
            generateQRCode();
        }
    });
    
    document.getElementById('qr-error-correction').addEventListener('change', function() {
        if (currentQRCode && textInput.value.trim()) {
            console.log('Уровень коррекции изменен, перегенерируем QR-код...');
            generateQRCode();
        }
    });
    
    downloadBtn.addEventListener('click', downloadQRCode);
    copyBtn.addEventListener('click', copyQRCode);
    
    // Добавляем обработчики событий для Excel файлов
    selectFileBtn.addEventListener('click', () => excelFileInput.click());
    excelFileInput.addEventListener('change', handleFileSelect);
    processExcelBtn.addEventListener('click', processExcelFile);
    
    // Добавляем обработчики для Excel опций
    document.getElementById('rows-per-qr').addEventListener('change', updateExcelPreview);
    maxRowsSelect.addEventListener('change', updateExcelPreview);
    
    // Добавляем drag & drop для Excel файлов
    setupDragAndDrop();
    
    // Добавляем анимацию для кнопки генерации
    generateBtn.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-2px) scale(1.02)';
    });
    
    generateBtn.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1)';
    });
    
    // Добавляем placeholder с примером
    textInput.addEventListener('focus', function() {
        if (this.value === '') {
            this.placeholder = 'Например: https://www.google.com или "Привет, мир!"';
        }
    });
    
    textInput.addEventListener('blur', function() {
        this.placeholder = 'Введите текст, ссылку или любой контент для генерации QR-кода...';
    });
    
    console.log('Все обработчики событий добавлены');
});

// Настройка drag & drop
function setupDragAndDrop() {
    excelUploadArea.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('dragover');
    });
    
    excelUploadArea.addEventListener('dragleave', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
    });
    
    excelUploadArea.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFile(files[0]);
        }
    });
}

// Обработка выбора файла
function handleFileSelect(e) {
    const file = e.target.files[0];
    if (file) {
        handleFile(file);
    }
}

// Обработка файла
function handleFile(file) {
    console.log('Обрабатываем файл:', file.name, 'размер:', file.size);
    
    // Проверяем расширение файла
    if (!file.name.match(/\.(xlsx|xls|csv)$/)) {
        showNotification('Пожалуйста, выберите Excel файл (.xlsx, .xls) или CSV файл (.csv)', 'error');
        return;
    }
    
    // Проверяем, что библиотека XLSX загружена
    if (typeof XLSX === 'undefined') {
        showNotification('Ошибка: библиотека для чтения Excel файлов не загружена. Попробуйте обновить страницу.', 'error');
        return;
    }
    
    const reader = new FileReader();
    
    reader.onload = function(e) {
        try {
            console.log('Файл прочитан, начинаем обработку...');
            
            let workbook, firstSheet, jsonData;
            
            if (file.name.endsWith('.csv')) {
                // Обработка CSV файла
                const csvText = e.target.result;
                console.log('CSV текст:', csvText.substring(0, 200) + '...');
                
                // Создаем временный div для XLSX
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = csvText;
                document.body.appendChild(tempDiv);
                
                // Конвертируем CSV в JSON
                jsonData = XLSX.utils.sheet_to_json(
                    XLSX.utils.aoa_to_sheet(
                        csvText.split('\n').map(row => row.split(','))
                    ), 
                    { header: 1 }
                );
                
                document.body.removeChild(tempDiv);
            } else {
                // Обработка Excel файла
                const data = new Uint8Array(e.target.result);
                console.log('Excel данные загружены, размер:', data.length);
                
                workbook = XLSX.read(data, { 
                    type: 'array',
                    cellDates: true,
                    cellNF: false,
                    cellText: false
                });
                
                console.log('Workbook создан, листы:', workbook.SheetNames);
                
                firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                if (!firstSheet) {
                    throw new Error('Первый лист не найден в файле');
                }
                
                console.log('Первый лист загружен, диапазон:', firstSheet['!ref']);
                
                jsonData = XLSX.utils.sheet_to_json(firstSheet, { 
                    header: 1,
                    defval: '',
                    blankrows: false
                });
            }
            
            console.log('JSON данные получены, строк:', jsonData.length);
            console.log('Первые 3 строки:', jsonData.slice(0, 3));
            
            if (!jsonData || jsonData.length === 0) {
                showNotification('Файл пуст или не содержит данных', 'error');
                return;
            }
            
            // Фильтруем пустые строки
            jsonData = jsonData.filter(row => 
                row && row.length > 0 && 
                row.some(cell => cell !== '' && cell !== null && cell !== undefined)
            );
            
            if (jsonData.length === 0) {
                showNotification('Файл не содержит непустых строк', 'error');
                return;
            }
            
            excelData = jsonData;
            
            // Показываем информацию о файле и настройках
            const rowsPerQr = parseInt(document.getElementById('rows-per-qr').value);
            const maxRows = parseInt(maxRowsSelect.value);
            const estimatedQRCodes = Math.ceil(Math.min(excelData.length, maxRows) / rowsPerQr);
            
            showNotification(`Файл загружен! Найдено ${excelData.length} строк`, 'success');
            excelOptions.style.display = 'grid';
            
            // Обновляем предварительный расчет
            updateExcelPreview();
            
            console.log('Excel файл успешно обработан, данные сохранены');
            
        } catch (error) {
            console.error('Ошибка чтения файла:', error);
            console.error('Детали ошибки:', error.message, error.stack);
            showNotification('Ошибка при чтении файла: ' + error.message, 'error');
        }
    };
    
    reader.onerror = function(error) {
        console.error('Ошибка чтения файла:', error);
        showNotification('Ошибка при чтении файла', 'error');
    };
    
    // Читаем файл как ArrayBuffer для Excel или как текст для CSV
    if (file.name.endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
    } else {
        reader.readAsArrayBuffer(file);
    }
}

// Обработка Excel файла
async function processExcelFile() {
    if (!excelData) {
        showNotification('Сначала загрузите Excel файл', 'warning');
        return;
    }
    
    // Проверяем, что все необходимые элементы существуют
    const rowsPerQrElement = document.getElementById('rows-per-qr');
    const maxRowsElement = document.getElementById('max-rows');
    const excelQrSizeElement = document.getElementById('excel-qr-size');
    const excelQrColorElement = document.getElementById('excel-qr-color');
    const errorCorrectionElement = document.getElementById('qr-error-correction');
    
    if (!rowsPerQrElement || !maxRowsElement || !excelQrSizeElement || !excelQrColorElement || !errorCorrectionElement) {
        showNotification('Ошибка: не все необходимые элементы настроек найдены', 'error');
        return;
    }
    
    const rowsPerQr = parseInt(rowsPerQrElement.value);
    const maxRows = parseInt(maxRowsElement.value);
    const size = parseInt(excelQrSizeElement.value);
    const color = excelQrColorElement.value;
    const errorCorrection = errorCorrectionElement.value;
    
    // Проверяем ограничения
    if (rowsPerQr > maxRows) {
        showNotification(`Ошибка: строк в QR-коде (${rowsPerQr}) не может быть больше общего лимита (${maxRows})`, 'error');
        return;
    }
    
    // Предупреждения для больших лимитов
    if (maxRows >= 5000) {
        const confirmLargeFile = confirm(`⚠️ Внимание! Вы выбрали большой лимит: ${maxRows} строк.\n\nЭто может занять много времени и потребовать много памяти.\n\nПродолжить?`);
        if (!confirmLargeFile) {
            return;
        }
        
        // Показываем дополнительное предупреждение
        showNotification(`Обработка большого файла (${maxRows} строк). Это может занять несколько минут.`, 'warning');
    }
    
    try {
        // Проверяем элементы прогресса
        if (!excelProgress || !progressFill || !progressText) {
            showNotification('Ошибка: элементы прогресса не найдены', 'error');
            return;
        }
        
        processExcelBtn.disabled = true;
        excelProgress.style.display = 'block';
        
        // Проверяем секции результатов
        if (!resultSection || !multipleResultsSection) {
            console.warn('Секции результатов не найдены, продолжаем обработку...');
        } else {
            // Скрываем одиночный результат
            resultSection.style.display = 'none';
            multipleResultsSection.style.display = 'none';
        }
        
        console.log(`Начинаем обработку Excel файла:`);
        console.log(`- Строк в одном QR-коде: ${rowsPerQr}`);
        console.log(`- Общий лимит строк: ${maxRows}`);
        console.log(`- Всего строк в файле: ${excelData.length}`);
        
        // Разбиваем данные на группы по rowsPerQr
        const dataGroups = [];
        for (let i = 0; i < Math.min(excelData.length, maxRows); i += rowsPerQr) {
            dataGroups.push(excelData.slice(i, i + rowsPerQr));
        }
        
        console.log(`Создано ${dataGroups.length} групп для QR-кодов`);
        
        generatedQRCodes = [];
        let processedGroups = 0;
        
        // Обрабатываем каждую группу
        for (let i = 0; i < dataGroups.length; i++) {
            const group = dataGroups[i];
            const groupText = group.map(row => row.join(' | ')).join('\n');
            
            console.log(`Обрабатываем группу ${i + 1}/${dataGroups.length}: строки ${i * rowsPerQr + 1}-${Math.min((i + 1) * rowsPerQr, excelData.length)}`);
            
            // Генерируем настоящий QR-код для группы
            const qrCodeDataURL = await generateRealQRCode(groupText, size, color, errorCorrection);
            generatedQRCodes.push({
                dataURL: qrCodeDataURL,
                rows: group.length,
                startRow: i * rowsPerQr + 1,
                endRow: Math.min((i + 1) * rowsPerQr, excelData.length)
            });
            
            // Обновляем прогресс
            processedGroups++;
            const progress = (processedGroups / dataGroups.length) * 100;
            progressFill.style.width = progress + '%';
            progressText.textContent = `Обработано ${processedGroups} из ${dataGroups.length} групп...`;
            
            // Адаптивная задержка для больших файлов
            if (maxRows >= 5000) {
                // Для больших файлов - минимальная задержка для скорости
                await new Promise(resolve => setTimeout(resolve, 10));
            } else if (maxRows >= 1000) {
                // Для средних файлов - небольшая задержка
                await new Promise(resolve => setTimeout(resolve, 50));
            } else {
                // Для маленьких файлов - стандартная задержка для плавности
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        
        // Показываем результаты
        showMultipleResults(size);
        
    } catch (error) {
        console.error('Ошибка обработки Excel файла:', error);
        showNotification('Произошла ошибка при обработке файла: ' + error.message, 'error');
    } finally {
        processExcelBtn.disabled = false;
        excelProgress.style.display = 'none';
    }
}

// Показ множественных результатов
function showMultipleResults(size) {
    // Если размер не передан, получаем его из настроек
    if (!size) {
        size = parseInt(document.getElementById('excel-qr-size').value);
    }
    
    console.log('showMultipleResults вызвана с размером:', size);
    console.log('Количество QR-кодов:', generatedQRCodes.length);
    console.log('Общее количество строк:', excelData.length);
    
    // Проверяем, что все необходимые элементы существуют
    if (!totalQrCodes || !totalRows || !qrGrid || !multipleResultsSection) {
        console.error('Ошибка: не все необходимые DOM элементы найдены');
        return;
    }
    
    totalQrCodes.textContent = generatedQRCodes.length;
    totalRows.textContent = excelData.length;
    
    // Очищаем сетку
    qrGrid.innerHTML = '';
    
    // Добавляем QR-коды в сетку
    generatedQRCodes.forEach((qrCode, index) => {
        try {
            const qrItem = document.createElement('div');
            qrItem.className = 'qr-item';
            
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            // Создаем изображение для получения размеров
            const img = new Image();
            img.onload = function() {
                canvas.width = img.width;
                canvas.height = img.height;
                ctx.drawImage(img, 0, 0);
            };
            img.src = qrCode.dataURL;
            
            const info = document.createElement('div');
            info.className = 'qr-item-info';
            info.innerHTML = `
                <div class="qr-range">Строки ${qrCode.startRow}-${qrCode.endRow}</div>
                <div class="qr-count">${qrCode.rows} строк</div>
                <div class="qr-size">${size}x${size}px</div>
            `;
            
            qrItem.appendChild(canvas);
            qrItem.appendChild(info);
            qrGrid.appendChild(qrItem);
            
            console.log(`QR-код ${index + 1} добавлен в сетку: строки ${qrCode.startRow}-${qrCode.endRow}, размер ${size}x${size}`);
        } catch (error) {
            console.error(`Ошибка при добавлении QR-кода ${index + 1}:`, error);
        }
    });
    
    multipleResultsSection.style.display = 'block';
    multipleResultsSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    showNotification(`Создано ${generatedQRCodes.length} QR-кодов!`, 'success');
    
    console.log('showMultipleResults завершена успешно');
}

// Скачивание всех QR-кодов
downloadAllBtn.addEventListener('click', async function() {
    if (generatedQRCodes.length === 0) {
        showNotification('Нет QR-кодов для скачивания', 'warning');
        return;
    }
    
    // Проверяем, что библиотека JSZip загружена
    if (typeof JSZip === 'undefined') {
        showNotification('Ошибка: библиотека JSZip не загружена. Попробуйте обновить страницу.', 'error');
        return;
    }
    
    try {
        this.disabled = true;
        this.innerHTML = '<span class="btn-icon">⏳</span> Создаю архив...';
        
        console.log('Начинаем создание ZIP архива...');
        console.log('Количество QR-кодов для архивации:', generatedQRCodes.length);
        
        const zip = new JSZip();
        
        // Добавляем каждый QR-код в архив
        generatedQRCodes.forEach((qrCode, index) => {
            try {
                const fileName = `qr-code-${index + 1}-rows-${qrCode.startRow}-${qrCode.endRow}.png`;
                console.log(`Добавляем в архив: ${fileName}`);
                
                // Конвертируем data URL в blob
                if (qrCode.dataURL && qrCode.dataURL.startsWith('data:image/')) {
                    const base64Data = qrCode.dataURL.split(',')[1];
                    if (base64Data) {
                        zip.file(fileName, base64Data, { base64: true });
                        console.log(`Файл ${fileName} добавлен в архив`);
                    } else {
                        console.warn(`Пропускаем ${fileName}: пустые данные`);
                    }
                } else {
                    console.warn(`Пропускаем ${fileName}: неверный формат data URL`);
                }
            } catch (fileError) {
                console.error(`Ошибка при добавлении файла ${index + 1}:`, fileError);
            }
        });
        
        console.log('Все файлы добавлены в архив, генерируем ZIP...');
        
        // Создаем и скачиваем архив
        const zipBlob = await zip.generateAsync({ 
            type: 'blob',
            compression: 'DEFLATE',
            compressionOptions: { level: 6 }
        });
        
        console.log('ZIP архив создан, размер:', zipBlob.size, 'байт');
        
        // Создаем ссылку для скачивания
        const link = document.createElement('a');
        link.href = URL.createObjectURL(zipBlob);
        link.download = `qr-codes-${Date.now()}.zip`;
        
        // Добавляем ссылку в DOM и кликаем по ней
        document.body.appendChild(link);
        link.click();
        
        // Очищаем ссылку
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(link.href);
        }, 100);
        
        showNotification(`Все QR-коды успешно скачаны! Размер архива: ${(zipBlob.size / 1024).toFixed(1)} КБ`, 'success');
        
    } catch (error) {
        console.error('Ошибка создания архива:', error);
        console.error('Детали ошибки:', error.message, error.stack);
        showNotification('Ошибка при создании архива: ' + error.message, 'error');
    } finally {
        this.disabled = false;
        this.innerHTML = '<span class="btn-icon">📦</span> Скачать все QR-коды (ZIP)';
    }
});

// Функция генерации QR-кода
async function generateQRCode() {
    console.log('Начинаем генерацию QR-кода...');
    
    const text = textInput.value.trim();
    
    if (!text) {
        showNotification('Пожалуйста, введите текст или ссылку', 'error');
        textInput.focus();
        return;
    }
    
    try {
        // Показываем индикатор загрузки
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<span class="btn-icon">⏳</span> Генерирую...';
        
        const size = parseInt(qrSize.value);
        const color = qrColor.value;
        const errorCorrection = document.getElementById('qr-error-correction').value;
        
        console.log('Параметры генерации:', { text, size, color, errorCorrection });
        
        // Очищаем предыдущий результат
        if (qrCanvas) {
            const ctx = qrCanvas.getContext('2d');
            ctx.clearRect(0, 0, qrCanvas.width, qrCanvas.height);
        }
        
        // Генерируем настоящий QR-код
        const qrCodeDataURL = await generateRealQRCode(text, size, color, errorCorrection);
        
        console.log('QR-код сгенерирован, длина data URL:', qrCodeDataURL.length);
        console.log('Первые 100 символов:', qrCodeDataURL.substring(0, 100));
        
        // Отображаем результат
        displayQRCode(qrCodeDataURL);
        currentQRCode = qrCodeDataURL;
        
        // Показываем уведомление об успехе
        showNotification('QR-код успешно сгенерирован!', 'success');
        
        // Плавно прокручиваем к результату
        resultSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
        
    } catch (error) {
        console.error('Ошибка генерации QR-кода:', error);
        showNotification('Произошла ошибка при генерации QR-кода: ' + error.message, 'error');
    } finally {
        // Восстанавливаем кнопку
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<span class="btn-icon">⚡</span> Сгенерировать';
    }
}

// Генерация QR-кода с помощью библиотеки qrcode.js
async function generateRealQRCode(text, size, color, errorCorrection = 'M') {
    return new Promise((resolve, reject) => {
        try {
            console.log('Создаем QR-код с помощью библиотеки qrcode.js...');
            console.log('Параметры:', { text, size, color, errorCorrection });
            
            // Проверяем, что библиотека qrcode.js загружена
            if (typeof QRCode === 'undefined') {
                reject(new Error('Библиотека qrcode.js не загружена'));
                return;
            }
            
            // Создаем временный div для QR-кода
            const tempDiv = document.createElement('div');
            tempDiv.style.position = 'absolute';
            tempDiv.style.left = '-9999px';
            tempDiv.style.top = '-9999px';
            document.body.appendChild(tempDiv);
            
            try {
                // Создаем QR-код с помощью qrcode.js
                const qrCode = new QRCode(tempDiv, {
                    text: text,
                    width: size,
                    height: size,
                    colorDark: color,
                    colorLight: '#FFFFFF',
                    correctLevel: getCorrectLevel(errorCorrection),
                    margin: 4
                });
                
                // Ждем немного, чтобы QR-код сгенерировался
                setTimeout(() => {
                    try {
                        // Получаем canvas из сгенерированного QR-кода
                        const canvas = tempDiv.querySelector('canvas');
                        if (canvas) {
                            // Конвертируем canvas в data URL
                            const dataURL = canvas.toDataURL('image/png');
                            console.log('QR-код успешно создан с помощью qrcode.js, длина data URL:', dataURL.length);
                            
                            // Очищаем временный div
                            document.body.removeChild(tempDiv);
                            
                            resolve(dataURL);
                        } else {
                            throw new Error('Canvas не найден в сгенерированном QR-коде');
                        }
                    } catch (error) {
                        document.body.removeChild(tempDiv);
                        reject(error);
                    }
                }, 100);
                
            } catch (error) {
                document.body.removeChild(tempDiv);
                reject(error);
            }
            
        } catch (error) {
            console.error('Ошибка в generateRealQRCode:', error);
            reject(new Error('Не удалось сгенерировать QR-код: ' + error.message));
        }
    });
}

// Функция для получения уровня коррекции ошибок qrcode.js
function getCorrectLevel(level) {
    switch (level) {
        case 'L': return QRCode.CorrectLevel.L; // 7%
        case 'M': return QRCode.CorrectLevel.M; // 15%
        case 'Q': return QRCode.CorrectLevel.Q; // 25%
        case 'H': return QRCode.CorrectLevel.H; // 30%
        default: return QRCode.CorrectLevel.M;
    }
}

// Эта функция больше не нужна, так как мы используем только qrcode.js

// Функция для конвертации hex цвета в RGB
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : { r: 0, g: 0, b: 0 };
}

// Функция отображения QR-кода
function displayQRCode(dataURL) {
    console.log('Отображаем QR-код...');
    
    // Создаем временное изображение для получения размеров
    const img = new Image();
    img.onload = function() {
        console.log('Изображение загружено, размеры:', img.width, 'x', img.height);
        
        // Устанавливаем размеры canvas
        qrCanvas.width = img.width;
        qrCanvas.height = img.height;
        
        // Рисуем изображение на canvas
        const ctx = qrCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        
        // Показываем секцию с результатом
        resultSection.style.display = 'block';
        
        // Добавляем анимацию появления
        resultSection.style.opacity = '0';
        resultSection.style.transform = 'translateY(20px)';
        
        setTimeout(() => {
            resultSection.style.transition = 'all 0.5s ease';
            resultSection.style.opacity = '1';
            resultSection.style.transform = 'translateY(0)';
        }, 10);
        
        console.log('QR-код отображен успешно');
    };
    
    img.onerror = function() {
        console.error('Ошибка загрузки изображения');
        showNotification('Ошибка при отображении QR-кода', 'error');
    };
    
    img.src = dataURL;
}

// Функция скачивания QR-кода
function downloadQRCode() {
    if (!currentQRCode) {
        showNotification('Сначала сгенерируйте QR-код', 'warning');
        return;
    }
    
    try {
        // Создаем ссылку для скачивания
        const link = document.createElement('a');
        link.download = `qr-code-${Date.now()}.png`;
        link.href = currentQRCode;
        
        // Добавляем ссылку в DOM и кликаем по ней
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        
        showNotification('QR-код успешно скачан!', 'success');
        
        // Анимация кнопки скачивания
        downloadBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            downloadBtn.style.transform = 'scale(1)';
        }, 150);
        
    } catch (error) {
        console.error('Ошибка скачивания:', error);
        showNotification('Ошибка при скачивании файла', 'error');
    }
}

// Функция копирования QR-кода в буфер обмена
async function copyQRCode() {
    if (!currentQRCode) {
        showNotification('Сначала сгенерируйте QR-код', 'warning');
        return;
    }
    
    try {
        // Конвертируем data URL в blob
        const response = await fetch(currentQRCode);
        const blob = await response.blob();
        
        // Копируем в буфер обмена
        await navigator.clipboard.write([
            new ClipboardItem({
                [blob.type]: blob
            })
        ]);
        
        showNotification('QR-код скопирован в буфер обмена!', 'success');
        
        // Анимация кнопки копирования
        copyBtn.style.transform = 'scale(0.95)';
        setTimeout(() => {
            copyBtn.style.transform = 'scale(1)';
        }, 150);
        
    } catch (error) {
        console.error('Ошибка копирования:', error);
        showNotification('Не удалось скопировать QR-код', 'error');
    }
}

// Функция показа уведомлений
function showNotification(message, type = 'info') {
    console.log('Показываем уведомление:', type, message);
    
    // Удаляем существующие уведомления
    const existingNotifications = document.querySelectorAll('.notification');
    existingNotifications.forEach(notification => notification.remove());
    
    // Создаем новое уведомление
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <span class="notification-icon">${getNotificationIcon(type)}</span>
            <span class="notification-message">${message}</span>
        </div>
    `;
    
    // Добавляем стили
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 25px rgba(0, 0, 0, 0.15);
        z-index: 1000;
        transform: translateX(100%);
        transition: transform 0.3s ease;
        max-width: 350px;
        font-weight: 500;
    `;
    
    // Добавляем в DOM
    document.body.appendChild(notification);
    
    // Показываем уведомление
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 10);
    
    // Автоматически скрываем через 4 секунды
    setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// Функция получения иконки для уведомления
function getNotificationIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

// Функция получения цвета для уведомления
function getNotificationColor(type) {
    const colors = {
        success: '#28a745',
        error: '#dc3545',
        warning: '#ffc107',
        info: '#17a2b8'
    };
    return colors[type] || colors.info;
}

// Добавляем CSS для уведомлений
const notificationStyles = document.createElement('style');
notificationStyles.textContent = `
    .notification-content {
        display: flex;
        align-items: center;
        gap: 12px;
    }
    
    .notification-icon {
        font-size: 1.2rem;
    }
    
    .notification-message {
        flex: 1;
    }
    
    @media (max-width: 480px) {
        .notification {
            right: 10px;
            left: 10px;
            max-width: none;
        }
    }
`;
document.head.appendChild(notificationStyles);

// Добавляем обработчик для Enter в textarea
textInput.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        generateQRCode();
    }
});

// Добавляем валидацию URL
function isValidURL(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

// Добавляем подсказки при вводе
textInput.addEventListener('input', function() {
    const text = this.value.trim();
    
    if (text && isValidURL(text)) {
        this.style.borderColor = '#28a745';
        this.style.background = '#f8fff9';
    } else if (text) {
        this.style.borderColor = '#667eea';
        this.style.background = '#f8f9fa';
    } else {
        this.style.borderColor = '#e1e5e9';
        this.style.background = '#f8f9fa';
    }
});

// Добавляем анимацию для feature cards
const featureCards = document.querySelectorAll('.feature-card');
featureCards.forEach((card, index) => {
    card.style.animationDelay = `${index * 0.1}s`;
    card.style.animation = 'fadeInUp 0.6s ease forwards';
    card.style.opacity = '0';
    card.style.transform = 'translateY(30px)';
});

// Функция обновления предварительного расчета для Excel
function updateExcelPreview() {
    if (excelData && excelData.length > 0) {
        const rowsPerQr = parseInt(document.getElementById('rows-per-qr').value);
        const maxRows = parseInt(maxRowsSelect.value);
        const estimatedQRCodes = Math.ceil(Math.min(excelData.length, maxRows) / rowsPerQr);
        
        // Обновляем информацию о файле
        const fileInfo = document.getElementById('excel-file-info');
        if (fileInfo) {
            let infoText = `Найдено ${excelData.length} строк. Будет создано примерно ${estimatedQRCodes} QR-кодов`;
            
            // Добавляем предупреждения для больших лимитов
            if (maxRows >= 50000) {
                infoText += ` ⚠️ Очень большой файл (${maxRows} строк)`;
            } else if (maxRows >= 10000) {
                infoText += ` ⚠️ Большой файл (${maxRows} строк)`;
            } else if (maxRows >= 5000) {
                infoText += ` ⚠️ Средний файл (${maxRows} строк)`;
            }
            
            fileInfo.textContent = infoText;
            
            // Добавляем цветовое кодирование для больших файлов
            if (maxRows >= 10000) {
                fileInfo.style.color = '#dc3545'; // Красный для очень больших
            } else if (maxRows >= 5000) {
                fileInfo.style.color = '#ffc107'; // Желтый для больших
            } else {
                fileInfo.style.color = '#6c757d'; // Обычный цвет
            }
        }
        
        console.log(`Предварительный расчет обновлен: ${estimatedQRCodes} QR-кодов из ${Math.min(excelData.length, maxRows)} строк`);
    }
}

// Добавляем CSS анимацию для feature cards
const featureAnimationStyles = document.createElement('style');
featureAnimationStyles.textContent = `
    @keyframes fadeInUp {
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
    
    .feature-card {
        animation: fadeInUp 0.6s ease forwards;
    }
`;
document.head.appendChild(featureAnimationStyles);

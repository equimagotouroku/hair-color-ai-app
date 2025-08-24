// グローバル変数
let colorDatabase = {};
let currentMode = 'recipe';
let currentBrand = 'qualucia';
let selectedLevel = 10;
let currentFinalHex = '';

// レベル調整テーブル
const LEVEL_DELTA = {
    3: -0.22, 4: -0.18, 5: -0.14, 6: -0.10, 7: -0.06,
    8: -0.03, 9: -0.01, 10: 0.00, 11: 0.03, 12: 0.06, 
    13: 0.09, 14: 0.12
};

// 薬剤量のデフォルト値
const defaultAmounts = {
    short: 80,
    medium: 100,
    long: 120,
    superlong: 150
};

// 初期化
document.addEventListener('DOMContentLoaded', async function() {
    console.log('アプリケーション初期化開始');
    await initializeApp();
    setupEventListeners();
    updateAmounts();
    console.log('アプリケーション初期化完了');
});

// アプリケーション初期化
async function initializeApp() {
    try {
        // JSONデータベースの読み込み
        const response = await fetch('color-database.json');
        colorDatabase = await response.json();
        console.log('カラーデータを読み込みました');
        
        // プリセットカラーの初期化
        initializePresetColors();
        
        // デフォルト設定
        updateIngredients();
        loadQuickRecipe('ash');
        
    } catch (error) {
        console.error('初期化エラー:', error);
        showNotification('データベースの読み込みに失敗しました。', 'error');
    }
}

// イベントリスナーの設定
function setupEventListeners() {
    // ブランド選択
    const brandSelector = document.getElementById('brand-selector');
    if (brandSelector) {
        brandSelector.addEventListener('click', (e) => {
            if (e.target.closest('.brand-button')) {
                brandSelector.querySelectorAll('.brand-button').forEach(btn => btn.classList.remove('active'));
                e.target.closest('.brand-button').classList.add('active');
                currentBrand = e.target.closest('.brand-button').dataset.brand;
                updateIngredients();
            }
        });
    }

    // モード切替
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const mode = this.dataset.mode;
            switchMode(mode);
        });
    });

    // レベル選択
    document.querySelectorAll('.level-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const parentSelector = this.closest('.level-selector');
            parentSelector.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            selectedLevel = parseInt(this.dataset.level);
            updateIngredients();
        });
    });

    // HEX入力
    const hexInput = document.getElementById('hexInput');
    if (hexInput) {
        hexInput.addEventListener('input', updateHexColor);
    }
}

// モード切替
function switchMode(mode) {
    currentMode = mode;
    
    // ボタンの状態を更新
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.dataset.mode === mode) {
            btn.classList.add('active');
        }
    });
    
    // モード表示を切り替え
    const recipeMode = document.getElementById('recipeMode');
    const hexMode = document.getElementById('hexMode');
    
    if (mode === 'recipe') {
        recipeMode.classList.remove('hidden');
        hexMode.classList.add('hidden');
    } else {
        recipeMode.classList.add('hidden');
        hexMode.classList.remove('hidden');
    }
}

// クイックレシピ読み込み
function loadQuickRecipe(recipeName) {
    console.log('クイックレシピ読み込み:', recipeName);
    
    let ingredients = [];
    let hexColor, colorName;
    
    switch(recipeName) {
        case 'ash':
            ingredients = [
                { code: '10GR', ratio: 60 },
                { code: '9SB', ratio: 40 }
            ];
            hexColor = '#B39C86';
            colorName = 'アッシュベージュ';
            break;
        case 'pink':
            ingredients = [
                { code: '3-7', ratio: 70 },
                { code: '3-8', ratio: 30 }
            ];
            hexColor = '#D4B0A8';
            colorName = 'ピンクベージュ';
            break;
        case 'silver':
            ingredients = [
                { code: '2-2', ratio: 50 },
                { code: '1-4', ratio: 30 },
                { code: '1-2', ratio: 20 }
            ];
            hexColor = '#C5B8B0';
            colorName = 'シルバーアッシュ';
            break;
    }
    
    // 配合を設定
    setIngredients(ingredients);
    
    // 最終色を更新
    updateFinalColor(hexColor, colorName);
    
    showNotification(`${colorName}レシピを読み込みました`, 'success');
}

// 配合を設定
function setIngredients(ingredients) {
    const formulaBuilder = document.getElementById('formulaBuilder');
    const rows = formulaBuilder.querySelectorAll('.ingredient-row');
    
    ingredients.forEach((ingredient, index) => {
        if (rows[index]) {
            const codeInput = rows[index].querySelector('.code-input');
            const ratioInput = rows[index].querySelector('.ratio-input');
            
            if (codeInput) codeInput.value = ingredient.code;
            if (ratioInput) ratioInput.value = ingredient.ratio;
            
            validateCode(codeInput);
        }
    });
    
    updateTotalRatio();
}

// 配合をクリア
function clearIngredients() {
    console.log('配合をクリア');
    const formulaBuilder = document.getElementById('formulaBuilder');
    const rows = formulaBuilder.querySelectorAll('.ingredient-row');
    
    rows.forEach(row => {
        const codeInput = row.querySelector('.code-input');
        const ratioInput = row.querySelector('.ratio-input');
        const colorPreview = row.querySelector('.color-preview');
        
        if (codeInput) codeInput.value = '';
        if (ratioInput) ratioInput.value = 50;
        if (colorPreview) colorPreview.style.backgroundColor = '#f7fafc';
        
        codeInput.classList.remove('valid', 'invalid');
    });
    
    updateTotalRatio();
    updateFinalColor('#f5f5f5', '配合またはHEXを指定してください');
    
    showNotification('配合をクリアしました', 'success');
}

// 薬剤を追加
function addIngredient() {
    const formulaBuilder = document.getElementById('formulaBuilder');
    const newRow = document.createElement('div');
    newRow.className = 'ingredient-row';
    newRow.innerHTML = `
        <input type="text" class="code-input" placeholder="薬剤コード (例: 10GR)" maxlength="6" onchange="validateCode(this)">
        <input type="number" class="ratio-input" value="50" min="1" max="100" onchange="updateTotalRatio()">
        <div class="color-preview"></div>
        <button class="remove-btn" onclick="removeIngredient(this)">×</button>
    `;
    
    formulaBuilder.appendChild(newRow);
    showNotification('薬剤を追加しました', 'success');
}

// 薬剤を削除
function removeIngredient(button) {
    const row = button.closest('.ingredient-row');
    const formulaBuilder = document.getElementById('formulaBuilder');
    const rows = formulaBuilder.querySelectorAll('.ingredient-row');
    
    if (rows.length > 1) {
        row.remove();
        updateTotalRatio();
        showNotification('薬剤を削除しました', 'success');
    } else {
        showNotification('最低1つの薬剤が必要です', 'error');
    }
}

// コード検証
function validateCode(input) {
    const code = input.value.toUpperCase();
    input.value = code;
    
    // カラーデータベースから検索
    let isValid = false;
    let colorHex = '#f7fafc';
    
    if (colorDatabase.qualucia && colorDatabase.qualucia.colors[code]) {
        isValid = true;
        colorHex = colorDatabase.qualucia.colors[code].hex;
    } else if (colorDatabase.blcolor && colorDatabase.blcolor.colors[code]) {
        isValid = true;
        colorHex = colorDatabase.blcolor.colors[code].hex;
    }
    
    // クラスを更新
    input.classList.remove('valid', 'invalid');
    if (code === '') {
        // 空の場合は何もしない
    } else if (isValid) {
        input.classList.add('valid');
    } else {
        input.classList.add('invalid');
    }
    
    // 色プレビューを更新
    const row = input.closest('.ingredient-row');
    const colorPreview = row.querySelector('.color-preview');
    if (colorPreview) {
        colorPreview.style.backgroundColor = colorHex;
    }
    
    // 配合計算を実行
    calculateBlend();
}

// 合計比率を更新
function updateTotalRatio() {
    const ratioInputs = document.querySelectorAll('.ratio-input');
    let total = 0;
    
    ratioInputs.forEach(input => {
        total += parseInt(input.value) || 0;
    });
    
    const ratioTotal = document.getElementById('ratioTotal');
    if (ratioTotal) {
        ratioTotal.textContent = `合計比率: ${total}%`;
        
        if (total === 100) {
            ratioTotal.className = 'mt-2 text-sm text-green-600';
        } else {
            ratioTotal.className = 'mt-2 text-sm text-red-600';
        }
    }
    
    // 配合計算を実行
    calculateBlend();
}

// 配合計算
function calculateBlend() {
    const codeInputs = document.querySelectorAll('.code-input');
    const ratioInputs = document.querySelectorAll('.ratio-input');
    
    let totalRatio = 0;
    let blendedR = 0, blendedG = 0, blendedB = 0;
    let validIngredients = 0;
    
    codeInputs.forEach((codeInput, index) => {
        const code = codeInput.value.toUpperCase();
        const ratio = parseInt(ratioInputs[index].value) || 0;
        
        if (code && ratio > 0) {
            let colorData = null;
            
            // カラーデータベースから検索
            if (colorDatabase.qualucia && colorDatabase.qualucia.colors[code]) {
                colorData = colorDatabase.qualucia.colors[code];
            } else if (colorDatabase.blcolor && colorDatabase.blcolor.colors[code]) {
                colorData = colorDatabase.blcolor.colors[code];
            }
            
            if (colorData && colorData.rgb) {
                const [r, g, b] = colorData.rgb;
                blendedR += r * ratio;
                blendedG += g * ratio;
                blendedB += b * ratio;
                totalRatio += ratio;
                validIngredients++;
            }
        }
    });
    
    if (validIngredients > 0 && totalRatio > 0) {
        // 平均を計算
        blendedR = Math.round(blendedR / totalRatio);
        blendedG = Math.round(blendedG / totalRatio);
        blendedB = Math.round(blendedB / totalRatio);
        
        const hexColor = rgbToHex(blendedR, blendedG, blendedB);
        updateFinalColor(hexColor, '配合計算結果');
    }
}

// RGB to HEX変換
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// 最終色更新
function updateFinalColor(hexColor, colorName = '') {
    const finalColorDiv = document.getElementById('finalColor');
    if (finalColorDiv) {
        finalColorDiv.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-20 h-20 rounded-lg border-2 border-gray-300" style="background-color: ${hexColor}"></div>
                <div>
                    <div class="text-2xl font-bold text-gray-800">${hexColor}</div>
                    <div class="text-gray-600">${colorName}</div>
                </div>
            </div>
        `;
    }
    currentFinalHex = hexColor;
}

// 薬剤量計算
function updateAmounts() {
    const hairLength = document.getElementById('hairLength');
    const totalAmount = document.getElementById('totalAmount');
    const rootRatio = document.getElementById('rootRatio');
    const endsRatio = document.getElementById('endsRatio');
    const amountResult = document.getElementById('amountResult');
    
    if (!hairLength || !totalAmount || !rootRatio || !endsRatio || !amountResult) return;
    
    const length = hairLength.value;
    const total = parseInt(totalAmount.value) || 100;
    const root = parseInt(rootRatio.value) || 60;
    const ends = parseInt(endsRatio.value) || 40;
    
    const rootAmount = Math.round(total * root / 100);
    const endsAmount = Math.round(total * ends / 100);
    
    amountResult.innerHTML = `
        <div class="text-sm">
            <div class="font-semibold text-gray-800">計算結果:</div>
            <div class="mt-1">根元: ${rootAmount}g (${root}%)</div>
            <div>毛先: ${endsAmount}g (${ends}%)</div>
            <div class="mt-2 text-xs text-gray-500">髪の長さ: ${getHairLengthText(length)}</div>
        </div>
    `;
}

// 髪の長さテキスト取得
function getHairLengthText(length) {
    const texts = {
        short: 'ショート',
        medium: 'ミディアム',
        long: 'ロング',
        superlong: 'スーパーロング'
    };
    return texts[length] || length;
}

// HEX色更新
function updateHexColor() {
    const hexInput = document.getElementById('hexInput');
    const colorPreview = document.getElementById('colorPreview');
    
    if (!hexInput || !colorPreview) return;
    
    const hexColor = hexInput.value;
    if (isValidHex(hexColor)) {
        colorPreview.style.backgroundColor = hexColor;
        updateFinalColor(hexColor, 'HEX指定色');
    }
}

// HEX検証
function isValidHex(hex) {
    return /^#[0-9A-F]{6}$/i.test(hex);
}

// プリセットカラー初期化
function initializePresetColors() {
    const presetColors = document.getElementById('presetColors');
    if (!presetColors || !colorDatabase.preset_colors) return;
    
    presetColors.innerHTML = '';
    
    Object.entries(colorDatabase.preset_colors).forEach(([hex, name]) => {
        const colorDiv = document.createElement('div');
        colorDiv.className = 'preset-color';
        colorDiv.style.backgroundColor = hex;
        colorDiv.textContent = name;
        colorDiv.onclick = () => {
            const hexInput = document.getElementById('hexInput');
            if (hexInput) {
                hexInput.value = hex;
                updateHexColor();
            }
        };
        presetColors.appendChild(colorDiv);
    });
}

// 配合更新
function updateIngredients() {
    // 配合計算を実行
    calculateBlend();
}

// AIレシピ生成
function generateRecipe() {
    const loader = document.getElementById('loader');
    const resultOutput = document.getElementById('result-output');
    
    if (loader) loader.classList.remove('hidden');
    
    // シミュレーション（実際のAI APIの代わり）
    setTimeout(() => {
        if (loader) loader.classList.add('hidden');
        
        const recipe = generateMockRecipe();
        
        if (resultOutput) {
            resultOutput.innerHTML = `
                <div class="bg-white rounded-lg p-6 shadow-lg">
                    <h3 class="text-lg font-semibold text-gray-800 mb-4">AI生成レシピ</h3>
                    <div class="space-y-4">
                        <div>
                            <h4 class="font-medium text-gray-700">配合レシピ:</h4>
                            <p class="text-gray-600">${recipe.formula}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">使用方法:</h4>
                            <p class="text-gray-600">${recipe.instructions}</p>
                        </div>
                        <div>
                            <h4 class="font-medium text-gray-700">注意事項:</h4>
                            <p class="text-gray-600">${recipe.notes}</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        showNotification('AIレシピを生成しました', 'success');
    }, 2000);
}

// モックレシピ生成
function generateMockRecipe() {
    const recipes = [
        {
            formula: "クオルシア 10GR 60% + クオルシア 9SB 40%",
            instructions: "1. 髪を洗浄し、タオルドライする\n2. 配合剤を均等に混ぜる\n3. 根元から毛先まで均等に塗布\n4. 20分間放置\n5. すすぎ、シャンプー、コンディショナー",
            notes: "・パッチテストを必ず実施してください\n・目に入らないよう注意してください\n・使用後は十分にすすいでください"
        },
        {
            formula: "BLカラー 12NN 70% + BLカラー 11SB 30%",
            instructions: "1. 髪を洗浄し、タオルドライする\n2. 配合剤を均等に混ぜる\n3. 根元から毛先まで均等に塗布\n4. 25分間放置\n5. すすぎ、シャンプー、コンディショナー",
            notes: "・パッチテストを必ず実施してください\n・目に入らないよう注意してください\n・使用後は十分にすすいでください"
        }
    ];
    
    return recipes[Math.floor(Math.random() * recipes.length)];
}

// 通知表示
function showNotification(message, type = 'success') {
    const notification = document.getElementById('notification');
    if (!notification) return;
    
    notification.textContent = message;
    notification.className = `fixed top-4 right-4 z-50 p-4 rounded-lg text-white font-bold ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
    notification.classList.remove('hidden');
    
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Service Worker登録
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js')
            .then(registration => {
                console.log('Service Worker登録成功:', registration);
            })
            .catch(error => {
                console.log('Service Worker登録失敗:', error);
            });
    });
}

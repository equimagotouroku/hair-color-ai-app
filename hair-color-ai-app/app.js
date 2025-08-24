// AI ヘアカラーレシピ提案アプリケーション

// グローバル変数
let colorData = {};
let currentMode = "recipe";

// アプリケーション初期化
async function initializeApp() {
    try {
        const response = await fetch("color-database.json");
        colorData = await response.json();
        console.log("カラーデータを読み込みました");
    } catch (error) {
        console.error("カラーデータの読み込みに失敗しました:", error);
    }
}

// イベントリスナー設定
document.addEventListener("DOMContentLoaded", async () => {
    await initializeApp();
    console.log("アプリケーションが初期化されました");
});

// 通知機能
function showNotification(message, type = "success") {
    const notification = document.createElement("div");
    notification.className = `notification ${type}`;
    notification.textContent = message;
    document.body.appendChild(notification);
    setTimeout(() => notification.classList.add("show"), 100);
    setTimeout(() => {
        notification.classList.remove("show");
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// モード切り替え機能
function switchMode(mode) {
    currentMode = mode;
    document.querySelectorAll(".mode-btn").forEach(btn => btn.classList.remove("active"));
    document.querySelector(`[data-mode="${mode}"]`).classList.add("active");
    document.querySelectorAll(".recipe-mode, .hex-mode").forEach(mode => mode.classList.remove("active"));
    document.getElementById(`${mode}Mode`).classList.add("active");
    showNotification(`モードを${mode === "recipe" ? "配合レシピ" : "HEX直接指定"}に切り替えました`, "success");
}

// イベントリスナー設定を更新
document.addEventListener("DOMContentLoaded", async () => {
    await initializeApp();
    setupEventListeners();
    console.log("アプリケーションが初期化されました");
});

// イベントリスナー設定関数
function setupEventListeners() {
    // モード切り替えボタン
    document.querySelectorAll(".mode-btn").forEach(btn => {
        btn.addEventListener("click", () => switchMode(btn.dataset.mode));
    });
}

// カラー配合計算機能
function calculateColorBlend(ingredients) {
    let totalR = 0, totalG = 0, totalB = 0, totalWeight = 0;
    ingredients.forEach(ingredient => {
        const color = colorData.qualucia.colors[ingredient.code];
        if (color) {
            const weight = ingredient.ratio / 100;
            totalR += color.rgb[0] * weight;
            totalG += color.rgb[1] * weight;
            totalB += color.rgb[2] * weight;
            totalWeight += weight;
        }
    });
    if (totalWeight > 0) {
        const finalR = Math.round(totalR / totalWeight);
        const finalG = Math.round(totalG / totalWeight);
        const finalB = Math.round(totalB / totalWeight);
        return rgbToHex(finalR, finalG, finalB);
    }
    return "#FFFFFF";
}

// カラー変換ユーティリティ
function rgbToHex(r, g, b) {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

// クイックレシピ読み込み機能
function loadQuickRecipe(recipeName) {
    const recipe = colorData.quick_recipes[recipeName];
    if (recipe) {
        const finalColor = calculateColorBlend(recipe.ingredients);
        updateFinalColor(finalColor, recipe.name);
        showNotification(`${recipe.name}レシピを読み込みました`, "success");
    }
}

// 最終色表示更新
function updateFinalColor(hexColor, colorName = "") {
    const finalColorDiv = document.getElementById("finalColor");
    if (finalColorDiv) {
        finalColorDiv.innerHTML = `
            <div class="flex items-center gap-4">
                <div class="w-20 h-20 rounded-lg border-2 border-gray-300" style="background-color: ${hexColor}"></div>
                <div>
                    <div class="text-2xl font-bold text-gray-800">${hexColor}</div>
                    <div class="text-gray-600">${colorName}</div>
                </div>
            </div>`;
    }
}

// AI統合機能
const GEMINI_API_KEY = "YOUR_GEMINI_API_KEY_HERE";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent";

// AIレシピ生成機能
async function generateAIRecipe(colorData, userRequest) {
    try {
        const prompt = `
あなたはヘアカラーの専門家です。以下の情報を基に、最適なヘアカラーレシピを提案してください。

【利用可能なカラー剤】
フィヨーレ クオルシア: ${JSON.stringify(colorData.qualucia.colors, null, 2)}

【ユーザーの希望】
${userRequest}

以下の形式でレシピを提案してください：
1. 推奨配合比率
2. 期待される仕上がり
3. 注意事項
4. プロンプト（AI画像生成用）
`;

        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });
        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    } catch (error) {
        console.error("AIレシピ生成エラー:", error);
        return "AIレシピ生成に失敗しました。";
    }
}

// Service Worker登録
if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("/hair-color-ai-app/sw.js")
        .then(registration => {
            console.log("Service Worker登録成功:", registration);
        })
        .catch(error => {
            console.error("Service Worker登録失敗:", error);
        });
}

// カラー配合計算機能（両ブランド対応）
function calculateColorBlendMultiBrand(ingredients) {
    let totalR = 0, totalG = 0, totalB = 0, totalWeight = 0;
    ingredients.forEach(ingredient => {
        const brandData = colorData[ingredient.brand];
        const color = brandData ? brandData.colors[ingredient.code] : null;
        if (color) {
            const weight = ingredient.ratio / 100;
            totalR += color.rgb[0] * weight;
            totalG += color.rgb[1] * weight;
            totalB += color.rgb[2] * weight;
            totalWeight += weight;
        }
    });
    if (totalWeight > 0) {
        const finalR = Math.round(totalR / totalWeight);
        const finalG = Math.round(totalG / totalWeight);
        const finalB = Math.round(totalB / totalWeight);
        return rgbToHex(finalR, finalG, finalB);
    }

// レベル選択のイベントリスナーを修正
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

    // レベル選択 - 修正版
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('level-btn')) {
            const levelBtn = e.target;
            const parentSelector = levelBtn.closest('.level-selector');
            
            if (parentSelector) {
                parentSelector.querySelectorAll('.level-btn').forEach(b => b.classList.remove('active'));
                levelBtn.classList.add('active');
                selectedLevel = parseInt(levelBtn.dataset.level);
                console.log('レベル選択:', selectedLevel);
                updateIngredients();
            }
        }
    });

    // HEX入力
    const hexInput = document.getElementById('hexInput');
    if (hexInput) {
        hexInput.addEventListener('input', updateHexColor);
    }
}

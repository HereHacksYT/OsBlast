// Sadece bu fonksiyonun içindeki koordinat hesaplamalarını (offset) düzelttik:
function addInteractionListeners(element, slotIndex) {
    let active = false;
    let startX, startY;

    // Başlama
    const startDrag = (clientX, clientY) => {
        if (!currentShapes[slotIndex]) return;
        active = true;
        startX = clientX;
        startY = clientY;
        element.classList.add('dragging');
        element.style.position = 'fixed';
        element.style.zIndex = '1000';
        moveElement(clientX, clientY);
    };

    // Hareket ve Ön İzleme (Preview) Hesaplama
    const moveDrag = (clientX, clientY) => {
        if (!active) return;
        moveElement(clientX, clientY);

        // HATA BURADAYDI: Görsel kayma miktarını (-40px) algılama koordinatına da tam ekledik
        clearPreviews();
        const targetEl = document.elementFromPoint(clientX, clientY - 40); 
        if (targetEl && targetEl.classList.contains('cell')) {
            const r = parseInt(targetEl.dataset.row);
            const c = parseInt(targetEl.dataset.col);
            showPreview(currentShapes[slotIndex], r, c);
        }
    };

    // Bırakma
    const endDrag = (clientX, clientY) => {
        if (!active) return;
        active = false;
        element.classList.remove('dragging');
        element.style.position = 'static';
        clearPreviews();

        // Bırakma anında da aynı -40px yukarıdaki hücreyi baz almasını sağlıyoruz
        const targetEl = document.elementFromPoint(clientX, clientY - 40);
        if (targetEl && targetEl.classList.contains('cell')) {
            const r = parseInt(targetEl.dataset.row);
            const c = parseInt(targetEl.dataset.col);
            executePlacement(slotIndex, r, c);
        }
    };

    // Bloğu parmağın tam ortasından tutup taşımak için konumlandırma
    const moveElement = (x, y) => {
        // translateY(-40px) CSS'te olduğu için burada da dikey merkezi ona göre dengeliyoruz
        element.style.left = `${x - (element.offsetWidth / 2)}px`;
        element.style.top = `${y - (element.offsetHeight / 2) + 40}px`; 
    };

    // Touch olayları (Tablet/Telefon)
    element.addEventListener('touchstart', (e) => {
        startDrag(e.touches[0].clientX, e.touches[0].clientY);
    });
    window.addEventListener('touchmove', (e) => {
        moveDrag(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: false });
    element.addEventListener('touchend', (e) => {
        endDrag(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
    });

    // Mouse olayları (PC)
    element.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => moveDrag(e.clientX, e.clientY));
    window.addEventListener('mouseup', (e) => endDrag(e.clientX, e.clientY));
}

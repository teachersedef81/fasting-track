document.addEventListener('DOMContentLoaded', () => {
    const baslangicKiloInput = document.getElementById('baslangicKilo');
    const hedefKilo1Input = document.getElementById('hedefKilo1');
    const hedefKilo2Input = document.getElementById('hedefKilo2');
    const hedefleriKaydetBtn = document.getElementById('hedefleriKaydetBtn');
    const hedefDurumuEl = document.getElementById('hedefDurumu');

    const kiloGirisFormu = document.getElementById('kiloGirisFormu');
    const tarihInput = document.getElementById('tarih');
    const guncelKiloInput = document.getElementById('guncelKilo');
    const gunlukNotInput = document.getElementById('gunlukNot');
    
    const gecmisKayitlarListesiEl = document.getElementById('gecmisKayitlarListesi');
    const kiloGrafigiCanvas = document.getElementById('kiloGrafigi').getContext('2d');
    document.getElementById('currentYear').textContent = new Date().getFullYear();

    let kiloKayitlari = [];
    let hedefler = {
        baslangic: null,
        hedef1: null,
        hedef2: null
    };
    let kiloChart = null;

    // --- HEDEF YÖNETİMİ ---
    function hedefleriKaydet() {
        hedefler.baslangic = parseFloat(baslangicKiloInput.value) || null;
        hedefler.hedef1 = parseFloat(hedefKilo1Input.value) || null;
        hedefler.hedef2 = parseFloat(hedefKilo2Input.value) || null;
        localStorage.setItem('kiloTakipHedefler', JSON.stringify(hedefler));
        hedefleriGoster();
        grafikCiz(); // Hedefler değişince grafik güncellenebilir (hedef çizgileri için)
        alert('Hedefler kaydedildi!');
    }

    function hedefleriYukle() {
        const kayitliHedefler = JSON.parse(localStorage.getItem('kiloTakipHedefler'));
        if (kayitliHedefler) {
            hedefler = kayitliHedefler;
            baslangicKiloInput.value = hedefler.baslangic || '';
            hedefKilo1Input.value = hedefler.hedef1 || '';
            hedefKilo2Input.value = hedefler.hedef2 || '';
        }
        hedefleriGoster();
    }

    function hedefleriGoster() {
        hedefDurumuEl.innerHTML = ''; // Önce temizle
        const sonKayit = kiloKayitlari.length > 0 ? kiloKayitlari[0].kilo : hedefler.baslangic;

        if (hedefler.baslangic) {
            hedefDurumuEl.innerHTML += `<p><strong>Başlangıç Kilosu:</strong> ${hedefler.baslangic} kg</p>`;
        }
        if (sonKayit && sonKayit !== hedefler.baslangic) {
             hedefDurumuEl.innerHTML += `<p><strong>Güncel Kilo:</strong> ${sonKayit} kg</p>`;
        }
        if (hedefler.hedef1) {
            hedefDurumuEl.innerHTML += `<p><strong>İlk Hedef:</strong> ${hedefler.hedef1} kg`;
            if (sonKayit) {
                const fark = (sonKayit - hedefler.hedef1).toFixed(1);
                hedefDurumuEl.innerHTML += ` | <span class="${fark > 0 ? 'text-red-500' : 'text-green-500'}">Kalan: ${fark} kg</span></p>`;
            } else {
                hedefDurumuEl.innerHTML += `</p>`;
            }
        }
        if (hedefler.hedef2) {
            hedefDurumuEl.innerHTML += `<p><strong>Nihai Hedef:</strong> ${hedefler.hedef2} kg`;
            if (sonKayit) {
                const fark = (sonKayit - hedefler.hedef2).toFixed(1);
                hedefDurumuEl.innerHTML += ` | <span class="${fark > 0 ? 'text-red-500' : 'text-green-500'}">Kalan: ${fark} kg</span></p>`;
            } else {
                hedefDurumuEl.innerHTML += `</p>`;
            }
        }
         if(hedefler.baslangic && sonKayit && sonKayit < hedefler.baslangic) {
            const verilenKilo = (hedefler.baslangic - sonKayit).toFixed(1);
            hedefDurumuEl.innerHTML += `<p class="mt-2 font-semibold text-green-600">Toplam verilen kilo: ${verilenKilo} kg 🎉</p>`;
        }
    }

    // --- KİLO KAYIT YÖNETİMİ ---
    function kiloKaydiEkle(event) {
        event.preventDefault();
        const tarih = tarihInput.value;
        const kilo = parseFloat(guncelKiloInput.value);
        const not = gunlukNotInput.value;

        if (!tarih || isNaN(kilo)) {
            alert('Lütfen geçerli bir tarih ve kilo girin.');
            return;
        }

        const yeniKayit = { tarih, kilo, not };
        
        // Tarihe göre aynı gün kaydı varsa güncelle, yoksa ekle
        const mevcutKayitIndex = kiloKayitlari.findIndex(k => k.tarih === tarih);
        if (mevcutKayitIndex > -1) {
            kiloKayitlari[mevcutKayitIndex] = yeniKayit;
        } else {
            kiloKayitlari.push(yeniKayit);
        }

        // Kayıtları tarihe göre sırala (en yeni en üstte)
        kiloKayitlari.sort((a, b) => new Date(b.tarih) - new Date(a.tarih));
        
        localStorage.setItem('kiloTakipKayitlar', JSON.stringify(kiloKayitlari));
        
        kayitlariGoster();
        grafikCiz();
        hedefleriGoster(); // Güncel kilo değişmiş olabilir
        kiloGirisFormu.reset(); // Formu temizle
        tarihInput.valueAsDate = new Date(); // Tarihi bugüne ayarla
    }

    function kayitlariYukle() {
        const kayitliVeriler = JSON.parse(localStorage.getItem('kiloTakipKayitlar'));
        if (kayitliVeriler) {
            kiloKayitlari = kayitliVeriler;
        }
        kayitlariGoster();
        grafikCiz();
    }

    function kayitSil(tarih) {
        if (confirm(`${new Date(tarih).toLocaleDateString('tr-TR')} tarihli kaydı silmek istediğinizden emin misiniz?`)) {
            kiloKayitlari = kiloKayitlari.filter(kayit => kayit.tarih !== tarih);
            localStorage.setItem('kiloTakipKayitlar', JSON.stringify(kiloKayitlari));
            kayitlariGoster();
            grafikCiz();
            hedefleriGoster();
        }
    }
    
    function kayitlariGoster() {
        gecmisKayitlarListesiEl.innerHTML = ''; // Önce listeyi temizle
        if (kiloKayitlari.length === 0) {
            gecmisKayitlarListesiEl.innerHTML = '<p class="text-slate-500 text-center">Henüz kilo kaydı bulunmuyor.</p>';
            return;
        }

        kiloKayitlari.forEach(kayit => {
            const kayitEl = document.createElement('div');
            kayitEl.className = 'p-3 bg-slate-50 rounded-md shadow flex justify-between items-center';
            kayitEl.innerHTML = `
                <div>
                    <p class="font-semibold text-purple-600">${new Date(kayit.tarih + 'T00:00:00').toLocaleDateString('tr-TR', {day: '2-digit', month: 'long', year: 'numeric'})}</p>
                    <p class="text-xl">${kayit.kilo} kg</p>
                    ${kayit.not ? `<p class="text-xs text-slate-500 mt-1"><em>Not: ${kayit.not}</em></p>` : ''}
                </div>
                <button class="text-red-500 hover:text-red-700 text-sm delete-btn" data-tarih="${kayit.tarih}">✖ Sil</button>
            `;
            gecmisKayitlarListesiEl.appendChild(kayitEl);
        });
        
        // Silme butonlarına event listener ekle
        document.querySelectorAll('.delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                kayitSil(this.dataset.tarih);
            });
        });
    }

    // --- GRAFİK YÖNETİMİ ---
    function grafikCiz() {
        if (kiloChart) {
            kiloChart.destroy(); // Önceki grafiği temizle
        }

        // Grafik için verileri tarihe göre sırala (en eski en başta)
        const siraliKayitlar = [...kiloKayitlari].sort((a, b) => new Date(a.tarih) - new Date(b.tarih));

        const etiketler = siraliKayitlar.map(k => new Date(k.tarih + 'T00:00:00').toLocaleDateString('tr-TR', {month: 'short', day: 'numeric'}));
        const kiloVerileri = siraliKayitlar.map(k => k.kilo);
        
        const datasets = [{
            label: 'Kilo (kg)',
            data: kiloVerileri,
            borderColor: '#7C3AED', // Purple-600
            backgroundColor: 'rgba(124, 58, 237, 0.1)',
            fill: true,
            tension: 0.1,
            pointBackgroundColor: '#7C3AED',
            pointBorderColor: '#fff',
            pointHoverBackgroundColor: '#fff',
            pointHoverBorderColor: '#7C3AED'
        }];

        // Hedef çizgilerini ekle (eğer varsa)
        if(hedefler.hedef1) {
            datasets.push({
                label: 'İlk Hedef',
                data: Array(etiketler.length).fill(hedefler.hedef1),
                borderColor: '#10B981', // Emerald-500
                borderDash: [5, 5], // Kesik çizgi
                pointRadius: 0, // Noktaları gösterme
                fill: false,
                tension: 0
            });
        }
        if(hedefler.hedef2 && hedefler.hedef2 !== hedefler.hedef1) {
             datasets.push({
                label: 'Nihai Hedef',
                data: Array(etiketler.length).fill(hedefler.hedef2),
                borderColor: '#EF4444', // Red-500
                borderDash: [5, 5],
                pointRadius: 0,
                fill: false,
                tension: 0
            });
        }


        kiloChart = new Chart(kiloGrafigiCanvas, {
            type: 'line',
            data: {
                labels: etiketler,
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: false, // Kilo genellikle sıfırdan başlamaz
                        ticks: {
                            color: '#4B5563' // Gray-600
                        },
                        grid: {
                            color: '#E5E7EB' // Gray-200
                        }
                    },
                    x: {
                        ticks: {
                            color: '#4B5563'
                        },
                        grid: {
                            display: false
                        }
                    }
                },
                plugins: {
                    legend: {
                        labels: { color: '#374151' } // Gray-700
                    },
                    tooltip: {
                        backgroundColor: '#1F2937', // Gray-800
                        titleColor: '#F9FAFB', 
                        bodyColor: '#F3F4F6',
                        callbacks: {
                            label: function(context) {
                                return `${context.dataset.label}: ${context.parsed.y} kg`;
                            }
                        }
                    }
                }
            }
        });
    }

    // --- BAŞLANGIÇ İŞLEMLERİ ---
    tarihInput.valueAsDate = new Date(); // Tarih alanını bugünün tarihiyle başlat
    hedefleriYukle();
    kayitlariYukle(); 
    
    hedefleriKaydetBtn.addEventListener('click', hedefleriKaydet);
    kiloGirisFormu.addEventListener('submit', kiloKaydiEkle);
});
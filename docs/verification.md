# Yerelde gözlenen doğrulama

Tarih: 25.10.2026. Bu belge çalıştırılmış senaryoları kaydeder; bütün platformlarda kapsamlı test iddiası değildir. Geçici doğrulama kitapları kamusal pakete alınmamıştır.

## Tarayıcı

Gerçek Chromium üzerinde yerel `file://` ve loopback HTTP kullanıldı.

- Yeni editör ilk açılışta boştu; eski özel `kureDizgi6` içeriğini içeri almadı.
- Tarafsız örnek açık kullanıcı onayıyla yüklendi; özgün özel localStorage değeri aynı kaldı.
- Tam küre, sabit uçlar, yaprak çifti ve dörtlü komşuluk görünümleri çalıştırılıp görsel olarak kontrol edildi.
- Normal, native italic ve bold örnekleri yüklendi. Ortak `KureLayout` çıktısı, özgün motorun aynı tarafsız veri üzerindeki çıktısıyla 16 sayfanın tamamında birebir eşleşti.
- Editörden gerçek JSON, SVG ve PNG blob’ları üretildi ve içerikleri/boyutları gözlendi. Tarayıcının dosya indirme listesi API’si boş kaldığından işletim sistemi indirme klasöründe otomatik kayıt iddiası yapılmıyor.
- Kitap projeksiyonu tarafsız örnekle 10,5/13 pt’de açıldı; 8 açılım PDF’si üretildi.
- 24 pt gibi sığmayan ayar, hata gösterdi; eski görseli kaldırdı ve dışa aktarmayı kapattı. 10,5/13’e dönünce yerleşim yeniden üretildi.
- HTTP üzerinden kitap SVG indirme yolu çalıştırıldı: glif metni ve iki gömülü fontu içeren gerçek SVG blob’u oluştu. `file://` SVG font-fetch kısıtlaması README’de belirtilmiştir.
- İncelenen arayüzlerde JavaScript hata kaydı yoktu. WebGL donanım/driver kombinasyonlarının tamamı denenmedi; özgün Canvas2D fallback korunmuştur.

## Özel tipografi araştırması

Gerçek özel kitapta Crimson Pro 10,5 pt ve 13 pt satır aralığı doğrulandı. Şiirin 16 sayfası için A/B × 13/17,6 pt satır arası seçenekleri olmak üzere dört PDF üretildi. Her birinde kaynakla aynı 7.640 mürekkepli glif bulundu. 4× render’da siyah mürekkep sınırı en az 20,55 mm idi. Merkez yakınındaki PDF text trace boyutu yaklaşık 10,47–10,49 pt’ydi. Özel metin/PDF’ler yalnız özel arşivde bulunur. Kitap gövdesinin bütün satırları yeniden dizilmedi; sayfa/satır sonları korunmuştur.

## PDF CLI

`tools/requirements.txt` içindeki PyMuPDF 1.26.7 yalıtılmış dizine kurularak gerçek CLI çağrıları çalıştırıldı:

- Tarayıcıdan üretilmiş 8 açılımı 16 tam boy sayfaya bölme başarılı.
- Tekrar aynı hedefe yazma, `--overwrite` verilmediğinde reddedildi.
- 3 sayfalık tarafsız kitaba 16 sayfa eklenmesi 19 sayfalık PDF oluşturdu.
- 2 sayfalık kitap, ek bölüm sağda başlayacağı için reddedildi; boş sayfa sessizce eklenmedi.

Girdi ölçüsü toleransı 0,1 mm’dir: Chromium CSS kağıt boyutunu PDF birimine yuvarlayabilir. Çıktı sayfaları hedef 130 × 195 mm olarak yeniden oluşturulur; bölme klibi kabul edilen gerçek girdi yarım genişliğinden alınır. Bu tolerans yanlış kitap formatını düzeltme vaadi değildir.

## Native InDesign

Windows InDesign 2026 (21.4) üzerinde betik çalıştırıldı:

1. Tarafsız, 3 sayfalık, karşılıklı 130 × 195 mm kaynak oluşturuldu.
2. Genel JSX, kaynağın bağımsız kopyasına 16 sayfa ekledi.
3. 19 sayfalık IDML yazıldı; tekrar açılıp gömme, sayfa/parite/ölçek kontrolü yapıldı.
4. PDF, yeniden açılan IDML’den native olarak export edildi.
5. Bütün 16 ek sayfası, CLI’nin kaynak sanatıyla raster karşılaştırıldı. En yüksek siyah mürekkep maskesi farkı %0,05’in altındaydı; metin/sayfa seçimi doğruydu.

Smoke sırasında iki gerçek InDesign davranışı düzeltildi: Page nesnesinde `pdfs` koleksiyonu yerine frame’in `pdfs` koleksiyonu kullanılmalı; aynı çok sayfalı PDF’yi gömme sonrası IDML round-trip kaynak sayfa seçimini değiştirebilir. Bu yüzden her doğrulanmış kaynak sayfa önce ayrı bir geçici tek sayfalık PDF’ye native export edilir, sonra benzersiz dosyadan yerleştirilip gömülür. Geçici dosyalar betiğin finally bölümünde temizlenir. 19 sayfanın 4’ün katı olmadığı uyarısı beklenen ve gözlenen sonuçtur.

Ayrıca 3 sayfalık gerçek INDD kaynakla OPEN_COPY akışı başarılı çalıştırıldı; kaynağın dosya boyutu aynı kaldı. 2 sayfalık kaynakta sağ başlangıç reddedildi ve çıktı IDML oluşmadı. PDF yerleştirme sayfası/kırpması, spread export ayarı, ölçü birimi ve açık belge sayısının bu başarı/hata senaryoları sonunda önceki değerlerine döndüğü gözlendi.

InDesign’ın diğer sürümleri, macOS, farklı PDF preset’leri ve font paketleri için ayrıca gerçek baskı provası gerekir. Otomasyon, şifresiz ve uygun ölçülü girdiler varsayar; font/bağlantı sorunları kaynak kopyada bile sessiz onarılmaz.

## Paket ve gizlilik

Kamusal UTF-8 dosyaları özel şiirden ayırt edici iki alıntı ve bilinen özel Windows yolları açısından tarandı; eşleşme bulunmadı. `kureDizgi6` yalnız geçmiş/ayrım açıklaması olan belgelerde geçer, editör kodunda kullanılmaz. Demo JSON ve JS içeriği eşitliği kontrol edildi. Özel arşivin ilk 549 kopyası kaynak dosyalarla SHA-256 eşleştirilerek doğrulandı. Bu bir yayımlama öncesi tam hukuk/güvenlik denetiminin yerine geçmez.

GitHub yalnız okunmuştur. Bu hazırlıkta repo oluşturma, uzak depo ekleme, commit, push veya release yapılmamıştır.

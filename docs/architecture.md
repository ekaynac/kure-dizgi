# Mimari ve değişiklik rehberi

## Sınırlar

`editor/` özgün düzenleme ve küre geometrisini korur. `compare/` kitabın okunurluğu için ayrı, fiziksel olarak izometrik olmayan bir projeksiyon uygular. Bu iki geometri birbirinin yerine kullanılmaz.

`src/layout.js` zengin metin Delta verisinden glif yerleşimi üretir. Her iki arayüz de aynı `KureLayout.layoutPage(state, k, measure)` fonksiyonunu kullanır; ikinci bir dizgi motoru yoktur. API önbelleksizdir; editör kendi glif önbelleğini saklar. `measure(fontString, char)` tarayıcının gerçek yüklü fontundaki ilerleme genişliğini döndürür. Font yüklenmeden ölçüm yapmak yanlış satır geometrisi üretir.

Dönen her glif `sigma`, `tau`, trigonometrik bileşenler, `ch`, `f` (font dizesi, piksel boyutu, kalın/italik), `hs` (yatay karakter ölçeği), `bl` (taban kayması), `over` alanlarını taşır. Açı birimi radyandır; `page.size` ekran/dizgi koordinatıdır, doğrudan baskı puntosu değildir.

`src/book-projection.js` giriş JSON’unun türetilmiş bir kopyasını hazırlar, hedef satır aralığını uygular ve bir glifi kitap düzlemine projekte eder. Kaynak JSON değiştirilmez. `compare/compare.js` gerçek SVG glif kutularını ölçer, en az yatay kısalmayı arar, fiziksel ölçeği ve 20,5 mm iç sınırı doğrular. Sığmayan ayarda görsel ve dışa aktarma kapatılır; eski başarılı görüntü yeni ayarmış gibi bırakılmaz.

## Dosyalar

- `editor/index.html`, `editor.css`, `editor.js`: özgün editör UI’si ve 3B/SVG/JSON çıktıları.
- `compare/index.html`, `compare.css`, `compare.js`: A/B kitap kompozisyonu ve ölçüm.
- `src/layout.js`: özgün ortak dizgi algoritması.
- `src/book-projection.js`: kitap projeksiyonu.
- `examples/demo.json`: dışarıdan yüklenebilen tarafsız örnek.
- `examples/demo.js`: aynı örneğin `file://` üzerinden fetch gerektirmeyen tarayıcı yüklemesi. JSON ile birlikte güncellenmelidir.
- `fonts/`: gerçek normal ve italik Crimson Pro değişken fontları, CSS ve OFL.
- `vendor/`: değiştirilmemiş Quill dağıtımı ve tam lisansları.
- `tools/`: baskı ve InDesign entegrasyonu; tarayıcı uygulamasının zorunlu bağımlılığı değildir.

## Bakım kuralları

1. Asıl geometriyi değiştirmeden önce [geometri sözleşmesini](geometry.md) okuyun; kitap projeksiyonundaki bir düzeltmeyi 3B küreye otomatik taşımayın.
2. Yeni JSON alanları için eski kayıtlara varsayılan sağlayın. Kullanıcı metnini sıfırlayarak şema değiştirmeyin.
3. Font yükleme, iki sütun, sağ/orta/yaslı hizalama, taban kayması, kalın ve italik, boş satırlar ve Türkçe karakterler gerçek tüketici senaryolarıdır.
4. CSS veya ekran yakınlaştırması yerine PDF’deki fiziksel ölçüyü kontrol edin. Metin çıkarımı çizim kliplerini her zaman uygulamaz; mürekkep sınırı için render da gerekir.
5. Geçici çalışma ve üretim çıktıları açık kaynak klasöründe tutulmamalı; `work/` ve `output/` ignore edilir.

Herhangi bir backend, ağ API’si veya GitHub entegrasyonu yoktur. GitHub araştırması bir geliştirme notudur, uygulama özelliği değildir.

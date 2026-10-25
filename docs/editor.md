# Editör ve çalışma verisi

Küre Dizgi was developed for A. Tolga Suyolcuğlu's Melissa Önermesi poem. Bu paket şiirin metnini içermez; şiir yayımlanmamakta ve paket lisansı kapsamına alınmamaktadır. `examples/demo.json` yalnızca bu araç için yazılmış teknik örnek metinler içerir.

## Yerel kullanım

Paketin yerel sunucusundan `editor/` sayfasını açın. İnternet gerekmez: Quill, Crimson Pro ve uygulama dosyaları paket içindedir. `editor/index.html` doğrudan dosya olarak da açılabilir; tarayıcıların `file:` güvenlik politikaları, font erişimi, depolama ve dosya seçici desteği farklılık gösterebilir. Kararlı sonuç için aynı yerel adresi ve tarayıcı profilini kullanın.

- `s1`–`s16` sekmeleri: sekiz sıranın sol/sağ yarım yaprakları. Tek sayılar sol, çift sayılar sağ halkadır.
- **Tam küre:** sürükleme döndürür; tekerlek yakınlaştırır. **Sabit uçlar:** dikey sürükleme uçtan uca eksende döndürür.
- **Yaprak çifti:** seçili sıranın düz açılımı. **Dörtlü komşuluk:** seçili ve sonraki sıra; son sıra ilk sıraya sarar. Düz görünümde sürükleme kaydırır. Çift tıklama yakınlaştırmayı sıfırlar.
- Kalın, italik, boyut, hizalama ve girinti Quill araç çubuğundadır. Gelişmiş metin alanları seçime/satıra harf ve sözcük aralığı, yatay ölçek, taban kayması, satır yüksekliği ve satır harf aralığı uygular.
- **Sayfa ayarları:** punto alanının tarihsel adı korunmuştur fakat sayısal birimi **CSS px**'dir; satır aralığı çarpandır. Dereceyle belirtilen marjlar uzunluk değil açıdır. **Tüm sayfalara uygula** açıkken ayarlar topluca değişir. Ayarları kopyalama metni kopyalamaz.
- İki sütunda **Dış / İç** ayrı Quill Delta verisi tutar. Dış sütun sivri uç tarafındadır. Tek sütuna geçmek iç sütun metnini silmez.
- Kırmızı glif ve küre görünümündeki sekme işareti mevcut motorun taşma uyarısıdır; otomatik yeniden akış veya baskı uygunluk sertifikası değildir.

## Örneği güvenli yükleme

**Dışa aktar · Veri → Örnek yükle** açıkça seçilmedikçe örnek yüklenmez. Paket içindeki `examples/demo.js`, `examples/demo.json` verisinin tarayıcı karşılığıdır; sunucuda ve doğrudan dosya açılışında aynı nötr örnek kullanılır. Onaydan önce veri değiştirilmez. Onaydan sonra mevcut durum `kureDizgiPublic1.beforeDemo` anahtarına ayrı kurtarma kopyası olarak yazılır ve `kure-dizgi-ornek-oncesi-yedek.json` indirmesi başlatılır. Kurtarma kopyası yazılamazsa örnek yüklenmez. Sonraki örnek yüklemesi önceki kurtarma kopyasının yerini alır; indirdiğiniz yedekleri ayrıca saklayın. Tarayıcı indirme uyarısı verirse indirmeye izin verin.

Örnek yüklemek açık çalışma dosyası bağlantısını bırakır: **Dosyaya kaydet** yeni dosya seçmenizi ister. Önceki dosyanız örnekle sessizce ezilmez.

## Yedekleme ve taşınabilirlik

- Otomatik kayıt yalnızca bu genel pakete ait `kureDizgiPublic1` anahtarına, düzenlemeden yaklaşık 600 ms sonra ve sayfadan ayrılırken yapılır. Önceki özel editörün depolaması okunmaz veya taşınmaz. İlk açılışta sayfalar boştur.
- Tarayıcı depolaması yedek değildir: profil temizliği, özel gezinme, kota ve `file:` davranışı veri kaybına yol açabilir. Her oturum sonunda **Yedek indir (JSON)** kullanın; farklı adlarla sürümlü kopyalar tutun. Normal otomatik kayıt depolama hatalarını arayüzde bildirmez.
- **Yedek yükle** mevcut durumu değiştirir. Önce yedek alın. Yalnızca güvendiğiniz, bu araçla uyumlu JSON dosyalarını açın; içe aktarma tam bir güvenlik/şema doğrulayıcısı değildir.
- Chrome/Edge'in uygun güvenli bağlamlarında **Dosyaya kaydet / Dosyadan aç** doğrudan çalışma dosyası kullanır. Desteklenmeyen tarayıcılarda JSON indir/yükle kullanılabilir. Dosya tutamacı oturumlar arasında saklanmaz.
- Kurtarma gerekirse geliştirici araçlarının depolama bölümündeki `kureDizgiPublic1.beforeDemo` değerini `.json` dosyasına kaydedip **Yedek yükle** ile açabilirsiniz.

## JSON biçimi

Üst nesne:

| Alan | Anlam |
| --- | --- |
| `pages` | Tam 16 sayfalık dizi; dizi indeksi 0–15, arayüzde s1–s16 |
| `cur` | Seçili sayfanın sıfır tabanlı indeksi |
| `font`, `R` | Font ailesi ve küre yarıçapı (CSS px); birlikte paketlenen aile `Crimson Pro` |
| `mode` | `3d`, `ring`, `pair` veya `quad` |
| `yaw`, `pitch`, `ringA` | Görünüm açıları (radyan) |
| `zoom`, `fz`, `fpx`, `fpy` | Küre/düz görünüm yakınlaştırması ve düz kaydırma |

Her sayfa `delta` ve `delta2` ile Quill Delta `{ "ops": [...] }` biçiminde iki bağımsız zengin metin akışı tutar. `insert` metindir; paragraf özellikleri bitirici `\n` işlemindedir. Motor metin olmayan gömülü öğeleri çizmez. Kalın/italik ve boyuta ek olarak desteklenen özellikler `align`, `indent`, `tracking`, `wordsp`, `baseline`, `hscale`, `lineheight`, `linetracking`'dir. Quill'in verisini düz metne dönüştürmeyin; biçim ve sütunlar kaybolur.

Sayfa alanları: `size` (px), `leading` (çarpan), `tracking` (px); `top`, `margintip`, `marginspine`, `shift`, `colgap` (derece); `cols` (1/2), `ratio` (dış sütun yüzdesi); `jwmin`/`jwmax` (yaslamada sözcük genişliği yüzdeleri), `jgmin`/`jgmax` (glif genişliği yüzdeleri). İsteğe bağlı eski alanlar açılışta/içe aktarmada mevcut motorun varsayılanlarıyla tamamlanır. Dışa aktarma üst nesneyi ve zengin metin alanlarını JSON olarak korur; yeni bir şema sarmalayıcısı eklenmemiştir.

## Çıktı ve sınırlar

**SVG** seçili yaprak çiftini veya sekiz çiftin şablonunu verir. Metin fonta bağlıdır; font gömülmez. Başka bilgisayarda Crimson Pro kurun veya baskı öncesi Inkscape gibi bir araçta metni kontura dönüştürün. SVG fiziksel mm ölçüsü, taşma payı, kesim toleransı veya matbaa renk profili içermez. **PNG (3×)** mevcut tuval görüntüsünü üç kat piksel boyutuna büyütür; yeniden üç kat çözünürlükte dizgi yapmaz.

Özgün motor bilinçli olarak korunmuştur: satırları kendiliğinden bölmez; sözcük şekillendirme/kerning yerine Unicode kod noktalarını ayrı ölçer ve çizer. Birleşen işaret, karmaşık yazı sistemleri, ligatürler, emoji dizileri ve tarayıcılar arası piksel eşitliği garanti edilmez. Düz açılım yaklaşık bir geliştirmedir; kürenin esnetmesiz düzleme açılması değildir. Gerçek formüller ve ortak API için [geometri](geometry.md), lisanslar için [üçüncü taraflar](third-party.md) belgesine bakın. Kitap karşılaştırmasının fiziksel punto/satır aralığı hedefleri editörün özgün px tabanlı durumunu yeniden tanımlamaz.

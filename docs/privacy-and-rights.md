# Özel içerik, telif ve yayımlama sınırı

Bu araçlar A. Tolga Suyolcuğlu’nun *Melissa Önermesi* şiirinin dizgisi için geliştirilmiştir. Bu atıf kullanım bağlamını açıklar; şiirin telifinin yazılım sahibine ait olduğu veya şiirin MIT lisansı altında yayımlandığı anlamına gelmez.

## Dağıtılacak klasör

Yalnız bu `kure-dizgi` klasörü [public GitHub deposu](https://github.com/ekaynac/kure-dizgi) ve [GitHub Pages sitesi](https://ekaynac.github.io/kure-dizgi/) olarak yayımlanır. Üst klasörün tamamını, kardeş `ozel-arsiv` klasörünü veya orijinal kitap klasörlerini yayımlamayın.

Açık pakette izin verilenler: genel araç kodu, genel üretim betikleri, tarafsız teknik örnekler, bu belgeler ve lisanslarıyla dağıtılabilen üçüncü taraf dosyalar.

Açık pakete dahil edilmeyenler: gerçek şiir ve yedek JSON’ları; kitap IDML/INDD/SLA/PDF dosyaları; yayınevi logosu; özel ekran görüntüleri, üretim açılımları ve tarayıcı kayıtları; kişisel dosya yolları; kimlik bilgileri veya erişim tokenları. Kullanıcının dışarıdan yüklediği metnin dağıtım hakkı kullanıcıya aittir.

## Veri davranışı

- Editör yalnız kendi `kureDizgiPublic1` alanını kullanır. Özel eski aracın `kureDizgi6` alanına bakmaz ve onu taşımaz/silmez.
- Örnek yükleme, mevcut içeriği değiştirmeden önce onay ve kurtarma akışı sunar. JSON dosyasını ayrıca saklayın; tarayıcı verileri silinebilir.
- Karşılaştırma aracı JSON’u oturum belleğinde tutar; yerel depoya veya sunucuya göndermez.
- Hiçbir araç analitik veya bulut metin depolama hizmeti içermez. GitHub Pages yalnız statik dosyaları sunar; ziyaret ve dosya istekleri GitHub’ın barındırma altyapısından geçer. [GitHub gizlilik bildirimi](https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement) geçerlidir. Şiir yükleme ve düzenleme tarayıcı içinde yapılır; uygulama şiir içeriğini GitHub’a göndermez. Yerel HTTP sunucusu da yalnız statik dosya sunar.
- SVG/PDF’ye dışa aktardığınız metin o belgede yer alır. Bazı PDF tüketicileri çizim klibinin dışında kalan, görünmeyen kaynak metni de metin çıkarımında görebilir; görünür kesim sınırı bir bilgi gizleme mekanizması değildir. Kitabın kendi içeriğini kamusal örnek olarak paylaşmayın.

## Lisanslar

Kendi kodumuz ve teknik belgelerimiz MIT. Quill ve içindeki bileşenler kendi lisanslarında. Crimson Pro OFL. PDF CLI’nin isteğe bağlı PyMuPDF bağımlılığı AGPL veya ticari lisanslıdır. Adobe InDesign ayrı, tescilli bir üründür. Ayrıntı: [üçüncü taraflar](third-party.md).

## Her sürümü yayımlamadan önce

1. Yalnız açık paket klasörünü ayrı depo kökü seçin; üst klasörü değil.
2. Gerçek JSON, kitap veya çıktı dosyası eklenmediğini ve `.gitignore` kapsamını kontrol edin.
3. Kullanılan tüm lisans dosyalarının pakette kaldığını doğrulayın.
4. README’deki yerel kullanım ve üretim adımlarını tarafsız örnekle çalıştırın.
5. Özel metin/sır taraması yapın. Git ignore kuralları tek başına gizlilik garantisi değildir.
6. Yeni özel içerikleri yayımlamak ayrıca hak ve kapsam kontrolü gerektirir; araçları yayımlama kararı şiir veya kitap dosyalarını yayımlama izni değildir.

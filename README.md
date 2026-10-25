# Küre Dizgi

A. Tolga Suyolcuğlu’nun **Melissa Önermesi** şiirinin dizgisi için geliştirilmiş araçların, kitap projesinden ayrılmış açık kaynak paketi. Amaç, bir şiiri küresel bir yüzey üzerinde düzenlemek ve kitap için farklı baskı projeksiyonları üretirken kullanılan araçları erişilebilir kılmak.

**[Tarayıcıda kullan](https://ekaynac.github.io/kure-dizgi/) · [GitHub kaynak kodu](https://github.com/ekaynac/kure-dizgi)** — Kendi araç kodumuz MIT lisanslıdır. Gerçek şiir, yayınevi varlıkları ve kitap dosyaları bu pakette yoktur. Yazılımın MIT lisansı, şiirin veya kitap içeriğinin haklarını kapsamaz.

## Hızlı başlangıç

1. [Canlı araç sayfasını](https://ekaynac.github.io/kure-dizgi/) açın veya paketi indirip `index.html` dosyasını Chrome/Edge ile açın.
2. **Şiir editörü**: metni yazın; 3B küre, sabit uçlar, yaprak çifti ve dörtlü komşuluk görünümleri arasında geçin. JSON kaydı çalışma verisidir.
3. **Kitap projeksiyonu**: editörden kaydettiğiniz JSON’u yükleyin. Gerçek punto, satır arası, A/B eğriliği ve yazı sınırlarını kontrol edin.
4. Kaybolmaması için çalışmanızı yeni bir JSON dosyasına kaydedin. Tarayıcı deposu yedek değildir.

Normal editör, örnek yükleme, JSON yükleme ve PDF yazdırma doğrudan dosyadan açılarak çalışır; internet gerekmez. Canlı site üzerinde fontları gömülü SVG dışa aktarma da çalışır. İndirdiğiniz yerel kopyada kitap projeksiyonundan **fontları içine gömülmüş SVG indirmek** için tarayıcının yerel dosya `fetch` kısıtlaması nedeniyle aşağıdaki yerel HTTP sunucusunu kullanın:

```sh
python -m http.server 8000 --bind 127.0.0.1
```

Komutu bu klasörde çalıştırın ve `http://127.0.0.1:8000/` adresini açın. Sunucu yalnız bilgisayarınızdaki loopback arayüzüne bağlanır. Özel arşiv kardeş klasördedir; sunucuyu üst klasörden başlatmayın.

## Araçlar

| Araç | Görev | Çıktı |
| --- | --- | --- |
| `editor/index.html` | Zengin metin düzenleme, 16 yapraklı küre, fiziksel açılımın temel geometrisi | JSON, SVG, PNG |
| `compare/index.html` | 130 × 195 mm kitap sayfasında A/B eğrilikleri; gerçek punto korunarak dışta yatay kısalma | SVG, tarayıcı PDF’si |
| `tools/pdf_appendix.py` | Açılım PDF’sini 16 sayfaya ayırma, isteğe bağlı kitap PDF’sine ekleme | Vektör PDF |
| `tools/appendix-indesign.jsx` | Kitabın bağımsız kopyasına 16 sayfalık eki yerleştirme, IDML üretme ve tekrar açıp PDF export | IDML ve InDesign PDF’si |

Tarayıcı araçları bir derleme veya npm kurulumu istemez. PDF CLI için Python ve ayrı lisanslı PyMuPDF; InDesign betiği için lisanslı Adobe InDesign gerekir. Bu proje InDesign veya Scribus dağıtmaz, ücretsiz INDD dönüştürücü içermez.

## Tipografi: punto ile sığdırma aynı şey değil

Başvuru ölçüsü **Crimson Pro 10,5 pt / 13 pt satır arasıdır**. İlk özel önizlemelerde tek tip küçültme gövdeyi yaklaşık 8,2 pt’ye indirmişti. Kitap projeksiyonu artık istenen puntoyu gizlice küçültmez:

- Şiraze ekseninde glif dönüşümü birim dönüşümdür: hedef punto ve satır arası korunur.
- Dışa gidildikçe yatay projeksiyon kısalır; dış harfler daha dar görünür. Bu bedel ekranda yüzde olarak bildirilir.
- 20 mm kenar boşluğuna 0,5 mm ölçüm güvenliği eklenir. Sığmayan ayar reddedilir.
- Varsayılan kitap modu satır arası geçersiz kılmalarını yalnız türetilmiş yerleşimde normalleştirir; JSON dosyasını değiştirmez. Satır sonları ve boş satır sayıları korunur.
- **Dikey alanı kullan**, satır arasını artırır; 13 pt’yi korumaz. Az satırlı bir şiirin, 13 pt satır arasıyla 155 mm alanı tamamen doldurması beklenmez.

A/B kitap kompozisyonları fiziksel olarak kesilip bir küreye kapatılacak şablon değildir. [Tipografi ve projeksiyon açıklaması](docs/typography.md), [asıl küre geometrisi](docs/geometry.md).

## Dokümantasyon

- [Editör ve veri biçimi](docs/editor.md)
- [Küre geometrisi](docs/geometry.md)
- [Kitap projeksiyonu ve tipografi](docs/typography.md)
- [PDF / IDML üretim adımları](docs/production.md)
- [Mimari ve dosya sorumlulukları](docs/architecture.md)
- [Telif, özel içerik ve yerel arşiv ayrımı](docs/privacy-and-rights.md)
- [Üçüncü taraf bileşenler](docs/third-party.md)
- [GitHub’da önceki yayın araştırması](docs/github-provenance.md)
- [Yerelde gözlenen doğrulama sonuçları](docs/verification.md)
- [Değişiklik kaydı](CHANGELOG.md)

## Lisans

Kendi araç kodumuz ve belgelerimiz [MIT](LICENSE) lisanslıdır. Quill, gömülü fontlar ve isteğe bağlı PDF kütüphanesi kendi lisanslarına tabidir; [üçüncü taraf açıklamasını](docs/third-party.md) okuyun. Özellikle PyMuPDF **AGPL veya ticari lisanslı** bir bağımlılıktır; proje MIT diye bu bağımlılık MIT olmaz.

Tarafsız örnek metinler bu paket için yazılmış teknik örneklerdir. *Melissa Önermesi* şiirinin kendisi, kitap baskıları, yayınevi logosu veya özel üretim belgeleri lisanslanmış örnek olarak dağıtılmamaktadır.

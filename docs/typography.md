# Kitap projeksiyonu ve gerçek tipografi

## Hedef

Referans, Crimson Pro 10,5 pt gövde ve 13 pt taban çizgisi aralığıdır. Özgün özel kitap PDF’sinde 10,5 pt gövde span’leri ve ardışık tabanlarda 13,000 pt fark; düz şiir Scribus stillerinde de 10,5/13 değerleri gözlenmiştir. Gerçek şiir ve bu özel belgeler açık pakette bulunmaz.

Eski kitap önizlemesindeki tek tip sığdırma tüm glifleri yaklaşık 8,2 pt’ye indiriyordu. Bu bir projeksiyon zorunluluğu değildi; tam sayfayı tek ölçeğe bağlayan sığdırma tercihiydi. Yeni kitap modu puntoyu bağımsız hedef olarak korur ve dış yatay ölçeğin bedelini bildirir.

## Dönüşüm

`σ` şiraze eksenine göre yatay açı, `t = τ − τmerkez`, `R` dizgi yarıçapı, `b = açı / 43,4°`, `c` sığdırmanın bulduğu yatay kısalma parametresi:

```text
x = R sin(c σ) / c                 c=0 ise x=R σ
y = R t cos(b σ)
dx/dσ / R = cos(c σ)
dy/dσ / R = −t b sin(b σ)
```

Glifin yerel affine çerçevesi, kullanıcı `hscale` değeri hariç:

```text
[ cos(c σ)    0 ]
[ −t b sin(b σ) 1 ]
```

`σ=0` noktasında bu matris birim matristir. Dolayısıyla merkezde hedef gövde ve satır arası değişmez. Dışta yatay kısalma ve kaykılma oluşur; bu, kabul edilen kitap projeksiyonu bozulmasıdır. Glif ilerlemeleri de aynı sürekli x fonksiyonundan geldiği için yalnız harf merkezlerini sıkıştırıp geniş glifleri üst üste bindiren bir yöntem kullanılmaz. Bu işlem fiziksel kürenin izometrik açılımı değildir.

Fiziksel ölçek `hedefPt × 25,4 / 72 / referansPikselBoyutu` şeklindedir. Referans piksel boyutu sayfaların medyan `size` değeridir; farklı boyuttaki zengin metin oranları korunur. Kaynak `hscale`, bold, italic ve baseline alanları uygulanır.

## Sığdırma ve sınırlar

- Her yarım sayfa 130 × 195 mm; gerçek kenar boşluğu koşulu 20 mm.
- SVG ölçümünde her kenara ayrıca 0,5 mm güvenlik konur: 89 × 154 mm ölçüm alanı.
- Gliflerin gerçek yüklü fontla alınan SVG `getBBox()` kutularının dört köşesi dönüşümden geçirilir. A ve B, bütün 16 sayfa birlikte ölçülür; ölçek ve sığdırma ortak kalır.
- Önce kısalmasız yerleşim denenir. Gerekirse bütün sayfalara sığan en küçük `c` ikili aramayla bulunur.
- En dış yatay türev %25’in altına indirilmez; ters dönme veya sıfıra çökme yoktur. Sığmayan ayarda punto gizlice küçültülmez, dışa aktarma kapanır.
- SVG kutusu ve PDF metin çıkarım kutusu birebir aynı değildir. Kaykılmış gliflerin PDF text trace kutusu gerçek mürekkepten daha büyük çıkabilir. Son baskı kontrolünde siyah mürekkep render ölçümü ve görsel kontrol de gerekir.

## Satır arası ile dikey doluluk

Varsayılan kitap modu sayfanın `leading` alanını hedefe göre ayarlar; Delta’daki `lineheight` geçersiz kılmalarını yalnız türetilmiş kopyadan kaldırır. Kaynak JSON’un kendisi değiştirilmez. Hizalama, sözcükler, satır sonları ve boş satır sayıları korunur. Özel satır aralığı ritmi önemliyse özgün editördeki JSON’u koruyun; bu kitap modunun ritmi normalleştirdiğini bilin.

Az satırlı bir metin 13 pt satır arasıyla sayfa yüksekliğini tamamen kullanmaz. “Dikey alanı kullan” aynı puntoyu koruyup satır arasını ölçülü biçimde artırır; 13 pt koşuluyla eşdeğer değildir.

Özel 16 sayfalık kaynaktaki gözlenen sonuçlar (gerçek metin bu pakette yok):

| Hedef | Metin yüksekliği | Merkezin iç 5° yatay ölçeği | En dış yatay ölçek |
| --- | --- | --- | --- |
| 10,5 / 13 pt | 115,5 mm | %99,0 | %39,7 |
| 10,5 / 17,6 pt | 153,7 mm | %99,0 | %39,7 |

10,5 pt hedefinde özel PDF’lerin şirazeye yakın şeridinde text trace boyutu yaklaşık 10,47–10,49 pt; fark yerel affine projeksiyon ve PDF ölçüm yönteminden gelir. Siyah mürekkep render sınırı dört A/B dosyasında en az 20,55 mm ölçülmüştür. Bu rakamlar her yeni şiir için otomatik garanti değildir; yeni JSON yüklenince yeniden ölçülür.

Puntoyu daha da artırmak teknik olarak daha fazla dış daralma pahasına mümkündür; okunurluk bununla aynı şey değildir. Bu özel kaynakta 10 pt hedefi dışta yaklaşık %50,5, 10,5 pt %39,7, 11 pt %30,2 yatay ölçek gerektiriyordu. Dış metin çok dar görünüyorsa puntoyu biraz azaltmak veya satırları editörde yeniden düzenlemek daha iyi tercihtir; satırlar otomatik değiştirilmez.

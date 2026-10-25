# Özgün küre ve açılım geometrisi

Bu belge `src/layout.js` ve editörün özgün çizim/açılım fonksiyonlarını tanımlar. Kitap karşılaştırmasında kullanılan diğer izdüşümler bu formüllerle karıştırılmamalıdır. Küre yarıçapı `R`, dizgi ölçüleri CSS px; trigonometrik açılar radyandır. Kullanıcı arayüzündeki derece değerleri `π/180` ile çevrilir.

## Sayfalar ve yüzey

16 sayfa sekiz açısal sıradır. Sıfır tabanlı `k` için:

```text
Δ = π/4
r = floor(k/2)
τ₀ = rΔ
τ₁ = τ₀ + Δ
τc = τ₀ + Δ/2
```

Çift `k` (s1, s3, …) sol yarım yaprak, `σ ∈ [−π/2, 0]`; tek `k` sağ yarım yaprak, `σ ∈ [0, π/2]`. Her sıranın açısal yüksekliği 45°'dir. Uçlar ±x eksenindedir; `τ` uçtan uca eksenin çevresinde tam tur atar.

Birim kürede glif merkezi:

```text
P(σ,τ) = (sin σ, −cos σ cos τ, cos σ sin τ)
```

Gerçek kürede konum `RP`'dir. Yerel birim yatay ve düşey teğetler:

```text
eσ = (cos σ, sin σ cos τ, −sin σ sin τ)
eτ = (0, sin τ, cos τ)
∂P/∂σ = eσ
∂P/∂τ = cos σ · eτ
```

Yüzey metriği `ds² = R²(dσ² + cos²σ dτ²)` olduğundan, τ yönündeki fiziksel aralık uçlara doğru daralır. Özgün motorun sabit `Δτ = lineHeight/R` ilerlemesi bu daralmayı tersine çevirmez. Bu bir eş alanlı veya konformal yazı yerleştirmesi değildir.

## Satır yerleştirme

`src/layout.js` Quill Delta'yı açık satır sonlarından ayırır; otomatik satır kaydırmaz. İlk satır `τ = τ₀ + top·π/180` konumundadır. Satır yüksekliği, satırdaki en büyük yazı boyutu (en az sayfa `size` değeri) ile satırın `lineheight` özelliğinin veya sayfa `leading` çarpanının çarpımıdır. Sonraki satıra `lineHeight/R` radyan ilerlenir. Boş satır da ilerler.

Karakter genişliği `measure(fontString, character) * hscale/100` ile başlar. Sayfa ve satır/karakter harf aralığı, boşluklara ek sözcük aralığı ve yaslama payları ilerlemeye katılır. Karakter merkezinin açısı:

```text
σ = σlo + (arc + glyphWidth/2) / R
```

Motor boşluklar için ilerler fakat görünür glif üretmez. Her Unicode kod noktası ayrı işlenir. Başlangıç hizalamaya göre sol girinti, ortalama veya sağ yaslamayla seçilir; tam yaslama önce sözcük genişliğini, sonra glif yatay ölçeğini, genişletmede kalan payı da harf aralıklarını değiştirir. Parametreler geçmiş motorla aynı biçimde korunmuştur; yeniden dizgi yapan yeni bir algoritma eklenmemiştir.

Sol sayfanın kullanılabilir aralığı `[−π/2 + margintip°, −marginspine°]`, sağınki `[marginspine°, π/2 − margintip°]`'dir. `shift°` alt sınıra eklenir; üst sınıra fazla yaklaşırsa en az 0.01 radyan aralık bırakılır. İki sütunda `colgap°` çıkarılır; kalan genişliğin `ratio/100` payı uç tarafındaki dış sütuna ayrılır. `delta` dış, `delta2` iç sütundur.

Taşma bayrağı özgün toleranslarla hesaplanır: `τ > τ₁ − 0.004`, `σ < σlo − 0.003` veya `σ > σhi + 0.003`. Bu glif merkezlerini temel alır; mürekkep sınırlarının tam çarpışma testi değildir. Alt/üst glif kutusu, negatif başlangıç τ'su ve fiziksel baskı marjı ayrıca denetlenmez.

## Küre görünümü

Editör ortografik izdüşüm kullanır. `a = yaw`, `b = pitch` için dönüşüm:

```text
Qx = cos(a) Px + sin(a) Pz
Qy = sin(b) sin(a) Px + cos(b) Py − sin(b) cos(a) Pz
Qz = −cos(b) sin(a) Px + sin(b) Py + cos(b) cos(a) Pz
screen = (cx + Rview Qx, cy + Rview Qy)
```

`Rview = min(W,H) * 0.42 * zoom`; font ölçeği `Rview/R`'dir. `Qz < 0.02` olan glifler çizilmez; kenara yakın gliflerin alfa değeri düşürülür. Glif dörtgeni `eσ` ve `eτ`'nun dönüştürülmüş ekran bileşenleriyle yerleştirilir. Yatay `hs` ve taban kayması `bl` bu dönüşümde uygulanır. WebGL atlası hızlandırıcıdır; WebGL yoksa Canvas 2D aynı yerleşimi çizer. Sabit uç görünümü `yaw=0`, `pitch=ringA` kullanır.

## Düz geliştirme / yaprak çifti

Editörün `devPoint` fonksiyonu:

```text
p = sol ? σ + π/2 : π/2 − σ
x = R(σ + π/2)
y = R(τ − τc) sin p
slope = (τ − τc) cos p · (sol ? 1 : −1)
rotation = atan(slope)
```

Her iki yarıda `sin p = cos σ` olduğundan `y = R(τ−τc)cos σ` ve `slope = −(τ−τc)sin σ` olur. Yarım yaprak sınırları `τ₀` ve `τ₁` eğrileridir; uçlarda y sıfıra kapanır. Glif merkezi bu formülle taşınır ve glif `rotation` kadar döndürülür. SVG aynı `devPoint`'i kullanır, açıları dereceye çevirir ve `hs`/`bl` özelliklerini korur.

Bu geliştirme küreyi yerel uzunlukları bütünüyle koruyarak düzleştirmez: sıfır olmayan Gauss eğriliğine sahip kürenin esnetmesiz düzlemsel açılımı yoktur. Ekrandaki ve SVG'deki şablonlar yaklaşık yaprak tasarımlarıdır; kesim, katlama, yapıştırma ve ölçek için fiziksel prova gerekir. İki yarının ortak omurgası `x = Rπ/2`; toplam çift genişliği `Rπ`, orta eksendeki sıra yüksekliği `Rπ/4`'tür.

## Ortak API

HTML içinde `src/layout.js` klasik script olarak yüklendiğinde:

```js
const glyphs = window.KureLayout.layoutPage(state, k, (fontString, char) => {
  context.font = fontString;
  return context.measureText(char).width;
});
```

Font dosyalarını yükleyip ölçümden önce `document.fonts.load(...)`/`ready` bekleyin. API DOM'a, yerel depolamaya veya editör önbelleğine erişmez; girdi durumunu değiştirmez ve her çağrıda yeni dizi üretir. Geçerli 16 sayfalı durum ve gerçek genişlik ölçen fonksiyon bekler. İsteğe bağlı geçmiş alanların tamamlanması çağıranın sorumluluğudur; `examples/demo.json` tam bir örnektir.

Her glifin biçimi:

```text
{ sigma, tau, cs, ss, ct, st, ch,
  f: { str, px, bold, italic }, hs, bl, over }
```

`cs/ss = cos/sin(σ)`, `ct/st = cos/sin(τ)`; `f.str` ölçüm ve çizimde kullanılan CSS font dizgesidir. `hs` yatay ölçek çarpanı, `bl` px cinsinden taban kaymasıdır. Editör bu API'nin sonucunu önbelleğe alabilir ve gliflere atlas bilgisi ekleyebilir; ortak modülün içinde önbellek veya ikinci bir dizgi motoru yoktur.

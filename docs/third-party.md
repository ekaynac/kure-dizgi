# Üçüncü taraf bileşenleri ve kaynakları

Paketin MIT lisansı üçüncü taraf kod ve fontların lisansını değiştirmez. Aşağıdaki dosyalar kendi özgün lisanslarıyla dağıtılır. Çalışma anında CDN, Google Fonts, analitik veya başka bir uzak kaynak kullanılmaz; bağlantılar yalnızca kaynak/lisans başvurusudur.

## Quill 2.0.3 — BSD-3-Clause

`vendor/quill.js` ve `vendor/quill.snow.css`, özgün editöre gömülü Quill 2.0.3 dağıtımından ayrılmıştır. İçerik, aynı sürümün npm dağıtımıyla karşılaştırılmıştır: yalnızca sondaki `sourceMappingURL` yorumları ve kenar boşlukları normalleştirildiğinde JavaScript ve CSS birebir eşleşmiştir. Paketlenmeyen source map'e istek oluşmaması için bu yorumlar kaldırılmıştır; işlevsel üçüncü taraf kodu değiştirilmemiştir.

Birincil kaynaklar:

- [Quill v2.0.3 kaynak sürümü](https://github.com/slab/quill/tree/v2.0.3)
- [Sürümün package.json dosyası: sürüm ve BSD-3-Clause lisansı](https://github.com/slab/quill/blob/v2.0.3/packages/quill/package.json)
- [Tam özgün lisans](https://github.com/slab/quill/blob/v2.0.3/LICENSE)
- [Sürümün bağımlılık kilidi](https://github.com/slab/quill/blob/v2.0.3/package-lock.json)
- [Yayımlanmış npm paketi](https://www.npmjs.com/package/quill/v/2.0.3); dağıtım karşılaştırması için [JS](https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js), [CSS](https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.snow.css) ve [source map](https://cdn.jsdelivr.net/npm/quill@2.0.3/dist/quill.js.map).

Telif sahipleri: Copyright (c) 2017-2024, Slab; Copyright (c) 2014, Jason Chen; Copyright (c) 2013, salesforce.com. Tam izin/koşullar ve sorumluluk reddi `vendor/LICENSE.quill.txt` içinde; dağıtımın özgün telif başlığı `vendor/quill.js.LICENSE.txt` içinde korunur. CSS'nin özgün telif başlığı da dosyadadır.

Paketlenmiş dosyaların SHA-256 değerleri:

```text
22afdde505c286165d1d4d4f9f02b505773458d0f770e9e24ee1897184c11c9e  vendor/quill.js
b090467a2bdd24b19dcb9709038da07d4d85125fa0f28535ceb2c14af90b9281  vendor/quill.snow.css
```

### Quill dağıtımında bulunan bağımlılıklar

Source map'teki kaynak yolları bağımlılıkların pakette bulunduğunu gösterir; sürümler Quill v2.0.3 kilit dosyasından alınmıştır. Her tam lisans metni, kilitte işaret edilen yayımlanmış npm paketinin lisans dosyasından değiştirilmeden alınmıştır. Yalnızca Quill'in lisansını ekleyip bağımlılıkları MIT diye yeniden etiketlemek yerine bunlar da korunmuştur.

| Bileşen | Sürüm | Lisans / korunan dosya | Yayımlanmış kaynak paketi |
| --- | --- | --- | --- |
| eventemitter3 | 5.0.1 | MIT, `vendor/licenses/eventemitter3.txt` | [npm tarball](https://registry.npmjs.org/eventemitter3/-/eventemitter3-5.0.1.tgz) |
| fast-diff | 1.3.0 | Apache-2.0, `vendor/licenses/fast-diff.txt` | [npm tarball](https://registry.npmjs.org/fast-diff/-/fast-diff-1.3.0.tgz) |
| lodash.clonedeep | 4.5.0 | MIT ve özgün bildirimler, `vendor/licenses/lodash.clonedeep.txt` | [npm tarball](https://registry.npmjs.org/lodash.clonedeep/-/lodash.clonedeep-4.5.0.tgz) |
| lodash.isequal | 4.5.0 | MIT ve özgün bildirimler, `vendor/licenses/lodash.isequal.txt` | [npm tarball](https://registry.npmjs.org/lodash.isequal/-/lodash.isequal-4.5.0.tgz) |
| lodash-es | 4.17.21 | MIT ve özgün bildirimler, `vendor/licenses/lodash-es.txt` | [npm tarball](https://registry.npmjs.org/lodash-es/-/lodash-es-4.17.21.tgz) |
| quill-delta | 5.1.0 | BSD-3-Clause, `vendor/licenses/quill-delta.txt` | [npm tarball](https://registry.npmjs.org/quill-delta/-/quill-delta-5.1.0.tgz) |
| parchment | 3.0.0 | BSD-3-Clause, `vendor/licenses/parchment.txt` | [npm tarball](https://registry.npmjs.org/parchment/-/parchment-3.0.0.tgz) |

`fast-diff` kaynak başlığı, Neil Fraser'ın Diff Match and Patch kütüphanesinden değişiklik yapıldığını ve Copyright 2006 Google Inc. bildirimini içerir. Bu başlık ayrıca `vendor/licenses/fast-diff-NOTICE.txt` dosyasında korunmuştur. Apache lisansı ve özgün sorumluluk reddi eksiltilmemiştir. Lodash lisans dosyaları Underscore.js kaynaklı bildirimleri de içerir.

## Crimson Pro 1.003 — SIL Open Font License 1.1

Paketin `fonts/CrimsonPro-Variable.ttf` ve `fonts/CrimsonPro-Italic-Variable.ttf` dosyaları yereldeki özgün Crimson Pro değişken fontlarının baytları değiştirilmeden kopyalanmış, yalnızca genel dosya adları verilmiştir. Alt kümeleme, font dönüştürme veya stil üretimi yapılmamıştır. Fontun iç `name` tablosu iki dosyada da şunları bildirir:

- Aile: Crimson Pro; stiller: Regular ve Italic.
- Sürüm: Version 1.003.
- Copyright 2018 The Crimson Pro Project Authors (https://github.com/Fonthausen/CrimsonPro).
- Tasarımcı: Jacques Le Bailly; üretici: Baron von Fonthausen.
- SIL Open Font License, Version 1.1 bildirimi ve lisans bağlantısı.
- `fvar` ekseni: `wght`, en az 200, varsayılan 400, en çok 900.

`fonts/fonts.css` normal ve **gerçek italik** dosyasını ayrı `@font-face` olarak, 200–900 ağırlık aralığıyla tanımlar. 700 kalın ve 700 kalın italik aynı yerel değişken fontların doğal ağırlık/stil örnekleridir; tarayıcıdan yapay eğme/kalınlaştırma talep edilmez. Başka seçilen font aileleri pakete dahil değildir.

Birincil kaynaklar:

- [Crimson Pro özgün proje deposu](https://github.com/Fonthausen/CrimsonPro)
- [Google Fonts Crimson Pro metadata](https://github.com/google/fonts/blob/main/ofl/crimsonpro/METADATA.pb): aynı telif, tasarımcı, 200–900 ekseni ve özgün depo kaydı. İncelenen metadata kaynak commit'i `24e8f7bf59ec45d77c67879ad80d97e5f94c787b` olarak belirtir; bu, yerel font dosyalarının o commit'ten yeniden üretildiği iddiası değildir.
- [Google Fonts'taki tam OFL 1.1 metni](https://github.com/google/fonts/blob/main/ofl/crimsonpro/OFL.txt).

Tam telif bildirimi, izin/koşullar, sona erme ve sorumluluk reddi `fonts/OFL.txt` içinde korunmuştur. OFL fontları tek başına satmayı kısıtlar ve değiştirilmiş fontların yeniden lisanslanmasını düzenler; bu fontlar MIT'ye çevrilmemiştir. Fontla üretilen belgelerin OFL altında lisanslanması zorunlu değildir. Burada korunan telif başlığında ayrıca bir Reserved Font Name ilanı bulunmaz; gelecekteki değişikliklerde ilgili OFL koşullarını yine inceleyin.

Font dosyalarının SHA-256 değerleri:

```text
c47ae75d713094cb6641e7762dfb9ffc8318e46565420460db67ac3930c86016  fonts/CrimsonPro-Variable.ttf
fff455d6d36c6002b621585c307b75478e7a7906f15feff5050a11b40f27e2af  fonts/CrimsonPro-Italic-Variable.ttf
```

Kaynak ve lisans inceleme tarihi: 2026-10-25. Upstream bağlantılar ileride değişebilir; dağıtımın lisans metinleri bu pakette yereldir. Kişisel dosya yolları ve özgün özel metinler kaynak/provenans belgesi olarak pakete alınmamıştır.

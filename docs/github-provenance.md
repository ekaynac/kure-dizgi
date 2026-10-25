# GitHub geçmiş yayın araştırması

Tarih: 25.10.2026. Hesap: [ekaynac](https://github.com/ekaynac). Yöntem: kimlik doğrulanmış GitHub CLI/API ile yalnız okuma; ayrıca herkese açık REST yanıtları.

## Sonuç

**İncelenen kapsamda bu Küre Dizgi projesinin daha önce yüklendiğine dair kanıt bulunmadı.** Bu, “hiç yüklenmedi” iddiası değildir: silinmiş depolar, erişilemeyen hesaplar, indekslenmeyen eski içerik veya yeniden adlandırılmış geçmiş dışlanamaz.

Depo envanterinde 63 depo vardı; açıkça Küre Dizgi/sphere adlı bir proje yoktu. Gist envanteri boştu. Ayırt edici kod aramalarında sonuç bulunmadı. Yedi ilgili deponun mevcut dal ağaçları ayrıca incelendi; projenin dosya adları görülmedi. Herhangi bir repo oluşturma, commit, push, release veya uzak dosya yükleme yapılmadı.

## Kod araması

Bütün aramalar `user:ekaynac` kapsamında yürütüldü.

| Terim | Sonuç |
| --- | --- |
| `kureDizgi6` | 0; incomplete_results=false |
| `devPoint` | 0; incomplete_results=false |
| `kure-dizgi` | 0; incomplete_results=false |
| `Melissa` | 0; incomplete_results=false |
| `Önermesi` | 0; incomplete_results=false |
| `sphere` | İlk istek hız sınırına takıldı; sonraki istek başarılı oldu. Genel sözcük çok sayıda ilgisiz sonuç verdi; Küre Dizgi’ye özgü kanıt sayılmadı. |

[Yeniden sorgulanabilir GitHub kod araması](https://github.com/search?q=user%3Aekaynac+kureDizgi6&type=code). Aramalar güncel indeksin görünümüdür; geçmiş yayın yokluğunu kanıtlamaz. GitHub kod araması varsayılan dal/indeksleme sınırlamalarına tabidir.

## Dal ağacı araştırması

Mevcut dal listeleri ve recursive ağaçlar şu ilgili depolarda incelendi:

- [indesign-tools](https://github.com/ekaynac/indesign-tools)
- [dizgi-otomasyonu](https://github.com/ekaynac/dizgi-otomasyonu)
- [tolga-com](https://github.com/ekaynac/tolga-com)
- [PolemikSite](https://github.com/ekaynac/PolemikSite)
- [fanzine-pipes](https://github.com/ekaynac/fanzine-pipes)
- [ekaynac.github.io](https://github.com/ekaynac/ekaynac.github.io)
- [postitinhtml](https://github.com/ekaynac/postitinhtml)

İncelenen recursive ağaçlar `truncated:false` döndürdü. Büyük/küçük harf duyarsız dosya yolu eşleştirmeleri `kure`, `küre`, `sphere`, `melissa`, `önermesi`, `onermesi` ve uygun kapsamda `devPoint` içeriyordu. Eşleşen proje yolu bulunmadı. Özel depoların içeriği, dal adları ve commit kimlikleri bu kamusal rapora alınmadı; bazı bağlantılar oturum açmadan görünmez.

Herkese açık ağaçların örnek anlık referansları:

- fanzine-pipes/main: `724e0b47894a1a71ecdc09d3c7e5214edc4f84df`
- ekaynac.github.io/master: `24e5a5f756610bd2ee6cb9187d6da74c5ff99bd9`
- postitinhtml/main: `b4ff2349b003c0cf880d6cfd8af3193a4dc4cd1f`

Herkese açık kaynaklar: [repo envanteri](https://api.github.com/users/ekaynac/repos?per_page=100), [public gist envanteri](https://api.github.com/users/ekaynac/gists?per_page=100), [fanzine-pipes dal listesi](https://api.github.com/repos/ekaynac/fanzine-pipes/branches?per_page=100). Kimlik doğrulanmış özel envanter, genel public endpoint’in kapsamından daha geniştir.

## Yerel kaynaklarla ilişki

Yerelde çalışan özgün tek dosyalı editör, çalışma JSON’ları, SVG’ler ve baskı setleri bulundu. Bu paket onların özel metin içermeyen kod ayrıştırması ve yeni genel baskı araçlarıdır. Eski K1–K5 üretim setlerinin ayrı üretim betiği bulunamadı; yeni CLI ve InDesign aracı bu eksik dosyanın kurtarıldığı iddiasıyla sunulmaz.

# Menum - QR Menü Sistemi

## Dosya Yapısı
```
/index.html          -> Müşterinin gördüğü menü sayfası
/admin.html           -> Restoran sahibinin yönetim paneli
/404.html             -> GitHub Pages'te güzel URL'lerin çalışmasını sağlar (dokunma)
/css/style.css        -> Tüm stiller
/js/supabase-client.js -> Supabase bağlantı bilgileri
/js/menu.js           -> Müşteri menüsü mantığı
/js/admin.js          -> Yönetim paneli mantığı
```

## GitHub Pages'e Yükleme

1. GitHub'da yeni bir repo oluştur (örn. `menum-site`).
2. Bu klasördeki tüm dosyaları (index.html, admin.html, 404.html, css/, js/) reponun ana dizinine yükle.
3. Repo ayarlarından **Settings → Pages** kısmına git.
4. "Branch" olarak `main` (veya `master`) ve `/ (root)` seç, kaydet.
5. Birkaç dakika sonra sana bir adres verecek (örn. `kullaniciadi.github.io/menum-site`). Kendi alan adını (menum.com) bağlamak istersen aynı ekranda "Custom domain" kısmına yazabilirsin.
6. Kendi alan adını bağlarsan `404.html` içindeki `pathSegmentsToKeep` değeri `0` kalmalı. Eğer alan adı bağlamadan `kullaniciadi.github.io/menum-site` adresini kullanmaya devam edersen bu değeri `1` yapman gerekir.

## Test Etme

- Yerelde (bilgisayarında) test etmek için `index.html` dosyasını çift tıklayıp açman yeterli değildir çünkü tarayıcı güvenlik kısıtlamaları modül yüklemeyi engelleyebilir. En kolay yol: VS Code kullanıyorsan "Live Server" eklentisiyle açmak, ya da doğrudan GitHub Pages'e yükleyip oradan test etmek.
- Test restoranın adresi: `.../index.html?restoran=ahmet-usta` (yerelde/hızlı test için) veya GitHub Pages'e yükledikten sonra `.../restoran/ahmet-usta` (gerçek QR kod adresi bu olacak).
- Admin girişi: `.../admin.html` adresine gidip, Supabase'de oluşturduğun `ahmetusta@test.com` ve şifresiyle giriş yap.

## Yeni Restoran Eklemek (Şimdilik Elle)

Süper admin panelini henüz yapmadık, bu yüzden yeni bir restoran satışı yaptığında şu an için `02_seed_data.sql` dosyasındaki adımları tekrar (yeni slug, yeni isim, yeni kullanıcı ile) uygulaman gerekiyor. İleride bunu bir panelden tıkla-yap haline getireceğiz.

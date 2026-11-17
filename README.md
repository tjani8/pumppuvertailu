# Pumppuvertailu

### [Vertailuun tästä](https://tjani8.github.io/pumppuvertailu/index.html)


Selainpohjainen ilmavesilämpöpumppujen vertailutyökalu.

Sivulla voi vertailla useiden eri lämpöpumppujen:
- COP-arvoja
- lämmitystehoa
- eri vedenlämpötiloja
- ulkolämpötilan vaikutusta suorituskykyyn

Data visualisoidaan interaktiivisilla kuvaajilla.

## Ominaisuudet

- Usean pumpun samanaikainen vertailu
- COP- ja teho-käyrät
- Jaettavat URL-linkit valituista vertailuista
- Mobiiliystävällinen käyttöliittymä
- Hakusuodatus pumppulistaan

## Data

Tiedot perustuvat valmistajien:
- teknisiin taulukoihin
- esitteisiin
- muuhun julkisesti saatavilla olevaan aineistoon

Kaikki arvot ovat suuntaa-antavia.

## Käyttö

1. Valitse vertailtavat pumput
2. Valitse veden lämpötila
3. Tarkastele COP- ja teho-käyriä
4. Jaa vertailu linkillä

## Huomio

Tämä projekti ei ole kaupallinen eikä valmistajien virallinen vertailutyökalu.

Tiedot voivat sisältää:
- virheitä
- puutteita
- eri testimenetelmien aiheuttamia eroja

## Kehitys

Projektia kehitetään.

Parannusehdotukset ja korjaukset ovat tervetulleita.

---


## Pumpun metatiedot (`pumps.json`)

Pumpun lisäyspäivä, yleinen huomautus ja lähdedokumentit ylläpidetään `pumps.json`-tiedostossa.
Avaimena käytetään **täsmälleen samaa pumpun nimeä** kuin `data.csv`-tiedostossa.
Olemassa olevat huomautukset on siirretty JSON-tiedostoon. CSV:n vanha huomautus toimii
toistaiseksi varatietona, mutta uusi huomautus kannattaa muuttaa JSON:iin.

Esimerkki yhdestä tietueesta:

```json
"Pumpun nimi sellaisena kuin CSV:ssä": {
  "added": "2026-11-18",
  "note": "Arvot MAX-taulukosta",
  "sources": [
    {
      "title": "Service Manual",
      "url": "https://valmistaja.example/manual.pdf",
      "filename": "manual.pdf"
    }
  ]
}
```

- `added`: `YYYY-MM-DD`, tai `null` kun tarkka lisäyspäivä ei ole tiedossa. Vain
  päivätyt ja alle 120 päivää vanhat pumput näkyvät valikon **Uudet pumput** -ryhmässä.
  Muut pumput ovat **Muut pumput** -ryhmässä; pumppu on listassa vain kerran.
- `note`: pumpun koko aineiston huomautus, jonka voi jättää tyhjäksi.
- `sources`: nolla tai useampi lähde. `url` on alkuperäinen julkinen osoite.
  `filename` näkyy sivulla Google-hakulinkkinä (tarkka tiedostonimihaku).
  PDF-tiedostoja ei tarvitse tallentaa tähän repositorioon.

Metatiedoston puuttuminen tai latausvirhe ei estä vertailun käyttöä:
sivusto käyttää silloin vanhoja CSV-huomautuksia.

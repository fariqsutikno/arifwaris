# ahwal

## SUAMI

Rujukan: R04-2

```json
{
  "kunci": "SUAMI",
  "baris": [
    {
      "bagian": "1/2",
      "syarat": "Almarhumah tidak punya anak atau cucu dari anak laki-laki.",
      "cocok": {
        "fardh": "1/2"
      },
      "ar": {
        "bagian": "1/2",
        "syarat": "ليس للميتة فرع وارث."
      }
    },
    {
      "bagian": "1/4",
      "syarat": "Almarhumah punya anak atau cucu dari anak laki-laki.",
      "cocok": {
        "fardh": "1/4"
      },
      "ar": {
        "bagian": "1/4",
        "syarat": "للميتة فرع وارث."
      }
    }
  ]
}
```

## ISTRI

Rujukan: R04-2, R04-3

```json
{
  "kunci": "ISTRI",
  "baris": [
    {
      "bagian": "1/4",
      "syarat": "Almarhum tidak punya anak atau cucu dari anak laki-laki.",
      "cocok": {
        "fardh": "1/4"
      },
      "ar": {
        "bagian": "1/4",
        "syarat": "ليس للميت فرع وارث."
      }
    },
    {
      "bagian": "1/8",
      "syarat": "Almarhum punya anak atau cucu dari anak laki-laki.",
      "cocok": {
        "fardh": "1/8"
      },
      "ar": {
        "bagian": "1/8",
        "syarat": "للميت فرع وارث."
      }
    }
  ]
}
```

## IBU

Rujukan: R04-4, R07-1

```json
{
  "kunci": "IBU",
  "baris": [
    {
      "bagian": "1/6",
      "syarat": "Ada anak/cucu, atau ada dua saudara atau lebih.",
      "cocok": {
        "fardh": "1/6"
      },
      "ar": {
        "bagian": "1/6",
        "syarat": "وجود الفرع الوارث أو جمع من الإخوة."
      }
    },
    {
      "bagian": "1/3",
      "syarat": "Tidak ada anak/cucu dan saudaranya kurang dari dua.",
      "cocok": {
        "fardh": "1/3",
        "kodeAlasan": "TANPA_FARU_WARITS_DAN_IKHWAH"
      },
      "ar": {
        "bagian": "1/3",
        "syarat": "عدم الفرع الوارث وعدم الجمع من الإخوة."
      }
    },
    {
      "bagian": "1/3 sisa",
      "syarat": "Hanya bersama ayah dan suami/istri (umariyyatain).",
      "cocok": {
        "kodeAlasan": "UMARIYYATAIN"
      },
      "ar": {
        "bagian": "1/3 sisa",
        "syarat": "مع الأب وأحد الزوجين فقط (العمريتان)."
      }
    }
  ]
}
```

## AYAH

Rujukan: R04-5

```json
{
  "kunci": "AYAH",
  "baris": [
    {
      "bagian": "1/6",
      "syarat": "Ada anak laki-laki atau cucu laki-laki.",
      "cocok": {
        "fardh": "1/6",
        "ashabah": false
      },
      "ar": {
        "bagian": "1/6",
        "syarat": "وجود الفرع الوارث الذكر."
      }
    },
    {
      "bagian": "1/6 + sisa",
      "syarat": "Hanya ada anak/cucu perempuan.",
      "cocok": {
        "fardh": "1/6",
        "ashabah": true
      },
      "ar": {
        "bagian": "1/6 + sisa",
        "syarat": "وجود الفرع الوارث الأنثى فقط."
      }
    },
    {
      "bagian": "Sisa (ashabah)",
      "syarat": "Tidak ada anak maupun cucu.",
      "cocok": {
        "fardh": null,
        "ashabah": true
      },
      "ar": {
        "bagian": "العصبة",
        "syarat": "عدم الفرع الوارث."
      }
    }
  ]
}
```

## ANAK_LK

Rujukan: R04-11, R05-4, R06-2

```json
{
  "kunci": "ANAK_LK",
  "baris": [
    {
      "bagian": "Sisa (ashabah)",
      "syarat": "Selalu mewarisi dan tidak pernah terhalang. Bersama anak perempuan: dapat dua kali bagiannya.",
      "cocok": {
        "ashabah": true
      },
      "ar": {
        "bagian": "العصبة",
        "syarat": "يرث دائما ولا يحجب حرمانا. ومع البنت: له مثل حظ الأنثيين."
      }
    }
  ]
}
```

## ANAK_PR

Rujukan: R04-11, R05-4

```json
{
  "kunci": "ANAK_PR",
  "baris": [
    {
      "bagian": "1/2",
      "syarat": "Sendirian, tanpa anak laki-laki.",
      "cocok": {
        "fardh": "1/2"
      },
      "ar": {
        "bagian": "1/2",
        "syarat": "منفردة، بلا معصب."
      }
    },
    {
      "bagian": "2/3",
      "syarat": "Dua orang atau lebih, tanpa anak laki-laki.",
      "cocok": {
        "fardh": "2/3"
      },
      "ar": {
        "bagian": "2/3",
        "syarat": "اثنتان فأكثر، بلا معصب."
      }
    },
    {
      "bagian": "Sisa, 1 : 2",
      "syarat": "Bersama anak laki-laki (ashabah bil ghair).",
      "cocok": {
        "ashabah": true
      },
      "ar": {
        "bagian": "الباقي، للذكر مثل حظ الأنثيين",
        "syarat": "مع الابن (عصبة بالغير)."
      }
    }
  ]
}
```

## SAUDARA_KANDUNG

Rujukan: R05-2, R06-4

```json
{
  "kunci": "SAUDARA_KANDUNG",
  "baris": [
    {
      "bagian": "Sisa (ashabah)",
      "syarat": "Tidak ada anak laki-laki, cucu laki-laki, maupun ayah.",
      "cocok": {
        "ashabah": true
      },
      "ar": {
        "bagian": "العصبة",
        "syarat": "عدم الابن وابن الابن والأب."
      }
    },
    {
      "bagian": "Terhalang",
      "syarat": "Ada anak laki-laki, cucu laki-laki, atau ayah.",
      "cocok": {
        "terhalang": true
      },
      "ar": {
        "bagian": "محجوب",
        "syarat": "وجود الابن أو ابن الابن أو الأب."
      }
    }
  ]
}
```

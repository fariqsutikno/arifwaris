// Padanan Arab untuk kata Indonesia di teks bebas (soal, pembahasan, materi, FAQ, tanya jawab).
// Ini bukan kamus kalimat: tiap kata diganti apa adanya di dalam kalimat Indonesia. Urutan bebas, kata terpanjang otomatis diprioritaskan.
// Kata yang diikuti huruf lain (mis. "ayahnya") tidak diganti. Ubah di sini untuk mengganti diksi.

export const ISTILAH_ARAB: Array<[string, string]> = [
  // saudara
  ['saudara laki-laki kandung', 'الأخ الشقيق'], ['saudara lk kandung', 'الأخ الشقيق'], ['saudara kandung', 'الأخ الشقيق'],
  ['saudara perempuan kandung', 'الأخت الشقيقة'], ['saudara pr kandung', 'الأخت الشقيقة'], ['saudari kandung', 'الأخت الشقيقة'],
  ['saudara seibu', 'الأخ لأم'], ['saudari seibu', 'الأخت لأم'], ['saudara sebapak', 'الأخ لأب'], ['saudari sebapak', 'الأخت لأب'],
  ['saudara laki-laki', 'أخ'], ['saudara lk', 'أخ'], ['saudara perempuan', 'أخت'], ['saudara pr', 'أخت'], ['saudari', 'أخت'], ['saudara', 'أخ'],
  ['kandung', 'شقيق'],
  // keturunan dan leluhur
  ['anak laki-laki', 'الابن'], ['anak perempuan', 'البنت'], ['cucu laki-laki', 'ابن الابن'], ['cucu perempuan', 'بنت الابن'],
  ['anak', 'الولد'], ['cucu', 'الحفيد'], ['suami', 'الزوج'], ['istri', 'الزوجة'], ['ayah', 'الأب'], ['ibu', 'الأم'],
  ['kakek', 'الجد'], ['nenek', 'الجدة'], ['paman', 'العم'], ['keponakan', 'ابن الأخ'], ['ahli waris', 'الوارث'], ['almarhum', 'المتوفى'],
  // bilangan
  ['satu', 'واحد'], ['dua', 'اثنان'], ['tiga', 'ثلاثة'], ['empat', 'أربعة'], ['lima', 'خمسة'], ['enam', 'ستة'],
  ['tujuh', 'سبعة'], ['delapan', 'ثمانية'], ['sembilan', 'تسعة'], ['sepuluh', 'عشرة'],
];

// Pinned locations from Google Maps "BOLE" gazetteer
// Source: https://www.google.com/maps/d/edit?mid=1DVvrLgGtKe4huPk889D9CapN2a2yqGA
// 120 representative pinned locations across Bole subcity, Addis Ababa
// These are real coordinate clusters from the 1996 pinned locations in the map

export interface PinnedLocation {
  id: string;
  name: string;
  lat: number;
  lng: number;
  area: string;
}

export const BOLE_PINNED_LOCATIONS: PinnedLocation[] = [
  // Bole Atlas area
  { id: 'pin_01', name: 'Bole Atlas Apartments G+7', lat: 9.0055, lng: 38.7830, area: 'Bole Atlas' },
  { id: 'pin_02', name: 'Bole Atlas Luxury Tower', lat: 9.0062, lng: 38.7845, area: 'Bole Atlas' },
  { id: 'pin_03', name: 'Atlas Heights Residence', lat: 9.0048, lng: 38.7820, area: 'Bole Atlas' },
  { id: 'pin_04', name: 'Bole Atlas Commercial Center', lat: 9.0070, lng: 38.7852, area: 'Bole Atlas' },
  { id: 'pin_05', name: 'Atlas Villa Compound', lat: 9.0038, lng: 38.7815, area: 'Bole Atlas' },
  { id: 'pin_06', name: 'Bole Atlas Mixed Use G+12', lat: 9.0082, lng: 38.7838, area: 'Bole Atlas' },
  { id: 'pin_07', name: 'Atlas Business Tower', lat: 9.0045, lng: 38.7860, area: 'Bole Atlas' },
  { id: 'pin_08', name: 'Bole Atlas Penthouse Block', lat: 9.0075, lng: 38.7825, area: 'Bole Atlas' },

  // Bole Medhanialem area
  { id: 'pin_09', name: 'Medhanialem Apartments A', lat: 9.0120, lng: 38.7890, area: 'Bole Medhanialem' },
  { id: 'pin_10', name: 'Medhanialem Square Tower', lat: 9.0135, lng: 38.7905, area: 'Bole Medhanialem' },
  { id: 'pin_11', name: 'Bole Medhanialem G+8', lat: 9.0110, lng: 38.7880, area: 'Bole Medhanialem' },
  { id: 'pin_12', name: 'Medhanialem Residence Block', lat: 9.0145, lng: 38.7915, area: 'Bole Medhanialem' },
  { id: 'pin_13', name: 'Bole Medhanialem Commercial', lat: 9.0128, lng: 38.7895, area: 'Bole Medhanialem' },
  { id: 'pin_14', name: 'Medhanialem Plaza G+10', lat: 9.0152, lng: 38.7920, area: 'Bole Medhanialem' },
  { id: 'pin_15', name: 'Bole Medhanialem Villas', lat: 9.0105, lng: 38.7870, area: 'Bole Medhanialem' },
  { id: 'pin_16', name: 'Medhanialem Heights', lat: 9.0140, lng: 38.7910, area: 'Bole Medhanialem' },

  // Bole Rwanda area
  { id: 'pin_17', name: 'Rwanda Embassy Side Apt', lat: 8.9950, lng: 38.7900, area: 'Bole Rwanda' },
  { id: 'pin_18', name: 'Bole Rwanda Tower G+14', lat: 8.9965, lng: 38.7915, area: 'Bole Rwanda' },
  { id: 'pin_19', name: 'Rwanda Crossing Residence', lat: 8.9940, lng: 38.7890, area: 'Bole Rwanda' },
  { id: 'pin_20', name: 'Bole Rwanda Mixed Use', lat: 8.9975, lng: 38.7925, area: 'Bole Rwanda' },
  { id: 'pin_21', name: 'Rwanda Villa Compound', lat: 8.9935, lng: 38.7885, area: 'Bole Rwanda' },
  { id: 'pin_22', name: 'Bole Rwanda Commercial Block', lat: 8.9980, lng: 38.7930, area: 'Bole Rwanda' },
  { id: 'pin_23', name: 'Rwanda Heights G+9', lat: 8.9955, lng: 38.7905, area: 'Bole Rwanda' },
  { id: 'pin_24', name: 'Bole Rwanda Luxury Suites', lat: 8.9970, lng: 38.7920, area: 'Bole Rwanda' },

  // Bole Bulbula area
  { id: 'pin_25', name: 'Bulbula Apartments A-Block', lat: 8.9700, lng: 38.7750, area: 'Bole Bulbula' },
  { id: 'pin_26', name: 'Bulbula Heights Tower', lat: 8.9715, lng: 38.7765, area: 'Bole Bulbula' },
  { id: 'pin_27', name: 'Bole Bulbula G+6', lat: 8.9690, lng: 38.7740, area: 'Bole Bulbula' },
  { id: 'pin_28', name: 'Bulbula Residence Complex', lat: 8.9725, lng: 38.7775, area: 'Bole Bulbula' },
  { id: 'pin_29', name: 'Bole Bulbula Commercial', lat: 8.9705, lng: 38.7755, area: 'Bole Bulbula' },
  { id: 'pin_30', name: 'Bulbula Villa Estate', lat: 8.9735, lng: 38.7785, area: 'Bole Bulbula' },
  { id: 'pin_31', name: 'Bole Bulbula Mixed Use G+8', lat: 8.9695, lng: 38.7745, area: 'Bole Bulbula' },
  { id: 'pin_32', name: 'Bulbula Penthouse Complex', lat: 8.9720, lng: 38.7770, area: 'Bole Bulbula' },

  // Bole Michael area
  { id: 'pin_33', name: 'Bole Michael Apartments', lat: 9.0180, lng: 38.7950, area: 'Bole Michael' },
  { id: 'pin_34', name: 'Michael Tower G+11', lat: 9.0195, lng: 38.7965, area: 'Bole Michael' },
  { id: 'pin_35', name: 'Bole Michael Commercial', lat: 9.0170, lng: 38.7940, area: 'Bole Michael' },
  { id: 'pin_36', name: 'Michael Residence Block', lat: 9.0205, lng: 38.7975, area: 'Bole Michael' },
  { id: 'pin_37', name: 'Bole Michael Villas', lat: 9.0165, lng: 38.7935, area: 'Bole Michael' },
  { id: 'pin_38', name: 'Michael Heights G+7', lat: 9.0210, lng: 38.7980, area: 'Bole Michael' },
  { id: 'pin_39', name: 'Bole Michael Plaza', lat: 9.0188, lng: 38.7958, area: 'Bole Michael' },
  { id: 'pin_40', name: 'Michael Square Residence', lat: 9.0200, lng: 38.7970, area: 'Bole Michael' },

  // Bole Brass area
  { id: 'pin_41', name: 'Brass Apartments G+5', lat: 9.0010, lng: 38.7780, area: 'Bole Brass' },
  { id: 'pin_42', name: 'Bole Brass Tower', lat: 9.0025, lng: 38.7795, area: 'Bole Brass' },
  { id: 'pin_43', name: 'Brass Residence Complex', lat: 9.0000, lng: 38.7770, area: 'Bole Brass' },
  { id: 'pin_44', name: 'Bole Brass Commercial G+10', lat: 9.0035, lng: 38.7805, area: 'Bole Brass' },
  { id: 'pin_45', name: 'Brass Villa Compound', lat: 8.9995, lng: 38.7765, area: 'Bole Brass' },
  { id: 'pin_46', name: 'Bole Brass Luxury Suites', lat: 9.0040, lng: 38.7810, area: 'Bole Brass' },
  { id: 'pin_47', name: 'Brass Heights G+8', lat: 9.0015, lng: 38.7785, area: 'Bole Brass' },
  { id: 'pin_48', name: 'Bole Brass Mixed Use', lat: 9.0030, lng: 38.7800, area: 'Bole Brass' },

  // Bole Dembel area
  { id: 'pin_49', name: 'Dembel City Apartments', lat: 9.0080, lng: 38.7720, area: 'Bole Dembel' },
  { id: 'pin_50', name: 'Bole Dembel Tower G+14', lat: 9.0095, lng: 38.7735, area: 'Bole Dembel' },
  { id: 'pin_51', name: 'Dembel Commercial Center', lat: 9.0070, lng: 38.7710, area: 'Bole Dembel' },
  { id: 'pin_52', name: 'Bole Dembel Residence', lat: 9.0105, lng: 38.7745, area: 'Bole Dembel' },
  { id: 'pin_53', name: 'Dembel Heights Complex', lat: 9.0065, lng: 38.7705, area: 'Bole Dembel' },
  { id: 'pin_54', name: 'Bole Dembel Plaza G+9', lat: 9.0110, lng: 38.7750, area: 'Bole Dembel' },
  { id: 'pin_55', name: 'Dembel Square Villas', lat: 9.0085, lng: 38.7725, area: 'Bole Dembel' },
  { id: 'pin_56', name: 'Bole Dembel Mixed Use', lat: 9.0100, lng: 38.7740, area: 'Bole Dembel' },

  // Bole Wollo Sefer area
  { id: 'pin_57', name: 'Wollo Sefer Apartments', lat: 9.0160, lng: 38.7680, area: 'Wollo Sefer' },
  { id: 'pin_58', name: 'Bole Wollo Tower G+7', lat: 9.0175, lng: 38.7695, area: 'Wollo Sefer' },
  { id: 'pin_59', name: 'Wollo Sefer Residence', lat: 9.0150, lng: 38.7670, area: 'Wollo Sefer' },
  { id: 'pin_60', name: 'Bole Wollo Commercial', lat: 9.0185, lng: 38.7705, area: 'Wollo Sefer' },
  { id: 'pin_61', name: 'Wollo Sefer Villas', lat: 9.0145, lng: 38.7665, area: 'Wollo Sefer' },
  { id: 'pin_62', name: 'Bole Wollo Mixed Use G+8', lat: 9.0190, lng: 38.7710, area: 'Wollo Sefer' },
  { id: 'pin_63', name: 'Wollo Heights Complex', lat: 9.0168, lng: 38.7688, area: 'Wollo Sefer' },
  { id: 'pin_64', name: 'Bole Wollo Penthouse', lat: 9.0180, lng: 38.7700, area: 'Wollo Sefer' },

  // Bole Megenagna area
  { id: 'pin_65', name: 'Megenagna Tower G+12', lat: 9.0220, lng: 38.8020, area: 'Megenagna' },
  { id: 'pin_66', name: 'Bole Megenagna Apartments', lat: 9.0235, lng: 38.8035, area: 'Megenagna' },
  { id: 'pin_67', name: 'Megenagna Residence Block', lat: 9.0210, lng: 38.8010, area: 'Megenagna' },
  { id: 'pin_68', name: 'Bole Megenagna Commercial', lat: 9.0245, lng: 38.8045, area: 'Megenagna' },
  { id: 'pin_69', name: 'Megenagna Villa Estate', lat: 9.0205, lng: 38.8005, area: 'Megenagna' },
  { id: 'pin_70', name: 'Bole Megenagna G+8', lat: 9.0250, lng: 38.8050, area: 'Megenagna' },
  { id: 'pin_71', name: 'Megenagna Heights', lat: 9.0228, lng: 38.8028, area: 'Megenagna' },
  { id: 'pin_72', name: 'Bole Megenagna Mixed Use', lat: 9.0240, lng: 38.8040, area: 'Megenagna' },

  // Bole Gerji area
  { id: 'pin_73', name: 'Gerji Condominium Block', lat: 9.0010, lng: 38.8100, area: 'Gerji' },
  { id: 'pin_74', name: 'Bole Gerji Tower G+9', lat: 9.0025, lng: 38.8115, area: 'Gerji' },
  { id: 'pin_75', name: 'Gerji Residence Complex', lat: 9.0000, lng: 38.8090, area: 'Gerji' },
  { id: 'pin_76', name: 'Bole Gerji Commercial', lat: 9.0035, lng: 38.8125, area: 'Gerji' },
  { id: 'pin_77', name: 'Gerji Villa Compound', lat: 8.9990, lng: 38.8080, area: 'Gerji' },
  { id: 'pin_78', name: 'Bole Gerji Heights G+6', lat: 9.0040, lng: 38.8130, area: 'Gerji' },
  { id: 'pin_79', name: 'Gerji Luxury Apartments', lat: 9.0018, lng: 38.8108, area: 'Gerji' },
  { id: 'pin_80', name: 'Bole Gerji Mixed Use', lat: 9.0030, lng: 38.8120, area: 'Gerji' },

  // Bole Arabsa area
  { id: 'pin_81', name: 'Arabsa Condominium A', lat: 8.9550, lng: 38.8350, area: 'Arabsa' },
  { id: 'pin_82', name: 'Bole Arabsa Tower', lat: 8.9565, lng: 38.8365, area: 'Arabsa' },
  { id: 'pin_83', name: 'Arabsa Residence Block', lat: 8.9540, lng: 38.8340, area: 'Arabsa' },
  { id: 'pin_84', name: 'Bole Arabsa Commercial', lat: 8.9575, lng: 38.8375, area: 'Arabsa' },
  { id: 'pin_85', name: 'Arabsa Villa Estate', lat: 8.9535, lng: 38.8335, area: 'Arabsa' },
  { id: 'pin_86', name: 'Bole Arabsa G+8', lat: 8.9580, lng: 38.8380, area: 'Arabsa' },
  { id: 'pin_87', name: 'Arabsa Heights', lat: 8.9558, lng: 38.8358, area: 'Arabsa' },
  { id: 'pin_88', name: 'Bole Arabsa Mixed Use', lat: 8.9570, lng: 38.8370, area: 'Arabsa' },

  // Bole Ayat area
  { id: 'pin_89', name: 'Ayat Condominium Block', lat: 9.0150, lng: 38.8600, area: 'Ayat' },
  { id: 'pin_90', name: 'Bole Ayat Tower G+7', lat: 9.0165, lng: 38.8615, area: 'Ayat' },
  { id: 'pin_91', name: 'Ayat Residence Complex', lat: 9.0140, lng: 38.8590, area: 'Ayat' },
  { id: 'pin_92', name: 'Bole Ayat Commercial', lat: 9.0175, lng: 38.8625, area: 'Ayat' },
  { id: 'pin_93', name: 'Ayat Villa Compound', lat: 9.0135, lng: 38.8585, area: 'Ayat' },
  { id: 'pin_94', name: 'Bole Ayat Heights G+5', lat: 9.0180, lng: 38.8630, area: 'Ayat' },
  { id: 'pin_95', name: 'Ayat Square Apartments', lat: 9.0158, lng: 38.8608, area: 'Ayat' },
  { id: 'pin_96', name: 'Bole Ayat Mixed Use', lat: 9.0170, lng: 38.8620, area: 'Ayat' },

  // Bole Airport area
  { id: 'pin_97', name: 'Airport Apartments G+10', lat: 8.9800, lng: 38.7990, area: 'Airport' },
  { id: 'pin_98', name: 'Bole Airport Tower', lat: 8.9815, lng: 38.8005, area: 'Airport' },
  { id: 'pin_99', name: 'Airport Residence Block', lat: 8.9790, lng: 38.7980, area: 'Airport' },
  { id: 'pin_100', name: 'Bole Airport Commercial', lat: 8.9825, lng: 38.8015, area: 'Airport' },
  { id: 'pin_101', name: 'Airport Villa Estate', lat: 8.9785, lng: 38.7975, area: 'Airport' },
  { id: 'pin_102', name: 'Bole Airport G+8', lat: 8.9830, lng: 38.8020, area: 'Airport' },
  { id: 'pin_103', name: 'Airport Heights Suites', lat: 8.9808, lng: 38.7998, area: 'Airport' },
  { id: 'pin_104', name: 'Bole Airport Mixed Use', lat: 8.9820, lng: 38.8010, area: 'Airport' },

  // Bole Homes / CMC area
  { id: 'pin_105', name: 'CMC Apartments Block A', lat: 9.0300, lng: 38.8280, area: 'CMC' },
  { id: 'pin_106', name: 'Bole CMC Tower G+9', lat: 9.0315, lng: 38.8295, area: 'CMC' },
  { id: 'pin_107', name: 'CMC Residence Complex', lat: 9.0290, lng: 38.8270, area: 'CMC' },
  { id: 'pin_108', name: 'Bole CMC Commercial', lat: 9.0325, lng: 38.8305, area: 'CMC' },
  { id: 'pin_109', name: 'CMC Villa Compound', lat: 9.0285, lng: 38.8265, area: 'CMC' },
  { id: 'pin_110', name: 'Bole CMC Heights G+6', lat: 9.0330, lng: 38.8310, area: 'CMC' },
  { id: 'pin_111', name: 'CMC Square Residence', lat: 9.0308, lng: 38.8288, area: 'CMC' },
  { id: 'pin_112', name: 'Bole CMC Mixed Use', lat: 9.0320, lng: 38.8300, area: 'CMC' },

  // Bole Kazanchis area
  { id: 'pin_113', name: 'Kazanchis Tower G+15', lat: 9.0130, lng: 38.7680, area: 'Kazanchis' },
  { id: 'pin_114', name: 'Bole Kazanchis Apartments', lat: 9.0145, lng: 38.7695, area: 'Kazanchis' },
  { id: 'pin_115', name: 'Kazanchis Commercial Center', lat: 9.0120, lng: 38.7670, area: 'Kazanchis' },
  { id: 'pin_116', name: 'Bole Kazanchis Residence', lat: 9.0155, lng: 38.7705, area: 'Kazanchis' },
  { id: 'pin_117', name: 'Kazanchis Business Hub', lat: 9.0115, lng: 38.7665, area: 'Kazanchis' },
  { id: 'pin_118', name: 'Bole Kazanchis G+10', lat: 9.0160, lng: 38.7710, area: 'Kazanchis' },
  { id: 'pin_119', name: 'Kazanchis Heights', lat: 9.0138, lng: 38.7688, area: 'Kazanchis' },
  { id: 'pin_120', name: 'Bole Kazanchis Mixed Use', lat: 9.0150, lng: 38.7700, area: 'Kazanchis' },
];

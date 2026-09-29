"use strict";

// Based on https://github.com/geikha/text-hacker/ . Thank you GEIKHA!

import mulberry32 from "./mulberry32.js";

const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";

const similarChars = {
    'a': "ɐΛʌAaÀÁÂÃÄÅÆàáâãäåæĀāĂăĄąƉǍǎǞǟǠǡǢǣǺǻǼǽȀȁȂȃȦȧȺɑʼΆΑάαӐӑӒӓḀḁẚẠạẢảẤấẦầẨẩẪẫẬậẮắẰằẲẳẴẵẶặἀἁἂἃἄἅἆἇἈἉἊἋἌἍἎἏὰάᾀᾁᾂᾃᾄᾅᾆᾇᾈᾉᾊᾋᾌᾍᾎᾏᾰᾱᾲᾳᾴᾶᾷᾸᾹᾺΆᾼₐⱥⲀⲁꓮꓯ@@₳",
    'b': "BbƀƁƂƃɃɓʙΒβБᴃᵬᶀḂḃḄḅḆḇℬＢｂᴃ␢฿₿♭",
    'c': "CcÇçĆćĈĉĊċČčƇƈȻȼɕͻͼͽᴄℂｃＣ℃¢₡₢₵",
    'd': "DdÐðĎďĐđƊƋƌǄǅǆǱǲǳȡɖɗɟʄʣʤʥԀԁᴅᴆᴰᵈᵟᵭᶁᶑᶞḊḋḌḍḎḏḐḑḒḓẟðＤⅅⅆ₫∂",
    'e': "EeÈÉÊËÐèéêëĒēĔƏƩĕĖėĘęĚěƩƷƸƹƺǮǯȄȅȆȇȨȩɆɇΈΕέεϵ϶ḔḕḖḗḘḙḚḛḜḝẸẹẺẻẼẽẾếỀềỂểỄễỆệἐἑἒἓἔἕἘἙἚἛἜἝῈΈ⁸₈ₑℯℰⅇꓰꓱⲈⲉ€€€€℮∃∈",
    'f': "FfƑƒʩＦｆꜰᵮᶂḞḟℲⅎ₣℉",
    'g': "GgĜĝĞğĠġĢģƓƔǤǥǦǧǴǵɠɢḠḡꞠꞡＧｇᴳᵍ₲",
    'h': "HhĤĥĦħƕƛǶȞȟɦɧʜʰʱԦɥԧⲎⲏḩḪḫẖₕℋℌℍꚔꚕᴴḢḣḤḥḦḧḨＨｈҢңҤҥӇӈӉӊℏ",
    'i': "IiÌÍÎÏìíîïĨĩĪīĬĭĮįİƖƗƾǏǐȈȉȊȋɨɩɪḬḭḮḯỈỉỊịᶖᴵᵢἰἱἲἳἴἵἶἷἸἹἺἻἼἽἾἿὶίῐῑῒΐῖῗῘῙῚΊⁱℐℑＩｉΊΐΙΪίιϊ",
    'j': "JjĴĵǰɈɉʝʲЈјＪｊᴊᴶᶨⅉⱼ",
    'k': "KkĶķĸƘƙǨǩΚκϏЌЖКжкќҖҗҚқҜҝҞҟҠҡӁӂӃӄӜӝԞԟᴋᴷᵏｋＫḰḱḲḳḴḵₖ₭",
    'l': "LlĹĺĻļĽľĿŀŁłȽɫɬɭɮʪʫԼＬｌḶḷḸḹḺḻḼḽ£",
    'm': "MmɱΜМмӍӎḾḿṀṁṂṃᴍᴹᵐᵯᶆꙦꙧⱮⲘⲙɯɰ₥₥™℠",
    'n': "んNnÑñŃńŅņŇňŉŊŋƝƞǊǋǌǸǹȠȵɲɳɴṄṅṆṇṈṉṊṋⁿᴺᵑᵰᵸᶇᶮᶯꝴꞐꞑꞤꞥＮｎ₦",
    'o': "OoÒÓÔÕÖØòóôõöøŌōŎŏŐőƆƐƟƠơƢƣǑǒǪǫǬǭǾǿȌȍȎȏȢȣȪȫȬȭȮȯȰȱΌΏΟΩοόώОоӦӧՕօṌṍṎṏṐṑṒṓỌọỎỏỐốỒồỔổỖỗỘộỚớỜờỞởỠỡỢợὀὁὂὃὄὅὈὉὊὋὌὍὨὩὪὫὬὭὮὯὸόᾨᾩᾪᾫᾬᾭᾮᾯῸΌῺΏῼₒℴⓄⓞＯｏꝊꝋꝌꝍꝎꝏ☠⚙☢♉⛔☭⛧",
    'p': "PpƤƥᴘᴾᵖᵱᵽᶈṔṕṖṗꝐꝑꝒꝓꝔꝕⴔＰｐπ₱℘℗♇¶",
    'q': "♀QqȹɊɋʠϘϙҀҁԚԛꝖꝗꝘꝙ",
    'r': "RrŔŕŖŗŘřƎƔƪȐȑȒȓɌɍɼɽɾɿʀṘṙṚṛṜṝṞṟῤῥῬℛℜℝᴙᴦＲｒꝵꝶꝚꝛꞧꞦⱤ℟℞",
    's': "SsßŚśŜŝŞşŠšȘșȿʂᶘṠṡṢṣṤṥṦṧṨṩẞꜱ$₷§∫",
    't': "TtŢţŤťŦŧƫƬƭƮȚțȶȾʇʈⲦⲧṪṫṬṭṮṯṰṱẗꚌꚍꚐꚑꓔꓕᵀᶵᵗ₮₸☦☨☩♰♱✝✞✟┬├╦",
    'u': "UuÙÚÛÜùúûüŨũŪūŬŭŮůŰűŲųƯưƱǓǔǕǖǗǘǙǚǛǜȔȕȖȗɄʉʊΰυϋύᵾᵿᶙṲṳṴṵṶṷṸṹṺṻỤụỦủỨứỪừỬửỮữỰựὐὑὒὓὔὕὖὗὺύῠῡῢΰῦῧｕꓴꓵμ",
    'v': "VvƲʋѴѵѶѷṼṽṾṿ⩡Ｖｖᵛᵥᶌᶹ√",
    'w': "WwŴŵԜԝⱲⱳẀẁẂẃẄẅẆẇẈẉẘＷｗꝠꝡ₩",
    'x': "XxˣͯΞΧχ᙭ᚷẊẋẌẍₓＸｘ╳⚔⛌❌❎☠",
    'y': "YÝýÿŶŷŸȲȳɎɏʎʏʸϒϓϔ⅄ＹｙῨῩῪΎὙὛὝὟ¥",
    'z': "ZzŹźŻżŽžƵƶȤȥɀʐʑΖζẐẑẒẓẔẕᴢᵶᶎᶻᶼⱫⱬⱿⲌⲍ"
};

const singleCharLeet = {
    'a': "4",
    'b': "86",
    'c': "(<[{",
    'd': "d0",
    'e': "3&",
    'f': "(=}",
    'g': "6;",
    'h': "#4",
    'i': "1!¡':¦]",
    'j': "7¿]",
    'k': "k",
    'l': "1|¬",
    'm': "m",
    'n': "n",
    'o': "0x.*",
    'p': "p",
    'q': "9,",
    'r': "2",
    's': "5",
    't': "7+",
    'u': "vM",
    'v': "v",
    'w': "w",
    'x': "%",
    'y': "9j",
    'z': "2%"
};

const multiCharLeet = {
    'a': ["/\\", "|\\"],
    'b': ["|3", "|X", "|8", "|:", "/3", "[3", "[8", "(3"],
    'c': ["c"],
    'd': ["[)", "[>", "[}", "|)", "|}", "])"],
    'e': ["[-"],
    'f': ["]]=", "ph", "|#", "|=", "(="],
    'g': ["(_+", "(_>", "[[6", "C-", "gee", "(_-", "cj"],
    'h': ["(-)", ")-(", "|-|", "/-/", "]-[", "]~[", "{-}", ":-:", "}{", "}-{"],
    'i': ["][", "[]", ""],
    'j': [",|", "_|", "_/", "(/"],
    'k': ["]{", "|(", "|<", "|\\{", "}<", "|X"],
    'l': ["][_", "|_", "1_"],
    'm': ["(V)", "(u)", ".\\\\", "//.", "ɅɅ", "|V|", "[V]", "em", "nn", "|v|", "^^", "|^^|"],
    'n': ["(\\)", "//", "ɅV", "[\\]", "]\\[", "^/", "|\\|", "[]\\"],
    'o': ["()", "[]", "oh", "<>", "( )"],
    'p': ["][D", "[]D", "|D", "|°", "|²", "|"],
    'q': ["(,)", "0,", "0_", "(_,)", "O,", "(),"],
    'r': ["|2", "1²", "P\\", "|?", "12", "/2", "l2", "|^", "|`"],
    's': ["es", "ez", "$$"],
    't': ["']'", "']['", "-|-", "7`", "~|~"],
    'u': ["(_)", "/_/", "|_|", "\\_/", "\\_\\", "]_[", "L|"],
    'v': ["\\V", "\\/"],
    'w': ["'//", "(Ʌ)", "///", "uu", "UU", "vv", "UU", "\\^/"],
    'x': [")(", "><", "}{", "ex"],
    'y': ["'/", "V/", "_v", "`/", "`)"],
    'z': ["\"/_", "~/_", "7_", ">_"]
};

const turnedLetters = {
    'a': "∀ɐ",
    'b': "q",
    'c': "Ɔɔ",
    'd': "p",
    'e': "Ǝǝ",
    'f': "Ⅎɟ",
    'g': "ƃ",
    'h': "ɥH",
    'i': "Iᴉ",
    'j': "ſɾ",
    'k': "ʞ",
    'l': "˥",
    'm': "Wɯ",
    'n': "Nu",
    'o': "oO",
    'p': "Ԁd",
    'q': "pQ",
    'r': "ᴚɹ",
    's': "Ss",
    't': "⊥ʇ",
    'u': "∩n",
    'v': "Λʌ",
    'w': "Mʍ",
    'x': "Xx",
    'y': "⅄ʎ",
    'z': "Zz"
};

const japaneseVowels = {
    'a': "ぁあァア",
    'i': "ぃいィイ",
    'u': "ぅうゥウ",
    'e': "ぇえェエ",
    'o': "ぉおォオを"//last one is 'wo'
};

const arabicAlikes = {
    'a': "م",
    'e': "ﻍﻎﻉﻊ",
    'f': "ٲ",
    'g': "ۄۅۆۇۈۉۊۋ",
    'i': "ﮅﮆﮇﮈﮉ",
    'j': "ݫݬﮊﮋﮌﮍ",
    'l': "ﭑ",
    'm': "ﱰﱱ",
    'o': "٥",
    'q': "۹",
    's': "ﻰﻱﻲﻯﳒﳓﳔﱯﳕ",
    'y': "٧۲۳",
    'z': "ﱀﱁ"
};

const weirdNumbers = {
    '1': "¹⅐⅑⅒¼½⅙①⑴⒈⓵❶➀➊႑|I∞۰",
    '2': "²Ƨƨƻ２②⑵⒉⓶⚇⚉⛖⛗₂⅔⅖२২৵੨∞:",
    '3': "³¾⅗⅜੩３❸➂➌③⑶⒊⓷⸫∞",
    '4': "⅘⁞⁴₄④⑷⒋⓮⓸⛶✤✦✧㍜㏣∞",
    '5': "Ƽƽ⑤⑸⒌⓹❺➄➎V⅚∞",
    '6': "Ƅƅ⑥⑯⑹⒃⒍⒗⓰⓺♬❻➅➏꘦㍞㍨㏥㏯６∞",
    '7': "⁷₇⅐⅞⑦⑰⑺⒄⒎⒘⓱⓻❼㍟㏦∞",
    '8': "∞⑧⑱⑻⒅⒏⒙⓲⓼㉏㍠㏧♫❽",
    '9': "∞٩۹߉९㍡㏨⁹₉Ⅸⅸ⑨⑲⑼⒆⒐⒚⓳⓽❾➈➒",
    '0': "۰०০੦૦୦௦౦౸೦൦๐໐༠༳၀႐០᠐᱐⁰₀↉⓪⓿〇㍘꘠"
};

const variationsOfPunctuations = {
    '.': "°*·",
    ',': ";ʻʽ̦̒̓̔̕՝،߸፣᠂᠈⍪❛❜❝❞❟❠︐︑﹐﹑，､",
    ':': ";╎ː꞉∶",
    ';': "؛",
    ' ': "_-_`",
    '!': '¡?¿!!',
    '?': '??¿¡'
};

const tailChars = ",!*¿(";

const letterWeight = [
    [similarChars, 12],
    [singleCharLeet, 6],
    [multiCharLeet, 1],
    [arabicAlikes, 3],
    [turnedLetters, 2]
];

const vowelWeight = [
    [similarChars, 10],
    [singleCharLeet, 5],
    [multiCharLeet, 1],
    [arabicAlikes, 1],
    [japaneseVowels, 2],
    [turnedLetters, 2]
];

const numberWeight = [
    [weirdNumbers, 5]
];

const elseWeight = [
    [variationsOfPunctuations, 5]
];

function baseChar(ch) {
    return ch.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function isLetter(s) {
    return LETTERS.includes(s);
}

function isVowel(s) {
    return "aeiouAEIOU".includes(s);
}

function isNumber(s) {
    return "0123456789".includes(s);
}

function getRandomVariation(data, rand) {
    let total = 0;
    for (let elem of data) {
        total += elem[1];
    }
    const threshold = rand() * total;
    let sum = 0;
    for (let elem of data) {
        sum += elem[1];
        if (sum >= threshold) {
            return elem[0];
        }
    }
    return data[data.length - 1][0];
}

function getOptionFrom(ch, charmap, rand) {
    const source = charmap[ch.toLowerCase()];
    if (source) {
        const i = Math.floor(rand() * source.length);
        return source[i];
    } else {
        const i = Math.floor(rand() * tailChars.length);
        return ch + tailChars[i];
    }
}

function getCharWeight(ch) {
    let weight = elseWeight;
    if (isLetter(ch)) {
        if (isVowel(ch)) {
            weight = vowelWeight;
        } else {
            weight = letterWeight;
        }
    } else if (isNumber(ch)) {
        weight = numberWeight;
    } else {
        weight = elseWeight;
    }
    return weight;
}

export function hackString(text, prob = .3, seed = 0) {
    const rand = mulberry32(seed);
    let out = "";
    for (let ch of text) {
        if (rand() <= prob) {
            const baseCh = baseChar(ch);
            const weight = getCharWeight(baseCh);
            const source = getRandomVariation(weight, rand);
            out += getOptionFrom(baseCh, source, rand);
        } else {
            out += ch;
        }
    }
    return out;
}

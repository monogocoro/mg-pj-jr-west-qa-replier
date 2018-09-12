///
// Nutural Language Understanding
//   matsuda@monogocoro.co.jp   2018.9
//

//
// 全体の構成
// 日本語音声 ==[Google 音声toテキスト] ==> 日本語テキスト
// 日本語テキスト ==[Google翻訳] ==> 英文(goolish)
// 英文(goolish) ==[enju] ==> 構文解析結果(json)
// 構文解析結果 ==[generateCode()] ==> ターミナル式 [ecode]
// 意味トークン抽出: ecode ==[generateScode()] ==> 意味トークン式 [scode]
// scode == [generateJcode()]  == query [jcode]

'use strict';
var _ = require('lodash');

var debug = false;
var debugC = false;
var edebug = true;
var batch = true;

// ---------------------------
//  Text to Enju output (JSON)
// ---------------------------

//--- Japanese => English
function get_ja2en(text){
    var params_text = text.replace(/\s+/g, "");
    var url = 'https://preprocessor.monogocoro.ai/ja2en/' + encodeURIComponent(params_text);
    var request = require('sync-request');
    var res = request('GET', url);
    return res.getBody('utf8');

}
//console.log(get_ja2en('初めまして'))

// --- English text => Enju Parsed Tree
function get_enju_xml(text){
    var url = 'https://preprocessor.monogocoro.ai/en2enju_xml/' + encodeURIComponent(text);
    var request = require('sync-request');
    var res = request('GET', url);
    return res.getBody('utf8');

}

// 使い方
//console.log(get_enju_xml('Nice to meet you.'))
//console.log(get_enju_xml(get_ja2en('初めまして'));


//
// Enju Parsed Tree => Json => Terminals with Grammartical Information (tokenlist)
// token
//

var goolish;
var parseString = require('xml2js').parseString;
function get_enju_json(text){
    goolish = get_ja2en(text);
    // Biwako Express' s free seat is.
    goolish = goolish.replace("' s"," 's");
    if (edebug) console.log(goolish);
    var xml = get_enju_xml(goolish);
    var json = {};
    parseString(xml, function (err, result) {
	json = JSON.stringify(result);
    });
    //console.log(JSON.stringify(JSON.parse(json), null, ' '));
    return json;
}

// -------------------------------------------
// Syntactic Analysis 動詞を主体とした構造解析
//   : 動詞が意図につながることを目指す
// -------------------------------------------

var nodemarks = [];
var tokens = [];
function getToken(key,value){
    if (key == "nodemark"){
	nodemarks.push(value);
    }
    if (key == "tok"){
	tokens.push(value);
    }
    return value;
}

function findTokenList(parsed0){
    var parsed = parsed0.replace(/\$/g, "nodemark");
    var sentence =  JSON.parse(parsed).sentence;
    var parseStatus = sentence["nodemark"]["parse_status"];
    if (!(parseStatus == "success" || parseStatus == "fragmental parse")) return;
    var sentenceType = sentence["_"];

    // bug.
    // for example, 'pos' of 'where' should be 'WRB'
    JSON.stringify(JSON.parse(parsed), getToken);
}

// tokensの中身をすべてオブジェクトとして登録
var tokenIdList = [];
var tokenList = [];
function createTokenObjects(tokens0){
    for (var i in tokens0){
	var tkn = new Object();
	tkn.content = tokens[i][0].nodemark;
	tkn.arg1 = null;
	tkn.arg2 = null;
	tkn.arg3 = null;
	tokenIdList.push(tkn.content.id);
	tokenList.push(tkn);
    };
    tokens = [];
}

function isToken (id){
    return id.startsWith('t')
}

function tokenIndex(id){
    var index = -1;
    for (var i=0; i<tokenIdList.length; i++){
	if (tokenIdList[i] != id) continue;
	index = i;
	break;
    }
    return index;
}

function tokenSearch(id){
    var cid = 0; // nodeリストの中からidに相当する場所を探す。
    for (var i in nodemarks){
	if (nodemarks[i]["id"] != id) continue;
	cid = nodemarks[i]["sem_head"];
	break;
    }
    // console.log("i=",i, " cid=",cid);

    // 見つかった箇所からtで始まるラベルを持つ（トークン）を探す
    for (var j = i; j<nodemarks.length; j++){
	if (nodemarks[j]["id"] != cid) continue;
	if (!(isToken(cid))){
	    cid = nodemarks[j]["sem_head"];
	    continue;
	}
	// 見つかった。
	//console.log(tokenList[tokenIndex(cid)]);
	return (tokenList[tokenIndex(cid)]);
    };
   //console.log("未登録のトークンが存在；", cid);
}


//var sentence_cat;
//var sentence_xcat;

function resolveArgLinks(){

    if (debugC) console.log(tokenList);

    // nodemarksを利用し、token内のarg1, arg2, arg3の値
    // （他のトークンオブジェクトへのポインタ)
    for (var i in tokenList){
	var tkn = tokenList[i];
	if (tkn.content.arg1 != undefined){
	    tkn.arg1 = tokenSearch(tkn.content.arg1);
	}
	if (tkn.content.arg2 != undefined){
	    tkn.arg2 = tokenSearch(tkn.content.arg2);
	}
	if (tkn.content.arg3 != undefined){
	    tkn.arg3 = tokenSearch(tkn.content.arg3);
	}
    }
    //sentence_cat = nodemarks[1].cat;
    //sentence_xcat = nodemarks[1].xcat;
    if (debugC) console.log("nodemarks = ", nodemarks);
    nodemarks = [];

    if(debugC){
	for (var i in tokenList){
	    var cat = tokenList[i].content.cat;
	    if (tokenList[i].content.cat == "V" && tokenList[i].content.type == "noun_mod")
		cat = tokenList[i].content.type;
	    console.log(tokenList[i].content.base + "[" + cat + "]");
	    var arg1 = tokenList[i].arg1;
	    var arg2 = tokenList[i].arg2;
	    var arg3 = tokenList[i].arg3;
	    if (arg1 != undefined) console.log("          <arg1>---> ", arg1.content.base);
	    if (arg2 != undefined) console.log("          <arg2>---> ", arg2.content.base);
	    if (arg3 != undefined) console.log("          <arg3>---> ", arg3.content.base);
	}
    }

}

// ------------------------------------
// eode: enju出力からターミナル列を生成
// ------------------------------------

var ecode;
function generateCode(line){
    console.log("--ecode--");
    if (JSON.stringify(tokenList) == "[]"){
	console.log(line, "が翻訳出来ませんでした。");
	return;
    }
    // -- code: ecode一步手前。ecode生成のための情報収集
    var stack = [];
    var code = {};
    //code["sentence_cat"] = sentence_cat;
    //code["sentence_xcat"] = sentence_xcat;
    //stack.push(code); code = {};

    if (tokenList.length >= 3 && tokenList[0].cat == "N" && tokenList[1].cat == "N" && tokenList[2].cat == "N"){
	console.log(line, "が翻訳出来ませんでした。");
	return}

    for (var i in tokenList){
	var cat = tokenList[i].content.cat;
	/*
	if (tokenList[i].content.cat == "V" && tokenList[i].content.type == "noun_mod")
	    cat = tokenList[i].content.type;
	*/
	var pred = tokenList[i].content.pred;
	if(pred.startsWith("aux")) cat = "auxV";
	code["cat"] = cat;
	code["base"] = tokenList[i].content.base;
	code["pos"] = tokenList[i].content.pos;
	code["type"] = tokenList[i].content.type; // noun_mod, verb_mod
	var arg1 = tokenList[i].arg1; code["arg1"] = null;
	var arg2 = tokenList[i].arg2; code["arg2"] = null;
	var arg3 = tokenList[i].arg3; code["arg3"] = null;

	if (tokenList[i].content.pos != undefined)
	    code["pos"] = tokenList[i].content.pos;

	// A cat arrived in the park. [cat arrived]の自動詞としてarrivedを分離するため。
	// 参考: 進行形 aspect = progressive, voice = active
	if (code["type"] == "noun_mod" &&
	    tokenList[i].content.aspect == "none" && tokenList[i].content.voice == "passive"){
	    code["cat"] = "V";
	    code["arg1"] = arg2.content.base;
	    code["tense"] = "past";
    	    code["aspect"] = "none";
	    code["voice"] = "none";
	} else {
	    if (arg1 != undefined && code["arg1"] == null) code["arg1"]= arg1.content.base;
	    if (arg2 != undefined && code["arg2"] == null) code["arg2"]= arg2.content.base;
	}
	if (arg3 != undefined && code["arg3"] == null) code["arg3"]= arg3.content.base;
	if (cat == "V"){
	    code["tense"] = tokenList[i].content.tense;
	    code["aspect"] = tokenList[i].content.aspect;
	    code["voice"] = tokenList[i].content.voice;
	}
	if (cat == "CONJ" || cat == "PN"){
	    code["base"] = tokenList[i].content.base;
	    code["lexetry"] = tokenList[i].content.lexentry;
	    //code["arg1"] = tokenList[i].content.arg1;
    	    //code["arg2"] = tokenList[i].content.arg2;
    	    if (tokenList[i].arg1 != undefined) code["arg1"] = tokenList[i].arg1.content.base;
  	    if (tokenList[i].arg2 != undefined) code["arg2"] = tokenList[i].arg2.content.base;
	}
	var base = tokenList[i].content.base;
	if (base == "where"){ // for enju bug.
	    code["pos"] = 'WRB';
	}

	//if (debugC) console.log("code = ", JSON.stringify(code));
	stack.push(code);
	code = {};
    }
    for (var i=0; i<stack.length; i++){
	if (edebug) console.log(JSON.stringify(stack[i]));
    }

    ecode = stack;
    tokenIdList = [];
    tokenList = [];
}

// ---------------------------------------------------------------
// 補正：goolish -> enju
// goolishが出力するトークン単位とenjuが出力するecodeの対応をつける
// ---------------------------------------------------------------

function tokenSplit(s0){
    var s = s0;
    s = s.replace(':', ' &cln ');
    s = s.replace("'d", ' would');
    s = s.replace("'s"," &s ");
    s = s.replace(",", " ,");
    s = s.replace(/\.$|\?$/,'');
    var a = s.split(' ');
    return a.filter(function(e){return e !== "";});
}

//
// -----------------------------------
// scode: ecodeに対し意味トークンを得る
// -----------------------------------

// ---------------
// CONJ「,」の扱い
// ---------------
// 例。彼は学校に行き、公園に行き、彼女は映画に行った。
// He went to school, went to the park, and she went to the movies.
// 最初の「,」は主語heに準じてる。
// {"cat":"CONJ","base":"-COMMA-","pos":",","arg1":"go","arg2":"go"}
// 一方、２番めの「,」は新しい主語sheの登場を示唆している。
// {"cat":"PN","base":"-COMMA-","pos":",","arg1":"and","arg2":null}

// ----------
// and の区別
// ----------
// 節を仲介するand {lexetry: "[V.decl<CONJP>V.decl]"}
// 語あるいは句を仲介するand {lexetry: "[N<CONJP>N]"}

// --------------------------------
// there 分離したい in splitEcode()
// --------------------------------
// cat = Nとして独立して分離できずphraseの中に残る場合
//    pos = RB
//    pos = EX
//    pos = DT

//
// is <something>の場合、is[N]となることがある。
// 例。
// Is KAISUKEN allowed to input three pieces at the same time?
// "Is KAISUKEN"で名詞句を作っている。
// どういう組み合わせだと名詞句になり、逆に、動詞として分離されるのか。

// ---------------------------------------
// 名詞を含む句部分の処理 in splitPhrase()
// ----------------------------------------
// (1) 冠詞を除く。厳密にはまずい。ただしgoolishがその辺、「適当」なので由とする。
// 冠詞 cat: "D"

// (2) 名詞句の前につく形容詞部分 名詞に対する制約として働く
// warm coffee
// {"cat":"ADJ","base":"warm","pos":"JJ"}
// {"cat":"N","base":"coffee","pos":"NN","arg1":null,"arg2":null,"arg3":null}

// (3) 名詞句に続いて形容詞的働きを持つもの。open nearby等
// cat = N |ADJ 名詞句の中に残る。妥当。
// cat = ADV 名詞句と独立
//     Is there a coffee shop open now?
//     open: ADV
//     now: ADV
// cat = V 動詞。妥当。

// (4)
// 名詞句に続いて、これを「形容する部分が付く」 : 制約として働く
//    形容詞
//    to <動詞>
//    which <動詞>
//    where you can <動詞>
//    that <動詞>
//    なお<動詞>の前に助動詞 auXが付くことがある
// {"cat":"N","base":"he","pos":"PRP"}
// {"cat":"N","base":"where","pos":"WRB"}
// {"cat":"N","base":"what","pos":"WP"}
// {"cat":"C","base":"to","pos":"TO"}

// (5) 名詞句が副詞的に機能するもの
// {"cat":"D","base":"this","pos":"DT","type":"noun_mod","arg1":"time","arg2":null,"arg3":null}
// {"cat":"N","base":"time","pos":"NN","arg1":null,"arg2":null,"arg3":null}
// -> "this_time"

// 数詞の扱い
//8:32
// pos == 'CD'+':'+'CD'

//2nd
// base == '-NUMBER-nd'

//No.30
// base == 'no-PERIOD-' + '-NUMBER-'

//何番線 number_noriba
// base == 'number'

//一日券
//base == '-NUMBER--day'
//base == 'one-day'

// 関数：splitEcode()
// ecodeを1件ずつみていき、次を区切り子として分割し、scode配列にスタック
// 分割単位はphraseとして扱う。
// (a) noun_modではない動詞[V]
// (b) 前置詞[P]
// (c) 副詞[P]
// (d) 冠詞[DT]
// (e) 文冒頭で名詞と扱われる
// (d) 文を区切る接続詞and

// 関数: sunit()
// この際、動詞は、aspectとvoiceでVPA, VNA, WNPに分類し、それ以外にarg1, arg2の情報を追加。
// それ以外のトークン（主としてADV, ADJ）はcatとbaseのみを取り出す。
// 数詞は数の処理を行う。

// 関数: splitPhrase()
// splitEcodeで分割された単位phraseを受け、gram:として再度分割する。
// この際、splitEcode()でうまく分割されなかったものを再度分離するのと、単語のカテゴリを追加する。
// (a) 「,」は無視
// (b) 副詞型[RB]、存在子型[EX]、冠詞型[DT]のthereは分離対象とする
// (c) 助動詞[auxV]を分離
// (d) 動詞につく前置詞[PRT]を分離
// (e) 冠詞型のWH [WDT]を分離
// (f) 受け身の動詞を分離
// (e) 名詞句をつなぐandを分離

// 関数: sunit2
// ecodeのリストを受け取り、個々の要素に関しsuitを呼び出す。

function printObject (objs){
    for (var i = 0; i < objs.length; i++){
	console.log(
	    JSON.stringify(
		objs[i],
		function(k, v){
		    if (v === null) return undefined
	    	    return v}, null, ' '))
    }

}

var scode = [];

function generateScode(){
    scode = splitEcode();
    console.log("--scode---");
    console.log(printObject(scode));
}

function splitEcode(){
    // ecodeを動詞、前置詞、副詞、節間andを分離
    var ex = ecode;
    var gx = tokenSplit(goolish);
    var i = 0;
    var phrase = []; // stack for Ecode
    var gphrase = []; // stack for goolish
    while (i < ex.length){

	phrase.push(ex[i]);
	gphrase.push(gx[i]);
	if ((ex[i].cat == "V" && ex[i].type != "noun_mod") ||
	    ex[i].cat == "P" ||
	    ex[i].cat == "ADV" ||
	    ex[i].pos == "DT" ||
	    (i == 0 && ex[i].base == "is") ||
	    (ex[i].cat == "CONJ" && isANDV(ex[i].lexetry))){
	    //console.log("ex[i]:", ex[i].base);
	    var token = phrase.pop();
	    var gtoken = gphrase.pop();
	    //console.log("phrase1:", getbasename(phrase));
	    splitPhrase(phrase, gphrase);
	    //console.log(ex[i].cat, "", token.base);
	    scode.push(sunit(token, gx[i]));
    	    phrase = []; gphrase = [];
	} else if (i == ex.length-1){
	    //console.log("phrase2:", getbasename(phrase));
       	    splitPhrase(phrase, gphrase);
	}
	i++;
    }
    return scode;
}

function splitPhrase(phrase, gphrase){
    // generateScodeが分割した句phraseから
    // 名詞・句andを分離
    // 助動詞、cat="N"型のpos="RB"(副詞)、たとえばthereを分離
    // PN型の-COMMA-に関して。後続するandが節の分離をカバーしているのでここでは単純に削除する。
    //console.log("split:");
    var i = 0;
    var gram = [];
    var ggram = [];

    while (i < phrase.length){
	gram.push(phrase[i]);
	ggram.push(gphrase[i]);
	if (phrase[i].cat == "PN" && phrase[i].base == "-COMMA-") {
	    i++; //スルー
	} else if(
	    (phrase[i].base == "there" &&
	     (phrase[i].pos == "RB" || phrase[i].pos == "EX" ||  phrase[i].pos == "DT")) ||
		phrase[i].cat == "auxV" ||
		phrase[i].cat == "PRT" ||
		phrase[i].cat == "SC" ||
		phrase[i].cat == "WDT" ||
		(phrase[i].cat == "V" && phrase[i].voice == "passive") ||
		(phrase[i].cat == "CONJ" && isANDN(phrase[i].lexetry))){

	    var token = gram.pop();
	    var gtoken = ggram.pop();
	    if (JSON.stringify(gram) != "[]"){
		//console.log("gram:", generategramn(gram, ggram));
		scode.push(sunit2(gram, ggram));
	    }
	    //console.log(phrase[i].cat, "", token.base);
	    var a = {}; a[phrase[i].cat] = token.base;
	    scode.push(a);
    	    gram = [];
	    ggram = [];
	} else if (i == phrase.length-1){
	    //console.log("gram", generategram(gram, ggram));
	    scode.push(sunit2(gram, ggram));
	}
	i++;
    }
}

function isANDV(entry){ // go and drink
    if (entry == "[V.decl<CONJP>V.decl]") return true;
    else return false;
}

function isANDN(entry){ // book and apple
    if (entry == "[N<CONJP>N]") return true;
    else return false;
}

function sunit(token, gx){
    var a = {};
    if (token.cat == "V"){
	var key;
	if (token.aspect == "progressive" && token.voice == "active") key = "VPA";
	else if (token.aspect == "none" && token.voice == "active") key = "VNA";
	else if (token.aspect == "none" && token.voice == "passive") key =  "VNP";
	else key = "V";
	a[key] = token.base;
	a["arg1"] = token.arg1;
	a["arg2"] = token.arg2;
    } else if (token.cat == "ADV"){
	a[token.cat] = token.base;
    } else if (token.cat == "ADJ"){
	a[token.cat] = token.base;
	a["pos"] = token.pos;
    }
    else {
	a[token.cat] = token.base;
    }
    return a;
}

function sunit2(gram, ggram){
    var g = {};
    var a = [];
    for (var i = 0; i < gram.length; i++){
	a.push(sunit(gram[i]));
    };
    a = sunit2post(a, ggram);
    g["gram"] = tonoun(a);
    return g;
}

function sunit2post (tokenList, ggram){ // 主として数詞処理
    // sgram: gramがsuit2で処理された後の値

    // -NUMBER- => 当該数字が入る => 32
    // -NUMBER-nd => 当該数字が入る => 32nd
    // -COLON- => 6_COLON_32
    // 's => &s に変換

    var tkn = [];
    for (var i = 0; i < tokenList.length; i++){
	var token = tokenList[i];
	if (token.N == "no-PERIOD-") continue;
	if (token.N == "-NUMBER-" || token.N == "-NUMBER-nd"){
	    var o = {};
	    o["N"] = ggram[i];
	    tkn.push(o);
	} else if (token.ADJ == "-NUMBER-" || token.ADJ == "-NUMBER-nd"){
	    var o = {};
	    o["ADJ"] = number(ggram[i]);
	    tkn.push(o);
	} else if (token.N == "-NUMBER--day"){
	    var o = {};
	    o["N"] = ggram[i];
	    tkn.push(o);
    	} else if (token.ADJ == "-NUMBER--day"){
	    var o = {};
	    o["ADJ"] = ggram[i];
	    tkn.push(o);
	} else if (token.PN == "-COLON-"){
	    var o = {};
	    o["N"] = ggram[i];
	    tkn.push(o);
	}else if(token.D =="\'s" ){
	    var o = {};
	    o["D"] = "&s";
	    tkn.push(o);
	}
	else{
	    var o = token;
	    for (var key in token) { // adj: three
		if (key == "ADJ") {
		    o["ADJ"] = number(token[key]);
		}
	    }
	    tkn.push(o);
	}
    }
    return tkn;
}

function number(letter){
    switch(letter){
    case "one": return "1";
    case "two": return "2";
    case "three": return "3";
    case "four": return "4";
    case "32nd": return "32";
    default: return letter;
    }
}


// --------------------------------
// 辞書エントリ
// use. db/noun.db
// use. db/verbnoun.db
// --------------------------------

const Realm = require('realm');
const noundb = new Realm({path: './db/noun.db'});
const verbnoundb = new Realm({path: './db/verbnoun.db'});

function tonoun(a){
    // a = [{"N":"biwako"},{"N":"express"}, {"D":"&s"},{"ADJ":"free","pos":"JJ"},{"N":"seat"}];
    var i  = 0;
    var noun = [];
    while( i < a.length) { // トークン要素が名詞[N]か形容詞[ADJ]の間、stackに候補を集める。
	var stack = [];
	var j = i;
	while ( j < a.length &&
		(getkey(a[j]) == "N" ||getkey(a[j]) == "ADJ")){
	    stack.push(a[j]);
	    j++;
	}

	//-- stak = (tmp + rest.reverse())
	var rest = []; // stackの長さを順次減じながら、名詞辞書エントリ候補を探す。
	// 成功した時点でstack部分が辞書エントリで置き換わり、
	//rest部分がそのまま残る。
	var tmp = [];
	while (JSON.stringify(stack) != "[]"){
	    var jword = getjword(concatenate(stack));
    	    if (jword != null){
		var o = {}; o["N"] = jword.N; o["db"] = jword.db;
		tmp.push(o);
		break;
	    }
	    rest.push(stack.pop());
	}
	rest = _.union(tmp, rest.reverse());
	//-- stak = (tmp + rest.reverse()) end.

	noun = _.union(noun, rest);
	if (j < a.length) noun.push(a[j]);
	i = j + 1;
    }
    return noun;
}

function concatenate(a){
    // [{"N":"biwako"},{"N":"express"}] -> biwako_express
    var noun = getvalue(a[0]);
    for (var i = 1; i < a.length; i++){
	noun = noun + "_" + getvalue(a[i]);
    }
    return noun;
}

var lodash = require('lodash');

function getkey(o){
    return (lodash.keys(o))[0];
    // return (Object.keys(o))[0];
}

function getvalue(o){
    return (lodash.values(o))[0];
    // return (Object.values(o))[0];
}

function getjword(s){
    var result =
	noundb.objects('noundb').filtered("aliases CONTAINS $0", "$"+s+"$");
    if (JSON.stringify(result) == "{}") return null;
    else{
	dbtype = result[0].db;  // dbtype:
	var o = {}; o["N"] = result[0].jword; o["db"] = result[0].db;
	return o;
    }
}

// --------------------------
// JCODE生成 (scode -> jcode)
// --------------------------

// デフォルトjcode
// 解析できない文が来た場合、統合部に返すJCODE
//var jcode = {queryTDB: {from: '京都', to: 'unknown'}};
var dbtype = "unknown";

//ルール内に使用する関数シンボルを定義する。

var isN = function(obj){
    if (obj == undefined) return false;
    if (getkey(obj) == 'N') return true;
    else return false;
}

var isSDBN = function(obj){
    if (obj == undefined) return false;
    if (obj.N != undefined && obj.db == 'SDB') return true;
    else return false;
}

var isTDBN = function(obj){
    if (obj == undefined) return false;
    if (obj.N != undefined && obj.db == 'TDB') return true;
    else return false;
}

var isNumber = function(obj){
    if (obj == undefined) return false;
    if (getkey(obj) == "ADJ" && typeof Number(obj.ADJ) == "number") return true;
    else return false;
}

function isBus(obj){ // "高速バス"
    if (obj == undefined) return false;
    var name = getvalue(obj);
    return (name.substring(name.length-2)) == "バス";
}

function isSubway(obj){
    if (obj == undefined) return false;
    var name = getvalue(obj);
    switch(name){
    case "地下鉄烏丸線":
    case "地下鉄東西線": return true;
    default: return false;
    }
}

function isLine(obj){
    if (obj == undefined) return false;
    var name = getvalue(obj);
    switch(name){
    case "東海道新幹線":
    case "新幹線":
    case "東海道本線":
    case "東海道線":
    case "湖西線":
    case "奈良線":
    case "嵯峨野線":
    case "京都線":
    case "近鉄京都線":
    case "琵琶湖線": return true;
    default: return false;
    }
}

function isSTrain(obj){ //特急
    if (obj == undefined) return false;
    var name = getvalue(obj);
    switch(name){
    case "サンダーバード":
    case "ひだ":
    case "スーパーはくと":
    case "くろしお":
    case "はるか": return true;
    default: return false;
    }
}

var vnvalue = false; // $値の変更のため
function isExchange(obj){
    if (obj == undefined) return false;
    var name = getvalue(obj);
    var r = false;
    switch(name){
    case "exchange": r = true; break;
    default: break;
    }
    vnvalue = "両替所";
    return r;
}

function isSell(obj){
    if (obj == undefined) return false;
    var name = getvalue(obj);
    var r = false;
    switch(name){
    case "sell":
    case "buy":
    case "drink": r = true; break;
    default: break;
    }
    vnvalue = "コンビニ";
    return r;
}

function isATM(obj){
    if (obj == undefined) return false;
    var name = getvalue(obj);
    var r = false;
    switch(name){
    case "get":
    case "find":
    case "withdraw":
    case "save": r = true; break;
    default: break;
    }
    vnvalue = "ATM";
    return r;
}

var scoderules = [
    // scodeの構造を前提にルールruleを作成
    // 文字列部分をそのまま一致した場合成功
    // 関数（シンボル）はそれが適用されたとき成功し、その時の引数をargsに保存
    // JSONパターンに含まれる$で始まる名前はargsの順番に適用される。

    {rule: ["number", "noriba", isTDBN],
     ptn: {queryTDB: {place: '京都', train: '$1', bansen: 'what'}}},

    {rule: [isNumber, "noriba"],
     ptn: {querySDB: {place: '京都', bansen: '$1'}}},

    {rule: ["noriba", isNumber],
     ptn: {querySDB: {place: '京都', bansen: '$1'}}},

    {rule: ["noriba", "of", isSDBN],
     ptn: {querySDB: {place: '京都', location: '$1'}}},

    {rule: [isSDBN, "noriba"],
     ptn: {querySDB: {place: '京都', location: '$1'}}},

    {rule: ["to", isTDBN, "noriba"],
     ptn: {queryTDB: {from: '京都', to: '$1', bansen: 'what'}}},

    {rule: ["チケット売り場", isSDBN],
     ptn: {querySDB: {location: '京都', place:'チケット売り場', kind: '$1'}}},

    {rule: [isLine, "noriba"],
     ptn: {queryTDB: {place: '京都', line: '$1', bansen: 'what'}}},

    {rule: [isSTrain, "noriba"],
     ptn: {queryTDB: {place: '京都', train: '$1', bansen: 'what'}}},

    {rule: ["noriba", "of", isLine],
     ptn: {queryTDB: {place: '京都', line: '$1', bansen: 'what'}}},

    {rule: ["noriba", "of", isSTrain],
     ptn: {queryTDB: {place: '京都', train: '$1', bansen: 'what'}}},

    {rule: ["始発", "to", isTDBN],
     ptn: {queryTDB: {from: '京都', to: '$1', period: '始発'}}},

    {rule: ["how", "long", isTDBN],
     ptn: {queryTDB: {from: '京都', to: '$1', total_time: 'what'}}},

    {rule: ["how", "long", isSDBN], //関空[SDB]のケース
     ptn: {queryTDB: {from: '京都', to: '$1', total_time: 'what'}}},

    {rule: ["time", "to", isTDBN],
     ptn: {queryTDB: {from: '京都', to: '$1', total_time: 'what'}}},

    {rule: ["how", "much", "time", isTDBN],
     ptn: {queryTDB: {from: '京都', to: '$1', total_time: 'what'}}},

    {rule: ["fare", "to", isTDBN],
     ptn: {queryTDB: {from: '京都', to: '$1', fare: 'what'}}},

    {rule: ["charge", "to", isTDBN],
     ptn: {queryTDB: {from: '京都', to: '$1', fare: 'what'}}},

    {rule: ["バス", "to", isSDBN],
     ptn: {querySDB: {place: '京都', location: 'バス', to: '$1'}}},

    {rule: ["バス", "to", isTDBN],
     ptn: {querySDB: {from: '京都', to: '$1', route: 'バス'}}},

    {rule: [isExchange, "money"],
     ptn: {querySDB: {place: '京都', location: '$1'}}},

    {rule: [isATM, "money"],
     ptn: {querySDB: {place: '京都', location: '$1'}}},

    {rule: [isSell, "beer"], // 後で修正
     ptn: {querySDB: {place: '京都', location: '$1'}}},

    {rule: [isSell, "cigarette"], //後で修正
     ptn: {querySDB: {place: '京都', location: '$1'}}},

    {rule: [isSell, "coffee"], //後で修正
     ptn: {querySDB: {place: '京都', location: '$1'}}},

    {rule: ["buy", "souvenir"], //後で修正
     ptn: {querySDB: {place: '京都', location: 'お土産屋'}}},

    {rule: ["leave", "something"], //後で修正
     ptn: {querySDB: {place: '京都', location: '京都忘れ物センター'}}},

    {rule: ["saten"], //後で修正
     ptn: {querySDB: {place: '京都', location: '喫茶店'}}},

    {rule: [isSDBN],
     ptn: {querySDB: {place: '京都', location: '$1'}}},

    {rule: [isTDBN],
     ptn: {queryTDB: {frome: '京都', to: '$1'}}},

    {rule: ["go", "to", isN],
     ptn: {queryTDB: {frome: '京都', to: '$1'}}},
];


function generateJcode(){
    console.log("--jcode---");
    // interprete scode then generate jcode

    var jcode = {queryJDB: "fail"}
    var ri = 0;
    scode = flatten(scode);
    var rule, pattern;
    while (ri < scoderules.length){
	rule = deepCopy(scoderules[ri].rule); // ruleapplyで破壊されるのを防ぐ
	if (ruleapply(scode, rule)){
	    pattern = JSON.parse(JSON.stringify(scoderules[ri].ptn));
	    jcode = JSON.stringify(pattern, replacer);;
	    break;
	} else {
	    //console.log("fail");
	};
	ri++;
    }

    //finaling
    scode = [];
    return jcode;
}

function ruleapply(scode, rule){
    var i = 0;

    while (i < scode.length){
	//console.log("scode:", scode[i], " rule:", rule);
	var sflag = false; var fflag = false;
	if (JSON.stringify(rule) != "[]" && typeof rule[0] == "string"){
	    if (getvalue(scode[i]) == rule[0]){
		rule.shift(); // next element of the rule
		i++; sflag = true;
	    }
	}
	if (JSON.stringify(rule) != "[]" && typeof rule[0] == "function"){
	    if (rule[0](scode[i])){
		// 動詞[V]+名詞[N]型で
		// 名詞との組み合わせで、動詞が場所[N]を決める場合
		if (vnvalue != false && getkey(scode[i]) != "N"){
		    args.push(vnvalue);
		    vnvalue = false;
		} else {
		    args.push(getvalue(scode[i]));
		}
		rule.shift();
		i++; fflag = true;
	    }
	}
	if(!(sflag || fflag)) i++;
    }
    if (JSON.stringify(rule) == "[]") return true;
    else return false;
}

function replacer(key, value) {
    switch(value){
    case '$1': return args.pop();
    case '$2': return args.pop();
    case '$3': return args.pop();
    case '$4': return args.pop();
    case '$5': return args.pop();
    case '$6': return args.pop();
    }
    return value;
}

function deepCopy(obj) {
    // ref. https://st40.xyz/one-run/article/338/
    var copy;

    if (null == obj || "object" != typeof obj) return obj;

    if (obj instanceof Date) {
        copy = new Date();
        copy.setTime(obj.getTime());
    } else if (obj instanceof Array) {
        copy = [];
        for (var i = 0, len = obj.length; i < len; i++) {
            copy.push(deepCopy(obj[i]));
        }
    } else if (obj instanceof Object) {
        copy = Object.create(obj);
        for (var key in obj) {
            if (obj.hasOwnProperty(key)) copy[key] = deepCopy(obj[key]);
        }
    }
    return copy;
}

function flatten(A){
    /*
    var scode = [
    {"gram":[{"N":"what"}]},
    {"VNA":"be","arg1":"what","arg2":"number"},
    {"D":"the"},
    {"gram":[{"N":"number"}]},
    {"P":"of"},
    {"D":"the"},
    {"gram":[{"N":"train"},{"VPA":"go","arg1":"train"}]},
    {"P":"to"},
    {"gram":[{"N":"嵯峨嵐山","db":"TDB"},{"N":"noriba"}]}
    ];
    ==>
    [ { N: 'what' },
    { VNA: 'be', arg1: 'what', arg2: 'number' },
    { D: 'the' },
    { N: 'number' },
    { P: 'of' },
    { D: 'the' },
    { N: 'train' },
    { VPA: 'go', arg1: 'train' },
    { P: 'to' },
    { N: '嵯峨嵐山', db: 'TDB' },
    { N: 'noriba' } ]
    */
    var stack = [];
    for (var o of A){
	if (o["gram"] != undefined) stack = _.union(stack, o.gram);
	else stack.push(o);
    }
    return stack;
}
/*
function isSDB(o){
    if (o["db"] != undefined) return o.db == "SDB";
    return false;
}

function isTDB(o){
    if (o["db"] != undefined) return o.db == "TDB";
    return false;
}
*/


/*
var scode = [
    {"gram":[{"N":"where"}]},
    {"VNA":"be","arg1":"where","arg2":"office"},
    {"D":"the"},
    {"gram":[{"N":"チケット売り場","db":"SDB"}]},
    {"P":"of"},
    {"D":"the"},
    {"gram":[{"N":"市バス","db":"SDB"}]}
];
*/

// --------------------
// システムインタプリタ
// -------------------

var noEmpty = true;

var args; // for generateJcode();
//args=[];generateJcode();

function interpreter(line){
    args = [];

    if (!noEmpty) { // デモ文入力の終わり | CRの対応
	noEmpty = true;
	return;
    }
    //対話ループ内で使う場合、毎回オープンする必要あり。

    // 日本語 -> goolish -> enju.xml -> enju.js
    var enjujs = get_enju_json(line);

    // enjujs を {tokens, nodemarks}に分解
    findTokenList(enjujs);

    // tokensの中身をすべてオブジェクトとして登録
    createTokenObjects(tokens);

    // nodemarksを利用し、token内のarg1, arg2, arg3の値
    // （他のトークンオブジェクトへのポインタ)
    resolveArgLinks();

    // code生成 : ecode
    generateCode(line);

    // 意味トークン抽出
    generateScode();

    // 最終query生成
    var jcode = generateJcode();
    console.log(jcode);
    return jcode;
}

// ------------------------------------------------------
// 入力テスト
// > 入力文
// if batch == true then バッチテスト、load from "test_in_sample.js"
// if batch == false then インタラクティブ
// ------------------------------------------------------

// ------------------------------
// 音声toテキストでの誤変換を防ぐ
// Google翻訳での誤変換を防ぐ
// 例。当時 => toji => 東寺
// use. ./db/mobidic 辞書
// ------------------------------

/* この部分の置き換え、後回し
const modidb = new Realm({path: './db/modi.db'});

function replaceTeisei(s){
    var result =
	modidb.objects('modidb').filtered("org == $0", s);
    if (JSON.stringify(result) == "{}") return s;
    else return result[0].mod;
}
*/
var teisei = require('./DICteisei.js');
var teiseidic = teisei.make();
/*
function replaceTeisei(s){
    var modified = s;
    for (var i = 0; i < teiseidic.length; i++){
	if (modified.indexOf(teiseidic[i].org) == -1) continue;
	modified = modified.replace(eval("\/"+teiseidic[i].org+"\/gi"), teiseidic[i].mod);
	//modified = modified.replace(teiseidic[i].org, teiseidic[i].mod);
	break;
    }
    return modified;
}
*/

function replaceTeisei(s){
    var modified = s;
    var j = 0;
    while (j != -1){//一文に複数の置換が起きる場合
	for (var i = 0; i < teiseidic.length; i++){
	    j = modified.indexOf(teiseidic[i].org);
	    if (j == -1) continue;
	    modified = modified.replace(teiseidic[i].org, teiseidic[i].mod);
	    break;
	}
    };
    return modified;
}

module.exports = function(line){
  var interpreter_result = interpreter(line);
  return JSON.parse(result);
}

// ----------
// 入力テスト
// ----------

if (batch){ //バッチテスト
    var text = [];
    var textid = 0;
    var testin = require('./test_in_sample.js');
    var example = testin.make();

    for (var i = 0; i < example.length; i++){
	text[i] = example[i];
    }
    var readline = require('readline'),
    rl = readline.createInterface(process.stdin, process.stdout),
	prefix = '\n> ';

    rl.on('line', function(line0) {
	if (textid < text.length){ // デモ中
	    var line = text[textid]; textid++;
	} else if (isNaN(line0.charCodeAt(0))){ // Enterキー
	    noEmpty = false;
	} else{ // リアル入力
	    line = line0;
	}
	try{
	    if (noEmpty) {
		console.log(line);
		interpreter(replaceTeisei(line));
	    }

	} catch(e){
	    console.log("問題が起きました。",e);
	} finally {
	    noEmpty = true;
	    rl.prompt();
	}

    }).on('close', function() {
    console.log('batch test end');
    process.exit(0); // needed for the process ending
    });

    rl.setPrompt(prefix, prefix.length);
    rl.prompt();
    }
else { //インタラクティブテスト

    // テストデータ入力および結果の出力
    var readline = require('readline'),
    rl = readline.createInterface(process.stdin, process.stdout),
	prefix = '\n> ';
    var noEmpty = true;
    rl.on('line', function(line0) {
	if (isNaN(line0.charCodeAt(0))){ // Enterキー
	    noEmpty = false;
	} else{ // リアル入力
	    //line = line0;
	}
	try{
	    if (noEmpty) {
		interpreter(replaceTeisei(line0));
	    }
	} catch(e){
	    console.log("問題が起きました。",e);
	} finally {
            noEmpty = true;
	    rl.prompt();
	}
    }).on('close', function() {
	console.log('exit');
	process.exit(0);
    });
    console.log('会話テスト');
    rl.setPrompt(prefix, prefix.length);
    rl.prompt();
}

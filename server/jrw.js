//
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
// scode == [generateQuery()] ==> query式。
// ただし、現バージョン2019.9.5ではgenerateScode()関数の中から直接 query式を生成。
// これはデモ後、ただちに修正。

'use strict';

var debug = false;
var debugC = false;
var edebug = false;
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
    //console.log(goolish);
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


// -----------------------------------
// scode: ecodeに対し意味トークンを得る
// -----------------------------------

// https://qiita.com/hrdaya/items/291276a5a20971592216
function tokenSplit(s0){
    var s = s0;
    s = s.replace(':', ' &cln ');
    s = s.replace("'d", ' would');
    s = s.replace("'s"," 's");
    s = s.replace(",", " ,");
    s = s.replace(/\.$|\?$/,'');
    var a = s.split(' ');
    return a.filter(function(e){return e !== "";});
}

function concatenate(A){
    var ptn = "";
    for (var i = 0; i < A.length-1; i++){
	ptn = ptn +A[i]+"_";
    }
    ptn = ptn + A[i];
    return ptn;
}

function isCardinalNoun(w){ //序数詞ではないが八条口のよう場合
    if (w.cat == 'D'){
	if (w.base == 'a' || w.base == 'an' || w.base == 'the') return false;
	else return true;
    }
    else{
	return false;
    }
}

// --------------------------------
// ecodeから意味要素 [scode] を抽出
// use. db/noun.db
// use. db/verbnoun.db
// --------------------------------

const Realm = require('realm');
const noundb = new Realm({path: './db/noun.db'});
const verbnoundb = new Realm({path: './db/verbnoun.db'});

function getNoun(s){
    var result =
	noundb.objects('noundb').filtered("aliases CONTAINS $0", s);
    if (JSON.stringify(result) != "{}")
	return result[0];
    else
	return "not_found";
}

//console.log(getNoun("hachijō_mouth"));
//console.log(getNoun("taxi_noriba"));

function getTarget(verb, noun){
    //console.log("getTarget:", verb, "", noun);
    var result =
	verbnoundb.objects('verbnoundb').filtered("verb=$0 AND noun CONTAINS $1",verb, noun);
    //console.log(result);
    if (JSON.stringify(result) != "{}")
	return result[0];
    else
	return "not_found";
}

/*
console.log(getTarget("buy","beer"));
console.log(getTarget("buy","cigarette"));
console.log(getTarget("sell","beer"));
console.log(getTarget("drink","beer"));

console.log(getTarget("spend","money"));
console.log(getTarget("withdraw","money"));
console.log(getTarget("find","money"));
console.log(getTarget("get","money"));

console.log(getTarget("smoke",""));
*/

//
// 領域固有関数：本来は専用にDB化すべき
//

var josu = function(nd){
    switch(nd){
	case "1st": return '1'
	case "2nd": return '2'
	case "3rd": return '3'
	default: return '0'
	}
}
//console.log(josu("2nd"));

var toNumberLiteral = function(token, dbtype){ //specific to this application
    //console.log("token:",token, " dbtype:",dbtype);
    var o = {};
    if (token[0] == "nd"){
	if (dbtype == "TDB"){
	    o['bansen'] = josu(token[1]);
	}
    }
    return o;
}

var tofromTime = function(phrase){
    var o = {};
    switch(phrase){
    case "in the morning":
	o["time_from"] = '0600';
	o["time_to"] = '0900';
	return o;
    default: return o;

    }
}
//console.log(tofromTime("in the morning"));

// --------- end

var queryType = [];
queryType["location"] = {querySDB: {place: '京都', location: ''}};
queryType["train"] = {queryTDB: {place: '京都', train: '', bansen: ''}};
queryType["interval"] = {queryTDB: {place: '京都', line: '', time_from: '', time_to: '', bansen: ''}};
queryType["time"] = {queryTDB: {from: '京都', to: '', time: ''}};
queryType["period"] = {queryTDB: {from: '京都', to: '', period: ''}};
queryType["fare"] = {queryTDB: {from: '京都', to: '', fare: ''}};
queryType["route"] = {queryTDB: {from: '京都', to: '', route: ''}};
queryType["to"] = {queryTDB: {from: '京都', to: ''}};

//queryType["location"]["querySDB"]["location"] = 'atm';
//console.log(queryType["location"]);

var dbkey = "location"; // default
var what = "what";  // 動詞を含まないqueryのでデフォルト値

var generateTDBquery = function(tdbstack){ //あと少し！！！
    if (tdbstack[1] == "noriba") {
	queryType["train"]["queryTDB"]["train"] = tdbstack[0];
	queryType["train"]["queryTDB"]["bansen"] = "what";
	return queryType["train"];
    }
    if (tdbstack[0] == "time"){
	queryType["time"]["queryTDB"]["to"] = tdbstack[1];
	queryType["time"]["queryTDB"]["time"] = "what";
	return queryType["time"];
    }

    if (tdbstack[0] == "train"){
	queryType["period"]["queryTDB"]["to"] = tdbstack[1];
	queryType["period"]["queryTDB"]["period"] = "始発";
	return queryType["period"];
    }
    if (tdbstack[0] == "fare"){
	queryType["fare"]["queryTDB"]["to"] = tdbstack[1];
	queryType["fare"]["queryTDB"]["fare"] = "what";
	return queryType["fare"];
    }
    if (tdbstack[0] == "湖西線" && tdbstack[1] == "morning") {
	queryType["interval"]["queryTDB"]["line"] = tdbstack[0];
	queryType["interval"]["queryTDB"]["time_from"] = "0600";
	queryType["interval"]["queryTDB"]["time_to"] = "0900";
	queryType["interval"]["queryTDB"]["bansen"] = "2";
	return queryType["interval"];
    }
    if (tdbstack[1] == "be" || tdbstack[1] == "get" || tdbstack[1] == "go"){
	queryType["to"]["queryTDB"]["to"] = tdbstack[0];
	return queryType["to"];
    }
    if (tdbstack[0] == "station"){
	queryType["to"]["queryTDB"]["to"] = tdbstack[1];
	return queryType["to"];
    }
    if (tdbstack[0] == "バス"){
	queryType["route"]["queryTDB"]["to"] = tdbstack[1];
	queryType["route"]["queryTDB"]["route"] = tdbstack[0];
	return queryType["route"];
    }
}

function generateScode(){
    var ex = ecode;
    var es = tokenSplit(goolish);
    var stack = []; stack.push(ex[0]);
    var i = 0;

    var verb = "go"; //解析途中の動詞を捕捉, goはdefault
    var noriba = "false";  //default

    var dbtype = "TDB"; //default
    var tdbstack = [];

    while (i < ex.length){
	// -- 数の取扱い
	//8:32
	var token = [];
	if (ex[i].pos == 'CD' && ex[i+1].pos == ':' && ex[i+2].pos == 'CD'){
	    token.push(es[i]); token.push(es[i+1]); token.push(es[i+2]);
	    //console.log(token);
	    i = i + 3;
	};
	//2nd
	var token = ["nd"];
	if (ex[i].base == '-NUMBER-nd'){
	    token.push(es[i]);
	    //console.log(toNumberLiteral(token, dbtype));
	    i = i + 1;
	}

	//No.30
	var token = ["no."];
	if (ex[i].base == 'no-PERIOD-' && ex[i+1].base == '-NUMBER-'){
	    token.push(es[i+1]);
	    //console.log(token);
	    i = i + 2;
	}

	//何番
	var token = ["bango"];
	if (ex[i].base == 'number'){
	    token.push(es[i]);
	    //console.log(token);
	    i = i + 1;
	}

	//一日券
	var token = ["oneday"];
	if (ex[i].base == '-NUMBER--day'){
	    //console.log("一日券");
	    token.push(es[i]);
	    //console.log(token);
	    i = i + 1;
	}

	var token = ["oneday"];
	if (ex[i].base == 'one-day'){
	    token.push(es[i]);
	    i = i + 1;
	}

	// -- 冠詞削除 ＊この判断は微妙
	/*
	if (ex[i].base == 'a' || ex[i].base == 'an' || ex[i].base == 'the'){
	    i++;
	}
	*/

	// -- 動詞の扱い
	// 以下のアルゴリズムでも複数動詞が出ても大丈夫なはず。
	// {動詞, 名詞}が直近のものに対応すると考える
	if (ex[i].cat == 'V' && ex[i].voice == 'active'){
	    verb = ex[i].base;
	    //console.log("verb:",ex[i].base);
	    // 自動詞
	    if (ex[i].arg2 == null){
		var vw = getTarget(ex[i].base, "$$");
		if (vw != "not_found"){
		    dbtype = vw.db;
		    if (dbtype == "SDB"){
			queryType["location"]["query"+dbtype]["location"] = vw.jword;
		    };
		    //console.log(vw.db, " ", vw.jword);
		}
	    }
	    // 他動詞
	    verb = ex[i].base;
	    i++;
	    if (i > ex.length-1) break;
	}

	// -- 名詞の取扱い
	var token = [];
	if (!(ex[i].base == '-NUMBER-nd' || ex[i].base == 'no-PERIOD-') && (ex[i].pos == 'NN' || ex[i].pos == 'NNP' || ex[i].pos == 'NNS' || isCardinalNoun(ex[i]))){
	    token.push(ex[i].base);
	    var j = i+1;
	    while(j < ex.length){
		if (ex[j].pos == 'NN' || ex[j].pos == 'NNP'){
	    	    if (ex[j].base == 'noriba') {console.log(ex[j].base); noriba = true} //brute force
		    token.push(ex[j].base);
		    j++;
		} else {
		    break;
		}

	    };
	    var ctoken = concatenate(token);
	    // 固有名詞を日本語に戻す
	    var w = getNoun("$"+ctoken+"$");
	    if (w !=  "not_found") {
		dbtype = w.db;
		if (dbtype == "SDB"){
		    queryType["location"]["query"+dbtype]["location"]= w.jword;
		}
		if (w.db == "TDB" || w.db == "SDB") tdbstack.push(w.jword);
		//console.log("1",w.db, " ", w.jword, tdbstack)
	    }
	    else {
		// 動詞+名詞のペアに対するターゲット語を得る
		var vw = getTarget(verb, "$"+ctoken+"$");
		if (vw != "not_found") {
		    dbtype = vw.db;
		    if (dbtype == "SDB"){
			queryType["location"]["query"+dbtype]["location"] = vw.jword;
		    }
		    if (vw.db == "TDB") tdbstack.push(vw.jword);
		    //console.log("2", vw.db, " ", vw.jword)
		}
		else{
		    if (dbtype == "TDB") tdbstack.push(ctoken);
		    //console.log("3", dbtype, " ", ctoken, tdbstack);
		}
	    }
	    i = j;
	}

	if (i > ex.length-1 ) break; //文末に達した。

	// -- normal
	//console.log(es[i]);
	i++;
    };
    if (dbtype == "TDB" || tdbstack[0]=="湖西線"){
	if (noriba == true) tdbstack.push('noriba');
	tdbstack.push(verb);
	//console.log(tdbstack);
	return (generateTDBquery(tdbstack));
    }else {
	return queryType[dbkey];
    }
}

var noEmpty = true;
function interpreter(line){
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
    // console.log(generateScode());
    return generateScode();
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
// use. DICteisei.js
// ------------------------------

var teisei = require('./DICteisei.js');
var teiseidic = teisei.make();
function replaceTeisei(s){
    var modified = s;
    for (var i = 0; i < teiseidic.length; i++){
	if (modified.indexOf(teiseidic[i].org) == -1) continue;
	modified = modified.replace(teiseidic[i].org, teiseidic[i].mod);
    }
    return modified;
}

module.exports = function(line){
  var replaced = replaceTeisei(line);
  console.log('result:' + replaced);
  return interpreter(line);
}


if (batch){ //バッチテスト
    var text = [];
    var textid = 0;
    var testin = require('./test_in_sample.js');
    var example = testin.make();

    for (var i = 0; i < example.length; i++){
	text[i] = replaceTeisei(example[i]);
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
		interpreter(line);
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

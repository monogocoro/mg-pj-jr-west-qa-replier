//
// Nutural Language Understanding
//   matsuda@monogocoro.co.jp   2018.7
//

'use strict';

var debug = false;
var debugC = true;

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

var parseString = require('xml2js').parseString;
function get_enju_json(text){
    var xml = get_enju_xml(get_ja2en(text));
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
    if (debug) console.log("nodemarks = ", nodemarks);
    nodemarks = [];

    if(debug){
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

//
// --- sode: 動詞主体で原文を再構成
//
var scode;
function generateCode(line){
    if (JSON.stringify(tokenList) == "[]"){
	console.log(line, "が翻訳出来ませんでした。");
	return;
    }
    // -- code: scode一步手前。scode生成のための情報収集
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
	    code["arg1"] = tokenList[i].content.arg1;
    	    code["arg2"] = tokenList[i].content.arg2;
	}
	var base = tokenList[i].content.base;
	if (base == "how"){
	    code["pos"] = 'WRB';
	}
	if (base == "what"){
	    code["pos"] = 'WP';
	}
	if (base == "when"){
	    code["pos"] = 'WRB';
	}
	if (base == "where"){
	    code["pos"] = 'WRB';
	}
	if (base == "who"){
	    code["pos"] = 'WP';
	}

	//if (debugC) console.log("code = ", JSON.stringify(code));
	stack.push(code);
	code = {};
    }
    //console.log(stack);
    scode = stack;
    tokenIdList = [];
    tokenList = [];
}

function isWhere(code){
    var obj = {};
    obj["ans"] = false;
    if (code.base == 'where' && code.pos =='WRB'){
	obj["ans"] = true;
    }
    return obj;
}

function isHow(code){
    var obj = {};
    obj["ans"] = false;
    if (code.base == 'how' && code.pos =='WRB'){
	obj["ans"] = true;
    }
    return obj;
}

function isThere(code){
    var obj = {};
    obj["ans"] = false;
    if (code.base == 'there' && code.cat =='N'){
	obj["ans"] = true;
    }
    return obj;
}

function isNoun(code){
    var obj = {};
    obj["ans"] = false;
    if (code.pos =='NN' || code.pos == 'NNP'){
	obj["ans"] = true;
	obj["base"] = code.base;
    }
    return obj;

}

function isVerb(code){
    var obj = {};
    obj["ans"] = false;
    if (code.cat =='V'){
	obj["ans"] = true;
	obj["base"] = code.base;
    }
    return obj;
}

/*
console.log(isWhere({base: 'where', pos: 'WRB'}));
console.log(isHow({base: 'how', pos: 'WRB'}));
console.log(isThere({base: 'there', cat: 'N'}));
console.log(isNoun({base: 'apple', pos: 'NN'}));
console.log(isVerb({base: 'go', cat: 'V'}));
*/

// 名詞=>場所タイプ
function placeof(noun){
    if (noun == 'kinkakuji') return 'out';
    else if (noun == 'atm') return 'in';
    else if (noun == 'money') return 'in';
}

// 場所タイプ=>DB
function dbofplace(p){
    if (p == 'out') return 'queryTDB';
    else if (p == 'in') return 'querySDB';
}

// DBタイプ
function isIn(db){
    return db == 'querySDB';
}

function isOut(db){
    return db == 'queryTDB';
}

function alias(noun){
    if (noun == 'atm') return noun;
    else if (noun == 'money') return 'atm';
    else if (noun == 'kinkakuji') return noun;
}

/*
console.log(dbofplace(placeof('atm')));
console.log(dbofplace(placeof('kinkakuji')));
console.log(isOut(dbofplace(placeof('kinkakuji'))));
console.log(isIn(dbofplace(placeof('atm'))));
*/

function getIntension(){
    var out = {};
    var db;
    var a;
    // {dbtype: from: kyoto to: }
    // {dbtype: location: }
    for (var i = 0; i < scode.length; i++){
	a = isWhere(scode[i]);
	if(a.ans){
	    ;;
	}
	a = isThere(scode[i]);
	if (a.ans){
	    ;;
	}
	a = isNoun(scode[i]);
	if (a.ans){
	    db = dbofplace(placeof(a.base));
	    if(isOut(db)){
		out["db"] = db;
		out["from"] = 'kyoto';
		out["to"] = alias(a.base);
	    }
	    else if(isIn(db)){
		out["db"] = db;
		out["location"] = alias(a.base);
	    }

	}
     }
     return out;
}

/*

金閣寺にはどう行きますか。
金閣寺へはどう行きますか。
金閣寺はどこですか。
金閣寺どこ。
金閣寺に行きたいんですが。
金閣寺に行きたいのですが。
金閣寺への行き方を教えてください。
金閣寺ってどこ。
金閣寺。

ATM。
ATM ある。
ATM はどこ。
ATM はありますか。
ATM ありますか。
お金をおろしたい。
(お金を下ろしたい.)
お金おろしたい。
お金をおろしたいんだけど。
お金おろしたいんだけど。
お金をおろせる場所を教えて。
お金おろせる場所ありますか。
お金おろせる場所は。
どこでお金をおろせますか。
どこでお金おろせる。

> 金閣寺はどこ。
queryTDB
{ db: 'queryTDB', from: 'kyoto', to: 'kinkakuji' }

> 金閣寺への行き方を教えてください。
queryTDB
{ db: 'queryTDB', from: 'kyoto', to: 'kinkakuji' }

> お金をおろしたいんだけど。
querySDB
{ db: 'querySDB', location: 'atm' }

> どこでお金をおろせますか。
querySDB
{ db: 'querySDB', location: 'atm' }
*/


var noEmpty = true;
module.exports = function(line){
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

    // code生成
    generateCode(line);

    // 意図抽出
    console.log(getIntension());
    return getIntension();
};

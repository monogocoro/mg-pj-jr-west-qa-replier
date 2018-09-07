'use strict'

const Realm = require("realm")

const noundb = {
    name: "noundb",
    primaryKey: "id",
    properties: {
        id: {
            type: "int",
        },
	jword: {
	    type: "string",
	},
	db: {
	    type: "string",
	},
	aliases: {
	    type: "string",
	}
    }
}
    
function createDB(db, schema_name, list){
    db.write(() => {
	list.forEach((val, key) => {
	    db.create(
		schema_name,
		val
	    );
        });
    });
}    

const db = new Realm({path: "./db/noun.db", schema: [noundb]});

// CSVファイルから自動生成できるはず
// 文字コードトラブル
//    goolishの変換で長音はhachijōのようになる！
//    kinakuji
//    手とものMAC OSのterminalで開発。コードUUU
// $マークはrealm CONTAINS利用において部分一致を防ぐため
// $マークがない場合、CONTAINSは""にも部分一致してしまう！
const nounlist = [
    {id: 1, jword: "八条口", db: "SDB", aliases: "$hachijō_mouth$"},
    {id: 2, jword: "金閣寺", db: "TDB", aliases: "$kinkakuji$ $kinkakuji_temple$"},
    {id: 3, jword: "タクシー", db: "SDB", aliases: "$taxi_noriba$"},
    {id: 4, jword: "バス", db: "SDB", aliases: "$bus$"},
    {id: 5, jword: "新幹線", db: "TDB", aliases: "$shinkansen_noriba$"},
    {id: 6, jword: "乗り場", db: "", aliases: "$noriba$"},
    {id: 7, jword: "コンビニ", db: "SDB", aliases: "$convenience_store$"},
    {id: 8, jword: "喫煙所", db: "SDB", aliases: "$place_tabacco_smoke$ $smoking_place$"},
    {id: 9, jword: "ユニバーサルシティ", db: "TDB", aliases: "$universal_city_station$ $usj$"},
    {id: 10, jword: "天王寺", db: "TDB", aliases: "$tennoji$"},
    {id: 11, jword: "関西国際空港", db: "TDB", aliases: "$kanku$"},
    {id: 12, jword: "大阪", db: "TDB", aliases: "$osaka_station$"},
    {id: 13, jword: "高槻", db: "TDB", aliases: "$takatsuki$"},
    {id: 14, jword: "湖西線", db: "TDB", aliases: "$koseisen$"},
    {id: 15, jword: "京都鉄道博物館",db: "TDB", aliases: "$kyoto_railway_museum$"},
    {id: 16, jword: "始発", db: "TDB", aliases: "$firsttrain first_departure$"},
    {id: 17, jword: "天王寺", db: "TDB", aliases: "$tennoji_station$"},
    {id: 18, jword: "atm", db: "SDB", aliases: "$atm"},
    {id: 19, jword: "奈良", db: "TDB", aliases: "$nara$"},
    {id: 20, jword: "尼崎", db: "TDB", aliases: "$amagasaki$"},
    {id: 21, jword: "博多", db: "TDB", aliases: "$hakata$"},
    {id: 22, jword: "嵐山", db: "TDB", aliases: "$arashiyama$"},
];

db.write(() => db.deleteAll())
createDB(db, "noundb", nounlist);

db.close();
process.exit(0);



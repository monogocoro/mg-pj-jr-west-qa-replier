'use strict'

const Realm = require("realm")

const verbnoundb = {
    name: "verbnoundb",
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
	verb: {
	    type: "string",
	},
	noun: {
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

const db = new Realm({path: "./db/verbnoun.db", schema: [verbnoundb]});

// CSVファイルから自動生成できるはず
const verbnounlist = [
    {id: 1, jword: "atm", db: "SDB", verb: "spend", noun: "$money$"},
    {id: 2, jword: "atm", db: "SDB", verb: "withdraw", noun: "$money$"},
    {id: 3, jword: "atm", db: "SDB", verb: "find", noun: "$money$"},
    {id: 4, jword: "atm", db: "SDB", verb: "get", noun: "$money$"},
    {id: 5, jword: "atm", db: "SDB", verb: "spare", noun: "$money$"},
    {id: 6, jword: "atm", db: "SDB", verb: "be", noun: "$atm$"},

    // a cold beer に対し beerと "a cold"部分を省略
    {id: 7, jword: "コンビニ", db: "SDB", verb: "buy", noun: "$beer$ $cigarette$"},
    {id: 8, jword: "コンビニ", db: "SDB", verb: "sell", noun: "$beer$ $cigarette$"},
    {id: 9, jword: "コンビニ", db: "SDB", verb: "drink", noun: "$beer$"},
    {id: 10, jword: "喫煙所", db: "SDB", verb: "smoke", noun: "$$"}
];

db.write(() => db.deleteAll())
createDB(db, "verbnoundb", verbnounlist);

db.close();
process.exit(0);

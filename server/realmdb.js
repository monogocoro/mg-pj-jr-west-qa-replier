// http://var.blog.jp/archives/75916438.html

'use strict'
const Realm = require("realm")

const schema_obj00 = {
    name: "schema00",
    primaryKey: "id",
    properties: {
        id: {
            type: "int",
        },
        val: {
            type: "int",
            default: 100,
            indexed: true,
        },
        val2: {
            type: "string",
            optional: true,
        },
        obj: {
            type: "schema01",
        },
        list: {
            type: "list",
            objectType: "schema02",
        }
    }
}

const schema_obj01 = {
    name: "schema01",
    properties: {
        x: "double",
        y: "double",
    }
}

const schema_obj02 = {
    name: "schema02",
    properties: {
        word: "string"
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

const db = new Realm({path: "./db/realm01.db", schema: [schema_obj00, schema_obj01, schema_obj02]})

const test = [
    {id: 1, obj: {x: 1.23, y: 4.56}, val2: "apple orange and",list: [{word: "apple"}, {word: "orange"}]},
    {id: 2, obj: {x: 4, y: 4.9}, val2: "apple3 <something>bad", list: [{word: "banana"}]}];

db.write(() => db.deleteAll())
createDB(db, "schema00", test);

//console.log(db.objects("schema00"));
//console.log(db.objects("schema01"));

db.close();
process.exit(0);

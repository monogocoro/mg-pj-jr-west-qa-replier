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
  {id: 300, jword: "金沢", db: "TDB", aliases: "$kanazawa$"},
    {id: 1, jword: "八条口", db: "SDB", aliases: "$hachijō_mouth$ $hachijoguchi$"},
    {id: 2, jword: "金閣寺", db: "TDB", aliases: "$kinkakuji$ $kinkakuji_temple$"},
    {id: 3, jword: "タクシー", db: "SDB", aliases: "$taxi$"},
    {id: 4, jword: "バス", db: "SDB", aliases: "$bus$"},
    {id: 5, jword: "新幹線", db: "TDB", aliases: "$shinkansen$"},
    {id: 7, jword: "コンビニ", db: "SDB", aliases: "$convenience_store$"},
    //{id: 8, jword: "喫煙所", db: "SDB", aliases: "$smoking_place$ $place_tabacco_smoke$"},
    {id: 9, jword: "ユニバーサルシティ", db: "TDB", aliases: "$universal_city$ $usj$"},
    {id: 10, jword: "天王寺", db: "TDB", aliases: "$tennoji$"},
    {id: 11, jword: "喫煙所", db: "SDB", aliases: "$smoking_place$ $place_tobacco_smoke$"}, //文字コードエラー
    //{id: 11, jword: "関西国際空港", db: "TDB", aliases: "$kanku$"},
    {id: 12, jword: "大阪", db: "TDB", aliases: "$osaka$"},
    {id: 13, jword: "高槻", db: "TDB", aliases: "$takatsuki$"},
    {id: 14, jword: "湖西線", db: "TDB", aliases: "$koseisen$"},
    {id: 15, jword: "京都鉄道博物館",db: "TDB", aliases: "$kyoto_railway_museum$"},
    {id: 16, jword: "始発", db: "TDB", aliases: "$first_train first_departure$"},
    {id: 17, jword: "天王寺", db: "TDB", aliases: "$tennoji$"},
    {id: 18, jword: "ATM", db: "SDB", aliases: "$atm$"},
    {id: 19, jword: "奈良", db: "TDB", aliases: "$nara$"},
    {id: 20, jword: "尼崎", db: "TDB", aliases: "$amagasaki$"},
    {id: 21, jword: "博多", db: "TDB", aliases: "$hakata$"},
    {id: 22, jword: "嵐山", db: "TDB", aliases: "$arashiyama$"},
    {id: 23, jword: "はるか", db: "TDB", aliases: "$haruka$ $horuka$"},
    {id: 24, jword: "祇園祭り", db: "EDB", aliases: "$gion_festival$"},
    {id: 25, jword: "高速バス", db: "SDB", aliases: "$high-speed_bus$"},
    {id: 26, jword: "関空リムジンバス", db: "SDB", aliases: "$kanku_limousine_bus$ $kansai_airport_limousine_bus$"},
    {id: 28, jword: "地下鉄", db: "SDB", aliases: "$subway$"},
    {id: 29, jword: "近鉄", db: "SDB", aliases: "$kintetsu$"},
    {id: 30, jword: "阪急", db: "SDB", aliases: "$hankyu$"},
    //{id: 31, jword: "はるか", db: "TDB", aliases: "$haruka$ $horuka$"},
    //{id: 32, jword: "新幹線のりば", db: "TDB", aliases: "$bullet_train_noriba$"},
    {id: 33, jword: "サンダーバード", db: "TDB", aliases: "$thunderbird$"},
    {id: 34, jword: "東海道線", db: "TDB", aliases: "$tokaido_line$"},
    {id: 35, jword: "京都駅周辺", db: "SDB", aliases: "$station_area$"},
    {id: 36, jword: "待ち合わせ場所", db: "SDB", aliases: "$meeting_place$"},
    {id: 37, jword: "時の灯り", db: "SDB", aliases: "$tokeidai$"},
    //{id: 38, jword: "喫煙所", db: "SDB", aliases: "$smoking_place$ $place_tobacco_smokeplace$"},
    {id: 39, jword: "観光案内所", db: "SDB", aliases: "$tourist_information_office$"},
    {id: 40, jword: "駅ビル", db: "SDB", aliases: "$station_building$"},
    {id: 41, jword: "北海道イベント", db: "EDB", aliases: "$hokkaido_event$"},
    {id: 42, jword: "イベント", db: "EDB", aliases: "$event$"},
    {id: 43, jword: "花火大会", db: "EDB", aliases: "$firework_festival$"},
    {id: 44, jword: "嵯峨野", db: "EDB", aliases: "$sagano$"},
    {id: 45, jword: "観光スポット", db: "EDB", aliases: "$tourist_attraction$ $tourist_spot$"},
    {id: 46, jword: "東山", db: "EDB", aliases: "$higashiyama$"},
    {id: 47, jword: "五条", db: "EDB", aliases: "$gojo$"},
    {id: 48, jword: "四条", db: "EDB", aliases: "$shijo$"},
    {id: 49, jword: "京都タワー", db: "SDB", aliases: "$kyoto_tower$"},
    {id: 50, jword: "保津川下り", db: "TDB", aliases: "$hozugawakudari$ $hozujiwakudari$"},
    {id: 51, jword: "トロッコ嵐山", db: "TDB", aliases: "$torokko$ $torokkoarashiyama$"},
    {id: 52, jword: "平等院", db: "TDB", aliases: "$byodoin$"},
    // to GIONSHIJO[V]
    {id: 53, jword: "祇園四条", db: "TDB", aliases: "$gionshijo$ $otani_shrine$ $otani_antique$ $higashihonganji_direction$ $higashihonganji$"},
    {id: 54, jword: "西本願寺前", db: "TDB", aliases: "$nishihonganji$　$nishihonganji_temple$"},
    {id: 55, jword: "石清水八幡宮", db: "TDB", aliases: "$iwashimizuhachimangu$"},
    {id: 56, jword: "極楽橋", db: "TDB", aliases: "$koyasan$"},
    {id: 57, jword: "銀閣寺", db: "TDB", aliases: "$ginkakuji$"},
    {id: 58, jword: "京阪祇園四条", db: "TDB", aliases: "$gion$"},
    {id: 59, jword: "東寺", db: "TDB", aliases: "$toji$"},
    {id: 60, jword: "清水寺", db: "TDB", aliases: "$kiyomizudera$"},
    {id: 61, jword: "100円ショップ", db: "SDB", aliases: "$100_yen_shop$"},
    {id: 62, jword: "ローソン", db: "SDB", aliases: "$lawson$"},
    {id: 63, jword: "ファミマ", db: "SDB", aliases: "$famima$ $familymart$"},
    {id: 64, jword: "セブンイレブン", db: "SDB", aliases: "$seven_eleven$"},
    {id: 65, jword: "スーパーマーケット", db: "SDB", aliases: "$supermarket$"},
    {id: 66, jword: "コンビニ", db: "SDB", aliases: "$convenience_store$"},
    {id: 67, jword: "薬局", db: "SDB", aliases: "$pharmacy$"},
    {id: 68, jword: "ドラッグストア", db: "SDB", aliases: "$drug_store$"},
    {id: 69, jword: "お土産屋", db: "SDB", aliases: "$souvenir_shop$"},
    {id: 79, jword: "改札階", db: "SDB", aliases: "$gift_floor$"},
    {id: 80, jword: "弁当屋", db: "SDB", aliases: "$bento_restaurant$"},
    {id: 81, jword: "駅弁", db: "SDB", aliases: "$ekiben$"},
    {id: 82, jword: "烏丸口", db: "SDB", aliases: "$karasumaguchi$ $karasuma_mouth$"},
    {id: 83, jword: "飲食店", db: "SDB", aliases: "$eatery$ $restaurant$ $restaurant_district$$"},
    {id: 84, jword: "喫茶店", db: "SDB", aliases: "$coffee_shop$ $saten$ $cafe$"},
    {id: 85, jword: "ユニクロ", db: "SDB", aliases: "$uniqlo$"},
    {id: 86, jword: "伊勢丹", db: "SDB", aliases: "$isetan$"},
    {id: 87, jword: "イオンモール", db: "SDB", aliases: "$aeon_mall$"},
    {id: 88, jword: "アバンティ", db: "SDB", aliases: "$avanti$"},
    {id: 89, jword: "東急ハンズ", db: "SDB", aliases: "$tokyu_hands$"},
    {id: 90, jword: "ビックカメラ", db: "SDB", aliases: "$bic_camera$"},
    {id: 91, jword: "ヨドバシカメラ", db: "SDB", aliases: "$yodobashi_camera$"},
    {id: 92, jword: "格安ホテル", db: "SDB", aliases: "$cheap_hotel$"},
    {id: 93, jword: "ゲストハウス", db: "SDB", aliases: "$guest_house$"},
    {id: 94, jword: "ホテルマイステイズ京都", db: "SDB", aliases: "$hotel_mystays_kyoto$"},
    {id: 95, jword: "リーガロイヤルホテル", db: "SDB", aliases: "$rihga_royal_hotel$"},
    {id: 96, jword: "第二タワーホテル", db: "SDB", aliases: "$dainitowerhotel$"},
    {id: 97, jword: "新都ホテル", db: "SDB", aliases: "$new_miyako_hotel$"},
    {id: 98, jword: "東急ホテル", db: "SDB", aliases: "$tokyu_hotel$"},
    {id: 99, jword: "阪急ホテル", db: "SDB", aliases: "$hankyu_hotel$"},
    {id: 100, jword: "ハトヤ瑞鳳閣", db: "SDB", aliases: "$hatoya_zuihokaku$"},
    {id: 101, jword: "グランヴィア京都", db: "SDB", aliases: "$granvia$ $granvia_kyoto$"},
    {id: 102, jword: "梅小路公園", db: "SDB", aliases: "$umekoji_park$ $kyoto_railway_museum$"},
    {id: 103, jword: "京都鉄道博物館", db: "SDB", aliases: "$umekoji_park$ $kyoto_railway_museum$"},
    {id: 104, jword: "京都水族館", db: "SDB", aliases: "$kyoto_aquarium$"},
    {id: 105, jword: "ニッポンレンタカー", db: "SDB", aliases: "$nipponrentacar$"},
    {id: 106, jword: "レンタカー", db: "SDB", aliases: "$rentacar$"},
    {id: 107, jword: "ホテル近鉄京都駅", db: "SDB", aliases: "$hotel_kintetsu_kyoto_station$"},
    {id: 108, jword: "リーガロイヤルホテル", db: "SDB", aliases: "$rihga_royal_hotel$"},
    {id: 109, jword: "バスの一日乗車券", db: "SDB", aliases: "$one-day_bus_ticket$ $1-day_bus_ticket$"},
    {id: 110, jword: "きっぷ", db: "SDB", aliases: "$ticket$"},
    {id: 111, jword: "関空", db: "SDB", aliases: "$kanku$"},
    {id: 112, jword: "市バス", db: "SDB", aliases: "$city_bus$"},
    {id: 113, jword: "チケット売り場", db: "SDB", aliases: "$ticket_office$"},
    {id: 114, jword: "河原町", db: "TDB", aliases: "$kawaramachi$"},
    {id: 115, jword: "神宮丸太町", db: "TDB", aliases: "$jingumarutamachi$"},
    {id: 116, jword: "東福寺", db: "TDB", aliases: "$tofukuji$ $keihan_train$"},
    {id: 117, jword: "地下鉄一日乗車券", db: "SDB", aliases: "$one_day_subway_ticket$ $1-day_subway_ticket$"},
    {id: 118, jword: "四条駅", db: "TDB", aliases: "$market$"},
    {id: 119, jword: "二条城前", db: "TDB", aliases: "$nijojomae$"},
    {id: 120, jword: "今出川", db: "TDB", aliases: "$imadegawa$"},
    {id: 121, jword: "四条烏丸", db: "TDB", aliases: "$subway_shijokarasuma$"},
    {id: 122, jword: "敦賀", db: "TDB", aliases: "$tsuruga$"},
    // 料金 fare / charge
    {id: 123, jword: "新大阪", db: "TDB", aliases: "$shinosaka$"},
    {id: 124, jword: "ウエストレールパス", db: "RDB", aliases: "$west_rail_pass$"},
    {id: 125, jword: "山科", db: "TDB", aliases: "$yamashina$"},
    {id: 126, jword: "昼得回数券", db: "RDB", aliases: "$hirutokukaisuken$"},
    {id: 127, jword: "回数券", db: "RDB", aliases: "$kaisuken$"},
    {id: 128, jword: "改札", db: "SDB", aliases: "$ticket_gate$"},
    {id: 129, jword: "EX ICカード", db: "RDB", aliases: "$exic_card$"},
    {id: 130, jword: "ICOCA定期", db: "RDB", aliases: "$icoca_teiki$"},
    {id: 131, jword: "ICOCA", db: "RDB", aliases: "$icoca$"},
    {id: 132, jword: "ICカード", db: "RDB", aliases: "$ic_card$"},
    {id: 133, jword: "入場券", db: "RDB", aliases: "$admission_ticket$"},
    {id: 134, jword: "東岡山", db: "TDB", aliases: "$higashiokayama$"},
    {id: 135, jword: "広島", db: "TDB", aliases: "$hiroshima$"},
    {id: 136, jword: "地下鉄五条", db: "TDB", aliases: "$subway_gojo$"},
    {id: 137, jword: "桂川", db: "TDB", aliases: "$katsuragawa$"},
    {id: 138, jword: "定期", db: "RDB", aliases: "$teiki$"},
    {id: 139, jword: "ぷらっとこだま", db: "RDB", aliases: "$prattokodama$"},
    //{id: 140, jword: "ぷらっとこだまのきっぷ", db: "RDB", aliases: "$prattokodama_ticket$"},
    {id: 141, jword: "ジャパンレールパス", db: "RDB", aliases: "$japan_rail_pass$"},
    {id: 142, jword: "京都", db: "TDB", aliases: "$kyoto$"},
    {id: 143, jword: "京都市内", db: "TDB", aliases: "$kyoto_citye$"},
    {id: 144, jword: "東京", db: "TDB", aliases: "$tokyo$"},
    {id: 145, jword: "尼崎", db: "TDB", aliases: "$amagasakio$"},
    {id: 146, jword: "神戸", db: "TDB", aliases: "$kobe$"},
    {id: 147, jword: "機械", db: "RDB", aliases: "$machine$"},
    {id: 148, jword: "名古屋", db: "TDB", aliases: "$nagoya$"},
    {id: 149, jword: "IC乗車", db: "RDB", aliases: "$ic_ride$"},
    {id: 150, jword: "Suica", db: "RDB", aliases: "$suica$"},
    {id: 151, jword: "Edy", db: "RDB", aliases: "$edy$"},
    {id: 152, jword: "クイックチャージポイント", db: "RDB", aliases: "$quickchargepoint$"},
    {id: 153, jword: "PASPY", db: "RDB", aliases: "$paspy$"},
    {id: 154, jword: "在来線", db: "RDB", aliases: "$conventional_line$"},
    {id: 155, jword: "最終時刻", db: "RDB", aliases: "$last_train_time$"},
    {id: 156, jword: "最終", db: "RDB", aliases: "$last_train$"},
    {id: 157, jword: "始発", db: "RDB", aliases: "$first_train$"},
    {id: 158, jword: "各停", db: "RDB", aliases: "$each_stop$ $local_train$"},
    //{id: 159, jword: "桂川の定期", db: "RDB", aliases: "$katsuragawa_teiki$"},
    {id: 160, jword: "新快速", db: "TDB", aliases: "$shinkaisoku$"},
    {id: 161, jword: "都路快速", db: "TDB", aliases: "$miyakojikaisoku$"},
    {id: 162, jword: "稲荷駅", db: "TDB", aliases: "$inari_station$"},
    {id: 163, jword: "普通", db: "RDB", aliases: "$normal$ $normal_train$"},
    {id: 164, jword: "快速", db: "RDB", aliases: "$fast$ $fast_train$ $speed$"},
    {id: 165, jword: "宇治", db: "TDB", aliases: "$uji$"},
    {id: 166, jword: "藤枝", db: "TDB", aliases: "$fujieda$"},
    {id: 167, jword: "竹田", db: "TDB", aliases: "$takeda$"},
    {id: 168, jword: "JR", db: "RDB", aliases: "$jr$"},
    {id: 169, jword: "先着列車", db: "RDB", aliases: "$senchaku_train$"},
    {id: 170, jword: "太秦", db: "TDB", aliases: "$uzumasa$"},
    {id: 171, jword: "おごと温泉", db: "TDB", aliases: "$ogoto_onsen$"},
    {id: 172, jword: "嵯峨嵐山", db: "TDB", aliases: "$sagaarashiyama$"},
    {id: 173, jword: "堺市", db: "TDB", aliases: "$sakai_city$"},
    {id: 174, jword: "コインロッカー", db: "SDB", aliases: "$coin_locker$"},
    {id: 175, jword: "授乳室", db: "SDB", aliases: "$nursing_room$"},
    {id: 176, jword: "駅のスタンプ", db: "SDB", aliases: "$station_stamp$"},
    {id: 177, jword: "待合室", db: "SDB", aliases: "$waiting_room$ $wait_room$"},
    //{id: 178, jword: "駅", db: "SDB", aliases: "$station$"},
    {id: 179, jword: "奈良線", db: "SDB", aliases: "$nara_line$"},
    //{id: 180, jword: "空いているトイレ", db: "SDB", aliases: "$vacant_toilet$"},
    {id: 181, jword: "多目的トイレ", db: "SDB", aliases: "$multi-purpose_toilet$"},
    {id: 182, jword: "トイレ", db: "SDB", aliases: "$toilet$ $restroom$"},
    {id: 183, jword: "関西ワンデイパス", db: "RDB", aliases: "$kansaionedaypass$"},
    {id: 184, jword: "定期券", db: "RDB", aliases: "$teiki_ticket$"},
    {id: 185, jword: "篠山口", db: "TDB", aliases: "$sasayamaguchi$"},
    {id: 186, jword: "鯖江", db: "TDB", aliases: "$sabae$"},
    {id: 187, jword: "Web予約", db: "TDB", aliases: "$web_reservation$"},
    {id: 188, jword: "特急券", db: "RDB", aliases: "$limited_express_ticket$"},
    {id: 189, jword: "券売機", db: "RDB", aliases: "$kenbaiki$"},
    //ticket[N] vending[V] machine[N]
    {id: 190, jword: "手回り品きっぷ", db: "RDB", aliases: "$temawarihin_ticket$"},
    {id: 191, jword: "関空特急はるか", db: "TDB", aliases: "$kanku_express_haruka$"},
    {id: 192, jword: "新幹線", db: "TDB", aliases: "$bullet_train$ $shinkansen$"},
    //{id: 193, jword: "はるかの特急券", db: "RDB", aliases: "$haruka_limited_express_ticket$"},
    {id: 194, jword: "中距離券", db: "RDB", aliases: "$chukyori_ticket$"},
    {id: 195, jword: "近距離券", db: "RDB", aliases: "$kinkyoriken$"},
    {id: 196, jword: "中央改札", db: "SDB", aliases: "$chuokaisatsu$"},
    {id: 197, jword: "バリアフリールート", db: "SDB", aliases: "$barrier_free_route$"},
    {id: 198, jword: "エレベータ", db: "SDB", aliases: "$elevator$"},
    {id: 199, jword: "自由席", db: "RDB", aliases: "$free_seat$"},
    {id: 200, jword: "指定席", db: "RDB", aliases: "$reserved_seat$ $designated_seat$"},
    {id: 201, jword: "サンダーバード", db: "TDB", aliases: "$thuderbird$"},
    {id: 202, jword: "びわこエクスプレス", db: "TDB", aliases: "$biwako_express$"},
    //The feet number of Biwako Express' s free seat is.
    //{id: 203, jword: "びわこエクスプレス", db: "TDB", aliases: "$biwako_express$"},
    //{id: 204, jword: "足元番号", db: "TDB", aliases: "$foot_number$"},
    {id: 205, jword: "くろしお", db: "TDB", aliases: "$kuroshio$"},
    //{id: 206, jword: "くろしお到着番線", db: "SDB", aliases: "$kuroshio_arrival_line$"},
    {id: 207, jword: "到着番線", db: "TDB", aliases: "$arrival_line$"},
    {id: 208, jword: "出発番線", db: "TDB", aliases: "$departure_line$"},
    {id: 209, jword: "特急橋立", db: "TDB", aliases: "$tokkyu_hashidate$"},
    {id: 210, jword: "みどりの窓口", db: "SDB", aliases: "$midorinomadoguchi$"},
    //{id: 211, jword: "シャッター", db: "SDB", aliases: "$shutter$"},
    {id: 212, jword: "下山口", db: "TDB", aliases: "$shimoyamaguchi$"},
    {id: 213, jword: "関西エアポートリムジンバス", db: "SDB", aliases: "$kansai_airport_limousine_bus$"},
    {id: 214, jword: "近鉄", db: "SDB", aliases: "$kintetsu$$"},
    {id: 215, jword: "大谷", db: "TDB", aliases: "$otani$"},
];

db.write(() => db.deleteAll())
createDB(db, "noundb", nounlist);

db.close();
process.exit(0);

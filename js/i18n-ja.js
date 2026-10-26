/* Japanese. Core screens only; other text falls back to English. */
(function(root){
root.H.addStrings("ja", {
app_name:"HUST 留学生サバイバルガイド", app_unofficial_short:"非公式の学生ガイド", close:"閉じる", cancel:"キャンセル", search:"検索", sos_help:"緊急ヘルプ", sos_short:"SOS", profile:"プロフィール", nav_main:"メインメニュー",
trust_official:"公式情報", trust_reference:"参考", trust_sample:"サンプル", trust_unverified:"未確認", trust_user:"自分のデータ",
src_undated:"日付なし", src_checked:"{d} 確認", err_generic:"問題が発生しました。もう一度お試しください。", loading:"読み込み中…",
speech_none:"このブラウザでは音声を再生できません。", speech_novoice:"この端末にはベトナム語の音声がなく、発音が不正確な場合があります。文字を読んでください。", play_audio:"音声を再生",
tab_home:"ホーム", tab_academic:"学習", tab_campus:"キャンパス", tab_life:"生活", tab_support:"サポート",
sub_plan:"履修プラン", sub_timetable:"マイ時間割", sub_tasks:"リマインダー", sub_credits:"単位とGPA", sub_portal:"学生ポータル案内", sub_map:"地図", sub_rooms:"教室検索", sub_library:"図書館", sub_places:"場所", sub_guide:"日常生活", sub_phrases:"ベトナム語", sub_address:"呼びかけ方", sub_activities:"キャンパスライフ", sub_help:"誰に聞く", sub_checklist:"最初の30日", sub_handbook:"ハンドブック", sub_conduct:"行動規範", sub_assess:"セルフチェック", sub_profile:"プロフィール", sub_saved:"保存済み", sub_data:"マイデータ", sub_about:"このアプリについて",
back:"戻る", next:"次へ", skip:"スキップ", skip_all:"設定を後で行う", finish:"完了", done:"完了", open:"開く", add:"追加", remove:"削除", edit:"編集", delete:"削除", save:"保存", saved:"保存済み", reset:"リセット", clear:"クリア", copy:"コピー", copied:"コピーしました", all:"すべて", website:"ウェブサイト", phone:"電話", where:"場所", steps:"手順", today:"今日", tomorrow:"明日", overdue:"期限切れ", from:"出発", to:"到着", call:"発信", due:"期限", language:"言語", theme:"テーマ", details:"詳細", known:"覚えた", progress:"進捗", correct:"正解！", incorrect:"惜しい。", again:"もう一度", show_answer:"答えを見る", credits:"単位", classes:"クラス", courses:"科目", building:"建物", floor:"階", room:"教室", saved_ok:"保存しました", unsaved_ok:"保存を解除しました", mark_done:"完了にする",
get_started:"はじめる", guest_mode:"ゲストとして続ける", guest_note:"アカウントは不要です。すべてこの端末に保存されます。", choose_lang:"言語を選択", ob_tagline:"ハノイ工科大学の留学生向け非公式ガイドです。",
ob_value_title:"このアプリでできること", ob_v1:"道に迷わない", ob_v1d:"キャンパス概略図、教室コードの解読、実際の地図へのリンク。", ob_v2:"学期の計画", ob_v2d:"クラス検索、時間割の重複回避、時間割の表示と書き出し。", ob_v3:"少しのベトナム語", ob_v3d:"音声付きの日常表現、フラッシュカード、クイズ。", ob_v4:"どこに聞けばよいか分かる", ob_v4d:"窓口、ハンドブック、緊急ページに出典を明記。",
ob_role_title:"あなたは？", ob_role_sub:"表示するチェックリストを選ぶだけです。あとで変更できます。", ob_detail_title:"任意の情報", ob_detail_sub:"すべて任意で、この端末にのみ保存されます。",
role_prospective:"入学検討中", role_prospective_d:"HUSTへの進学を検討中", role_new:"新入生", role_new_d:"合格して準備中", role_current:"在学生", role_current_d:"すでにHUSTで学んでいる", role_exchange:"交換留学生", role_exchange_d:"短期・交換プログラム",
display_name:"表示名", name_hint:"ニックネームで構いません。どこにも送信されません。", program:"課程", study_year:"学年", major:"専攻または学部", needs:"助けが必要なこと", privacy_fields:"このアプリにはアカウントもサーバーもありません。回答はブラウザ内にのみ保存されます。",
prog_bachelor:"学士", prog_master:"修士", prog_phd:"博士", prog_exchange:"交換", prog_language:"語学コース", prog_other:"その他",
need_vi:"ベトナム語", need_access:"バリアフリー", need_diet:"食事制限", need_housing:"住居", need_visa:"ビザと滞在",
hello:"こんにちは", guest_chip:"ゲスト", local_profile:"ローカルプロフィール", local_profile_d:"プロフィールはこのブラウザにのみ保存されます。ログインもパスワードもありません。学生ポータルのパスワードをこのアプリに入力しないでください。", set_up_profile:"プロフィールを設定",
home_no_tt:"時間割がありません", home_no_tt_d:"履修プランでクラスを追加すると、次の授業がここに表示されます。", add_classes:"クラスを追加", home_need_start:"学期の開始日を設定", home_need_start_d:"第1週の日付を入力すると今が何週目か分かります。アプリは推測しません。", set_start:"開始日を設定",
home_no_next:"今後の授業なし", home_no_next_d:"今後3週間は予定がありません。", home_before_sem:"学期はまだ始まっていません。", next_class:"次の授業", next_class_on:"次の授業 · {d}", room_tba:"教室未定", room_decoded:"{b}棟 {f}階（教室コードから解読）", room_help:"この教室を探す", navigate:"案内", open_timetable:"時間割を開く", today_classes:"今日", week_n:"第{n}週", this_week:"今週",
first30:"最初の30日", next_task:"次のステップ", all_done:"すべて完了しました！", my_reminders:"マイリマインダー", due_now:"期限です", no_reminders:"リマインダーはまだありません。", official_info:"公式サイトのお知らせ", copied_by_hand:"手動で転記", open_ctsv:"CTSVサイト", open_hust:"HUSTサイト",
daily_phrase:"今日のフレーズ", i_know_it:"覚えた", more_phrases:"フレーズをもっと", campus_tip:"キャンパスのヒント", quick_tools:"クイックツール", customize:"カスタマイズ", emergency_help:"緊急ヘルプ", emergency_sub:"番号、フレーズ、自分の連絡先", not_official_short:"非公式の学生ガイドで、HUSTが発行したものではありません。", not_official:"HUSTの公式アプリではありません。必ず大学に確認してください。",
tool_map:"地図", tool_rooms:"教室検索", tool_library:"図書館", tool_planner:"履修プラン", tool_timetable:"時間割", tool_tasks:"リマインダー", tool_gpa:"単位とGPA", tool_phrases:"ベトナム語", tool_address:"呼びかけ方", tool_guide:"日常生活", tool_office:"誰に聞く", tool_checklist:"最初の30日", tool_handbook:"ハンドブック", tool_assess:"セルフチェック", tool_saved:"保存済み", tool_emergency:"緊急",
kind_assignment:"課題", kind_exam:"試験", kind_study:"自習", kind_admin:"事務手続き", kind_personal:"個人", kind_note:"メモ",
task_title:"タイトル", task_due:"日時", task_remind:"通知", task_note:"メモ", remind_none:"通知しない", remind_at:"その時刻", remind_10:"10分前", remind_60:"1時間前", remind_day:"1日前", new_reminder:"新しいリマインダー",
plan_only:"計画ツールであり、正式な履修登録ではありません", map_schematic:"キャンパス概略図", schematic:"概略図", map_disclaimer:"簡略化した図で、測量図ではありません。位置と大きさはおおよそです。実際の道案内は地図リンクを使ってください。", map_search_ph:"建物を検索（D3、図書館…）", route_hint:"建物を選んで「案内」を押してください。", open_gmaps:"Googleマップ", start_here:"ここから出発",
room_finder:"教室検索", room_finder_d:"時間割の教室コードを入力すると建物と階が分かります。", decode:"解読", room_unknown:"認識できない教室コード", room_formats:"例：D3-201（D3棟2階）、D8-1006（10階）、C10-305。",
sos_title:"緊急ヘルプ", sos_intro:"危険な状況の人がいれば今すぐ電話してください。このアプリを待たないでください。", sos_national:"ベトナム全国の緊急番号", sos_police:"警察", sos_fire:"消防・救助", sos_ambulance:"救急", sos_numbers_note:"全国共通の番号です。学内の緊急番号は未確認のため掲載していません。", sos_say:"ベトナム語で伝える", sos_mine:"自分の緊急連絡先", sos_name:"名前", sos_where:"今どこ？", sos_where_d:"ボタンを押したときだけ座標を表示します。自動で送信・共有されることはありません。", sos_show_loc:"現在地を表示", loc_denied:"位置情報がブロックされているか利用できません。住所か近くの建物を伝えてください。", loc_acc:"端末が報告する精度：約{m}m。特に屋内では誤差が出ることがあります。",
search_ph:"科目、場所、窓口、フレーズを検索…", search_hint:"2文字以上入力してください。", no_results:"結果なし",
bilingual:"ラベルの横にベトナム語を表示", theme_system:"システム", theme_light:"ライト", theme_dark:"ダーク", who_you_are:"私は",
saved_empty:"保存したものはありません", delete_all:"自分のデータをすべて削除", about_unofficial:"このアプリは留学生を助けるために学生が作りました。HUSTの公式アプリではなく、HUSTの承認も受けていません。", privacy:"プライバシー", privacy_d:"アカウント、分析、データ送信はありません。データはブラウザ内に残ります。位置情報はボタンを押したときだけ読み取ります。", feedback:"フィードバック",
export:"書き出し", export_done:"ファイルを作成しました", sem_start:"学期開始日（第1週）", all_weeks:"全週", view_grid:"グリッド", view_list:"リスト", no_classes_yet:"クラスはまだありません", clashes_found:"時間の重複が{n}件あります。", n_results:"{n}件", my_classes:"マイクラス", lecturer:"講師"
});
})(window);

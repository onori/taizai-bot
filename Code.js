// デイリーイベント通知トリガー
function dailyEventTriggers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName("DailyEvents");

  const today = new Date();

  const weeklyEvnets = sh.getDataRange().getValues();

  // 実行時の曜日と合致するレコードを抽出
  const todayEvent = weeklyEvnets.filter((v) => {
    return v[0] === today.getDay();
  });
  // notice: propertyは旧エディタからのみGUI編集可能
  // https://stackoverflow.com/questions/65740899/how-do-i-view-script-properties-in-the-new-google-apps-script-ide
  sendToDiscord(
    PropertiesService.getScriptProperties().getProperty("DAILYEVENT_HOOK"),
    todayEvent[0][1]
  );
}

// youtubeRSS通知トリガー
function youtubeRssTrigers() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sh = ss.getSheetByName("Youtube");

  const lastRow = sh.getLastRow();

  // 先頭行を飛ばすため、row=2から
  for (let row = 2; row <= lastRow; row++) {
    const channelId = sh.getRange(row, 2).getValue();
    const latestVideoRange = sh.getRange(row, 3);
    const fetchUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`;

    const res = UrlFetchApp.fetch(fetchUrl);
    const { id, link } = getLatestEntry(res);

    // 最後に取得したvideoIDが今回取得したIDと違う場合、取得したIDに書き換えDiscordに送信
    if (latestVideoRange.getValue() !== id) {
      latestVideoRange.setValue(id);
      sendToDiscord(
        PropertiesService.getScriptProperties().getProperty("YOUTUBE_HOOK"),
        link
      );
    }
  }
}
/**
 * discord webhookでメッセージ送信
 * @param {string} url
 * @param {string} message
 */
function sendToDiscord(url, message) {
  const payload = {
    content: message,
  };

  UrlFetchApp.fetch(url, {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
  });
}

/**
 * youtubeRSSの最新entryからentryIDとlinkを取得
 * @param {HTTPResponse} xmlData
 * @returns
 */
function getLatestEntry(xmlData) {
  const xml = XmlService.parse(xmlData.getContentText());
  const atom = XmlService.getNamespace("http://www.w3.org/2005/Atom");
  const entries = xml.getRootElement().getChildren("entry", atom);
  return {
    id: entries[0].getChild("id", atom).getText(),
    link: entries[0].getChild("link", atom).getAttribute("href").getValue(),
  };
}

import fetch from "node-fetch";
import reader from "xlsx";

async function getTicketsForEvent(eventUrl) {
  const response = await fetch(eventUrl);
  return response.json();
}

async function getAndWriteTicketInfo(xlsxFilePath, eventUrl, eventNickname) {
  const workbook = reader.readFile(xlsxFilePath);
  const sheet_name_list = workbook.SheetNames;
  const sheetData = reader.utils.sheet_to_json(
    workbook.Sheets[sheet_name_list[0]]
  );

  const data = await getTicketsForEvent(eventUrl);
  const jojo = {
    timestamp: new Date().toLocaleString(),
    amountSold: data.soldEvents.amountSold,
    amountBooked: data.soldEvents.amountBooked,
    error: data.error,
  };
  sheetData.push(jojo);

  const ws = reader.utils.json_to_sheet(sheetData);
  const wb = reader.utils.book_new();
  reader.utils.book_append_sheet(wb, ws, "Responses");
  reader.writeFile(wb, "./boelBiljetter.xlsx");

  return "Retrieved " + eventNickname + " tickets at " + new Date();
}

function go() {
  getAndWriteTicketInfo(
    "./boelBiljetter.xlsx",
    "http://www.nortic.se/api/json/organizer/924/event/33860",
    "Boel"
  ).then(function (result) {
    console.log(result);
  });
  
  getAndWriteTicketInfo(
    "./toddyBiljetter.xlsx",
    "http://www.nortic.se/api/json/organizer/924/event/33943",
    "Toddy"
  ).then(function (result) {
    console.log(result);
  });
}

go();
setInterval(go, 1800000);

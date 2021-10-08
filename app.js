import fetch from "node-fetch";
import reader from "xlsx";

async function getTicketsForEvent(eventUrl) {
  const response = await fetch(eventUrl);
  return response.json();
}

async function getTicketsForShow(organizerId, showId) {
  const url = `https://www.nortic.se/api/json/organizer/${organizerId}/show/${showId}`;
  const response = await fetch(url);
  return response.json();
}

async function getEventsForOrganizer(organizerId) {
  const url = "https://www.nortic.se/api/json/organizer/";
  const response = await fetch(url + organizerId);
  const { events } = await response.json();
  return events;
}

async function getEventInfo(eventId) {
  const url = "https://www.nortic.se/api/json/event/";
  const response = await fetch(url + eventId);
  return response.json();
}

async function getShowInfo(showId) {
  const url = "https://www.nortic.se/api/json/show/";
  const response = await fetch(url + showId);
  return response.json();
}

async function getShowsForEvent(eventId) {
  const { events } = await getEventInfo(eventId);
  const { shows } = events[0];

  return shows;
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
  reader.writeFile(wb, xlsxFilePath);

  return "Retrieved " + eventNickname + " tickets at " + new Date();
}

function go() {
  getAndWriteTicketInfo(
    "./boelBiljetter.xlsx",
    "https://www.nortic.se/api/json/organizer/924/event/33860",
    "Boel"
  ).then(function (result) {
    console.log(result);
  });

  getAndWriteTicketInfo(
    "./toddyBiljetter.xlsx",
    "https://www.nortic.se/api/json/organizer/924/event/33943",
    "Toddy"
  ).then(function (result) {
    console.log(result);
  });

  getTicketsForAllShows("924", "33860", "./boelShowSpecific.xlsx").then((r) =>
    console.log(r)
  );
  getTicketsForAllShows("924", "33943", "./toddyShowSpecific.xlsx").then((r) =>
    console.log(r)
  );
}

async function getTicketsForAllShows(organizerId, eventId, xlsxFilePath) {
  const showArray = await getShowsForEvent(eventId);

  const workbook = reader.readFile(xlsxFilePath);
  const sheetArray = workbook.SheetNames;

  const wb = reader.utils.book_new();
  for (let i = 0; i < showArray.length; i++) {
    const sheetData = reader.utils.sheet_to_json(
      workbook.Sheets[sheetArray[i]]
    );

    const data = await getTicketsForShow(organizerId, showArray[i].id);
    const dataObject = {
      timestamp: new Date().toLocaleString(),
      amountSold: data.soldEvents.amountSold,
      amountBooked: data.soldEvents.amountBooked,
      error: data.error,
    };

    sheetData.push(dataObject);

    const ws = reader.utils.json_to_sheet(sheetData);
    reader.utils.book_append_sheet(wb, ws, "Show " + i);

    reader.writeFile(wb, xlsxFilePath);
  }
}

go();
setInterval(go, 1800000);
